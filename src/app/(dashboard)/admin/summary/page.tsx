import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { loadSummaryV2 } from '@/lib/insights/company'
import { SummaryLoader } from '@/components/admin/SummaryLoader'
import { SummaryContent } from '@/components/admin/SummaryContent'

export default async function AdminSummaryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()

  if (!me || me.role !== 'manager' || !me.company_id) {
    redirect('/welcome')
  }

  const summary = await loadSummaryV2(me.company_id)

  if (!summary) {
    return (
      <div className="space-y-6">
        <SummaryLoader />
      </div>
    )
  }

  return <SummaryContent summary={summary} companyId={me.company_id} />
}
