import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    console.warn('[onboarding/start] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find user's company
  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single()
  if (userErr) {
    console.error('[onboarding/start] Failed to load user', userErr)
  }

  // Ensure company exists for this user; if not, create a minimal company and attach the user
  let companyId = user?.company_id as string | null
  if (!companyId) {
    try {
      const newId = `comp_${crypto.randomBytes(8).toString('hex')}`
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({ id: newId, name: 'My Company', domain: `${newId}.local`, headcount: null, industry: null, region: null, description: null })
        .select()
        .single()
      if (companyError) {
        console.error('[onboarding/start] Failed to create company', companyError)
      }
      if (!companyError && company) {
        companyId = company.id
        const up = await supabaseAdmin
          .from('users')
          .upsert({ id: userId, company_id: companyId, role: 'manager', email: '', full_name: null }, { onConflict: 'id' })
        if (up.error) console.error('[onboarding/start] Failed to upsert user link', up.error)
      }
    } catch {}
  }

  // Load existing onboarding from companies.description (JSON string) for compatibility
  if (!companyId) {
    return NextResponse.json({ error: 'No company' }, { status: 400 })
  }
  const { data: companyRow, error: compErr } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()
  if (compErr) {
    console.error('[onboarding/start] Failed to load company row', compErr)
  }
  type OnboardingData = Record<string, unknown>
  let parsed: OnboardingData = {}
  try {
    if (companyRow?.description) parsed = JSON.parse(companyRow.description) as OnboardingData
  } catch {}

  // Ensure Clerk public metadata has role + company_id to satisfy downstream guards
  try {
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: 'manager',
        company_id: companyId,
      },
    })
  } catch (e) {
    console.error('[onboarding/start] Failed to set Clerk metadata', e)
  }
  return NextResponse.json({ data: parsed || {} })
}


