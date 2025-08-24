import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// Invite manager flow removed
import { AssessmentCard } from '@/components/ui/assessment-card'

export default async function WelcomePage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const role = (user.publicMetadata?.role as string | undefined) || undefined
  const companyId = (user.publicMetadata?.company_id as string | undefined) || undefined

  // Determine visibility flags for options
  const showCompanyTest = Boolean(companyId && role !== 'manager')
  const showPersonalTest = !companyId

  // Check if personal insights exist
  const { data: insights } = await supabaseAdmin
    .from('personal_insights' as never)
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  const showPersonalInsights = Boolean(insights)
  const showRegisterCompany = !companyId

  // If company association exists, fetch name for button label
  let companyName: string | null = null
  if (companyId) {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()
    companyName = company?.name || null
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-5">
        <h1 className="text-[40px] text-center font-serif font-base">
          Welcome!
        </h1>
        <div className="grid grid-cols-1 gap-6">
          {/* Personal / Assessment using shared component, and shown for all users */}
          {companyId ? (
            <AssessmentCard href="/survey" title="Assessment" subtitle="Submit for your company" />
          ) : (
            <>
              <AssessmentCard href="/survey?mode=personal" title="Assessment" subtitle="Take your personal test" />
              {showPersonalInsights && (
                <Card className="bg-[#abd37a] border-[#68c282] text-black p-4">
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-sans text-lg font-medium">Your insights</div>
                      <Link href="/personal/insights"><Button variant="outline">View insights</Button></Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Register company card */}
          {showRegisterCompany && (
            <Card className="bg-[#eae7fc] border-[#ddd6fb] text-foreground p-4 gap-1">
              <CardHeader className="pb-0 mb-0 gap-0">
                <div className="font-sans text-xl font-medium pb-0 w-full">Register a company</div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Create a company space to invite coworkers and generate a shareable report.</p>
                <Link href="/company/register"><Button variant="black">Start company onboarding</Button></Link>
              </CardContent>
            </Card>
          )}

          
        </div>
      </div>
    </div>
  )
}


