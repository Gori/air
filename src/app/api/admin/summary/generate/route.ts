import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { streamObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SUMMARY_GENERATION_SYSTEM_PROMPT, buildSummaryPrompt } from '@/lib/ai/prompts-summary'
import { loadOnboardingData, saveSummaryV2 } from '@/lib/insights/company'
import { SummaryV2 } from '@/types/summary'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const summarySchema = z.object({
  headline_takeaway: z.string(),
  top_3_bets: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })),
  why_these_3: z.array(z.object({
    bet: z.string(),
    rationale: z.string(),
  })),
  primary_outcome_focus: z.string(),
  metrics_to_measure: z.array(z.string()),
  quick_wins_vs_longer_plays: z.object({
    quick_wins: z.array(z.string()),
    longer_plays: z.array(z.string()),
  }),
  time_allocation: z.object({
    current: z.array(z.object({ category: z.string(), hours: z.number() })),
    proposed: z.array(z.object({ category: z.string(), hours: z.number() })),
  }),
  team_slowdowns: z.array(z.object({
    issue: z.string(),
    frequency: z.string(),
  })),
  foundations_check: z.object({
    documentation: z.number(),
    data_quality: z.number(),
    tool_integration: z.number(),
  }),
  culture_boosters: z.record(z.number()),
  right_now_timing: z.array(z.string()),
  cautions: z.array(z.object({
    blocker: z.string(),
    mitigation: z.string(),
  })),
  industry_lens: z.string(),
  team_size_lens: z.string(),
  first_30_days: z.array(z.string()),
  who_to_involve: z.array(z.object({
    function: z.string(),
    role: z.string(),
  })),
  assumptions: z.array(z.string()),
  open_questions: z.array(z.string()),
})

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()

  if (!user || user.role !== 'manager' || !user.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const companyId = user.company_id

  try {
    const onboardingData = await loadOnboardingData(companyId)

    const result = streamObject({
      model: openai('gpt-4o'),
      system: SUMMARY_GENERATION_SYSTEM_PROMPT,
      prompt: buildSummaryPrompt(onboardingData),
      schema: summarySchema,
      onFinish: async ({ object }) => {
        try {
          await saveSummaryV2(companyId, object as SummaryV2)
        } catch (e) {
          console.error('[summary/generate] Failed to save summary', e)
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[summary/generate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

