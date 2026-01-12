import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UsersTable, type AdminUserRow } from './users-table'
import { getEmployeeSurveyProgress } from '@/lib/supabase/queries'

export default async function AdminUsersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const { data: me } = await supabaseAdmin
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()
  if (!me || me.role !== 'manager' || !me.company_id) redirect('/welcome')

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('company_id', me.company_id)

  const ids = (users || []).map((u) => u.id)
  // Batch fetch insights presence
  const { data: insightsRows } = await supabaseAdmin
    .from('personal_insights')
    .select('user_id')
    .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])

  const hasInsightsSet = new Set<string>((insightsRows || []).map((r) => r.user_id))

  // Progress per user (company survey)
  const progressList = await Promise.all(
    (users || []).map(async (u) => {
      const p = await getEmployeeSurveyProgress(u.id)
      return { id: u.id, total: p.total, completed: p.completed }
    })
  )
  const progressById = new Map(progressList.map((p) => [p.id, p]))

  const rows: AdminUserRow[] = (users || []).map((u) => {
    const p = progressById.get(u.id) || { total: 0, completed: 0 }
    const status = p.total === 0 && p.completed === 0
      ? 'not_started'
      : p.completed >= p.total && p.total > 0
      ? 'completed'
      : 'in_progress'
    return {
      id: u.id,
      name: u.full_name || '',
      email: u.email || '',
      role: u.role || 'employee',
      status,
      completedCount: p.completed,
      totalCount: p.total,
      hasInsights: hasInsightsSet.has(u.id),
      joinedAt: u.created_at,
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-neutral-200">
          <CardTitle className="">Currently registered users</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable data={rows} />
        </CardContent>
      </Card>
    </div>
  )
}


