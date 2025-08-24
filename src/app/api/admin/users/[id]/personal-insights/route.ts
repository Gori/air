import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabaseAdmin
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single()
    if (!me || me.role !== 'manager' || !me.company_id) {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 })
    }

    // Ensure target belongs to same company
    const targetId = params.id
    const { data: target } = await supabaseAdmin
      .from('users')
      .select('id, company_id')
      .eq('id', targetId)
      .single()
    if (!target || target.company_id !== me.company_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: insights } = await supabaseAdmin
      .from('personal_insights' as never)
      .select('user_id, survey_id, generated_at, scores_json, narrative_json')
      .eq('user_id', targetId)
      .maybeSingle()

    return NextResponse.json({ insights: insights || null })
  } catch (e) {
    console.error('admin user insights error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


