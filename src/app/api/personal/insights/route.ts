import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/utils/api-response'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return ApiErrors.unauthorized()
    const { data } = await supabaseAdmin
      .from('personal_insights')
      .select('user_id, survey_id, generated_at, scores_json, narrative_json')
      .eq('user_id', userId)
      .maybeSingle()
    if (!data) return NextResponse.json({ insights: null })
    return NextResponse.json({ insights: data })
  } catch (e) {
    console.error('get personal insights error', e)
    return ApiErrors.internal('Failed to load insights')
  }
}


