import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateAIResponse } from '@/lib/ai/client'
import { COMPANY_ONBOARDING_SUMMARY_SYSTEM_PROMPT, buildCompanyOnboardingSummaryPrompt } from '@/lib/ai/prompts'
import { SummaryV2, CompanyOnboardingData } from '@/types/summary'

type CompanyProfile = {
  name: string
  industry: string | null
  headcount: number | null
  region: string | null
}

type OnboardingSummary = {
  summary: string
  readiness_score: number
  key_signals: string[]
  recommended_actions: string[]
  tips: string[]
  generated_at?: string
}

export async function getExistingOnboardingSummary(companyId: string): Promise<OnboardingSummary | null> {
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()

  let onboardingSummary: OnboardingSummary | null = null
  try {
    if (company?.description) {
      const parsed = JSON.parse(company.description) as Record<string, unknown>
      const candidate = (parsed as { onboarding_summary?: unknown })?.onboarding_summary as OnboardingSummary | undefined
      if (candidate && typeof candidate === 'object' && candidate.summary && Array.isArray(candidate.key_signals)) {
        onboardingSummary = candidate
      }
    }
  } catch {
    // ignore parse errors; treat as no summary
  }
  return onboardingSummary
}

export async function ensureCompanyOnboardingSummary(companyId: string): Promise<{ created: boolean; summary: OnboardingSummary }> {
  const existing = await getExistingOnboardingSummary(companyId)
  if (existing) return { created: false, summary: existing }

  const [{ data: companyRow }, empCountRes, answersCountRes, startedCountRes] = await Promise.all([
    supabaseAdmin
      .from('companies')
      .select('name, industry, headcount, region, description')
      .eq('id', companyId)
      .single(),
    supabaseAdmin.from('users').select('id', { head: true, count: 'exact' }).eq('company_id', companyId).eq('role', 'employee'),
    supabaseAdmin.from('answers').select('id', { head: true, count: 'exact' }).eq('company_id', companyId),
    supabaseAdmin.from('question_instances').select('id', { head: true, count: 'exact' }).eq('company_id', companyId),
  ])

  const profile: CompanyProfile = {
    name: (companyRow?.name as string) || 'Company',
    industry: (companyRow?.industry as string | null) ?? null,
    headcount: (companyRow?.headcount as number | null) ?? null,
    region: (companyRow?.region as string | null) ?? null,
  }

  let onboardingData: Record<string, unknown> = {}
  try { if (companyRow?.description) onboardingData = JSON.parse(companyRow.description) as Record<string, unknown> } catch {}

  const totalEmployees = empCountRes.count || 0
  const totalResponses = answersCountRes.count || 0
  const started = startedCountRes.count || 0
  const completionRatePct = started > 0 ? Math.round(((totalResponses as number) / (started as number)) * 100) : 0

  const prompt = buildCompanyOnboardingSummaryPrompt({
    companyName: profile.name,
    companyProfile: { industry: profile.industry, headcount: profile.headcount, region: profile.region },
    onboardingData,
    aggregates: { totalEmployees, totalResponses, completionRatePct },
  })

  const ai = await generateAIResponse(prompt, COMPANY_ONBOARDING_SUMMARY_SYSTEM_PROMPT)

  let parsed: OnboardingSummary
  try {
    parsed = JSON.parse(ai.content) as OnboardingSummary
  } catch {
    throw new Error('Failed to parse onboarding summary JSON')
  }

  const summary: OnboardingSummary = { ...parsed, generated_at: new Date().toISOString() }

  const merged = { ...(onboardingData || {}), onboarding_summary: summary }
  const { error: saveErr } = await supabaseAdmin
    .from('companies')
    .update({ description: JSON.stringify(merged) } as never)
    .eq('id', companyId)

  if (saveErr) {
    throw new Error('Failed to save onboarding summary')
  }

  await supabaseAdmin
    .from('prompt_logs')
    .insert({
      company_id: companyId,
      employee_id: null,
      source: 'report_generation',
      prompt,
      response: ai.content,
      model: ai.model,
    } as never)

  return { created: true, summary }
}

export async function loadSummaryV2(companyId: string): Promise<SummaryV2 | null> {
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()

  if (!company?.description) return null

  try {
    const parsed = JSON.parse(company.description) as Record<string, unknown>
    return (parsed.summary_v2 as SummaryV2) || null
  } catch {
    return null
  }
}

export async function saveSummaryV2(companyId: string, summary: SummaryV2): Promise<void> {
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()

  let desc: Record<string, unknown> = {}
  try {
    if (company?.description) {
      desc = JSON.parse(company.description) as Record<string, unknown>
    }
  } catch {}

  desc.summary_v2 = summary
  desc.summary_v2_generated_at = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('companies')
    .update({ description: JSON.stringify(desc) } as never)
    .eq('id', companyId)

  if (error) {
    throw new Error('Failed to save summary v2')
  }
}

export async function loadOnboardingData(companyId: string): Promise<CompanyOnboardingData> {
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()

  if (!company?.description) return {}

  try {
    return JSON.parse(company.description) as CompanyOnboardingData
  } catch {
    return {}
  }
}


