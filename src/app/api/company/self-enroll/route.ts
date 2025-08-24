import { NextRequest, NextResponse } from 'next/server'

// Deprecated: self-enroll by domain has been removed. Use invite link join.
export async function POST(request: NextRequest) {
  const url = new URL('/welcome', request.url)
  url.searchParams.set('error', 'self_enroll_deprecated')
  return NextResponse.redirect(url, { status: 410 })
}


