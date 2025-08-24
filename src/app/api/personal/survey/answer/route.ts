import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { surveyId, dimension, answerText } = await req.json() as { surveyId?: string; dimension?: string; answerText?: string }
    if (!surveyId || !dimension || typeof answerText !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    // Upsert answer by (survey_id, dimension)
    const { data: existing } = await supabaseAdmin
      .from('personal_answers' as never)
      .select('id')
      .eq('survey_id', surveyId)
      .eq('dimension', dimension)
      .maybeSingle()
    const existingRow = (existing ?? null) as { id: string } | null
    if (existingRow?.id) {
      const { error: upErr } = await supabaseAdmin
        .from('personal_answers' as never)
        .update({ answer_text: answerText } as never)
        .eq('id', existingRow.id)
      if (upErr) throw upErr
    } else {
      const { error: insErr } = await supabaseAdmin
        .from('personal_answers' as never)
        .insert({ survey_id: surveyId, dimension, answer_text: answerText } as never)
      if (insErr) throw insErr
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('personal answer error', e)
    return NextResponse.json({ error: 'Failed to save personal answer' }, { status: 500 })
  }
}


