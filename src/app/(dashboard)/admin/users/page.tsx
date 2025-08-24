import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-neutral-200">
          <CardTitle className="">Currently registered users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-2">
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-2 pr-4">Name</th>
                    <th className="text-left py-2 pr-4">Email</th>
                    <th className="text-left py-2 pr-4">Role</th>
                    <th className="text-left py-2 pr-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(users || []).map((u) => (
                    <tr key={u.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4">
                        <Link href={`/admin/users/${u.id}`}>{u.full_name || '—'}</Link>
                      </td>
                      <td className="py-3 pr-4">{u.email}</td>
                      <td className="py-3 pr-4 capitalize">{u.role}</td>
                      <td className="py-3 pr-4">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


