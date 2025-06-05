'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { UserButton } from '@/components/auth/user-button'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface QuestionInstance {
  id: string
  ordinal: number
  text?: string
  parent_instance?: string
  questions?: {
    id: number
    text: string
    dimension: string
  } | null
}

interface SurveyProgress {
  current: number
  total: number
}

export default function SurveyPage() {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionInstance | null>(null)
  const [answer, setAnswer] = useState('')
  const [progress, setProgress] = useState<SurveyProgress>({ current: 0, total: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const router = useRouter()

  // Load the current question and progress
  const loadSurvey = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/survey/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to load survey')
      }

      const data = await response.json()
      
      if (data.completed) {
        setIsCompleted(true)
        setProgress({ current: data.totalQuestions, total: data.totalQuestions })
      } else {
        setCurrentQuestion(data.questionInstance)
        setProgress(data.progress)
        setAnswer('') // Reset answer for new question
      }
    } catch (error) {
      console.error('Survey load error:', error)
      setError('Failed to load survey. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit an answer
  const submitAnswer = async () => {
    if (!currentQuestion || !answer.trim()) {
      setError('Please provide an answer before continuing.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/survey/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionInstanceId: currentQuestion.id,
          answerText: answer.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save answer')
      }

      // Check if we need a follow-up question
      const questionText = currentQuestion.text || currentQuestion.questions?.text || ''
      const followUpResponse = await fetch('/api/ai/nextQuestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionInstanceId: currentQuestion.id,
          originalQuestion: questionText,
          employeeAnswer: answer.trim(),
          currentOrdinal: currentQuestion.ordinal
        })
      })

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json()
        
        if (followUpData.hasFollowUp) {
          // Show the follow-up question
          setCurrentQuestion({
            ...followUpData.followUpQuestion,
            questions: null // Follow-up questions don't have base questions
          })
          setAnswer('')
          setProgress(prev => ({ ...prev, current: followUpData.followUpQuestion.ordinal }))
          return
        }
      }

      // No follow-up needed, load next question
      await loadSurvey()

    } catch (error) {
      console.error('Answer submission error:', error)
      setError('Failed to save answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Initialize survey on component mount
  useEffect(() => {
    loadSurvey()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your survey...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">
              Survey Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Thank you for completing the AI Readiness Assessment. Your responses will help create valuable insights for your organization.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const questionText = currentQuestion?.text || currentQuestion?.questions?.text || ''
  const questionDimension = currentQuestion?.questions?.dimension || 'AI Assessment'
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with UserButton */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Readiness Assessment</h1>
        <UserButton />
      </div>
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-medium">Survey Progress</span>
          <span className="text-sm text-gray-600">
            Question {progress.current} of {progress.total}
          </span>
        </div>
        <Progress value={progressPercentage} className="w-full" />
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {questionDimension}
            </CardTitle>
            {currentQuestion?.parent_instance && (
              <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                Follow-up
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="question" className="text-base font-medium">
                {questionText}
              </Label>
            </div>
            
            <div>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Share your thoughts, experiences, or specific examples..."
                className="min-h-[120px] resize-none"
                maxLength={2000}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {answer.length}/2000 characters
                </span>
                {answer.length > 1800 && (
                  <span className="text-sm text-amber-600">
                    Approaching character limit
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                disabled={isSubmitting}
              >
                Save & Exit
              </Button>
              
              <Button
                onClick={submitAnswer}
                disabled={isSubmitting || !answer.trim()}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question help text */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Be specific and provide examples where possible. 
            Your detailed responses help create more accurate insights and recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 