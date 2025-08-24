import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  const companyId = (user.publicMetadata?.company_id as string | undefined) || undefined

  // Determine visibility flags for options

  // Check if personal insights exist
  const { data: insights } = await supabaseAdmin
    .from('personal_insights' as never)
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  const showPersonalInsights = Boolean(insights)
  const showRegisterCompany = !companyId

  // If company association exists, fetch name for button label (removed unused value)

  // Personal progress (server-side) for AssessmentCard ring
  let personalAnswered = 0
  const PERSONAL_TOTAL = 20
  if (!companyId) {
    // Try to find a personal survey and count answers
    const { data: surveyRow } = await supabaseAdmin
      .from('personal_surveys' as never)
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true } as never)
      .limit(1)
      .maybeSingle()
    let surveyId: string | undefined
    if (surveyRow && typeof (surveyRow as { id?: unknown }).id === 'string') {
      surveyId = (surveyRow as { id: string }).id
    }
    if (surveyId) {
      const { data: ans } = await supabaseAdmin
        .from('personal_answers' as never)
        .select('id')
        .eq('survey_id', surveyId)
      personalAnswered = (ans || []).length
    }
  }

  const isPersonalCompleted = (!companyId && (showPersonalInsights || personalAnswered >= PERSONAL_TOTAL))

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-5">
        <h1 className="text-[40px] text-center font-serif font-base">
          Welcome!
        </h1>
        <div className="grid grid-cols-1 gap-6">
          {/* Personal / Assessment using shared component, and shown for all users */}
          {companyId ? (
            showPersonalInsights ? (
              <AssessmentCard href="/personal/insights" title="Assessment" subtitle="View your personal insights" />
            ) : (
              <AssessmentCard href="/survey" title="Assessment" subtitle="Submit for your company" />
            )
          ) : (
            isPersonalCompleted ? (
              <AssessmentCard href="/personal/insights" title="Assessment" subtitle="View your personal insights" value={PERSONAL_TOTAL} total={PERSONAL_TOTAL} />
            ) : (
              <AssessmentCard href="/survey?mode=personal" title="Assessment" subtitle="Continue your personal test" value={personalAnswered} total={PERSONAL_TOTAL} />
            )
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


