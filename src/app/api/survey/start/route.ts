import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId, getUserId } from '@/lib/supabase/server'
import { 
  getEmployeeQuestionInstances 
} from '@/lib/supabase/queries'
import { 
  initializeEmployeeQuestions, 
  getNextQuestion 
} from '@/lib/supabase/mutations'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

    // Get the next unanswered question
    const nextQuestion = await getNextQuestion(userId)
    
    // Get fresh count of question instances for progress tracking
    const allInstances = await getEmployeeQuestionInstances(userId)
    const totalQuestions = allInstances?.length || 0
    
    if (!nextQuestion) {
      return NextResponse.json({ 
        message: 'Survey completed',
        completed: true,
        totalQuestions 
      })
    }

    return NextResponse.json({
      questionInstance: nextQuestion,
      progress: {
        current: nextQuestion.ordinal,
        total: totalQuestions
      },
      completed: false
    })

  } catch (error) {
    console.error('Survey start error:', error)
    return NextResponse.json(
      { error: 'Failed to start survey' }, 
      { status: 500 }
    )
  }
} 