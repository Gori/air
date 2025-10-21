export interface SummaryV2 {
  headline_takeaway: string
  top_3_bets: Array<{
    title: string
    description: string
  }>
  why_these_3: Array<{
    bet: string
    rationale: string
  }>
  primary_outcome_focus: string
  metrics_to_measure: string[]
  quick_wins_vs_longer_plays: {
    quick_wins: string[]
    longer_plays: string[]
  }
  time_allocation: {
    current: Array<{ category: string; hours: number }>
    proposed: Array<{ category: string; hours: number }>
  }
  team_slowdowns: Array<{
    issue: string
    frequency: string
  }>
  foundations_check: {
    documentation: number
    data_quality: number
    tool_integration: number
  }
  culture_boosters: {
    [key: string]: number
  }
  right_now_timing: string[]
  cautions: Array<{
    blocker: string
    mitigation: string
  }>
  industry_lens: string
  team_size_lens: string
  first_30_days: string[]
  who_to_involve: Array<{
    function: string
    role: string
  }>
  assumptions: string[]
  open_questions: string[]
}

export interface CompanyOnboardingData {
  industry?: string | null
  niches?: string[]
  niches_other?: string | null
  workflow_docs?: {
    documentation?: number
    data_quality?: number
    tool_integration?: number
  }
  ai_readiness?: {
    [key: string]: number
  }
  biggest_slowdown_multi?: string[]
  biggest_slowdown_other?: string | null
  reinvest?: string[]
  reinvest_other?: string | null
  primary_outcome?: string | null
  change_enablers?: string[]
  change_enablers_other?: string | null
  change_blockers?: string[]
  change_blockers_other?: string | null
  company_name?: string | null
  headcount_range?: string | null
}

