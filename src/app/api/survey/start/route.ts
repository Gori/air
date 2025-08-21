import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId, getUserId } from '@/lib/supabase/server'
import { 
  getEmployeeQuestionInstances 
} from '@/lib/supabase/queries'
import { 
  initializeEmployeeQuestions
} from '@/lib/supabase/mutations'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCompany } from '@/lib/supabase/queries'

export async function POST() {
  try {
    // Get authentication details
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No company association found' }, { status: 400 })
    }

    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'User UUID not found' }, { status: 400 })
    }

    // Ensure the 6 usage-matrix questions exist in the question bank (idempotent)
    const requiredUsage = [
      { dimension: 'usage_creative_content', text: 'For each item below, choose how much you are using it.', module_id: 3 },
      { dimension: 'usage_research_knowledge', text: 'For each item below, choose how much you are using it.', module_id: 3 },
      { dimension: 'usage_business_productivity', text: 'For each item below, choose how much you are using it.', module_id: 3 },
      { dimension: 'usage_decision_support', text: 'For each item below, choose how much you are using it.', module_id: 3 },
      { dimension: 'usage_personal_assistance', text: 'For each item below, choose how much you are using it.', module_id: 3 },
      { dimension: 'usage_security_moderation', text: 'For each item below, choose how much you are using it.', module_id: 3 }
    ]
    const { data: existingUsage } = await supabaseAdmin
      .from('questions')
      .select('dimension')
      .in('dimension', requiredUsage.map(u => u.dimension))
    const existingSet = new Set((existingUsage || []).map((q: { dimension: string | null }) => q.dimension || ''))
    const missingUsage = requiredUsage.filter(u => !existingSet.has(u.dimension))
    if (missingUsage.length > 0) {
      await supabaseAdmin
        .from('questions')
        .insert(missingUsage.map(u => ({
          module_id: u.module_id,
          dimension: u.dimension,
          text: u.text,
          active: true
        })))
    }

    // Ensure v2 core question dimensions exist (idempotent)
    const requiredCore = [
      // Contact
      { dimension: 'job_title', text: "What’s your job title?", module_id: 1 },
      // Attitudes & perceptions
      { dimension: 'ai_sentiment', text: 'Overall, how do you feel about AI becoming more common at work?', module_id: 2 },
      { dimension: 'ai_expected_benefits', text: 'Looking ahead, what potential benefits do you foresee AI bringing?', module_id: 2 },
      { dimension: 'ai_concerns', text: 'What are your main concerns or potential risks with AI at work?', module_id: 2 },
      { dimension: 'human_led_work', text: 'How much of your work requires distinctly human judgment and should remain human-led?', module_id: 2 },
      // Workflow & opportunities (current_ai_usage removed per v2 update)
      { dimension: 'workflow_integration', text: 'Describe any ways automation or advanced tools are already part of your workflow.', module_id: 3 },
      { dimension: 'ai_opportunity_ideas', text: 'Which repetitive tasks could be assisted or automated?', module_id: 3 },
      { dimension: 'integration_barriers', text: 'If you’ve tried to integrate new tools, what challenges arose?', module_id: 3 },
      // Org ecosystem
      { dimension: 'org_support', text: 'How supported do you feel to try useful new tools?', module_id: 4 },
      { dimension: 'culture_experimentation', text: 'How easy is it to experiment safely with new tools?', module_id: 4 },
      { dimension: 'policy_awareness', text: 'Are you aware of any company policies or guidelines on using AI?', module_id: 4 },
      { dimension: 'support_requests', text: 'What specific support would help you adopt AI more confidently?', module_id: 4 },
      // Learning & development
      { dimension: 'training_effectiveness', text: 'If you’ve had AI training, how helpful was it overall?', module_id: 5 },
      { dimension: 'learning_preferences', text: 'When learning new tech, what’s your preferred style?', module_id: 5 },
      { dimension: 'training_received', text: 'Have you received any AI training?', module_id: 5 },
      // Strategy & vision
      { dimension: 'strategic_clarity', text: 'How clearly do you understand the company’s AI adoption vision?', module_id: 6 },
      { dimension: 'perceived_alignment', text: 'Do you see a connection between your work and the company’s AI goals?', module_id: 6 },
      { dimension: 'pace_satisfaction', text: 'How do you feel about the pace of AI adoption here?', module_id: 6 },
      { dimension: 'leadership_confidence', text: 'How confident are you in leadership’s ability to implement AI initiatives?', module_id: 6 },
      { dimension: 'future_roles_skills', text: 'If AI progress goes right in 6–12 months, what roles & skills would we need?', module_id: 6 }
    ]

    const { data: existingCore } = await supabaseAdmin
      .from('questions')
      .select('dimension')
      .in('dimension', requiredCore.map(c => c.dimension))
    const existingCoreSet = new Set((existingCore || []).map((q: { dimension: string | null }) => q.dimension || ''))
    const missingCore = requiredCore.filter(c => !existingCoreSet.has(c.dimension))
    if (missingCore.length > 0) {
      await supabaseAdmin
        .from('questions')
        .insert(missingCore.map(c => ({
          module_id: c.module_id,
          dimension: c.dimension,
          text: c.text,
          active: true
        })))
    }

    // Check if user already has question instances
    const questionInstances = await getEmployeeQuestionInstances(userId)
    
    // If no question instances exist, initialize them
    if (!questionInstances || questionInstances.length === 0) {
      await initializeEmployeeQuestions(userId, companyId)
    }

    // Ensure new usage-matrix questions are present and first for existing employees
    if (questionInstances && questionInstances.length > 0) {
      const { data: usageQuestions } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('active', true)
        .like('dimension', 'usage_%')

      if (usageQuestions && usageQuestions.length > 0) {
        const existingQuestionIds = new Set(
          (questionInstances || []).map((qi: { question_id: number | null }) => qi.question_id || -1)
        )
        const missing = usageQuestions.filter((q: { id: number }) => !existingQuestionIds.has(q.id))

        if (missing.length > 0) {
          const bumpBy = missing.length

          // Bump ordinals of existing instances to make room at the front
          const { data: instancesToUpdate } = await supabaseAdmin
            .from('question_instances')
            .select('id, ordinal')
            .eq('employee_id', userId)
            .order('ordinal')

          if (instancesToUpdate && instancesToUpdate.length > 0) {
            for (const inst of instancesToUpdate as Array<{ id: string; ordinal: number }>) {
              await supabaseAdmin
                .from('question_instances')
                .update({ ordinal: inst.ordinal + bumpBy })
                .eq('id', inst.id)
            }
          }

          // Insert missing usage questions at the beginning with ordinals 1..n
          const newInstances = missing.map((q: { id: number }, idx: number) => ({
            employee_id: userId,
            company_id: companyId,
            question_id: q.id,
            ordinal: idx + 1,
            parent_instance: null
          }))

          await supabaseAdmin
            .from('question_instances')
            .insert(newInstances)
        }
      }
    }

    // Ensure any newly added core questions are present in instances (append at end)
    if (questionInstances && questionInstances.length > 0) {
      const { data: allQuestions } = await supabaseAdmin
        .from('questions')
        .select('id')
        .eq('active', true)

      const existingQuestionIds = new Set(
        (questionInstances || []).map((qi: { question_id: number | null }) => qi.question_id || -1)
      )

      const missing = (allQuestions || []).filter((q: { id: number }) => !existingQuestionIds.has(q.id))
      if (missing.length > 0) {
        const { data: lastInst } = await supabaseAdmin
          .from('question_instances')
          .select('ordinal')
          .eq('employee_id', userId)
          .order('ordinal', { ascending: false })
          .limit(1)
          .single()
        const start = (lastInst?.ordinal || 0) + 1
        const newInstances = missing.map((q: { id: number }, idx: number) => ({
          employee_id: userId,
          company_id: companyId,
          question_id: q.id,
          ordinal: start + idx,
          parent_instance: null
        }))
        await supabaseAdmin
          .from('question_instances')
          .insert(newInstances)
      }
    }

    // Remove deprecated 'current_ai_usage' instances for this employee if any
    const { data: currentUsageQ } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('dimension', 'current_ai_usage')
      .limit(1)
      .single()
    if (currentUsageQ?.id) {
      await supabaseAdmin
        .from('question_instances')
        .delete()
        .eq('employee_id', userId)
        .eq('question_id', currentUsageQ.id)
    }

    // Remove deprecated 'product_strategy' instances for this employee if any
    const { data: prodStratQ } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('dimension', 'product_strategy')
      .limit(1)
      .single()
    if (prodStratQ?.id) {
      await supabaseAdmin
        .from('question_instances')
        .delete()
        .eq('employee_id', userId)
        .eq('question_id', prodStratQ.id)
    }

    // Build a dimension→instance map with existing answers
    const { data: instancesWithAnswers } = await supabaseAdmin
      .from('question_instances')
      .select(`
        id, ordinal, question_id,
        questions (id, dimension, text),
        answers (answer_text)
      `)
      .eq('employee_id', userId)
      .order('ordinal')

    const instanceMap: Record<string, { id: string, ordinal: number, question_id: number | null, answer_text?: string }> = {}
    for (const row of (instancesWithAnswers || []) as Array<{ id: string; ordinal: number; question_id: number | null; questions?: { id: number; dimension: string | null; text: string }; answers?: Array<{ answer_text: string }> }>) {
      const dim = row.questions?.dimension || null
      if (dim) {
        instanceMap[dim] = {
          id: row.id,
          ordinal: row.ordinal,
          question_id: row.question_id,
          answer_text: row.answers && row.answers[0]?.answer_text || undefined
        }
      }
    }

    // Progress snapshot based on answered instances
    const totalQuestions = (instancesWithAnswers || []).length
    const answeredCount = Object.values(instanceMap).filter(v => typeof v.answer_text === 'string' && v.answer_text.length > 0).length

    // Include company name for client prompts
    const company = await getCompany(companyId)

    return NextResponse.json({
      completed: answeredCount >= totalQuestions && totalQuestions > 0,
      progress: {
        current: answeredCount + 1,
        total: totalQuestions
      },
      totalQuestions,
      instanceMap,
      companyName: company?.name || ''
    })

  } catch (error) {
    console.error('Survey start error:', error)
    return NextResponse.json(
      { error: 'Failed to start survey' }, 
      { status: 500 }
    )
  }
} 