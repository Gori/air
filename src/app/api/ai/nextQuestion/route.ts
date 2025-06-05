import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/client'
import { 
  FOLLOW_UP_QUESTION_SYSTEM_PROMPT, 
  buildFollowUpPrompt 
} from '@/lib/ai/prompts'
import { 
  createQuestionInstance, 
  saveAnswer 
} from '@/lib/supabase/mutations'
import { getUser, getCompany } from '@/lib/supabase/queries'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const followUpSchema = z.object({
  questionInstanceId: z.string().uuid(),
  originalQuestion: z.string().min(1),
  employeeAnswer: z.string().min(1),
  currentOrdinal: z.number().int().positive()
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
    const result = followUpSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: result.error.errors 
      }, { status: 400 })
    }

    const { questionInstanceId, originalQuestion, employeeAnswer, currentOrdinal } = result.data

    // Get user and company context for better follow-up questions
    const [user, company] = await Promise.all([
      getUser(clerkUserId),
      getCompany(companyId)
    ])

    const employeeContext = {
      role: user?.full_name || 'Employee',
      company: company?.name || 'the company'
    }

    // Generate follow-up question using AI
    const prompt = buildFollowUpPrompt(originalQuestion, employeeAnswer, employeeContext)
    const aiResponse = await generateAIResponse(prompt, FOLLOW_UP_QUESTION_SYSTEM_PROMPT)

    // Check if AI determined no follow-up is needed
    if (aiResponse.content.trim() === 'NO_FOLLOWUP' || aiResponse.content.trim().length === 0) {
      return NextResponse.json({
        hasFollowUp: false,
        message: 'No follow-up question needed'
      })
    }

    // Log the AI prompt and response
    await supabaseAdmin
      .from('prompt_logs')
      .insert({
        company_id: companyId,
        employee_id: clerkUserId,
        source: 'question_selection',
        model: aiResponse.model,
        prompt,
        response: aiResponse.content
      })

    // Create a new question instance for the follow-up
    const followUpInstance = await createQuestionInstance({
      employee_id: clerkUserId,
      company_id: companyId,
      question_id: null, // AI-generated questions don't have a base question_id
      ordinal: currentOrdinal + 1,
      parent_instance: questionInstanceId
    })

    return NextResponse.json({
      hasFollowUp: true,
      followUpQuestion: {
        id: followUpInstance.id,
        text: aiResponse.content.trim(),
        ordinal: followUpInstance.ordinal,
        parentInstance: questionInstanceId
      },
      tokenUsage: aiResponse.usage
    })

  } catch (error) {
    console.error('Follow-up question generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate follow-up question' }, 
      { status: 500 }
    )
  }
} 