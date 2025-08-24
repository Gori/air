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
      .maybeSingle()

    if (!data) return NextResponse.json({ report: null })
    return NextResponse.json({ report: {
      id: data.id,
      shareSlug: data.shared_slug,
      createdAt: data.generated_at,
      scores: data.scores_json,
      narrative: data.narrative_json,
    } })
  } catch (e) {
    console.error('get current report error', e)
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
  }
}


