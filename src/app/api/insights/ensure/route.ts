import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ensurePersonalInsightsForUser } from '@/lib/insights/ensure'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const created = await ensurePersonalInsightsForUser(userId)
    return NextResponse.json({ created })
  } catch (e) {
    console.error('ensure insights error', e)
    return NextResponse.json({ error: 'Failed to ensure insights' }, { status: 500 })
  }
}


