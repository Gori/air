import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/utils/api-response'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return ApiErrors.unauthorized()
  const { data: me } = await supabaseAdmin
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()
  if (!me || me.role !== 'manager' || !me.company_id) {
    return ApiErrors.managerRequired()
  }
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('company_id', me.company_id)
  return NextResponse.json({ users: data || [] })
}


