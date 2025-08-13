'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { UserButton } from '@/components/auth/user-button'
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Users,
  AlertTriangle 
} from 'lucide-react'

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

  const loadProgress = async () => {
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
      
      if (data.completed) {
        setSurveyProgress({
          total: data.totalQuestions,
          completed: data.totalQuestions,
          progress: 1
        })
      } else {
        setSurveyProgress({
          total: data.progress.total,
          completed: data.progress.current - 1, // Current is next question to answer
          progress: data.progress.total > 0 ? (data.progress.current - 1) / data.progress.total : 0
        })
      }
    } catch (error) {
      console.error('Progress load error:', error)
      setError('Failed to load survey progress.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProgress()
  }, [])

  const handleStartSurvey = () => {
    router.push('/survey')
  }

  const isCompleted = surveyProgress?.completed === surveyProgress?.total && (surveyProgress?.total ?? 0) > 0
  const hasStarted = surveyProgress && surveyProgress.total > 0
  const progressPercentage = surveyProgress ? Math.round(surveyProgress.progress * 100) : 0

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header with UserButton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-medium uppercase">
            Assessment
          </h1>
          <p className=" mt-2">
            Track your progress and contribute to your organization's AI readiness insights.
          </p>
        </div>
        <UserButton />
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Survey Progress Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle >Survey Progress</CardTitle>
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 " />
            ) : hasStarted ? (
              <Clock className="h-4 w-4 " />
            ) : (
              <PlayCircle className="h-4 w-4 " />
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
                <div >
                  {surveyProgress.completed}/{surveyProgress.total}
                </div>
                <p className="  mb-2">Questions completed</p>
                <Progress value={progressPercentage} className="w-full" />
                <p className="  mt-1">{progressPercentage}% complete</p>
              </div>
            ) : (
              <div >Not started</div>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle >Status</CardTitle>
            <Badge 
              variant={isCompleted ? "default" : hasStarted ? "secondary" : "outline"}
              className={
                isCompleted ? " " :
                hasStarted ? " " :
                " "
              }
>
              {isCompleted ? "Completed" : hasStarted ? "In Progress" : "Not Started"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div >
              {isCompleted ? 
                "Your assessment is complete. Thank you for participating!" :
                hasStarted ?
                "Continue where you left off." :
                "Ready to begin your AI readiness assessment."
              }
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle >Assessment Info</CardTitle>
            <BarChart3 className="h-4 w-4 " />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between ">
                <span >Estimated time:</span>
                <span >15-20 minutes</span>
              </div>
              <div className="flex justify-between ">
                <span >Question types:</span>
                <span >Open-ended</span>
              </div>
              <div className="flex justify-between ">
                <span >Follow-ups:</span>
                <span >AI-generated</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            {isCompleted ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5 " />
                Assessment Complete
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5 " />
                {hasStarted ? "Continue Assessment" : "Start Assessment"}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCompleted ? (
            <div className="space-y-4">
              <p >
                Your AI readiness assessment is complete! Your responses are being analyzed 
                and will contribute to your organization's comprehensive AI readiness report.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => router.push('/survey')}>
                  Review Responses
                </Button>
                <Button variant="outline" onClick={() => router.push('/report')}>
                  View Reports
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p >
                {hasStarted ? 
                  `You've completed ${surveyProgress?.completed || 0} out of ${surveyProgress?.total || 0} questions. 
                   Continue where you left off to finish your assessment.` :
                  "The AI Readiness Assessment helps evaluate your organization's preparedness for AI adoption. " +
                  "Your thoughtful responses will contribute to valuable insights and recommendations."
                }
              </p>
              <div className="flex space-x-4">
                <Button onClick={handleStartSurvey} className="flex items-center">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {hasStarted ? "Continue Survey" : "Start Survey"}
                </Button>
                {hasStarted && (
                  <Button variant="outline" onClick={loadProgress}>
                    Refresh Progress
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            About This Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className=" mb-2 text-lg font-medium">What to Expect</h4>
              <ul className="  space-y-1">
                <li>• Open-ended questions about AI experience and perspectives</li>
                <li>• AI-generated follow-up questions for deeper insights</li>
                <li>• Focus on practical examples and specific scenarios</li>
                <li>• Questions covering 13 dimensions of AI readiness</li>
              </ul>
            </div>
            <div>
              <h4 className=" mb-2 text-lg font-medium">Your Privacy</h4>
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
  )
} 