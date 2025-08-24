import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ensurePersonalInsightsForUser } from '@/lib/insights/ensure'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { surveyId } = await req.json() as { surveyId?: string }
    if (!surveyId) return NextResponse.json({ error: 'Missing surveyId' }, { status: 400 })

    await supabaseAdmin
      .from('personal_surveys' as never)
      .update({ completed_at: new Date().toISOString() } as never)
      .eq('id', surveyId)

    // Ensure insights exist (inline, avoids extra network hop)
    try { await ensurePersonalInsightsForUser(userId) } catch { /* best-effort */ }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('personal complete error', e)
    return NextResponse.json({ error: 'Failed to complete personal survey' }, { status: 500 })
  }
}


