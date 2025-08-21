import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId, getUserId } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { rating, comment, surveyVersion = 'v2', userAgent } = body || {}

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }
    if (comment && typeof comment === 'string' && comment.length > 140) {
      return NextResponse.json({ error: 'Comment too long (max 140 chars)' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('feedback_survey_ratings')
      .insert({
        company_id: companyId,
        user_id: userId,
        survey_version: surveyVersion,
        rating,
        comment: comment || null,
        user_agent: userAgent || null
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Survey rating error:', error)
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
  }
}


