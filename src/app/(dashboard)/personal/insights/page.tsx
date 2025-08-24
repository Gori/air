import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function PersonalInsightsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/personal/insights`, { cache: 'no-store' })
  const data = await res.json()
  const insights = data?.insights

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl mb-4">Your Personal Insights</h1>
      {!insights ? (
        <p>No insights yet. Complete a test to see your insights.</p>
      ) : (
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
      )}
    </div>
  )
}


