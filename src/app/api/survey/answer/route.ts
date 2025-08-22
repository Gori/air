import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/supabase/server'
import { saveAnswer, updateAnswerById } from '@/lib/supabase/mutations'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAnswersForQuestionInstances } from '@/lib/supabase/queries'
import { z } from 'zod'

const answerSchema = z.object({
  questionInstanceId: z.string().uuid(),
  // Allow empty strings and structured JSON for skippable slides and prefer-not
  answerText: z.string().min(0).max(16000)
})

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const result = answerSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: result.error.errors 
      }, { status: 400 })
    }

    const { questionInstanceId, answerText } = result.data

    // Check if answer already exists for this question instance
    const existingAnswers = await getAnswersForQuestionInstances([questionInstanceId])
    
    let answer
    if (existingAnswers && existingAnswers.length > 0) {
      // If duplicates exist, keep the latest (max created_at) and remove the rest to enforce 1 row per instance
      const sorted = [...existingAnswers].sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime())
      const latest = sorted[sorted.length - 1]
      // Delete older duplicates if any
      const staleIds = sorted.slice(0, -1).map(a => a.id)
      if (staleIds.length > 0) {
        await supabaseAdmin.from('answers').delete().in('id', staleIds)
      }
      // Update the latest row only
      answer = await updateAnswerById(latest.id, answerText)
    } else {
      // Create new answer
      answer = await saveAnswer({
        question_instance_id: questionInstanceId,
        employee_id: clerkUserId,
        company_id: companyId,
        answer_text: answerText
      })
    }

    return NextResponse.json({
      success: true,
      answer: {
        id: answer.id,
        questionInstanceId: answer.question_instance_id,
        answerText: answer.answer_text
      }
    })

  } catch (error) {
    console.error('Answer submission error:', error)
    return NextResponse.json(
      { error: 'Failed to save answer' }, 
      { status: 500 }
    )
  }
} 