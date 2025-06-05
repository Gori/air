import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'
import { validateEmailDomain } from '@/lib/clerk/utils'

interface JoinRouteProps {
  params: Promise<{ invite_code: string }>
}

export async function GET(request: NextRequest, { params }: JoinRouteProps) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const { invite_code } = await params
    
    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Get company by invite code
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, domain')
      .eq('invite_code', invite_code.toUpperCase())
      .single()

    if (companyError || !company) {
      return NextResponse.redirect(new URL('/sign-up?error=invalid_invite', request.url))
    }

    // Get current user details from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress

    if (!userEmail) {
      return NextResponse.redirect(new URL('/sign-up?error=no_email', request.url))
    }

    // Validate email domain
    if (!validateEmailDomain(userEmail, company.domain)) {
      const errorUrl = new URL('/sign-up', request.url)
      errorUrl.searchParams.set('error', 'invalid_domain')
      errorUrl.searchParams.set('expected_domain', company.domain)
      return NextResponse.redirect(errorUrl)
    }

    // Check if user already exists in our database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, company_id, role')
      .eq('id', userId)
      .single()

    if (existingUser) {
      // User already exists, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Create user record as employee
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        company_id: company.id,
        role: 'employee',
        email: userEmail,
        full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
      })

    if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.redirect(new URL('/sign-up?error=creation_failed', request.url))
    }

    // Update Clerk user metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'employee',
        company_id: company.id,
        company_name: company.name,
        company_domain: company.domain,
      }
    })

    // Redirect to dashboard/survey
    return NextResponse.redirect(new URL('/dashboard', request.url))

  } catch (error) {
    console.error('Join process error:', error)
    return NextResponse.redirect(new URL('/sign-up?error=server_error', request.url))
  }
} 