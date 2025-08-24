import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

    // Ensure insights exist
    const res = await fetch(new URL('/api/insights/ensure', req.url), { method: 'POST' })
    void res
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('personal complete error', e)
    return NextResponse.json({ error: 'Failed to complete personal survey' }, { status: 500 })
  }
}


