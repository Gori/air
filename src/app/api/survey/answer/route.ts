import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/supabase/server'
import { saveAnswer, updateAnswer } from '@/lib/supabase/mutations'
import { getAnswersForQuestionInstances } from '@/lib/supabase/queries'
import { z } from 'zod'

const answerSchema = z.object({
  questionInstanceId: z.string().uuid(),
  answerText: z.string().min(1, 'Answer cannot be empty').max(2000, 'Answer too long')
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
      // Update existing answer
      answer = await updateAnswer(questionInstanceId, answerText)
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