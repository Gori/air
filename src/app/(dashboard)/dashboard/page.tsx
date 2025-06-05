import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'
import { CompanyOnboardingForm } from '@/components/forms/company-onboarding-form'
import { UserButton } from '@/components/auth/user-button'

async function getUserAndCompany(userId: string) {
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

  const { data: user } = await supabase
    .from('users')
    .select(`
      id,
      role,
      email,
      full_name,
      company_id,
      companies (
        id,
        name,
        domain,
        invite_code,
        headcount,
        industry,
        region
      )
    `)
    .eq('id', userId)
    .single()

  return user
}

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await getUserAndCompany(userId)

  // If user doesn't exist in our database, they need to complete onboarding
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">AIR Dashboard</h1>
          <UserButton />
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to AIR
              </h2>
              <p className="text-lg text-gray-600">
                Let&apos;s set up your company to start assessing AI readiness
              </p>
            </div>
            <CompanyOnboardingForm />
          </div>
        </div>
      </div>
    )
  }

  const company = Array.isArray(user.companies) ? user.companies[0] : user.companies

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {company?.name || 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-600">
            AI Readiness Assessment
          </p>
        </div>
        <UserButton />
      </div>
      
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manager view */}
          {user.role === 'manager' && (
            <>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Company Setup
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your company is registered and ready
                </p>
                <div className="space-y-2 text-sm">
                  <div><strong>Domain:</strong> {company?.domain}</div>
                  <div><strong>Size:</strong> {company?.headcount} employees</div>
                  <div><strong>Invite Code:</strong> {company?.invite_code}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Employee Progress
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Track assessment completion
                </p>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-500">surveys completed</div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Invite Employees
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share this link with your team
                </p>
                <div className="bg-gray-50 p-3 rounded border text-sm font-mono break-all">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'}/join/{company?.invite_code}
                </div>
              </div>
            </>
          )}

          {/* Employee view */}
          {user.role === 'employee' && (
            <>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Assessment
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete your AI readiness survey
                </p>
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Start Survey
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Progress
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your completion status
                </p>
                <div className="text-2xl font-bold text-gray-600">0%</div>
                <div className="text-sm text-gray-500">completed</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 