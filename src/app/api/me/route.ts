import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabaseAdmin
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      role: me?.role || 'employee',
      company_id: me?.company_id || null,
    })
  } catch {
    return NextResponse.json({ role: 'employee', company_id: null })
  }
}


