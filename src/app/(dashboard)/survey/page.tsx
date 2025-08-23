'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
// UserButton intentionally removed from survey chrome

// Slide engine types
type SlideType = 'welcome' | 'intro' | 'matrix' | 'text' | 'scale' | 'mc_single' | 'mc_multi' | 'end' | 'ai_followup'

interface InstanceMapItem {
  id: string
  ordinal: number
  question_id: number | null
  answer_text?: string
}

interface StartPayload {
  completed: boolean
  progress: { current: number, total: number }
  instanceMap: Record<string, InstanceMapItem>
}

interface Slide {
  type: SlideType
  title?: string
  copy?: string
  prompt?: string
  dimension?: string
  required?: boolean
  items?: string[]
  options?: string[]
  allowPreferNot?: boolean
  optionalText?: boolean
  examples?: string[]
  followUpInstanceId?: string
  heading?: string
  subheading?: string
  illustration?: string
}

const MATRIX_LEVELS = [
  'Never tried',
  "I've tried it",
  'I use it regularly',
  "I'm dependent on it"
] as const

export default function SurveyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [instanceMap, setInstanceMap] = useState<Record<string, InstanceMapItem>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Controls per slide
  const [textValue, setTextValue] = useState('')
  const [scaleValue, setScaleValue] = useState<number | null>(null)
  const [scalePreferNot, setScalePreferNot] = useState(false)
  const [mcSingle, setMcSingle] = useState<string | null>(null)
  const [mcSinglePreferNot, setMcSinglePreferNot] = useState(false)
  const [mcMulti, setMcMulti] = useState<Record<string, boolean>>({})
  const [mcMultiPreferNot, setMcMultiPreferNot] = useState(false)
  const [matrixSelections, setMatrixSelections] = useState<Record<string, typeof MATRIX_LEVELS[number]>>({})
  const [optionalComment, setOptionalComment] = useState('')
  const FOLLOWUP_ALLOWED = useMemo(() => new Set<string>([
    'support_requests',
    'future_roles_skills'
  ]), [])

  // Descriptions for example tools/services shown on intro slides
  const EXAMPLE_DESCRIPTIONS: Record<string, string> = useMemo(() => ({
    // Research & Knowledge
    'Perplexity': 'Answer engine that cites sources for fast research.',
    'Elicit': 'Research assistant that helps with literature reviews.',
    'Notion AI': 'Writing and knowledge features built into Notion.',
    'ChatGPT': 'General-purpose conversational AI by OpenAI.',
    'Claude': 'Conversational AI assistant by Anthropic.',

    // Business & Productivity
    'Microsoft Copilot': 'AI features across Microsoft 365 apps.',
    'Google Gemini for Workspace': 'AI assistance in Gmail, Docs, and Sheets.',
    'Zapier': 'Automates multi‑step workflows between apps.',

    // Creative & Content
    'Midjourney': 'High‑quality image generation from prompts.',
    'DALL·E': 'Image generation from OpenAI inside ChatGPT and API.',
    'Adobe Firefly': 'Generative tools for images and text effects in Adobe apps.',
    'Runway': 'AI video generation and smart editing.',
    'Pika': 'Text‑to‑video generation.',
    'ElevenLabs': 'High‑quality synthetic voices and voice cloning.',

    // Decision Support
    'Tableau + AI': 'Analytics with natural‑language insights and predictions.',
    'Power BI + Copilot': 'BI reports with Copilot analysis and summaries.',
    'Amazon Fraud Detector': 'Managed ML service for real‑time fraud scoring.',
    'OpenAI text analytics': 'NLP for classification, extraction, and summarization.',

    // Personal Assistance
    'Apple Intelligence': 'On‑device AI features across Apple platforms.',
    'Google Assistant with Gemini': 'Assistant enhanced with Gemini reasoning.',
    'Reclaim': 'Smart calendar that auto‑blocks focus time and tasks.',

    // Security & Moderation
    'Azure Content Moderator': 'Content filtering and human‑in‑the‑loop moderation.',
    'OpenAI Moderation': 'Safety classifications for text and images.',
    'Perspective API': 'Toxicity scoring for safer online conversations.',
    'Sift': 'Fraud and abuse prevention for accounts and payments.'
  }), [])

  // Explanations shown under each matrix item
  const MATRIX_ITEM_DESCRIPTIONS: Record<string, string> = useMemo(() => ({
    // Research & Knowledge
    'Summarizing/synthesizing': 'Condense long docs, pages, or threads into key takeaways and actions.',
    'Research support': 'Discover sources, compare viewpoints, draft outlines or literature reviews.',
    'Translation/transcription': 'Translate languages, transcribe audio or video, generate subtitles.',
    'Code generation & debugging': 'Suggest code, tests, refactors, and diagnostics.',
    'Personalized learning': 'Generate short lessons, examples, and quizzes for your level.',

    // Business & Productivity
    'Customer service automation': 'Triage questions, surface answers, and hand off to humans.',
    'Meeting/email/doc summaries': 'Turn long exchanges into clear bullets, tasks, and deadlines.',
    'Market & trend analysis': 'Scan reports/data to spot changes, competitors, or customer signals.',
    'Forecasting & risk modeling': 'Explore scenarios and likely outcomes from historical data.',
    'Workflow/process automation': 'Connect tools so routine steps run automatically.',

    // Creative & Content
    'Image/graphics': 'Generate concepts, variants, and production‑ready assets.',
    'Video': 'Create b‑roll, captions, and edits from scripts or rough clips.',
    'Music/audio': 'Compose beds, clean audio, and synthesize voices where permitted.',
    'Writing/storytelling': 'Outline, draft, and edit copy in your tone.',
    'Game assets & NPC/dialogue': 'Produce sprites, textures, and believable character dialogue.',

    // Decision Support
    'Predictive analytics': 'Forecast demand, churn, or workload from historical patterns.',
    'Medical/diagnostic support': 'Provide suggestions for review; clinicians make final calls.',
    'Fraud/anomaly detection': 'Flag unusual events for investigation.',
    'Sentiment analysis': 'Track voice‑of‑customer across reviews, tickets, and surveys.',

    // Personal Assistance
    'Personal assistants': 'Plan tasks, schedule, and reminders across apps.',
    'Content recommendations': 'Suggest articles, videos, or playlists that fit your interests.',
    'Wellness & mental health chat': 'Supportive check‑ins and coping tips; not a substitute for care.',

    // Security & Moderation
    'Threat detection & prevention': 'Spot suspicious patterns in network or app logs.',
    'Content moderation': 'Flag hateful, violent, or unsafe content for review.',
    'Identity verification & fraud prevention': 'Check documents and behavior to reduce risk.'
  }), [])

  const usageConfig: Record<string, { title: string, items: string[], intro: string, examples: string[] }> = useMemo(() => ({
    usage_research_knowledge: {
      title: 'Research & Knowledge',
      items: [
        'Summarizing/synthesizing',
        'Research support',
        'Translation/transcription',
        'Code generation & debugging',
        'Personalized learning'
      ],
      intro: 'AI can help you find and understand information quickly. Common uses include asking questions about long documents, turning meetings into notes, translating, and getting coding help. Choose what matches your real use—there are no right or wrong answers.',
      examples: ['Perplexity', 'Elicit', 'Notion AI', 'ChatGPT', 'Claude']
    },
    usage_business_productivity: {
      title: 'Business & Productivity',
      items: [
        'Customer service automation',
        'Meeting/email/doc summaries',
        'Market & trend analysis',
        'Forecasting & risk modeling',
        'Workflow/process automation'
      ],
      intro: 'This section looks at day‑to‑day efficiency. AI can tidy inboxes, summarize meetings, draft documents, analyze trends, and automate routine steps between apps. Think about what actually saves you time.',
      examples: ['Microsoft Copilot', 'Google Gemini for Workspace', 'Notion AI', 'Zapier']
    },
    usage_creative_content: {
      title: 'Creative & Content',
      items: [
        'Image/graphics',
        'Video',
        'Music/audio',
        'Writing/storytelling',
        'Game assets & NPC/dialogue'
      ],
      intro: 'Here we cover creative work: drafting text, creating images or video, making audio, and building game assets. AI can turn rough ideas into first drafts, help with edits, and produce visual and audio variations quickly.',
      examples: ['Midjourney', 'DALL·E', 'Adobe Firefly', 'Runway', 'Pika', 'ElevenLabs']
    },
    usage_decision_support: {
      title: 'Decision Support',
      items: [
        'Predictive analytics',
        'Medical/diagnostic support',
        'Fraud/anomaly detection',
        'Sentiment analysis'
      ],
      intro: 'Decision support covers pattern‑finding and judgment under uncertainty. AI can highlight anomalies, project likely outcomes, and surface sentiment so you can make faster, better decisions—while keeping humans in the loop.',
      examples: ['Tableau + AI', 'Power BI + Copilot', 'Amazon Fraud Detector', 'OpenAI text analytics']
    },
    usage_personal_assistance: {
      title: 'Personal Assistance',
      items: [
        'Personal assistants',
        'Content recommendations',
        'Wellness & mental health chat'
      ],
      intro: 'Personal assistants help you plan, write, and stay organized. They can draft messages, prepare agendas, propose schedules, and remind you of deadlines so you can focus on the work that matters.',
      examples: ['Apple Intelligence', 'Google Assistant with Gemini', 'Microsoft Copilot', 'Reclaim']
    },
    usage_security_moderation: {
      title: 'Security & Moderation',
      items: [
        'Threat detection & prevention',
        'Content moderation',
        'Identity verification & fraud prevention'
      ],
      intro: 'Security and moderation tools help protect people and systems. AI can detect threats in logs, filter harmful content at scale, and assist with identity checks or fraud risk—always with proper oversight.',
      examples: ['Azure Content Moderator', 'OpenAI Moderation', 'Perspective API', 'Sift']
    }
  }), [])

  const resetControlsForSlide = useCallback((slide?: Slide) => {
    setTextValue('')
    setScaleValue(null)
    setScalePreferNot(false)
    setMcSingle(null)
    setMcSinglePreferNot(false)
    setMcMulti({})
    setMcMultiPreferNot(false)
    setMatrixSelections({})
    setOptionalComment('')

    if (slide && slide.dimension && instanceMap[slide.dimension]?.answer_text) {
      const raw = instanceMap[slide.dimension].answer_text as string
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          if (parsed.type === 'scale') {
            setScaleValue(typeof parsed.value === 'number' ? parsed.value : null)
            setScalePreferNot(Boolean(parsed.preferNot))
            setOptionalComment(parsed.text || '')
          } else if (parsed.type === 'mc_single') {
            setMcSingle(parsed.choice || null)
            setMcSinglePreferNot(Boolean(parsed.preferNot))
            setOptionalComment(parsed.text || '')
          } else if (parsed.type === 'mc_multi') {
            const rec: Record<string, boolean> = {}
            for (const c of parsed.choices || []) rec[c] = true
            setMcMulti(rec)
            setMcMultiPreferNot(Boolean(parsed.preferNot))
            setOptionalComment(parsed.text || '')
          } else if (parsed.type === 'usage_matrix') {
            const rec: Record<string, typeof MATRIX_LEVELS[number]> = {}
            for (const s of parsed.selections || []) rec[s.name] = s.level
            setMatrixSelections(rec)
          } else {
            setTextValue(raw)
          }
        } else {
          setTextValue(raw)
        }
      } catch {
        setTextValue(raw)
      }
    }
  }, [instanceMap])

  const buildSlides = useCallback((): Slide[] => {
    const slidesDef: Slide[] = [
      {
        type: 'welcome',
        title: 'AI Readiness Assessment',
        copy: 'Takes 7–10 minutes. Your input helps us learn what’s working, where to support, and how to move at the right pace.',
        heading: 'Welcome',
        subheading: 'Takes 7–10 minutes. Your input helps us learn what’s working, where to support, and how to move at the right pace.'
      },
      {
        type: 'text',
        dimension: 'job_title',
        prompt: 'Enter your job title (e.g., Product Manager).',
        required: true,
        heading: 'Job title',
        subheading: 'What’s your job title?'
      },
      {
        type: 'scale',
        dimension: 'ai_sentiment',
        prompt: 'Choose a rating from 1 (low) to 5 (high).',
        allowPreferNot: true,
        optionalText: true,
        required: true,
        heading: 'Attitude toward AI',
        subheading: 'Overall, how do you feel about AI becoming more common at work?'
      },
      {
        type: 'intro',
        title: 'Research & Knowledge',
        copy: usageConfig.usage_research_knowledge.intro,
        examples: usageConfig.usage_research_knowledge.examples,
        illustration: '/images/research.webp',
        heading: 'Research & Knowledge',
        subheading: 'Find answers and insights faster.'
      },
      {
        type: 'matrix',
        dimension: 'usage_research_knowledge',
        items: usageConfig.usage_research_knowledge.items,
        required: true,
        heading: usageConfig.usage_research_knowledge.title,
        subheading: 'Choose how much you are using each item.'
      },
      {
        type: 'mc_multi',
        dimension: 'ai_expected_benefits',
        prompt: 'Select all benefits that apply to you.',
        options: ['Faster work', 'Fewer repetitive tasks', 'Better quality', 'New ideas', 'Better decisions', 'Cost savings', 'Other'],
        optionalText: true,
        required: true,
        heading: 'Expected benefits',
        subheading: 'What potential benefits do you foresee AI bringing?'
      },
      {
        type: 'scale',
        dimension: 'human_led_work',
        prompt: 'Choose a rating from 1 (low) to 5 (high).',
        allowPreferNot: true,
        optionalText: true,
        required: true,
        heading: 'Human‑led work',
        subheading: 'How much of your work requires distinctly human judgment and should remain human‑led?'
      },
      {
        type: 'intro',
        title: 'Business & Productivity',
        copy: usageConfig.usage_business_productivity.intro,
        examples: usageConfig.usage_business_productivity.examples,
        illustration: '/images/business.webp',
        heading: 'Business & Productivity',
        subheading: 'Automate routine work and move faster.'
      },
      {
        type: 'matrix',
        dimension: 'usage_business_productivity',
        items: usageConfig.usage_business_productivity.items,
        required: true,
        heading: usageConfig.usage_business_productivity.title,
        subheading: 'Choose how much you are using each item.'
      },
      {
        type: 'mc_single',
        dimension: 'training_received',
        prompt: 'Select the one option that applies to you.',
        options: ['Yes', 'No', 'Not sure'],
        required: true,
        heading: 'Training received?',
        subheading: 'Have you received any AI training?'
      },
      {
        type: 'mc_multi',
        dimension: 'integration_barriers',
        prompt: 'Select all obstacles that apply to you.',
        options: ['Access/permissions', 'Time to learn', 'Tool quality', 'Missing data', 'Process/policy limits', 'Stakeholder buy‑in', 'Cost', 'Other'],
        optionalText: true,
        required: true,
        heading: 'What gets in the way',
        subheading: 'Select the obstacles that apply.'
      },
      {
        type: 'intro',
        title: 'Creative & Content',
        copy: usageConfig.usage_creative_content.intro,
        examples: usageConfig.usage_creative_content.examples,
        illustration: '/images/creative.webp',
        heading: 'Creative & Content',
        subheading: 'Turn ideas into drafts and visuals quickly.'
      },
      {
        type: 'matrix',
        dimension: 'usage_creative_content',
        items: usageConfig.usage_creative_content.items,
        required: true,
        heading: usageConfig.usage_creative_content.title,
        subheading: 'Choose how much you are using each item.'
      },
      
      {
        type: 'mc_multi',
        dimension: 'learning_preferences',
        prompt: 'Select all learning formats you prefer.',
        options: ['Short videos', 'Written guides', 'Live workshops', '1:1 coaching', 'Practice by doing', 'Other'],
        optionalText: true,
        required: true,
        heading: 'How you learn best',
        subheading: 'Select your preferred learning formats.'
      },
      {
        type: 'intro',
        title: 'Decision Support',
        copy: usageConfig.usage_decision_support.intro,
        examples: usageConfig.usage_decision_support.examples,
        illustration: '/images/decision.webp',
        heading: 'Decision Support',
        subheading: 'See patterns and decide with more confidence.'
      },
      {
        type: 'matrix',
        dimension: 'usage_decision_support',
        items: usageConfig.usage_decision_support.items,
        required: true,
        heading: usageConfig.usage_decision_support.title,
        subheading: 'Choose how much you are using each item.'
      },
      {
        type: 'scale',
        dimension: 'org_support',
        prompt: 'Choose a rating from 1 (low) to 5 (high).',
        allowPreferNot: true,
        optionalText: true,
        required: true,
        heading: 'Support from the organization',
        subheading: 'How supported do you feel to try useful new tools?'
      },
      {
        type: 'scale',
        dimension: 'culture_experimentation',
        prompt: 'Choose a rating from 1 (hard) to 5 (easy).',
        allowPreferNot: true,
        optionalText: true,
        required: true,
        heading: 'Culture of experimentation',
        subheading: 'How easy is it to experiment safely with new tools?'
      },
      {
        type: 'mc_single',
        dimension: 'policy_awareness',
        prompt: 'Select the one option that applies to you.',
        options: ['Yes', 'No', 'Not sure', 'Prefer not to say'],
        optionalText: true,
        required: true,
        heading: 'Policy awareness',
        subheading: 'Are you aware of any company policies or guidelines on using AI?'
      },
      {
        type: 'intro',
        title: 'Personal Assistance',
        copy: usageConfig.usage_personal_assistance.intro,
        examples: usageConfig.usage_personal_assistance.examples,
        illustration: '/images/assistance.webp',
        heading: 'Personal Assistance',
        subheading: 'Plan, write, and stay organized with AI help.'
      },
      {
        type: 'matrix',
        dimension: 'usage_personal_assistance',
        items: usageConfig.usage_personal_assistance.items,
        required: true,
        heading: usageConfig.usage_personal_assistance.title,
        subheading: 'Choose how much you are using each item.'
      },
      {
        type: 'scale',
        dimension: 'pace_satisfaction',
        prompt: 'Choose a rating from 1 (too slow) to 5 (too fast).',
        optionalText: true,
        required: true,
        heading: 'Pace that feels right',
        subheading: 'How do you feel about the pace of AI adoption here?'
      },
      {
        type: 'scale',
        dimension: 'leadership_confidence',
        prompt: 'Choose a rating from 1 (not confident) to 5 (very confident).',
        allowPreferNot: true,
        optionalText: true,
        required: true,
        heading: 'Confidence in leadership',
        subheading: 'How confident are you in leadership’s ability to implement AI well?'
      },
      {
        type: 'intro',
        title: 'Security & Moderation',
        copy: usageConfig.usage_security_moderation.intro,
        examples: usageConfig.usage_security_moderation.examples,
        illustration: '/images/security.webp',
        heading: 'Security & Moderation',
        subheading: 'Protect people and systems with intelligent safeguards.'
      },
      {
        type: 'matrix',
        dimension: 'usage_security_moderation',
        items: usageConfig.usage_security_moderation.items,
        required: true,
        heading: usageConfig.usage_security_moderation.title,
        subheading: 'Choose how much you are using each item.'
      },
      {
        type: 'text',
        dimension: 'future_roles_skills',
        prompt: 'Describe what success would look like for your work and team.',
        required: false,
        heading: 'Final vision',
        subheading: 'If AI progress goes right over the next 6–12 months, what would success look like for your work and team?'
      },
      {
        type: 'end',
        title: 'Thank you!',
        prompt: 'Rate your survey experience from 1 (poor) to 5 (excellent).',
        heading: 'Your answers are saved.',
        subheading: 'How would you rate this survey experience?'
      }
    ]
    return slidesDef
  }, [usageConfig])

  const findFirstUnansweredSlideIndex = useCallback((slidesList: Slide[], map: Record<string, InstanceMapItem>): number => {
    // Iterate slides to find first with a dimension that is unanswered
    for (let i = 0; i < slidesList.length; i++) {
      const sl = slidesList[i]
      if (!sl.dimension) continue
      const inst = map[sl.dimension]
      if (!inst || !inst.answer_text || inst.answer_text.length === 0) {
        return i
      }
    }
    // default to last slide (end) if everything answered
    return Math.max(slidesList.length - 1, 0)
  }, [])

  const answerQuestion = useCallback(async (dimension: string, payload: string) => {
    const inst = instanceMap[dimension]
    if (!inst) return
    const res = await fetch('/api/survey/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionInstanceId: inst.id, answerText: payload })
    })
    if (!res.ok) throw new Error('Failed to save answer')
    // Immediately reflect the saved answer locally so Back restores values
    setInstanceMap(prev => {
      const prevItem = prev[dimension]
      if (!prevItem) return prev
      return {
        ...prev,
        [dimension]: { ...prevItem, answer_text: payload }
      }
    })
  }, [instanceMap])

  const handleNext = useCallback(async () => {
    const slide = slides[activeIdx]
    if (!slide) return
    try {
      setIsSubmitting(true)
      if (slide.type === 'text' && slide.dimension) {
        const payload = textValue.trim()
        await answerQuestion(slide.dimension, payload)
        if (payload && FOLLOWUP_ALLOWED.has(slide.dimension)) {
          const inst = instanceMap[slide.dimension]
          if (inst) {
            const followRes = await fetch('/api/ai/nextQuestion', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                questionInstanceId: inst.id,
                originalQuestion: slide.subheading || '',
                employeeAnswer: payload,
                currentOrdinal: inst.ordinal
              })
            })
            if (followRes.ok) {
              const data = await followRes.json()
              if (data.hasFollowUp && data.followUpQuestion?.id) {
                const text = data.followUpQuestion.text as string
                const f: Slide = {
                  type: 'ai_followup',
                  prompt: 'Briefly answer the follow‑up question below.',
                  required: true,
                  followUpInstanceId: data.followUpQuestion.id,
                  heading: 'Follow‑up',
                  subheading: text
                }
                const newSlides = [...slides]
                newSlides.splice(activeIdx + 1, 0, f)
                setSlides(newSlides)
              }
            }
          }
        }
      } else if (slide.type === 'scale' && slide.dimension) {
        const payload = JSON.stringify({ type: 'scale', value: scalePreferNot ? null : scaleValue, preferNot: scalePreferNot, text: optionalComment || undefined })
        await answerQuestion(slide.dimension, payload)
        if (slide.dimension === 'training_effectiveness' && !scalePreferNot && typeof scaleValue === 'number' && scaleValue <= 2) {
          const needsSlide: Slide = { type: 'text', dimension: 'support_requests', prompt: 'Describe the training or format that would help you start.', required: false, heading: 'What would help you start?', subheading: 'What training or formats would help you get started?' }
          const newSlides = [...slides]
          newSlides.splice(activeIdx + 1, 0, needsSlide)
          setSlides(newSlides)
        }
      } else if (slide.type === 'mc_single' && slide.dimension) {
        const choice = mcSinglePreferNot ? 'Prefer not to say' : (mcSingle || null)
        const payload = JSON.stringify({ type: 'mc_single', choice, preferNot: mcSinglePreferNot, text: optionalComment || undefined })
        await answerQuestion(slide.dimension, payload)
        if (slide.dimension === 'training_received') {
          const yes = choice === 'Yes'
          const idx = activeIdx + 1
          const newSlides = [...slides]
          const existsEffect = newSlides.find(s => s.dimension === 'training_effectiveness')
          if (!existsEffect && yes) {
            newSlides.splice(idx, 0, {
              type: 'scale',
              dimension: 'training_effectiveness',
              prompt: 'Choose a rating from 1 (low) to 5 (high).',
              required: true,
              allowPreferNot: false,
              optionalText: true,
              heading: 'Training effectiveness',
              subheading: 'If you’ve had AI training, how helpful was it overall?'
            })
          }
          if (!yes) {
            newSlides.splice(idx, 0, {
              type: 'text',
              dimension: 'support_requests',
              prompt: 'Describe the training or format that would help you start.',
              required: false,
              heading: 'What would help you start?',
              subheading: 'If you haven’t had training yet, what training or formats would help you get started?'
            })
          }
          setSlides(newSlides)
        }
      } else if (slide.type === 'mc_multi' && slide.dimension) {
        const choices = Object.keys(mcMulti).filter(k => mcMulti[k])
        const payload = JSON.stringify({ type: 'mc_multi', choices, preferNot: mcMultiPreferNot, text: optionalComment || undefined })
        await answerQuestion(slide.dimension, payload)
      } else if (slide.type === 'matrix' && slide.dimension) {
        const selections = Object.entries(matrixSelections).map(([name, level]) => ({ name, level }))
        const payload = JSON.stringify({ type: 'usage_matrix', selections })
        await answerQuestion(slide.dimension, payload)
      } else if (slide.type === 'ai_followup' && slide.followUpInstanceId) {
        const payload = textValue.trim()
        await fetch('/api/survey/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionInstanceId: slide.followUpInstanceId, answerText: payload })
        })
      } else if (slide.type === 'end') {
        // handled by submitRating
      }
      setActiveIdx(i => Math.min(i + 1, slides.length - 1))
      resetControlsForSlide(slides[activeIdx + 1])
    } catch (e) {
      console.error(e)
      setError('Failed to save answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [slides, activeIdx, textValue, scaleValue, scalePreferNot, mcSingle, mcSinglePreferNot, mcMulti, mcMultiPreferNot, matrixSelections, optionalComment, instanceMap, answerQuestion, resetControlsForSlide, FOLLOWUP_ALLOWED])

  const handleBack = useCallback(() => {
    setActiveIdx(i => Math.max(0, i - 1))
    setError(null)
    resetControlsForSlide(slides[Math.max(0, activeIdx - 1)])
  }, [slides, activeIdx, resetControlsForSlide])

  

  // Load start
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/survey/start', { method: 'POST' })
        if (!res.ok) throw new Error('Failed to load survey')
        const data: StartPayload = await res.json()
        setInstanceMap(data.instanceMap || {})
        const s = buildSlides()
        setSlides(s)
        // Resume from first unanswered slide
        const idx = findFirstUnansweredSlideIndex(s, data.instanceMap || {})
        setActiveIdx(idx)
        // Initialize controls for first slide
        resetControlsForSlide(s[idx])
      } catch (e) {
        console.error(e)
        setError('Failed to load survey. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
    // Intentionally run once on mount to avoid reload loops when callbacks change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalSlides = slides.length
  const current = activeIdx + 1
  const progressPercentage = totalSlides > 0 ? (current / totalSlides) * 100 : 0

  const slide = slides[activeIdx]

  const canContinue = (() => {
    if (!slide) return false
    if (slide.type === 'welcome' || slide.type === 'intro') return true
    if (slide.type === 'end') return true
    if (slide.type === 'text') return true
    if (slide.type === 'ai_followup') return textValue.trim().length > 0
    if (slide.type === 'scale') {
      return slide.required ? (scalePreferNot || typeof scaleValue === 'number') : true
    }
    if (slide.type === 'mc_single') {
      return slide.required ? (mcSinglePreferNot || !!mcSingle || (slide.options || []).includes('Prefer not to say')) : true
    }
    if (slide.type === 'mc_multi') {
      const has = Object.values(mcMulti).some(Boolean) || mcMultiPreferNot
      return slide.required ? has : true
    }
    if (slide.type === 'matrix') {
      const items = slide.items || []
      return items.every(it => matrixSelections[it])
    }
    return false
  })()

  // Keyboard shortcuts (respect same logic as the Continue button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!isSubmitting && canContinue) {
          handleNext()
        }
      }
      if (e.key === 'ArrowLeft') {
        handleBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext, handleBack, canContinue, isSubmitting])

  // End screen rating
  const [rating, setRating] = useState<number | null>(null)
  const [ratingComment, setRatingComment] = useState('')
  const submitRating = async () => {
    try {
      if (!rating) { setActiveIdx(activeIdx + 1); return }
      await fetch('/api/feedback/survey-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: ratingComment.slice(0, 140), surveyVersion: 'v2', userAgent: navigator.userAgent })
      })
      setActiveIdx(activeIdx + 1)
    } catch { }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center">Loading your survey...</p>
      </div>
    )
  }

  return (
    <div className="pt-0 pb-12">
      {/* Top bar (non-sticky) */}
      <div className="mx-auto max-w-full px-0 mb-2">
        <div className="h-12 flex items-center justify-between px-12 pb-8 pt-9">
          <Button variant="outline" onClick={handleBack} className="gap-1 h-9 pr-6 pl-5">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </Button>
          <div className="text-sm text-gray-500">{current} of {totalSlides}</div>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-1 h-9 px-6">
            <span>Close</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Button>
        </div>
        {/* 4px high progress with dark gray track */}
        <div className="h-1" />
        <div className="relative h-1 w-full bg-gray-300 rounded-none">
          <div className="absolute left-0 top-0 h-1 bg-black" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-4xl">

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="py-12">
          <h1 className="text-[40px]/11 text-center font-serif mb-2">
            {slide?.heading || 'Assessment'}
          </h1>
          <p className="text-center text-lg">
            {slide?.subheading || ''}
          </p>
        </div>

        <Card>
          <CardContent className="pb-3 pt-2">
            <div className="space-y-6">
              {(slide?.type === 'scale' || slide?.type === 'mc_multi' || slide?.type === 'text' || slide?.type === 'mc_single' || slide?.type === 'ai_followup') && (
                slide?.prompt ? <p className="text-base mb-3">{slide.prompt}</p> : null
              )}
              {slide?.type === 'welcome' && (
                <div>
                  <p>{slide.copy}</p>
                  <p className="text-xs mt-4">Your responses are used for an internal readiness report; not shared outside your company.</p>
                </div>
              )}

              {slide?.type === 'intro' && (
                <div className="flex flex-col items-center text-center">
                  {/* Round illustration */}
                  <div className="mt-2 mb-6">
                    <div className="w-36 h-36 rounded-full overflow-hidden border border-gray-200 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                      <Image src={slide.illustration || '/globe.svg'} alt="Illustration" width={144} height={144} className="w-full h-full object-cover grayscale" />
                    </div>
                  </div>

                  {/* Prompt/copy inside card */}
                  {(slide.copy || slide.subheading) && (
                    <p className="max-w-2xl text-base text-gray-800">{slide.copy || slide.subheading}</p>
                  )}

                  {/* Tips/tools box */}
                  {slide.examples && slide.examples.length > 0 && (
                    <div className="w-full mt-8">
                      <div className="rounded-3xl bg-secondary p-5 text-left">
                        <div className="flex items-center gap-2 mb-3">
                          {/* Light bulb icon (updated as provided) */}
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="w-6 h-6 text-pink-900">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2.75C8.27208 2.75 5.25 5.77208 5.25 9.5C5.25 11.4985 6.11758 13.2934 7.49907 14.5304L7.50342 14.5343C8.06008 15.0328 8.48295 15.4114 8.78527 15.6886C9.06989 15.9495 9.29537 16.1628 9.41353 16.3086L9.42636 16.3244C9.64763 16.5974 9.84045 16.8353 9.9676 17.1199C10.0948 17.4044 10.1434 17.7067 10.1992 18.0537L10.2024 18.0738C10.231 18.2517 10.2425 18.4701 10.247 18.75H13.753C13.7575 18.4701 13.769 18.2517 13.7976 18.0738L13.8008 18.0537C13.8566 17.7067 13.9052 17.4044 14.0324 17.1199C14.1596 16.8353 14.3524 16.5974 14.5736 16.3244L14.5865 16.3086C14.7046 16.1628 14.9301 15.9495 15.2147 15.6886C15.5171 15.4114 15.94 15.0327 16.4966 14.5343L16.5009 14.5304C17.8824 13.2934 18.75 11.4985 18.75 9.5C18.75 5.77208 15.7279 2.75 12 2.75ZM13.7436 20.25H10.2564C10.2597 20.3542 10.2646 20.4453 10.2721 20.5273C10.2925 20.7524 10.3269 20.8341 10.3505 20.875C10.4163 20.989 10.511 21.0837 10.625 21.1495C10.6659 21.1731 10.7476 21.2075 10.9727 21.2279C11.2082 21.2493 11.5189 21.25 12 21.25C12.4811 21.25 12.7918 21.2493 13.0273 21.2279C13.2524 21.2075 13.3341 21.1731 13.375 21.1495C13.489 21.0837 13.5837 20.989 13.6495 20.875C13.6731 20.8341 13.7075 20.7524 13.7279 20.5273C13.7354 20.4453 13.7403 20.3542 13.7436 20.25ZM3.75 9.5C3.75 4.94365 7.44365 1.25 12 1.25C16.5563 1.25 20.25 4.94365 20.25 9.5C20.25 11.9428 19.1874 14.1384 17.5016 15.6479C16.9397 16.151 16.5234 16.5238 16.2284 16.7942C16.0809 16.9295 15.9681 17.0351 15.8849 17.1162C15.8434 17.1566 15.8117 17.1886 15.788 17.2134C15.7763 17.2256 15.7675 17.2352 15.7611 17.2423C15.7546 17.2496 15.7519 17.2529 15.7519 17.2529C15.4917 17.574 15.4354 17.6568 15.4019 17.7319C15.3683 17.8069 15.3442 17.9041 15.2786 18.3121C15.2527 18.4732 15.25 18.7491 15.25 19.5V19.5322C15.25 19.972 15.25 20.3514 15.2218 20.6627C15.192 20.9918 15.1259 21.3178 14.9486 21.625C14.7511 21.967 14.467 22.2511 14.125 22.4486C13.8178 22.6259 13.4918 22.692 13.1627 22.7218C12.8514 22.75 12.472 22.75 12.0322 22.75H11.9678C11.528 22.75 11.1486 22.75 10.8374 22.7218C10.5082 22.692 10.1822 22.6259 9.875 22.4486C9.53296 22.2511 9.24892 21.967 9.05144 21.625C8.87407 21.3178 8.80802 20.9918 8.77818 20.6627C8.74997 20.3514 8.74998 19.972 8.75 19.5322L8.75 19.5C8.75 18.7491 8.74735 18.4732 8.72144 18.3121C8.6558 17.9041 8.63166 17.8069 8.59812 17.7319C8.56459 17.6568 8.50828 17.574 8.24812 17.2529C8.24812 17.2529 8.24514 17.2493 8.23888 17.2423C8.23249 17.2352 8.22369 17.2256 8.21199 17.2134C8.18835 17.1886 8.15661 17.1566 8.11513 17.1162C8.03189 17.0351 7.91912 16.9295 7.77161 16.7942C7.4766 16.5238 7.06034 16.151 6.49845 15.6479C4.81263 14.1384 3.75 11.9428 3.75 9.5Z" fill="currentColor"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M13.2215 7.8897C13.5586 8.13046 13.6366 8.59887 13.3959 8.93593L12.1001 10.75H13.6427C13.9237 10.75 14.181 10.907 14.3096 11.1568C14.4382 11.4066 14.4163 11.7073 14.253 11.9359L12.1102 14.9359C11.8694 15.273 11.401 15.3511 11.0639 15.1103C10.7269 14.8695 10.6488 14.4011 10.8896 14.0641L12.1853 12.25H10.6427C10.3618 12.25 10.1044 12.093 9.97585 11.8432C9.84729 11.5934 9.86913 11.2927 10.0324 11.0641L12.1753 8.06407C12.416 7.72701 12.8844 7.64894 13.2215 7.8897Z" fill="currentColor"/>
                          </svg>
                          <div className="font-semibold text-pink-900 text-lg">Some tools to try!</div>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 text-base text-pink-900">
                          {slide.examples.map(ex => (
                            <li key={ex}>
                              <span className="font-semibold">{ex}</span>
                              {EXAMPLE_DESCRIPTIONS[ex] && (
                                <span>: {EXAMPLE_DESCRIPTIONS[ex]}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {slide?.type === 'text' && (
                <div>
                  {slide.dimension === 'job_title' ? (
                    <>
                      <Input
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder={slide.prompt || ''}
                        className="w-full"
                        maxLength={140}
                        disabled={isSubmitting}
                      />
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span>{textValue.length}/140</span>
                        <span>Free‑text is optional</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Textarea
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        placeholder="Share your thoughts. Please don’t paste sensitive data."
                        className="min-h-[120px] resize-none placeholder:text-gray-400"
                        maxLength={2000}
                        disabled={isSubmitting}
                      />
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span>{textValue.length}/2000</span>
                        <span>Free‑text is optional</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {slide?.type === 'scale' && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap mb-7">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Button
                        key={n}
                        type="button"
                        size="chip"
                        variant={!scalePreferNot && scaleValue === n ? 'chipActive' : 'chip'}
                        onClick={() => { setScalePreferNot(false); setScaleValue(n) }}
                        disabled={isSubmitting}
                      >{n}</Button>
                    ))}
                    {slide.allowPreferNot && (
                      <Button
                        type="button"
                        size="chip"
                        variant={scalePreferNot ? 'chipActive' : 'chip'}
                        onClick={() => { setScalePreferNot(v => !v); if (!scalePreferNot) setScaleValue(null) }}
                        disabled={isSubmitting}
                      >Prefer not to say</Button>
                    )}
                  </div>
                  {slide.optionalText && (
                    <Textarea
                      value={optionalComment}
                      onChange={(e) => setOptionalComment(e.target.value)}
                      placeholder={'Add detail (optional). Please don’t paste sensitive data.'}
                      className="min-h-[100px] resize-none placeholder:text-gray-400"
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              )}

              {slide?.type === 'mc_single' && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap pb-2">
                    {(slide.options || []).map(opt => (
                      <Button
                        key={opt}
                        type="button"
                        size="chip"
                        variant={!mcSinglePreferNot && mcSingle === opt ? 'chipActive' : 'chip'}
                        onClick={() => { setMcSinglePreferNot(false); setMcSingle(opt) }}
                        disabled={isSubmitting}
                      >{opt}</Button>
                    ))}
                    {slide.allowPreferNot && !((slide.options || []).includes('Prefer not to say')) && (
                      <Button
                        type="button"
                        size="chip"
                        variant={mcSinglePreferNot ? 'chipActive' : 'chip'}
                        onClick={() => { setMcSinglePreferNot(v => !v); if (!mcSinglePreferNot) setMcSingle(null) }}
                        disabled={isSubmitting}
                      >Prefer not to say</Button>
                    )}
                  </div>
                  {slide.optionalText && (
                    <Textarea
                      value={optionalComment}
                      onChange={(e) => setOptionalComment(e.target.value)}
                      placeholder={'Add detail (optional). Please don’t paste sensitive data.'}
                      className="mt-5 min-h-[100px] resize-none placeholder:text-gray-400"
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              )}

              {slide?.type === 'mc_multi' && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap mb-7">
                    {(slide.options || []).map(opt => (
                      <Button
                        key={opt}
                        type="button"
                        size="chip"
                        variant={mcMulti[opt] ? 'chipActive' : 'chip'}
                        onClick={() => setMcMulti(prev => ({ ...prev, [opt]: !prev[opt] }))}
                        disabled={isSubmitting}
                      >{opt}</Button>
                    ))}
                    {slide.allowPreferNot && (
                      <Button
                        type="button"
                        size="chip"
                        variant={mcMultiPreferNot ? 'chipActive' : 'chip'}
                        onClick={() => setMcMultiPreferNot(v => !v)}
                        disabled={isSubmitting}
                      >Prefer not to say</Button>
                    )}
                  </div>
                  {slide.optionalText && (
                    <Textarea
                      value={optionalComment}
                      onChange={(e) => setOptionalComment(e.target.value)}
                      placeholder={'Add detail (optional). Please don’t paste sensitive data.'}
                      className="min-h-[100px] resize-none placeholder:text-gray-400"
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              )}

              {slide?.type === 'matrix' && (
                <div className="space-y-5">
                  {(slide.items || []).map(item => (
                    <div key={item} className="space-y-0 pb-3">
                      <div className="pt-0 pb-3">
                        <div className="font-semibold text-lg">{item}</div>
                        {MATRIX_ITEM_DESCRIPTIONS[item] && (
                          <div className="text-sm text-gray-600 mt-1">{MATRIX_ITEM_DESCRIPTIONS[item]}</div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {MATRIX_LEVELS.map(level => (
                          <Button
                            key={level}
                            type="button"
                            size="chip"
                            variant={matrixSelections[item] === level ? 'chipActive' : 'chip'}
                            onClick={() => setMatrixSelections(prev => ({ ...prev, [item]: level }))}
                            disabled={isSubmitting}
                          >{level}</Button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!(slide.items || []).every(it => matrixSelections[it]) && (
                    <div className="text-sm">Please answer every item to continue.</div>
                  )}
                </div>
              )}

              {slide?.type === 'ai_followup' && (
                <div>
                  <Textarea
                    value={textValue}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder="Brief answer"
                    className="min-h-[120px] resize-none placeholder:text-gray-400"
                    maxLength={800}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {slide?.type === 'end' && (
                <div className="space-y-3">
                  <p>{slide.prompt || 'How would you rate this survey experience?'}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Button key={n} size="chip" type="button" variant={rating === n ? 'chipActive' : 'chip'} onClick={() => setRating(n)}>{n}</Button>
                    ))}
                  </div>
                  <Textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Any quick feedback? (optional, 140 chars)"
                    className="min-h-[80px] resize-none"
                    maxLength={140}
                    disabled={isSubmitting}
                  />
                </div>
              )}


            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center sticky bottom-0 pt-7">
          {slide?.type === 'end' ? (
            <Button variant="dark" size="xl" onClick={submitRating} disabled={isSubmitting} className="min-w-[120px]">Finish</Button>
          ) : (
            <Button variant="dark" size="xl" onClick={handleNext} disabled={isSubmitting || !canContinue} className="min-w-[120px]">
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <span>Continue</span>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}