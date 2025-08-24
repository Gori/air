import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data } = await supabaseAdmin
      .from('personal_insights' as never)
      .select('user_id, survey_id, generated_at, scores_json, narrative_json')
      .eq('user_id', userId)
      .maybeSingle()
    if (!data) return NextResponse.json({ insights: null })
    return NextResponse.json({ insights: data })
  } catch (e) {
    console.error('get personal insights error', e)
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 })
  }
}


