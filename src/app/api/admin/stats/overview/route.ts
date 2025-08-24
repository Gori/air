import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
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

    const companyId = me.company_id as string

    const [{
      count: employeesCount
    }, answersRes, companyRes, myAnsweredCount, myTotalCount] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('role', 'employee'),
      supabaseAdmin.from('answers').select('employee_id, created_at').eq('company_id', companyId),
      supabaseAdmin.from('companies').select('invite_code, name').eq('id', companyId).single(),
      supabaseAdmin.from('answers').select('id', { head: true, count: 'exact' }).eq('employee_id', userId),
      supabaseAdmin.from('question_instances').select('id', { head: true, count: 'exact' }).eq('employee_id', userId)
    ])

    const respondentsSet = new Set((answersRes.data || []).map((r: { employee_id: string | null }) => r.employee_id || ''))
    const respondents = respondentsSet.size

    const recent = (answersRes.data || [])
      .sort((a: { created_at: string | null }, b: { created_at: string | null }) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 5)

    return NextResponse.json({
      employees: employeesCount || 0,
      respondents,
      recent,
      company: companyRes.data || null,
      managerProgress: {
        answered: myAnsweredCount.count || 0,
        total: myTotalCount.count || 0
      }
    })
  } catch (e) {
    console.error('overview error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


