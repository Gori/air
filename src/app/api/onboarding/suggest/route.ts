import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateAIResponse } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { context, type } = body || {}
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

  const prompt = buildSuggestPrompt(type, context || {})
  const ai = await generateAIResponse(prompt)

  // Log prompt/response (minimal)
  const { data: me } = await supabaseAdmin
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single()

  await supabaseAdmin.from('prompt_logs').insert({
    company_id: me?.company_id || null,
    employee_id: null,
    source: 'question_selection',
    prompt,
    response: ai.content,
    model: ai.model,
  })

  let suggestions: string[] = []
  try {
    const parsed = JSON.parse(ai.content) as { suggestions?: unknown }
    if (Array.isArray(parsed?.suggestions)) suggestions = parsed.suggestions as string[]
  } catch {
    // fallback to naive line-split if JSON not returned
    suggestions = ai.content.split('\n').map(s => s.trim()).filter(Boolean)
  }

  // Normalize: short, concise, de-duped
  const maxWords = (t: string) => {
    switch (t) {
      case 'buyer_roles':
      case 'user_roles':
      case 'niches':
      case 'slowdowns':
        return 3
      case 'enablers':
      case 'blockers':
        return 4
      default:
        return 3
    }
  }
  const limit = (t: string) => (t === 'enablers' || t === 'blockers' ? 10 : 12)
  const cleaned = Array.from(new Set(
    suggestions
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 0)
      .map(s => s.replace(/[.;:,!?]/g, ''))
      .filter(s => s.split(' ').length <= maxWords(type))
  )).slice(0, limit(type))

  // Append Other last when applicable
  if (['niches', 'slowdowns', 'reinvest', 'enablers', 'blockers', 'buyer_roles', 'user_roles', 'company_names'].includes(type)) {
    if (!cleaned.includes('Other')) cleaned.push('Other')
  }

  return NextResponse.json({ suggestions: cleaned })
}

function buildSuggestPrompt(type: string, ctx: Record<string, unknown>): string {
  const common = `Return JSON only: {"suggestions": ["..."]}`
  const base = `Context: ${JSON.stringify(ctx)}`
  const rules = `Rules: 6-12 items, concise, no punctuation, no numbers, plain phrasing.`
  let spec = ''
  if (type === 'buyer_roles') spec = 'Output job titles/personas who make purchase decisions (e.g., CFO, VP Operations, Head of RevOps). Max 3 words each.'
  else if (type === 'user_roles') spec = 'Output job titles/personas who use the product daily (e.g., Accountants, CS reps, Sales managers). Max 3 words each.'
  else if (type === 'niches') spec = 'Output sub-industry segments relevant to the industry (e.g., Payments orchestration, KYC/KYB). Max 3 words each.'
  else if (type === 'slowdowns') spec = 'Output short causes of slowdown (e.g., Handoffs, Rework, Manual data). Max 3 words each.'
  else if (type === 'enablers') spec = 'Output short enablers (e.g., Leadership air cover, Team capacity). Max 4 words each.'
  else if (type === 'blockers') spec = 'Output short blockers (e.g., Peak season, Audit window). Max 4 words each.'
  else if (type === 'company_names') spec = 'Output likely company/brand names from context; keep concise.'
  else spec = 'Output concise, relevant suggestions.'
  return [common, base, `Type: ${type}`, spec, rules].join('\n')
}


