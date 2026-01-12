import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function PersonalInsightsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { data: insights } = await supabaseAdmin
    .from('personal_insights')
    .select('user_id, survey_id, generated_at, scores_json, narrative_json')
    .eq('user_id', userId)
    .maybeSingle()

  if (!insights) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-3xl mb-4">Your Personal Insights</h1>
        <p>No insights yet. Complete a test to see your insights.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl mb-4">Your Personal Insights</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl mb-2">Scores</h2>
          <pre className="text-sm bg-neutral-100 p-4 rounded">{JSON.stringify(insights.scores_json, null, 2)}</pre>
        </section>
        <section>
          <h2 className="text-xl mb-2">Narrative</h2>
          <pre className="text-sm bg-neutral-100 p-4 rounded">{JSON.stringify(insights.narrative_json, null, 2)}</pre>
        </section>
      </div>
    </div>
  )
}


