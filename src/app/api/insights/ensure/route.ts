import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateAIResponse } from '@/lib/ai/client'
import { REPORT_GENERATION_SYSTEM_PROMPT, buildReportPrompt } from '@/lib/ai/prompts'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // If insights already exist, no-op
    const { data: existing } = await supabaseAdmin
      .from('personal_insights' as never)
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (existing) return NextResponse.json({ created: false })

    // Prefer personal survey answers; otherwise fall back to company answers for this user
    let answers: Array<{ question: string; dimension: string; answer: string }> = []
    const { data: personal } = await supabaseAdmin
      .from('personal_surveys' as never)
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    let surveyId: string | null = personal?.id || null
    if (surveyId) {
      const { data: pa } = await supabaseAdmin
        .from('personal_answers' as never)
        .select('dimension, answer_text')
        .eq('survey_id', surveyId)
      answers = (pa || []).map(a => ({ question: a.dimension, dimension: a.dimension, answer: a.answer_text }))
    }
    if (!answers.length) {
      const { data: qi } = await supabaseAdmin
        .from('question_instances')
        .select('questions (text, dimension), answers (answer_text)')
        .eq('employee_id', userId)
        .not('answers', 'is', null)
      answers = (qi || []).filter(r => r.questions && r.answers?.[0]?.answer_text).map(r => ({
        question: (r as any).questions.text,
        dimension: (r as any).questions.dimension,
        answer: (r as any).answers[0].answer_text,
      }))
    }

    // Build minimal prompt and generate personal insights
    const prompt = buildReportPrompt('Personal', answers.map(a => ({ employee_id: userId, role: 'Self', question: a.question, dimension: a.dimension, answer: a.answer })))
    const ai = await generateAIResponse(prompt, REPORT_GENERATION_SYSTEM_PROMPT)
    let parsed
    try {
      parsed = JSON.parse(ai.content)
    } catch {
      return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
    }

    // Ensure a surveyId for linkage
    if (!surveyId) {
      const { data: created } = await supabaseAdmin
        .from('personal_surveys' as never)
        .insert({ user_id: userId } as never)
        .select('id')
        .single()
      surveyId = (created as any)?.id || null
    }
    if (!surveyId) return NextResponse.json({ error: 'Failed to create survey record' }, { status: 500 })

    // Insert insights (one-time)
    const { error: insErr } = await supabaseAdmin
      .from('personal_insights' as never)
      .insert({
        user_id: userId,
        survey_id: surveyId,
        scores_json: parsed.scores,
        narrative_json: parsed.narrative,
      } as never)
    if (insErr) return NextResponse.json({ error: 'Failed to save insights' }, { status: 500 })
    return NextResponse.json({ created: true })
  } catch (e) {
    console.error('ensure insights error', e)
    return NextResponse.json({ error: 'Failed to ensure insights' }, { status: 500 })
  }
}


