import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import type { Database } from '@/lib/supabase/database.types'
import { EmployeeJoinForm } from '@/components/forms/employee-join-form'

interface JoinPageProps {
  params: Promise<{ invite_code: string }>
}

async function getCompanyByInviteCode(inviteCode: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, domain')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (error || !company) {
    return null
  }

  return company
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { invite_code } = await params
  const { userId } = await auth()

  const company = await getCompanyByInviteCode(invite_code)

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 mb-6">
            This invitation link is not valid or has expired.
          </p>
          <a 
            href="/sign-up"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign Up Instead
          </a>
        </div>
      </div>
    )
  }

  // If user is already authenticated, redirect to processing
  if (userId) {
    redirect(`/api/auth/join/${invite_code}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join {company.name}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You&apos;ve been invited to complete an AI readiness assessment
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Domain: {company.domain}
          </p>
        </div>
        
        <EmployeeJoinForm 
          companyId={company.id}
          companyName={company.name}
          companyDomain={company.domain}
          inviteCode={invite_code}
        />
      </div>
    </div>
  )
} 