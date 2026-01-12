import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateAIResponse } from '@/lib/ai/client'
import { REPORT_GENERATION_SYSTEM_PROMPT, buildReportPrompt } from '@/lib/ai/prompts'

/**
 * Ensures a personal_insights row exists for the given user.
 * Returns true if a row was created, false if it already existed.
 */
export async function ensurePersonalInsightsForUser(userId: string): Promise<boolean> {
  // If insights already exist, no-op
  const { data: existing } = await supabaseAdmin
    .from('personal_insights')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (existing) return false

  // Prefer personal survey answers; otherwise fall back to company answers for this user
  let answers: Array<{ question: string; dimension: string; answer: string }> = []
  const { data: personal } = await supabaseAdmin
    .from('personal_surveys')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  let surveyId: string | null = personal?.id || null
  if (surveyId) {
    const { data: pa } = await supabaseAdmin
      .from('personal_answers')
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
    type QiRow = {
      questions?: { text?: string | null; dimension?: string | null } | null
      answers?: Array<{ answer_text?: string | null }> | null
    }
    answers = ((qi as QiRow[] | null) || [])
      .filter(r => r.questions && r.answers?.[0]?.answer_text)
      .map(r => ({
        question: r.questions?.text || '',
        dimension: r.questions?.dimension || '',
        answer: r.answers?.[0]?.answer_text || '',
      }))
  }

  // Build minimal prompt and generate personal insights
  const prompt = buildReportPrompt('Personal', answers.map(a => ({ employee_id: userId, role: 'Self', question: a.question, dimension: a.dimension, answer: a.answer })))
  const ai = await generateAIResponse(prompt, REPORT_GENERATION_SYSTEM_PROMPT)
  let parsed
  try {
    parsed = JSON.parse(ai.content)
  } catch {
    throw new Error('Failed to parse AI insights JSON')
  }

  // Ensure a surveyId for linkage
  if (!surveyId) {
    const { data: created } = await supabaseAdmin
      .from('personal_surveys')
      .insert({ user_id: userId })
      .select('id')
      .single()
    surveyId = created?.id || null
  }
  if (!surveyId) throw new Error('Failed to create survey record')

  // Insert insights (one-time)
  const { error: insErr } = await supabaseAdmin
    .from('personal_insights')
    .insert({
      user_id: userId,
      survey_id: surveyId,
      scores_json: parsed.scores,
      narrative_json: parsed.narrative,
    })
  if (insErr) throw new Error('Failed to save insights')
  return true
}


