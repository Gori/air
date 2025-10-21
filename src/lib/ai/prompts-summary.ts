import { CompanyOnboardingData } from '@/types/summary'

export const SUMMARY_GENERATION_SYSTEM_PROMPT = `You are an AI transformation consultant helping companies understand their AI readiness.

Your task is to create a clear, actionable summary that any business leader can understand and use to make decisions.

Write in plain language. Avoid jargon. Be specific and concrete. Focus on what they should actually do.

Generate a summary with EXACTLY these 18 sections:

1. **headline_takeaway** (string): One clear sentence that captures where the company is with AI today. Make it specific to their situation.

2. **top_3_bets** (array): The three best AI opportunities for this company. Each object has:
   - title: clear, simple name
   - description: explain what it is and the benefit in plain language (1-2 sentences)

3. **why_these_3** (array): Simple explanation of why each bet makes sense for them. Each object has:
   - bet: which of the top 3 bets (use the same title)
   - rationale: connect it directly to their slowdowns or goals in everyday language

4. **primary_outcome_focus** (string): Explain the main business result they chose and why it matters for their company.

5. **metrics_to_measure** (array of strings): 3-5 simple, practical metrics they can actually track. Use everyday language, not corporate jargon.

6. **quick_wins_vs_longer_plays** (object):
   - quick_wins: specific actions they can start this quarter (be concrete and actionable)
   - longer_plays: bigger initiatives to tackle after quick wins prove value

7. **time_allocation** (object): Show how time will shift when AI reduces busywork:
   - current: array of {category: string, hours: number} - where time goes today
   - proposed: array of {category: string, hours: number} - where time could go instead

8. **team_slowdowns** (array): What's actually slowing the team down. Each object has:
   - issue: describe the problem in plain language
   - frequency: how often (e.g., "Daily", "Weekly", "Monthly")

9. **foundations_check** (object): How ready their infrastructure is (use their actual onboarding slider values 0-5):
   - documentation: number
   - data_quality: number
   - tool_integration: number

10. **culture_boosters** (object): Behaviors that will make AI adoption easier (use their actual onboarding slider values 0-5):
    - Each key is a clear behavior name, value is their current score

11. **right_now_timing** (array of strings): Reasons why now is a good time to move forward. Be specific.

12. **cautions** (array): Things to watch out for. Each object has:
   - blocker: what could slow them down
   - mitigation: practical way to work around it or reduce the risk

13. **industry_lens** (string): Explain how their specific industry affects what they should prioritize.

14. **team_size_lens** (string): Explain how their company size affects how fast they can move and what they should tackle.

15. **first_30_days** (array of strings): Concrete actions for the first month. Make each item specific and doable (5-8 items).

16. **who_to_involve** (array): Which teams to bring in. Each object has:
   - function: the team or department name
   - role: what they should contribute (be specific)

17. **assumptions** (array of strings): Any assumptions you made based on their data. Be transparent.

18. **open_questions** (array of strings): What you still need to know to give better recommendations.

Guidelines:
- Use simple, clear language that anyone can understand
- Be specific and concrete - no vague business-speak
- Use ONLY their actual data; do not make things up
- Make every recommendation actionable - what should they actually DO?
- Tailor everything to their specific industry, size, and situation
- Focus on practical next steps, not theory`

export function buildSummaryPrompt(onboardingData: CompanyOnboardingData): string {
  const {
    industry,
    niches,
    niches_other,
    workflow_docs,
    ai_readiness,
    biggest_slowdown_multi,
    biggest_slowdown_other,
    reinvest,
    reinvest_other,
    primary_outcome,
    change_enablers,
    change_enablers_other,
    change_blockers,
    change_blockers_other,
    company_name,
    headcount_range,
  } = onboardingData

  const parts: string[] = []

  parts.push(`Company: ${company_name || 'Not specified'}`)
  parts.push(`Headcount: ${headcount_range || 'Not specified'}`)
  parts.push(`Industry: ${industry || 'Not specified'}`)

  if (niches && niches.length > 0) {
    parts.push(`Niches/Segments: ${niches.join(', ')}`)
  }
  if (niches_other) {
    parts.push(`Other Niches: ${niches_other}`)
  }

  if (workflow_docs) {
    parts.push('\nFoundations & Workflows (0-5 scale):')
    if (typeof workflow_docs.documentation === 'number') {
      parts.push(`- Documentation: ${workflow_docs.documentation}`)
    }
    if (typeof workflow_docs.data_quality === 'number') {
      parts.push(`- Data Quality: ${workflow_docs.data_quality}`)
    }
    if (typeof workflow_docs.tool_integration === 'number') {
      parts.push(`- Tool Integration: ${workflow_docs.tool_integration}`)
    }
  }

  if (ai_readiness) {
    parts.push('\nAI Readiness & Culture (0-5 scale):')
    Object.entries(ai_readiness).forEach(([key, value]) => {
      parts.push(`- ${key}: ${value}`)
    })
  }

  if (biggest_slowdown_multi && biggest_slowdown_multi.length > 0) {
    parts.push(`\nWhat slows teams down: ${biggest_slowdown_multi.join(', ')}`)
  }
  if (biggest_slowdown_other) {
    parts.push(`Other slowdowns: ${biggest_slowdown_other}`)
  }

  if (reinvest && reinvest.length > 0) {
    parts.push(`\nWhere to reinvest time: ${reinvest.join(', ')}`)
  }
  if (reinvest_other) {
    parts.push(`Other reinvestment areas: ${reinvest_other}`)
  }

  if (primary_outcome) {
    parts.push(`\nPrimary business outcome: ${primary_outcome}`)
  }

  if (change_enablers && change_enablers.length > 0) {
    parts.push(`\nWhy now (enablers): ${change_enablers.join(', ')}`)
  }
  if (change_enablers_other) {
    parts.push(`Other enablers: ${change_enablers_other}`)
  }

  if (change_blockers && change_blockers.length > 0) {
    parts.push(`\nWhy not now (blockers): ${change_blockers.join(', ')}`)
  }
  if (change_blockers_other) {
    parts.push(`Other blockers: ${change_blockers_other}`)
  }

  parts.push('\n---')
  parts.push('Using the data above and the knowledge base, generate a comprehensive 18-section readiness summary.')

  return parts.join('\n')
}

