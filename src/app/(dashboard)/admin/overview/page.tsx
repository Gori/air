import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CopyInviteButton } from './copy-link'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

function ProgressRing({ value, total }: { value: number; total: number }) {
  const clampedTotal = total > 0 ? total : 1
  const progress = Math.max(0, Math.min(1, value / clampedTotal))
  const size = 42
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference
  const offset = circumference - progress * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
        {value}/{clampedTotal}
      </div>
    </div>
  )
}

export default async function AdminOverviewPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()

  if (!me || me.role !== 'manager' || !me.company_id) redirect('/welcome')

  const companyId = me.company_id as string

  const [empCountRes, mgrCountRes, answersRes, companyRes, myAnswered, myTotal, startedRes] = await Promise.all([
    supabaseAdmin.from('users').select('id', { head: true, count: 'exact' }).eq('company_id', companyId).eq('role', 'employee'),
    supabaseAdmin.from('users').select('id', { head: true, count: 'exact' }).eq('company_id', companyId).eq('role', 'manager'),
    supabaseAdmin.from('answers').select('employee_id, created_at').eq('company_id', companyId),
    supabaseAdmin.from('companies').select('invite_code, name, created_at').eq('id', companyId).single(),
    supabaseAdmin.from('answers').select('id', { head: true, count: 'exact' }).eq('employee_id', userId),
    supabaseAdmin.from('question_instances').select('id', { head: true, count: 'exact' }).eq('employee_id', userId),
    supabaseAdmin.from('question_instances').select('id', { head: true, count: 'exact' }).eq('company_id', companyId)
  ])

  const employees = empCountRes.count || 0
  const managers = mgrCountRes.count || 0
  const respondents = new Set((answersRes.data || []).map((r: any) => r.employee_id)).size
  const companyAnswers = (answersRes.data || []).length
  const companyStarted = startedRes.count || 0
  const completionRatePct = companyStarted > 0 ? Math.round((companyAnswers / companyStarted) * 100) : 0
  const answered = myAnswered.count || 0
  const total = myTotal.count || 0
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0
  const needsSelfAssessment = total > 0 && answered === 0
  const inviteCode = companyRes.data?.invite_code
  const companyName = companyRes.data?.name
  const createdAt = companyRes.data?.created_at ? new Date(companyRes.data.created_at) : null
  const runningDays = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : null
  const lastAnswerAt = (answersRes.data || []).reduce((acc: number | null, r: any) => {
    const ts = r.created_at ? new Date(r.created_at).getTime() : null
    if (ts === null) return acc
    return acc === null ? ts : Math.max(acc, ts)
  }, null as number | null)

  return (
    <div className="space-y-6">
      {needsSelfAssessment && (
        <PageHeader>
          <div />
          <Button asChild><a href="/survey">Take the test</a></Button>
        </PageHeader>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main summary card (3/4) */}
        <Card className="lg:col-span-2 py-6">
          <CardHeader className="border-b border-neutral-200">
            <CardTitle className="">Company overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Company</div>
                <div className="text-xl font-medium">{companyName || '—'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Running</div>
                <div className="text-xl font-medium">{runningDays !== null ? `${runningDays} day${runningDays === 1 ? '' : 's'}` : '—'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Employees</div>
                <div className="text-xl font-medium">{employees}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Answers / Started</div>
                <div className="text-xl font-medium">{companyAnswers} / {companyStarted}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Managers</div>
                <div className="text-xl font-medium">{managers}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Completion rate</div>
                <div className="text-xl font-medium">{completionRatePct}%</div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm text-muted-foreground">Last activity</div>
                <div className="text-xl font-medium">{lastAnswerAt ? new Date(lastAnswerAt).toLocaleString() : '—'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column (1/4) stacked cards */}
        <div className="lg:col-span-1 space-y-4">
          {total > 0 && answered < total ? (
            <Link href="/survey" className="block" aria-label="Complete the survey">
              <Card className="bg-[#abd37a] border-[#68c282] text-black p-4 cursor-pointer transition hover:brightness-95">
                <CardContent>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <ProgressRing value={answered} total={total} />
                      <div>
                        <div className="font-sans text-lg font-medium">Complete your survey</div>
                        <div className="text-black/80">Finish to get personal insights</div>
                      </div>
                    </div>
                    <ChevronRight className="size-6 text-black/80" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="bg-[#abd37a] border-[#68c282] text-black p-4">
              <CardContent>
                <div className="space-y-2">
                  <div className="font-sans text-lg font-medium">Assessment</div>
                  <div className="text-black/80">{pct}% complete</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-[#eae7fc] border-[#ddd6fb] text-foreground p-4">
            <CardHeader className="pb-0 mb-0 gap-0">
              <div className="font-sans text-xl font-medium pb-0 w-full">Share assessment</div>
            </CardHeader>
            <CardContent>
              {inviteCode ? (
                <div className="space-y-0 pb-2">
                  
                  <div className="flex items-center gap-3">
                    <code className="pr-3 py-0 rounded font-mono font-medium whitespace-nowrap"><div className="text-sm text-muted-foreground font-sans mr-12 pb-1">Invite code</div>{inviteCode}</code>
                    <CopyInviteButton inviteCode={inviteCode} />
                  </div>
                </div>
              ) : '—'}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


