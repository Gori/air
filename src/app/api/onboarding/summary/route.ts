import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ensureCompanyOnboardingSummary, getExistingOnboardingSummary } from '@/lib/insights/company'

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const summary = await getExistingOnboardingSummary(me.company_id)
    return NextResponse.json({ summary })
  } catch (e) {
    console.error('[onboarding/summary] GET failed', e)
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabaseAdmin
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single()
    if (!me || me.role !== 'manager' || !me.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Ensure-only: if exists, do not regenerate
    const existing = await getExistingOnboardingSummary(me.company_id)
    if (existing) return NextResponse.json({ created: false, summary: existing })

    const { created, summary } = await ensureCompanyOnboardingSummary(me.company_id)
    return NextResponse.json({ created, summary })
  } catch (e) {
    console.error('[onboarding/summary] POST failed', e)
    return NextResponse.json({ error: 'Failed to ensure summary' }, { status: 500 })
  }
}


