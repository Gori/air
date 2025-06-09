import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { randomBytes, randomUUID } from 'crypto'
import { sendEmail } from '@/lib/email/client'
import type { Database } from '@/types/database'

const registerCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  domain: z.string().email('Invalid domain format').transform(email => email.split('@')[1]),
  headcount: z.number().min(1, 'Headcount must be at least 1'),
  industry: z.string().min(1, 'Industry is required'),
  region: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = registerCompanySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', issues: validation.error.issues },
        { status: 400 }
      )
    }

    const { name, domain, headcount, industry, region } = validation.data

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
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Check if domain already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('domain', domain)
      .single()

    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company with this domain already exists' },
        { status: 409 }
      )
    }

    // Generate a simple text-based company ID
    const companyId = `comp_${randomBytes(8).toString('hex')}`

    // Create company with explicit text ID
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        id: companyId,
        name,
        domain: domain.toLowerCase(),
        headcount,
        industry,
        region,
      })
      .select()
      .single()

    if (companyError) {
      console.error('Company creation error:', companyError)
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      )
    }

    // Generate invite code
    const inviteCode = `INV-${randomBytes(3).toString('hex').toUpperCase()}`
    
    // Update company with invite code
    const { error: updateError } = await supabase
      .from('companies')
      .update({ invite_code: inviteCode })
      .eq('id', company.id)

    if (updateError) {
      console.error('Invite code update error:', updateError)
    }

    // Get current user details
    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    // Create user record with Clerk ID
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        company_id: company.id,
        role: 'manager',
        email: user.emailAddresses[0]?.emailAddress || '',
        full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
      })

    if (userError) {
      console.error('User creation error:', userError)
      // Cleanup: delete the company if user creation fails
      await supabase.from('companies').delete().eq('id', company.id)
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    // Update Clerk user metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'manager',
        company_id: company.id,
        company_name: company.name,
        company_domain: company.domain,
      }
    })

    // Send welcome email to the manager
    try {
      await sendEmail({
        to: user.emailAddresses[0]?.emailAddress || '',
        subject: `Welcome to AIR - ${company.name} Registration Complete`,
        template: 'welcome',
        data: {
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Manager',
          companyName: company.name,
          dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
        }
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          domain: company.domain,
          invite_code: inviteCode,
        }
      }
    })

  } catch (error) {
    console.error('Company registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 