import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getCompanyId, getUserId } from '@/lib/supabase/server'
import { 
  getEmployeeQuestionInstances, 
  getUser 
} from '@/lib/supabase/queries'
import { 
  initializeEmployeeQuestions, 
  getNextQuestion,
  upsertUser 
} from '@/lib/supabase/mutations'

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

    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'User UUID not found' }, { status: 400 })
    }

    // Check if user already has question instances
    const questionInstances = await getEmployeeQuestionInstances(userId)
    
    // If no question instances exist, initialize them
    if (!questionInstances || questionInstances.length === 0) {
      await initializeEmployeeQuestions(userId, companyId)
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