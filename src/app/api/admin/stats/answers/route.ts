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

    if (!me || me.role !== 'manager' || !me.company_id) {
      return NextResponse.json({ error: 'Manager access required' }, { status: 403 })
    }

    const companyId = me.company_id as string

    const { data } = await supabaseAdmin
      .from('question_instances')
      .select(`
        id,
        questions (dimension),
        answers (answer_text)
      `)
      .eq('company_id', companyId)

    const byDim: Record<string, { answered: number; total: number; dist?: Record<string, number> }> = {}
    for (const row of (data || []) as any[]) {
      const dim = row.questions?.dimension || 'unknown'
      byDim[dim] = byDim[dim] || { answered: 0, total: 0, dist: {} }
      byDim[dim]!.total += 1
      const a = row.answers?.[0]?.answer_text
      if (typeof a === 'string' && a.length > 0) {
        byDim[dim]!.answered += 1
        try {
          const parsed = JSON.parse(a)
          if (parsed?.type === 'scale' && typeof parsed.value === 'number') {
            const k = String(parsed.value)
            byDim[dim]!.dist![k] = (byDim[dim]!.dist![k] || 0) + 1
          }
          if (parsed?.type === 'mc_single' && parsed.choice) {
            const k = String(parsed.choice)
            byDim[dim]!.dist![k] = (byDim[dim]!.dist![k] || 0) + 1
          }
          if (parsed?.type === 'mc_multi' && Array.isArray(parsed.choices)) {
            for (const c of parsed.choices) {
              const k = String(c)
              byDim[dim]!.dist![k] = (byDim[dim]!.dist![k] || 0) + 1
            }
          }
        } catch {}
      }
    }

    return NextResponse.json({ byDim })
  } catch (e) {
    console.error('answers error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}


