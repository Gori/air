import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Ensure a personal survey exists (requires personal_* tables to be migrated)
    const { data: selRows, error: selError } = await supabaseAdmin
      .from('personal_surveys' as never)
      .select('id, created_at, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
    if (selError) {
      return NextResponse.json({ error: 'Missing personal tables or DB error', details: selError.message }, { status: 500 })
    }
    const existingSurvey = (Array.isArray(selRows) && selRows.length > 0 ? selRows[0] : null) as { id: string } | null

    // Ensure a users row exists so FK(user_id -> users.id) succeeds in personal_* tables
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (!existingUser) {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const email = clerkUser.emailAddresses[0]?.emailAddress || ''
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null
      const { error: insertUserErr } = await supabaseAdmin
        .from('users')
        .upsert({ id: userId, company_id: null, role: 'employee', email, full_name: fullName } as never, { onConflict: 'id' } as never)
      if (insertUserErr) {
        return NextResponse.json({ error: 'Failed to create user record', details: insertUserErr.message }, { status: 500 })
      }
    }

    let surveyId = (existingSurvey?.id as string | undefined)
    if (!surveyId) {
      const { data: created, error: createErr } = await supabaseAdmin
        .from('personal_surveys' as never)
        .insert({ user_id: userId } as never)
        .select('*')
        .single()
      if (createErr) throw createErr
      surveyId = (created as { id: string }).id
    }

    // Build instance map from saved answers
    const { data: answers, error: ansErr } = await supabaseAdmin
      .from('personal_answers' as never)
      .select('dimension, answer_text, created_at')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: true })
    if (ansErr) {
      return NextResponse.json({ error: 'DB error reading personal answers', details: ansErr.message }, { status: 500 })
    }

    const instanceMap: Record<string, { id: string; ordinal: number; question_id: number | null; answer_text?: string }> = {}
    let ordinal = 1
    for (const row of ((answers as Array<{ dimension: string; answer_text: string }> | null) || [])) {
      instanceMap[row.dimension] = { id: `personal_${row.dimension}`, ordinal: ordinal++, question_id: null, answer_text: row.answer_text }
    }

    const total = 20
    const answered = Object.values(instanceMap).filter(v => v.answer_text && v.answer_text.length > 0).length

    return NextResponse.json({
      completed: answered >= total && total > 0,
      progress: { current: answered + 1, total },
      instanceMap,
      surveyId,
    })
  } catch (e) {
    console.error('personal start error', e)
    return NextResponse.json({ error: 'Failed to start personal survey' }, { status: 500 })
  }
}


