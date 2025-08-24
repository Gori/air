import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Disabled' }, { status: 410 })
}


