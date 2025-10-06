import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    console.warn('[onboarding/save] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch((e) => {
    console.error('[onboarding/save] Failed to parse JSON body', e)
    return {}
  })
  const patch = body?.data || {}
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    console.warn('[onboarding/save] Invalid payload', { received: body })
    return NextResponse.json({ error: 'Invalid payload: expected { data: object }' }, { status: 400 })
  }

  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single()
  if (userErr) {
    console.error('[onboarding/save] Failed to load user', userErr)
  }

  let companyId = user?.company_id as string | null
  if (!companyId) {
    // Ensure company and user record exist (idempotent)
    try {
      const newId = `comp_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`
      const created = await supabaseAdmin.from('companies').insert({ id: newId, name: 'My Company', domain: `${newId}.local`, headcount: null, industry: null, region: null, description: null }).select().single()
      if (created.error) {
        console.error('[onboarding/save] Failed to create company', created.error)
      }
      if (!created.error && created.data) {
        companyId = created.data.id
        const up = await supabaseAdmin.from('users').upsert({ id: userId, company_id: companyId, role: 'manager', email: '', full_name: null }, { onConflict: 'id' }).select().single()
        if (up.error) console.error('[onboarding/save] Failed to upsert user company link', up.error)
      }
    } catch (e) {
      console.error('[onboarding/save] Exception ensuring company', e)
    }
  }
  if (!companyId) {
    console.error('[onboarding/save] No company after ensure')
    return NextResponse.json({ error: 'No company' }, { status: 400 })
  }

  // Store onboarding JSON in companies.description (JSON string)
  const { data: companyRow, error: compErr } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()
  if (compErr && compErr.code !== 'PGRST116') {
    console.error('[onboarding/save] Failed to load company', compErr)
  }
  type OnboardingPayload = Record<string, unknown>
  let existingObj: OnboardingPayload = {}
  try { if (companyRow?.description) existingObj = JSON.parse(companyRow.description) as OnboardingPayload } catch {}
  const merged: OnboardingPayload = { ...existingObj, ...patch }
  const upd = await supabaseAdmin
    .from('companies')
    .update({ description: JSON.stringify(merged) })
    .eq('id', companyId)
    .select()
    .single()
  if (upd.error) {
    console.error('[onboarding/save] Update companies.description error', upd.error)
    return NextResponse.json({ error: 'Failed to save', detail: upd.error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: merged })
}


