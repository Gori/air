'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserButton } from '@/components/auth/user-button'
// icons removed

interface SurveyProgress {
  total: number
  completed: number
  progress: number
}

export default function DashboardPage() {
  const [surveyProgress, setSurveyProgress] = useState<SurveyProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadProgress = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/survey/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 400 && errorData.error === 'No company association found') {
          // Redirect to company setup
          router.push('/company/register')
          return
        }
        throw new Error('Failed to load progress')
      }

      const data = await response.json()
      const total = data?.progress?.total ?? data?.totalQuestions ?? 0
      const current = data?.progress?.current ?? 0
      const completedCount = Math.max(current - 1, 0)
      const isDone = Boolean(data?.completed && total > 0)

      setSurveyProgress({
        total,
        completed: isDone ? total : completedCount,
        progress: total > 0 ? (isDone ? 1 : completedCount / total) : 0
      })
    } catch (error) {
      console.error('Progress load error:', error)
      setError('Failed to load survey progress.')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  const handleStartSurvey = () => {
    router.push('/survey')
  }

  const isCompleted = surveyProgress?.completed === surveyProgress?.total && (surveyProgress?.total ?? 0) > 0
  const hasStarted = !!(surveyProgress && surveyProgress.completed > 0)
  const progressPercentage = surveyProgress ? Math.round(surveyProgress.progress * 100) : 0
  const remaining = surveyProgress ? Math.max((surveyProgress.total || 0) - (surveyProgress.completed || 0), 0) : 0
  const AVERAGE_MINUTES_PER_QUESTION = 1
  const timeRemainingMinutes = surveyProgress ? Math.max(Math.ceil(remaining * AVERAGE_MINUTES_PER_QUESTION), 0) : 0

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header with UserButton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-medium text-4xl font-medium font-sans">
            Assessment
          </h1>
          <p className=" mt-2">
            Track your progress and contribute to your organization&apos;s AI readiness insights.
          </p>
        </div>
        <UserButton />
      </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Survey Progress + Actions (combined) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle >Survey Progress</CardTitle>
            {!isCompleted && (
              <Button size="sm" onClick={handleStartSurvey}>
                {hasStarted ? "Continue Survey" : "Start Survey"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4  rounded w-3/4 mb-2"></div>
                <div className="h-2  rounded w-full"></div>
              </div>
            ) : surveyProgress ? (
              <div>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Percent</div>
                    <div className="text-lg font-medium">{progressPercentage}%</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Progress</div>
                    <div className="text-lg font-medium">{surveyProgress.completed}/{surveyProgress.total}</div>
                    <div className="text-xs text-muted-foreground">{remaining} left</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Time remaining</div>
                    <div className="text-lg font-medium">{timeRemainingMinutes > 0 ? `≈ ${timeRemainingMinutes} min` : '—'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Percent</div>
                    <div className="text-lg font-medium">0%</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Progress</div>
                    <div className="text-lg font-medium">0/0</div>
                    <div className="text-xs text-muted-foreground">0 left</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Time remaining</div>
                    <div className="text-lg font-medium">—</div>
                  </div>
                </div>
              </div>
            )}
            {!isLoading && (
              <div className="mt-4 space-y-4">
                {isCompleted && (
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={() => router.push('/survey')}>Review Responses</Button>
                    <Button variant="outline" onClick={() => router.push('/report')}>View Reports</Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment Info + About (combined) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle >About This Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="mb-2 text-lg font-mono uppercase tracking-widest font-normal">What to Expect</h4>
                <ul className="  space-y-1">
                  <li>• Open-ended questions about AI experience and perspectives</li>
                  <li>• AI-generated follow-up questions for deeper insights</li>
                  <li>• Focus on practical examples and specific scenarios</li>
                  <li>• Questions covering 13 dimensions of AI readiness</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-lg font-mono uppercase tracking-widest font-normal">Your Privacy</h4>
                <ul className="  space-y-1">
                  <li>• Responses are aggregated for organizational insights</li>
                  <li>• Individual responses remain confidential</li>
                  <li>• Data used solely for AI readiness assessment</li>
                  <li>• Results shared only with your organization</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Section removed: merged into the first card above */}

      {/* Information Section removed: merged into the card above */}
    </div>
  )
} 