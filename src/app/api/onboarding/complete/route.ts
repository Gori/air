import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('company_id, role')
    .eq('id', userId)
    .single()

  const companyId = user?.company_id
  if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

  const { data: companyRow, error: compErr } = await supabaseAdmin
    .from('companies')
    .select('description')
    .eq('id', companyId)
    .single()
  if (compErr) {
    console.error('[onboarding/complete] Failed to load company', compErr)
  }
  interface CompanyOnboarding {
    industry?: string
    headcount?: number
    headcount_range?: string
    company_name?: string
  }
  let data: CompanyOnboarding = {}
  try { if (companyRow?.description) data = JSON.parse(companyRow.description) as CompanyOnboarding } catch {}
  const updates: { industry?: string; headcount?: number | null; name?: string } = {}
  if (typeof data.industry === 'string' && data.industry.length > 0) updates.industry = data.industry
  if (typeof data.headcount === 'number' && data.headcount > 0) updates.headcount = data.headcount
  if (typeof data.headcount_range === 'string' && data.headcount_range.length > 0 && !updates.headcount) {
    // Map range to an approximate midpoint number if headcount not provided
    const map: Record<string, number> = { '1-10': 10, '11-50': 50, '51-200': 200, '201-1000': 1000, '1000+': 1000 }
    updates.headcount = map[data.headcount_range] || null
  }
  if (typeof data.company_name === 'string' && data.company_name.trim().length > 0) {
    updates.name = data.company_name.trim()
  }

  if (Object.keys(updates).length > 0) {
    const r = await supabaseAdmin.from('companies').update(updates).eq('id', companyId)
    if (r.error) console.error('[onboarding/complete] Failed to update companies', r.error)
    else console.log('[onboarding/complete] Updated company fields', updates)
  }

  // Ensure user row is linked and role is manager
  if (!user || user.role !== 'manager' || !user.company_id) {
    const up = await supabaseAdmin.from('users').upsert({ id: userId, company_id: companyId, role: 'manager' } as never, { onConflict: 'id' } as never).select('company_id, role').single()
    if (up.error) console.error('[onboarding/complete] Failed to upsert user role/company', up.error)
    else console.log('[onboarding/complete] Ensured user role/company', up.data)
  }

  // Ensure Clerk public metadata has role + company_id (idempotent)
  try {
    const client = await clerkClient()
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: 'manager',
        company_id: companyId,
      },
    })
  } catch (e) {
    console.error('[onboarding/complete] Failed to set Clerk metadata', e)
  }

  return NextResponse.json({ success: true, redirect: '/onboarding/welcome' })
}


