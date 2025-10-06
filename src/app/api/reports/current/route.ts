import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const companyId = await getCompanyId()
    if (!companyId) return NextResponse.json({ report: null })

    const { data } = await supabaseAdmin
      .from('reports')
      .select('id, generated_at, scores_json, narrative_json, shared_slug')
      .eq('company_id', companyId)
      .order('generated_at', { ascending: false } as never)
      .limit(1)
      .maybeSingle()

    if (!data) return NextResponse.json({ report: null })

    // Compute summary fields on the fly
    const scores = (data.scores_json || {}) as Record<string, { score?: number }>
    const scoreValues = Object.values(scores).map((s) => Number(s?.score ?? 0)).filter((n) => Number.isFinite(n))
    const averageScore = scoreValues.length ? Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 10) / 10 : 0

    const [{ count: totalEmployees = 0 }, { count: totalResponses = 0 }] = await Promise.all([
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role', 'employee'),
      supabaseAdmin
        .from('answers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
    ])

    return NextResponse.json({
      report: {
        id: data.id,
        shareSlug: data.shared_slug,
        createdAt: data.generated_at,
        scores: data.scores_json,
        narrative: data.narrative_json,
        summary: {
          totalEmployees: totalEmployees || 0,
          totalResponses: totalResponses || 0,
          averageScore,
          completionDate: data.generated_at,
        },
      },
    })
  } catch (e) {
    console.error('get current report error', e)
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
  }
}


