'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { UserButton } from '@/components/auth/user-button'
// icons removed

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
  const [usageSelections, setUsageSelections] = useState<Record<string, 'Never tried' | "I've tried it" | 'I use it regularly' | "I'm dependant on it">>({})
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

  const USAGE_CATEGORIES: Record<string, { title: string, subcategories: string[] }> = useMemo(() => ({
    usage_creative_content: {
      title: '🎨 Creative & Content Generation',
      subcategories: [
        'Image & graphic creation (art, photography, design)',
        'Video generation & editing (including AI upscaling, special effects, deepfakes)',
        'Music & audio creation (composition, mixing, mastering, voice synthesis/cloning)',
        'Writing & storytelling (articles, scripts, ads, social media content)',
        'Game asset creation & NPC dialogue generation'
      ]
    },
    usage_research_knowledge: {
      title: '📚 Research & Knowledge Work',
      subcategories: [
        'Summarizing and synthesizing information from large datasets or literature',
        'Assisting with academic research & hypothesis generation',
        'Language translation, transcription, and subtitling',
        'Code generation, debugging, and software optimization',
        'Personalized learning and tutoring'
      ]
    },
    usage_business_productivity: {
      title: '💼 Business & Productivity',
      subcategories: [
        'Customer service automation (chatbots, virtual agents)',
        'Meeting, email, and document summarization',
        'Market and trend analysis',
        'Business forecasting and risk modeling',
        'Workflow & process automation'
      ]
    },
    usage_decision_support: {
      title: '🧠 Decision Support & Analysis',
      subcategories: [
        'Predictive analytics (finance, marketing, user behavior)',
        'Medical decision support & diagnostics assistance',
        'Fraud detection & anomaly detection',
        'Sentiment analysis (brand monitoring, user feedback)'
      ]
    },
    usage_personal_assistance: {
      title: '🤝 Personal Assistance & Lifestyle',
      subcategories: [
        'AI personal assistants (task management, reminders, scheduling)',
        'Smart content recommendations (music, articles, videos)',
        'Wellness & mental health chat support'
      ]
    },
    usage_security_moderation: {
      title: '🛡️ Security & Moderation',
      subcategories: [
        'Cybersecurity threat detection & prevention',
        'Content moderation (detecting harmful, illegal, or spam content)',
        'Identity verification & fraud prevention'
      ]
    }
  }), [])

  const isUsageQuestion = useMemo(() => {
    const dim = currentQuestion?.questions?.dimension
    return Boolean(dim && USAGE_CATEGORIES[dim as keyof typeof USAGE_CATEGORIES])
  }, [currentQuestion, USAGE_CATEGORIES])

  // Reset inputs when question changes
  useEffect(() => {
    setAnswer('')
    setUsageSelections({})
  }, [currentQuestion?.id])

  // Submit an answer
  const submitAnswer = async () => {
    if (!currentQuestion) return

    // Usage question validation: all subcategories must be selected
    if (isUsageQuestion) {
      const dim = currentQuestion.questions?.dimension as string
      const cfg = USAGE_CATEGORIES[dim as keyof typeof USAGE_CATEGORIES]
      const allSelected = cfg && cfg.subcategories.every(sc => usageSelections[sc])
      if (!allSelected) {
        setError('Please select an option for every item before continuing.')
        return
      }
    } else {
      if (!answer.trim()) {
        setError('Please provide an answer before continuing.')
        return
      }
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare payload
      const preparedAnswer = isUsageQuestion
        ? JSON.stringify({
            type: 'usage_matrix',
            selections: Object.entries(usageSelections).map(([name, level]) => ({ name, level }))
          })
        : answer.trim()

      const response = await fetch('/api/survey/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionInstanceId: currentQuestion.id,
          answerText: preparedAnswer
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save answer')
      }

      // Skip AI follow-ups for usage matrix questions
      if (!isUsageQuestion) {
        // Check if we need a follow-up question
        const questionText = currentQuestion.text || currentQuestion.questions?.text || ''
        const followUpResponse = await fetch('/api/ai/nextQuestion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionInstanceId: currentQuestion.id,
            originalQuestion: questionText,
            employeeAnswer: preparedAnswer,
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
            <p >Loading your survey...</p>
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
            <CardTitle >
              Survey Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className=" mb-6">
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
  const usageConfig = isUsageQuestion && questionDimension ? USAGE_CATEGORIES[questionDimension as keyof typeof USAGE_CATEGORIES] : null
  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header with UserButton */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-sans" >Assessment</h1>
        <UserButton />
      </div>
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span >Survey Progress</span>
          <span >
            Question {progress.current} of {progress.total}
          </span>
        </div>
        <Progress value={progressPercentage} className="w-full" />
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle >
              {isUsageQuestion && usageConfig ? usageConfig.title : questionDimension}
            </CardTitle>
            {currentQuestion?.parent_instance && (
              <span className=" px-2 py-1 rounded-full">
                Follow-up
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isUsageQuestion && usageConfig ? (
              <div className="space-y-6">
                <p>
                  For each item below, choose how much you are using it.
                </p>
                <div className="space-y-5">
                  {usageConfig.subcategories.map(sub => {
                    const current = usageSelections[sub]
                    const options: Array<'Never tried' | "I've tried it" | 'I use it regularly' | "I'm dependant on it"> = [
                      'Never tried',
                      "I've tried it",
                      'I use it regularly',
                      "I'm dependant on it"
                    ]
                    return (
                      <div key={sub} className="space-y-2">
                        <div className="font-semibold text-lg">{sub}</div>
                        <div className="flex flex-col gap-2">
                          {options.map(opt => (
                            <Button
                              key={opt}
                              type="button"
                              variant={current === opt ? 'default' : 'outline'}
                              className={current === opt ? 'bg-black text-white hover:bg-black' : ''}
                              onClick={() => setUsageSelections(prev => ({ ...prev, [sub]: opt }))}
                              disabled={isSubmitting}
                            >
                              {opt === 'Never tried' && '❌ '} 
                              {opt === "I've tried it" && '✨ '} 
                              {opt === 'I use it regularly' && '🚀 '} 
                              {opt === "I'm dependant on it" && '🔒 '} 
                              {opt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Validation hint */}
                {!usageConfig.subcategories.every(sc => usageSelections[sc]) && (
                  <div className="text-sm  ">Please answer every item to continue.</div>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="question">
                  {questionText}
                </label>
                <Textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Share your thoughts, experiences, or specific examples..."
                  className="min-h-[120px] resize-none mt-2"
                  maxLength={2000}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  <span >
                    {answer.length}/2000 characters
                  </span>
                  {answer.length > 1800 && (
                    <span >
                      Approaching character limit
                    </span>
                  )}
                </div>
              </div>
            )}

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
                disabled={isSubmitting || (isUsageQuestion ? !(usageConfig && usageConfig.subcategories.every(sc => usageSelections[sc])) : !answer.trim())}
                className="min-w-[120px]"
>
                {isSubmitting ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question help text */}
      <Card className="mt-6  ">
        <CardContent className="p-4">
          <p >
            💡 <strong>Tip:</strong> Be specific and provide examples where possible. 
            Your detailed responses help create more accurate insights and recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 