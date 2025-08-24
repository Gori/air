import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const targetId = params.id
    // Ensure target belongs to same company
    const { data: target } = await supabaseAdmin
      .from('users')
      .select('id, company_id')
      .eq('id', targetId)
      .single()
    if (!target || target.company_id !== me.company_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete dependent rows: answers → question_instances → user
    await supabaseAdmin.from('answers').delete().eq('employee_id', targetId)
    await supabaseAdmin.from('question_instances').delete().eq('employee_id', targetId)
    await supabaseAdmin.from('users').delete().eq('id', targetId)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('delete user error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


