import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ensureCompanyOnboardingSummary } from '@/lib/insights/company'

async function loadSummary(companyId: string) {
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()
  let summary: Record<string, unknown> | null = null
  try {
    if (company?.description) {
      const parsed = JSON.parse(company.description as unknown as string) as Record<string, unknown>
      summary = (parsed as { onboarding_summary?: Record<string, unknown> })?.onboarding_summary || null
    }
  } catch {}
  return summary
}

export default async function AdminOnboardingSummaryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()
  if (!me || me.role !== 'manager' || !me.company_id) redirect('/welcome')

  // Try to ensure once if missing
  let summary = await loadSummary(me.company_id)
  if (!summary) {
    try {
      await ensureCompanyOnboardingSummary(me.company_id)
    } catch (e) {
      console.error('[admin/summary] ensure failed', e)
    }
    summary = await loadSummary(me.company_id)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-neutral-200">
          <CardTitle>Onboarding Readiness Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {!summary ? (
            <div className="text-sm text-neutral-500">Generating summary… Refresh in a few seconds.</div>
          ) : (
            <div className="space-y-6">
              {'summary' in summary && typeof summary.summary === 'string' && (
                <section>
                  <h3 className="text-lg font-medium mb-2">Executive Summary</h3>
                  <p className="text-sm leading-6 whitespace-pre-line">{summary.summary}</p>
                </section>
              )}

              {'readiness_score' in summary && typeof summary.readiness_score === 'number' && (
                <section>
                  <h3 className="text-lg font-medium mb-2">Readiness Score</h3>
                  <div className="text-sm">{summary.readiness_score.toFixed(1)} / 5</div>
                </section>
              )}

              {'key_signals' in summary && Array.isArray(summary.key_signals) && (
                <section>
                  <h3 className="text-lg font-medium mb-2">Key Signals</h3>
                  <ul className="list-disc ml-6 text-sm space-y-1">
                    {summary.key_signals.map((s: unknown, i: number) => (
                      <li key={i}>{typeof s === 'string' ? s : String(s)}</li>
                    ))}
                  </ul>
                </section>
              )}

              {'recommended_actions' in summary && Array.isArray(summary.recommended_actions) && (
                <section>
                  <h3 className="text-lg font-medium mb-2">Recommended Actions</h3>
                  <ul className="list-disc ml-6 text-sm space-y-1">
                    {summary.recommended_actions.map((s: unknown, i: number) => (
                      <li key={i}>{typeof s === 'string' ? s : String(s)}</li>
                    ))}
                  </ul>
                </section>
              )}

              {'tips' in summary && Array.isArray(summary.tips) && (
                <section>
                  <h3 className="text-lg font-medium mb-2">Tips & Tricks</h3>
                  <ul className="list-disc ml-6 text-sm space-y-1">
                    {summary.tips.map((s: unknown, i: number) => (
                      <li key={i}>{typeof s === 'string' ? s : String(s)}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


