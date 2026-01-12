import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/utils/api-response'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) return ApiErrors.unauthorized()

    const { data: me } = await supabaseAdmin
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single()
    if (!me || me.role !== 'manager' || !me.company_id) {
      return ApiErrors.managerRequired()
    }

    // Ensure target belongs to same company
    const { id: targetId } = await params
    const { data: target } = await supabaseAdmin
      .from('users')
      .select('id, company_id')
      .eq('id', targetId)
      .single()
    if (!target || target.company_id !== me.company_id) {
      return ApiErrors.notFound('User')
    }

    const { data: insights } = await supabaseAdmin
      .from('personal_insights')
      .select('user_id, survey_id, generated_at, scores_json, narrative_json')
      .eq('user_id', targetId)
      .maybeSingle()

    return NextResponse.json({ insights: insights || null })
  } catch (e) {
    console.error('admin user insights error', e)
    return ApiErrors.internal()
  }
}


