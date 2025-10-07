import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CopyInviteButton } from './copy-link'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { AssessmentCard } from '@/components/ui/assessment-card'

// ProgressRing removed (unused)

interface Onboarding {
  industry?: string | null
  headcount_range?: string | null
  // buyer/user roles removed from onboarding
  change_enablers?: string[]
  change_blockers?: string[]
  ai_readiness?: {
    ai_understanding?: number
    ai_usage_learning?: number
    ai_sharing_rhythm?: number
    ai_experimentation_culture?: number
    ai_leadership_engagement?: number
  }
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

  const [empCountRes, mgrCountRes, answersRes, companyRes, myAnswered, myTotal, startedRes, insightsRes] = await Promise.all([
    supabaseAdmin.from('users').select('id', { head: true, count: 'exact' }).eq('company_id', companyId).eq('role', 'employee'),
    supabaseAdmin.from('users').select('id', { head: true, count: 'exact' }).eq('company_id', companyId).eq('role', 'manager'),
    supabaseAdmin.from('answers').select('employee_id, created_at').eq('company_id', companyId),
    supabaseAdmin.from('companies').select('invite_code, name, created_at, industry, headcount, description').eq('id', companyId).single(),
    supabaseAdmin.from('answers').select('id', { head: true, count: 'exact' }).eq('employee_id', userId),
    supabaseAdmin.from('question_instances').select('id', { head: true, count: 'exact' }).eq('employee_id', userId),
    supabaseAdmin.from('question_instances').select('id', { head: true, count: 'exact' }).eq('company_id', companyId),
    supabaseAdmin.from('personal_insights' as never).select('user_id').eq('user_id', userId).maybeSingle()
  ])

  const employees = empCountRes.count || 0
  const managers = mgrCountRes.count || 0
  // respondents count not displayed; compute omitted
  const companyAnswers = (answersRes.data || []).length
  const companyStarted = startedRes.count || 0
  const completionRatePct = companyStarted > 0 ? Math.round((companyAnswers / companyStarted) * 100) : 0
  const answered = myAnswered.count || 0
  const total = myTotal.count || 0
  // pct unused; omitted
  const needsSelfAssessment = total > 0 && answered === 0
  const hasInsights = Boolean((insightsRes as { data?: unknown })?.data)
  const isCompleted = hasInsights || (total > 0 && answered >= total)
  const inviteCode = companyRes.data?.invite_code
  const companyName = companyRes.data?.name
  const industry = companyRes.data?.industry as string | null
  const headcount = (companyRes.data?.headcount as number | null) || null
  let onboarding: Partial<Onboarding> = {}
  try { if (companyRes.data?.description) onboarding = JSON.parse(companyRes.data.description as unknown as string) as Partial<Onboarding> } catch {}
  const createdAt = companyRes.data?.created_at ? new Date(companyRes.data.created_at) : null
  const runningDays = createdAt ? Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))) : null
  const lastAnswerAt = (answersRes.data || []).reduce((acc: number | null, r: { created_at: string | null }) => {
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
                <div className="text-sm text-muted-foreground">Industry</div>
                <div className="text-xl font-medium">{industry || onboarding.industry || '—'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Headcount</div>
                <div className="text-xl font-medium">{headcount || onboarding.headcount_range || '—'}</div>
              </div>
              {/* Value statement removed */}
              {/* buyer/user roles removed from overview */}
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm text-muted-foreground">Why now for AI-based workflows</div>
                <div className="text-lg">{Array.isArray(onboarding?.change_enablers) ? onboarding.change_enablers.join(', ') : '—'}</div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm text-muted-foreground">Why not now for AI-based workflows</div>
                <div className="text-lg">{Array.isArray(onboarding?.change_blockers) ? onboarding.change_blockers.join(', ') : '—'}</div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm text-muted-foreground">AI Readiness & Culture (sliders)</div>
                <div className="text-sm">
                  <div>Understanding: {onboarding?.ai_readiness?.ai_understanding ?? '—'}</div>
                  <div>Usage & learning: {onboarding?.ai_readiness?.ai_usage_learning ?? '—'}</div>
                  <div>Sharing rhythm: {onboarding?.ai_readiness?.ai_sharing_rhythm ?? '—'}</div>
                  <div>Experimentation culture: {onboarding?.ai_readiness?.ai_experimentation_culture ?? '—'}</div>
                  <div>Leadership engagement: {onboarding?.ai_readiness?.ai_leadership_engagement ?? '—'}</div>
                </div>
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
          {isCompleted ? (
            <AssessmentCard href="/personal/insights" title="Assessment" subtitle="View your personal insights" value={total} total={total} />
          ) : (
            <AssessmentCard href="/survey" title="Assessment" subtitle="Complete your survey" value={answered} total={total} />
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


