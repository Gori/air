'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SurveyLayout } from '@/components/survey/SurveyLayout'
import { SelectSingle } from '@/components/survey/SelectSingle'
import { QuestionMultiChoice } from '@/components/survey/QuestionMultiChoice'
import { MultiChoiceList } from '@/components/survey/MultiChoiceList'
// import { InlineTemplate } from '@/components/survey/InlineTemplate'
import { MultiSlider } from '@/components/survey/MultiSlider'
// import { ChoiceGrid } from '@/components/survey/ChoiceGrid'
import { ChoiceList } from '@/components/survey/ChoiceList'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

type SlideType =
  | 'select_single'
  | 'mc_single'
  | 'mc_multi'
  | 'inline_template'
  | 'multi_slider'
  | 'text'
  | 'tags_multi'

interface Slide {
  type: SlideType
  heading: string
  subheading?: string
  dimension: string
  options?: string[]
  placeholder?: string
  prompt?: string
}

const INDUSTRY_OPTIONS = [
  'B2B SaaS & Developer Tools', 'Fintech', 'Healthtech & Digital Health', 'Biotech & Pharma', 'E-commerce & D2C', 'Retail & Omnichannel', 'Manufacturing & Industrial', 'Supply Chain, Logistics & Mobility', 'Media, Marketing & Entertainment', 'Gaming', 'Edtech', 'Energy & Climate (Cleantech)', 'PropTech & Real Estate', 'Travel & Hospitality', 'Telecommunications & Connectivity', 'Professional Services & Agencies', 'Other'
]

const INDUSTRY_ICONS: Record<string, 'code' | 'bank' | 'health' | 'flask' | 'shop' | 'store' | 'factory' | 'truck' | 'film' | 'game' | 'grad' | 'zap' | 'building' | 'plane' | 'wifi' | 'users' | 'help'> = {
  'B2B SaaS & Developer Tools': 'code',
  'Fintech': 'bank',
  'Healthtech & Digital Health': 'health',
  'Biotech & Pharma': 'flask',
  'E-commerce & D2C': 'shop',
  'Retail & Omnichannel': 'store',
  'Manufacturing & Industrial': 'factory',
  'Supply Chain, Logistics & Mobility': 'truck',
  'Media, Marketing & Entertainment': 'film',
  'Gaming': 'game',
  'Edtech': 'grad',
  'Energy & Climate (Cleantech)': 'zap',
  'PropTech & Real Estate': 'building',
  'Travel & Hospitality': 'plane',
  'Telecommunications & Connectivity': 'wifi',
  'Professional Services & Agencies': 'users',
  'Other': 'help',
}

const ensureOtherLast = (items: string[], includeOther: boolean) => {
  const cleaned = Array.from(new Set((items || []).map((s: string) => String(s || '').trim()).filter((s: string) => s.length > 0 && s.toLowerCase() !== 'other')))
  if (includeOther) cleaned.push('Other')
  return cleaned
}

const cap = (items: string[], max: number) => items.slice(0, max)

const SLOWDOWN_OPTIONS = [
  'Handoffs',
  'Rework',
  'Manual data',
  'Approvals',
  'Support load',
  'Inventory/Ops',
  'Compliance',
  'Meetings',
  'Context switching',
  'Tool sprawl',
]

const REINVEST_OPTIONS = [
  'Ship faster',
  'Improve quality',
  'Customer time',
  'Reduce cost',
  'Explore new bets',
  'Fix data hygiene',
  'Shorten onboarding',
  'Reduce escalations',
  'Increase win rate',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [activeIdx, setActiveIdx] = useState(0)

  // Form state (JSONB)
  const [data, setData] = useState<Record<string, unknown>>({})

  // Local UI states
  const [nicheSuggestions, setNicheSuggestions] = useState<string[]>([])
  // buyer/user role suggestions removed
  // slowdown and reinvest suggestions removed in favor of curated lists
  const [enablerSuggestions, setEnablerSuggestions] = useState<string[]>([])
  const [blockerSuggestions, setBlockerSuggestions] = useState<string[]>([])
  // company name suggestions removed; using manual input instead
  // Readiness flags to avoid infinite loading when suggestions are empty
  const [nicheReady, setNicheReady] = useState(false)
  // buyer/user readiness flags removed
  const [enablerReady, setEnablerReady] = useState(false)
  const [blockerReady, setBlockerReady] = useState(false)
  // removed ready flags for slowdowns and names
  // Loading flags to avoid duplicate concurrent fetches
  const [nicheLoading, setNicheLoading] = useState(false)
  // buyer/user loading flags removed
  const [enablerLoading, setEnablerLoading] = useState(false)
  const [blockerLoading, setBlockerLoading] = useState(false)
  // removed loading flags for slowdowns and names
  const [nicheKey, setNicheKey] = useState<string>('')
  // buyer/user keys removed
  // Value statement suggestions state (load once per industry)
  // value statement removed
  const [enablerKey, setEnablerKey] = useState<string>('')
  const [blockerKey, setBlockerKey] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/onboarding/start', { method: 'POST' })
        const payload = await res.json().catch(() => ({}))
        setData(payload?.data || {})
        const s: Slide[] = [
          { type: 'select_single', heading: 'Industry', subheading: 'Which industry are you in?', dimension: 'industry', prompt: 'Pick one industry from the list.' },
          { type: 'mc_multi', heading: 'Niche/segment', subheading: 'Which niche/segment best fits you?', dimension: 'niches', prompt: 'Select all that apply (chips). Use “Other” if none fit.' },
          // Value statement removed
          { type: 'multi_slider', heading: 'Foundations & Workflows', subheading: 'Let\u2019s peek under the hood \u2014 how ready is your company behind the scenes to make AI work day to day?', dimension: 'workflow_docs', prompt: '' },
          { type: 'multi_slider', heading: 'AI Readiness & Culture', subheading: 'Rate how true these are today.', dimension: 'ai_readiness', prompt: '' },
          { type: 'mc_multi', heading: 'What slows teams down?', subheading: 'What slows your teams down most?', dimension: 'biggest_slowdown_multi', prompt: 'Select all that apply. “Other” if needed.' },
          { type: 'mc_multi', heading: 'Reinvest time', subheading: 'Where would you reinvest 10h/week?', dimension: 'reinvest', prompt: 'Select up to three priorities. “Other” if needed.' },
          { type: 'mc_single', heading: 'Primary outcome', subheading: 'Which outcome matters most right now?', dimension: 'primary_outcome', prompt: 'Pick the single best-fitting outcome.' },
          { type: 'mc_multi', heading: 'Right time to adopt AI-based workflows', subheading: 'What would make now the right time to implement new AI-based workflows?', dimension: 'change_enablers', prompt: 'Select all that apply. “Other” to add your own.' },
          { type: 'mc_multi', heading: 'Wrong time to adopt AI-based workflows', subheading: 'What would make now the wrong time to implement new AI-based workflows?', dimension: 'change_blockers', prompt: 'Select all that apply. “Other” to add your own.' },
          { type: 'tags_multi', heading: 'Company names', subheading: 'What is the name of your company?', dimension: 'company_names', prompt: 'Enter your company’s legal or primary brand name.' },
          // headcount merged into company_names
        ]
        setSlides(s)
      } catch {
        setError('Failed to load onboarding')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  const savePatch = useCallback(async (patch: Record<string, unknown>) => {
    setData(prev => ({ ...prev, ...patch }))
    await fetch('/api/onboarding/save', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: patch })
    })
  }, [])

  // Suggestion helper
  const suggest = useCallback(async (type: string, context: Record<string, unknown>) => {
    const startedAt = Date.now()
    console.log('[onboarding] suggest:start', { type, context })
    const res = await fetch('/api/onboarding/suggest', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, context })
    })
    const out = await res.json().catch(() => ({}))
    console.log('[onboarding] suggest:done', { type, count: Array.isArray(out?.suggestions) ? out.suggestions.length : 0, ms: Date.now() - startedAt })
    return out?.suggestions || []
  }, [])

  // Prefetch suggestions; refetch when upstream context changes, and prune selections to new options
  useEffect(() => {
    const run = async () => {
      const ctx = { industry: data.industry, niches: data.niches }
      const key = (v: unknown) => JSON.stringify(v || null)
      const currentDim = slides[activeIdx]?.dimension

      // Niche suggestions depend on industry
      const nk = key({ industry: data.industry })
      if (currentDim === 'niches' && data.industry && !nicheLoading && (nk !== nicheKey || !nicheReady)) {
        console.log('[onboarding] refetch niches', { prevKey: nicheKey, nextKey: nk })
        setNicheKey(nk)
        setNicheReady(false)
        setNicheSuggestions([])
        setNicheLoading(true)
        try {
          const s = ensureOtherLast(await suggest('niches', { industry: data.industry }), true)
          const capped = cap(s, 12)
          setNicheSuggestions(capped)
          setNicheReady(true)
          console.log('[onboarding] niches ready', { count: capped.length })
          if (Array.isArray(data.niches)) {
            const allowed = new Set(capped.concat('Other'))
            const pruned = (data.niches as string[]).filter((x: string) => allowed.has(x))
            if (pruned.length !== data.niches.length) void savePatch({ niches: pruned })
          }
        } finally {
          setNicheLoading(false)
        }
      }

      // value statement removed

      // buyer/user role suggestion logic removed

      // Slowdowns suggestions removed; using curated list

      // Enablers depend on ctx
      const ek = key(ctx)
      if (currentDim === 'change_enablers' && data.industry && !enablerLoading && (ek !== enablerKey || !enablerReady)) {
        console.log('[onboarding] refetch enablers', { prevKey: enablerKey, nextKey: ek })
        setEnablerKey(ek)
        setEnablerReady(false)
        setEnablerSuggestions([])
        setEnablerLoading(true)
        try {
          const s = ensureOtherLast(await suggest('enablers', ctx), true)
          const capped = cap(s, 10)
          setEnablerSuggestions(capped)
          setEnablerReady(true)
          console.log('[onboarding] enablers ready', { count: capped.length })
          if (Array.isArray(data.change_enablers)) {
            const allowed = new Set(capped.concat('Other'))
            const pruned = (data.change_enablers as string[]).filter((x: string) => allowed.has(x))
            if (pruned.length !== data.change_enablers.length) void savePatch({ change_enablers: pruned })
          }
        } finally {
          setEnablerLoading(false)
        }
      }

      // Blockers depend on ctx
      const bk2 = key(ctx)
      if (currentDim === 'change_blockers' && data.industry && !blockerLoading && (bk2 !== blockerKey || !blockerReady)) {
        console.log('[onboarding] refetch blockers', { prevKey: blockerKey, nextKey: bk2 })
        setBlockerKey(bk2)
        setBlockerReady(false)
        setBlockerSuggestions([])
        setBlockerLoading(true)
        try {
          const s = ensureOtherLast(await suggest('blockers', ctx), true)
          const capped = cap(s, 10)
          setBlockerSuggestions(capped)
          setBlockerReady(true)
          console.log('[onboarding] blockers ready', { count: capped.length })
          if (Array.isArray(data.change_blockers)) {
            const allowed = new Set(capped.concat('Other'))
            const pruned = (data.change_blockers as string[]).filter((x: string) => allowed.has(x))
            if (pruned.length !== data.change_blockers.length) void savePatch({ change_blockers: pruned })
          }
        } finally {
          setBlockerLoading(false)
        }
      }
      // Company name suggestions removed; using manual input
    }
    void run()
    return () => {}
  }, [activeIdx, slides, data.industry, data.niches, data.domain, data.change_enablers, data.change_blockers, suggest, nicheKey, enablerKey, blockerKey, nicheReady, enablerReady, blockerReady, nicheLoading, enablerLoading, blockerLoading, savePatch])

  const slide = slides[activeIdx]
  const current = activeIdx + 1
  const total = slides.length

  const isString = (v: unknown): v is string => typeof v === 'string'
  const isNumber = (v: unknown): v is number => typeof v === 'number'
  const get = (obj: Record<string, unknown>, key: string): unknown => obj[key]
  const workflowDocs = (get(data, 'workflow_docs') as Record<string, unknown> | undefined) || undefined
  const aiReadiness = (get(data, 'ai_readiness') as Record<string, unknown> | undefined) || undefined

  const isSlideSatisfied = useCallback((s?: Slide) => {
    if (!s) return false
    if (s.dimension === 'headcount') return true
    if (s.type === 'text') {
      const v = get(data, s.dimension)
      return isString(v) && v.trim().length > 0
    }
    if (s.type === 'select_single') {
      const industry = get(data, 'industry')
      return isString(industry) && industry.length > 0
    }
    if (s.type === 'multi_slider') {
      if (s.dimension === 'workflow_docs') {
        const wd = get(data, 'workflow_docs') as Record<string, unknown> | undefined
        const documented = wd ? wd['documented'] : undefined
        const dataQuality = wd ? wd['data_quality'] : undefined
        const toolIntegration = wd ? wd['tool_integration'] : undefined
        return isNumber(documented) && isNumber(dataQuality) && isNumber(toolIntegration)
      }
      if (s.dimension === 'ai_readiness') {
        const ar = get(data, 'ai_readiness') as Record<string, unknown> | undefined
        const vals = [
          ar ? ar['ai_understanding'] : undefined,
          ar ? ar['ai_usage_learning'] : undefined,
          ar ? ar['ai_sharing_rhythm'] : undefined,
          ar ? ar['ai_experimentation_culture'] : undefined,
          ar ? ar['ai_leadership_engagement'] : undefined,
        ]
        return vals.every(isNumber)
      }
      return false
    }
    if (s.type === 'mc_single') {
      const v = get(data, s.dimension)
      return isString(v) && v.length > 0
    }
    if (s.type === 'mc_multi') {
      const v = get(data, s.dimension)
      return Array.isArray(v) && (v as unknown[]).every(isString) && (v as unknown[]).length > 0
    }
    if (s.type === 'tags_multi') {
      const cn = get(data, 'company_name')
      return isString(cn) && cn.trim().length > 0
    }
    return false
  }, [data])

  const canContinue = useMemo(() => isSlideSatisfied(slide), [slide, isSlideSatisfied])
  const allSatisfied = useMemo(() => slides.every(s => isSlideSatisfied(s)), [slides, isSlideSatisfied])

  const next = useCallback(async () => {
    if (!slide) return
    // No special handling for headcount: we now capture range with company name slide
    if (current === total) {
      const res = await fetch('/api/onboarding/complete', { method: 'POST' })
      const out = await res.json().catch(() => ({}))
      if (out?.redirect) {
        router.push(out.redirect)
        return
      }
    }
    setActiveIdx(i => {
      const nextIndex = Math.min(i + 1, total - 1)
      console.log('[onboarding] next', { fromIndex: i, toIndex: nextIndex, from: slide?.dimension, to: slides[nextIndex]?.dimension })
      return nextIndex
    })
  }, [slide, current, total, router, slides])

  const suspend = useMemo(() => {
    if (!slide) return false
    if (isLoading) return true
    if (slide.dimension === 'niches') return nicheSuggestions.length === 0
    // buyer/user roles removed
    if (slide.dimension === 'change_enablers') return enablerSuggestions.length === 0
    if (slide.dimension === 'change_blockers') return blockerSuggestions.length === 0
    // value statement removed
    return false
  }, [slide, isLoading, nicheSuggestions.length, enablerSuggestions.length, blockerSuggestions.length])

  // Log entering slides and suspend changes for diagnostics
  useEffect(() => {
    console.log('[onboarding] enter slide', {
      idx: activeIdx,
      dimension: slide?.dimension,
      suspend,
      ready: { nicheReady, enablerReady, blockerReady }
    })
  }, [activeIdx, slide?.dimension, suspend, nicheReady, enablerReady, blockerReady])

  // Also log when suspend flips while on a specific slide
  useEffect(() => {
    if (!slide) return
    const reason = (() => {
      if (isLoading) return 'initial-load'
      if (slide.dimension === 'niches' && !nicheReady) return 'niches-not-ready'
      // buyer/user readiness removed
      if (slide.dimension === 'change_enablers' && !enablerReady) return 'enablers-not-ready'
      if (slide.dimension === 'change_blockers' && !blockerReady) return 'blockers-not-ready'
      // value statement removed
      return 'none'
    })()
    console.log('[onboarding] suspend', { idx: activeIdx, dimension: slide.dimension, suspend, reason })
  }, [suspend, slide, activeIdx, isLoading, nicheReady, enablerReady, blockerReady])

  return (
    <SurveyLayout
      current={current}
      total={total}
      heading={slide?.heading}
      subheading={slide?.subheading}
      prompt={slide?.prompt}
      suspend={suspend}
      isSubmitting={false}
      canContinue={canContinue}
      onBack={() => setActiveIdx(i => Math.max(0, i - 1))}
      onClose={() => {
        if (allSatisfied) router.push('/admin/overview')
        else router.push('/welcome')
      }}
      onContinue={next}
      progressPercentage={total > 0 ? (current / total) * 100 : 0}
    >
      {error && (
        <Alert className="mb-6" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      {slide?.dimension === 'industry' && (
        <ChoiceList
          items={INDUSTRY_OPTIONS.map((t) => ({ id: t, title: t, icon: INDUSTRY_ICONS[t] }))}
          selectedId={typeof data.industry === 'string' ? data.industry : undefined}
          onSelect={async (id) => { await savePatch({ industry: id }); setActiveIdx(i => Math.min(i + 1, total - 1)) }}
        />
      )}

      {slide?.dimension === 'niches' && (
        <>
          <MultiChoiceList
            items={ensureOtherLast(nicheSuggestions, true)}
            selected={Array.isArray(data.niches) ? data.niches : []}
            onToggle={(opt) => {
              const list: string[] = Array.isArray(data.niches) ? data.niches : []
              const has = list.includes(opt)
              const next = has ? list.filter((x) => x !== opt) : [...list, opt]
              void savePatch({ niches: next })
            }}
          />
          {Array.isArray(data.niches) && data.niches.includes('Other') && (
            <Textarea
              value={typeof data.niches_other === 'string' ? data.niches_other : ''}
              onChange={(e) => savePatch({ niches_other: e.target.value })}
              placeholder={'Other (optional)'}
              className="min-h-[80px] resize-none mt-4"
              maxLength={140}
            />
          )}
        </>
      )}

      {/* value statement removed */}

      {/* buyer/user role slides removed */}

      {slide?.dimension === 'workflow_docs' && (
        <MultiSlider
          items={[
            {
              id: 'documented',
              prompt: '📋 Documentation — How documented are your workflows?',
              minLabel: '✋ Not at all',
              maxLabel: '📗 Perfectly documented',
              descriptions: [
                'Barely anything is written down',
                'Some scattered notes exist',
                'Key steps are outlined',
                'Most workflows have guides',
                'Processes are well documented',
                'Documentation is comprehensive and up to date',
              ],
            },
            {
              id: 'data_quality',
              prompt: '🧹 Data quality — How clean and reliable is your operational data?',
              minLabel: '😬 Messy and inconsistent',
              maxLabel: '💎 Clean, trusted source of truth',
              descriptions: [
                'Data scattered, duplicates everywhere',
                'Some key systems somewhat accurate',
                'Most data usable, but not always current',
                'Generally clean and maintained',
                'Reliable across systems',
                'Single source of truth and confidence',
              ],
            },
            {
              id: 'tool_integration',
              prompt: '🔗 Tool integration — How integrated are your tools and systems?',
              minLabel: '🔒 Mostly siloed',
              maxLabel: '🌐 Fully connected',
              descriptions: [
                'No integrations between tools',
                'Some manual exports/imports',
                'A few key integrations set up',
                'Most tools connected via API or sync',
                'Data flows automatically',
                'Unified stack with seamless data flow',
              ],
            },
          ]}
          values={{
            documented: isNumber(workflowDocs?.['documented']) ? (workflowDocs?.['documented'] as number) : undefined,
            data_quality: isNumber(workflowDocs?.['data_quality']) ? (workflowDocs?.['data_quality'] as number) : undefined,
            tool_integration: isNumber(workflowDocs?.['tool_integration']) ? (workflowDocs?.['tool_integration'] as number) : undefined,
          }}
          onChange={(delta) => {
            const next = { ...(data.workflow_docs || {}), ...delta }
            void savePatch({ workflow_docs: next })
          }}
        />
      )}

      {slide?.dimension === 'ai_readiness' && (
        <MultiSlider
          items={[
            {
              id: 'ai_understanding',
              prompt: '🎯 Strategic alignment — Employees understand why AI matters to our strategy',
              minLabel: 'Not at all',
              maxLabel: 'Crystal clear',
              descriptions: [
                'Rarely discussed',
                'Some awareness',
                'Basics are known',
                'Understands the why',
                'Understands the impact',
                'Deeply aligned with strategy',
              ],
            },
            {
              id: 'ai_usage_learning',
              prompt: '📚 Active learning — Employees use AI tools and take learning opportunities',
              minLabel: 'Not really',
              maxLabel: 'Active and ongoing',
              descriptions: [
                'Few experiments',
                'Occasional use',
                'Some teams adopt',
                'Regular usage',
                'Most teams engaged',
                'High adoption and learning',
              ],
            },
            {
              id: 'ai_sharing_rhythm',
              prompt: '💬 Knowledge sharing — We share what works with AI on a regular rhythm',
              minLabel: 'No cadence',
              maxLabel: 'Tight, consistent cadence',
              descriptions: [
                'Ad-hoc only',
                'Rare updates',
                'Team-level shareouts',
                'Monthly cadence',
                'Bi-weekly cadence',
                'Weekly and consistent',
              ],
            },
            {
              id: 'ai_tools_data_access',
              prompt: '⚡ Resource access — Teams have fast, reliable access to tools and data',
              minLabel: 'Hard to access',
              maxLabel: 'Fast and reliable',
              descriptions: [
                'Often blocked',
                'Slow approvals',
                'Some bottlenecks',
                'Mostly available',
                'Reliable access',
                'Frictionless access',
              ],
            },
            {
              id: 'ai_experimentation_culture',
              prompt: '🧪 Experimentation culture — How comfortable are your teams experimenting with AI tools?',
              minLabel: '😬 Avoids new tools',
              maxLabel: '🚀 Experiments weekly',
              descriptions: [
                'Risk-averse, rarely try new tools',
                'A few curious individuals experimenting',
                'Some teams run small tests',
                'Regular experimentation across org',
                'Frequent sharing of what works',
                'Continuous improvement mindset',
              ],
            },
            {
              id: 'ai_leadership_engagement',
              prompt: '👑 Leadership engagement — Leaders actively use and encourage AI tools',
              minLabel: '💤 Not really',
              maxLabel: '🔥 Fully embraced',
              descriptions: [
                'Rarely discussed at leadership level',
                'Leadership curious but not involved',
                'Leaders talk about it occasionally',
                'Some leaders use AI for their own work',
                'Actively encourage team experimentation',
                'Leaders consistently use and champion AI tools',
              ],
            },
          ]}
          values={{
            ai_understanding: isNumber(aiReadiness?.['ai_understanding']) ? (aiReadiness?.['ai_understanding'] as number) : undefined,
            ai_usage_learning: isNumber(aiReadiness?.['ai_usage_learning']) ? (aiReadiness?.['ai_usage_learning'] as number) : undefined,
            ai_sharing_rhythm: isNumber(aiReadiness?.['ai_sharing_rhythm']) ? (aiReadiness?.['ai_sharing_rhythm'] as number) : undefined,
            ai_tools_data_access: isNumber(aiReadiness?.['ai_tools_data_access']) ? (aiReadiness?.['ai_tools_data_access'] as number) : undefined,
            ai_experimentation_culture: isNumber(aiReadiness?.['ai_experimentation_culture']) ? (aiReadiness?.['ai_experimentation_culture'] as number) : undefined,
            ai_leadership_engagement: isNumber(aiReadiness?.['ai_leadership_engagement']) ? (aiReadiness?.['ai_leadership_engagement'] as number) : undefined,
          }}
          onChange={(delta) => {
            const next = { ...(data.ai_readiness || {}), ...delta }
            void savePatch({ ai_readiness: next })
          }}
        />
      )}

      {slide?.dimension === 'biggest_slowdown_multi' && (
        <>
          <MultiChoiceList
            items={ensureOtherLast(SLOWDOWN_OPTIONS, true)}
            selected={Array.isArray(data.biggest_slowdown_multi) ? data.biggest_slowdown_multi : []}
            onToggle={(opt) => {
              const list: string[] = Array.isArray(data.biggest_slowdown_multi) ? data.biggest_slowdown_multi : []
              const has = list.includes(opt)
              const next = has ? list.filter(x => x !== opt) : [...list, opt]
              void savePatch({ biggest_slowdown_multi: next })
            }}
          />
          {Array.isArray(data.biggest_slowdown_multi) && data.biggest_slowdown_multi.includes('Other') && (
            <Textarea
              value={typeof data.biggest_slowdown_other === 'string' ? data.biggest_slowdown_other : ''}
              onChange={(e) => savePatch({ biggest_slowdown_other: e.target.value })}
              placeholder={'Other (optional)'}
              className="min-h-[80px] resize-none mt-4"
              maxLength={140}
            />
          )}
        </>
      )}

      {slide?.dimension === 'stopped_doing' && (
        <Textarea
          value={typeof data.stopped_doing === 'string' ? data.stopped_doing : ''}
          onChange={(e) => savePatch({ stopped_doing: e.target.value.slice(0, 100) })}
          placeholder={'“Stopped double-entering invoices in two systems.”'}
          className="min-h-[80px] resize-none"
          maxLength={100}
        />
      )}

      {slide?.dimension === 'reinvest' && (
        <>
          <MultiChoiceList
            items={ensureOtherLast(REINVEST_OPTIONS, true)}
            selected={Array.isArray(data.reinvest) ? data.reinvest : []}
            onToggle={(opt) => {
              const list: string[] = Array.isArray(data.reinvest) ? data.reinvest : []
              const has = list.includes(opt)
              const next = has ? list.filter(x => x !== opt) : [...list, opt].slice(0, 3)
              void savePatch({ reinvest: next })
            }}
          />
          {Array.isArray(data.reinvest) && data.reinvest.includes('Other') && (
            <Textarea
              value={typeof data.reinvest_other === 'string' ? data.reinvest_other : ''}
              onChange={(e) => savePatch({ reinvest_other: e.target.value })}
              placeholder={'Other (optional)'}
              className="min-h-[80px] resize-none mt-4"
              maxLength={140}
            />
          )}
        </>
      )}

      {slide?.dimension === 'primary_outcome' && (
        <ChoiceList
          items={[...['New revenue growth','Gross margin improvement','Retention/churn reduction','NPS/CSAT lift','Cycle-time reduction','Cost-to-serve reduction','Defect/incident reduction','Regulatory readiness']].map((t) => ({ id: t, title: t }))}
          selectedId={typeof data.primary_outcome === 'string' ? data.primary_outcome : undefined}
          onSelect={async (id) => { await savePatch({ primary_outcome: id }); setActiveIdx(i => Math.min(i + 1, total - 1)) }}
        />
      )}

      {slide?.dimension === 'change_enablers' && (
        <QuestionMultiChoice
          options={ensureOtherLast(enablerSuggestions, true)}
          values={(Array.isArray(data.change_enablers) ? data.change_enablers : []).reduce((acc: Record<string, boolean>, v: string) => { acc[v] = true; return acc }, {})}
          preferNot={false}
          onToggle={(opt) => {
            const list: string[] = Array.isArray(data.change_enablers) ? data.change_enablers : []
            const has = list.includes(opt)
            const next = has ? list.filter((x) => x !== opt) : [...list, opt]
            void savePatch({ change_enablers: next })
          }}
          onTogglePreferNot={() => {}}
          disabled={false}
          allowPreferNot={false}
          optionalTextSlot={
            Array.isArray(data.change_enablers) && data.change_enablers.includes('Other') ? (
              <Textarea
                value={typeof data.change_enablers_other === 'string' ? data.change_enablers_other : ''}
                onChange={(e) => savePatch({ change_enablers_other: e.target.value })}
                placeholder={'Other (optional)'}
                className="min-h-[80px] resize-none"
                maxLength={140}
              />
            ) : null
          }
        />
      )}

      {slide?.dimension === 'change_blockers' && (
        <QuestionMultiChoice
          options={ensureOtherLast(blockerSuggestions, true)}
          values={(Array.isArray(data.change_blockers) ? data.change_blockers : []).reduce((acc: Record<string, boolean>, v: string) => { acc[v] = true; return acc }, {})}
          preferNot={false}
          onToggle={(opt) => {
            const list: string[] = Array.isArray(data.change_blockers) ? data.change_blockers : []
            const has = list.includes(opt)
            const next = has ? list.filter((x) => x !== opt) : [...list, opt]
            void savePatch({ change_blockers: next })
          }}
          onTogglePreferNot={() => {}}
          disabled={false}
          allowPreferNot={false}
          optionalTextSlot={
            Array.isArray(data.change_blockers) && data.change_blockers.includes('Other') ? (
              <Textarea
                value={typeof data.change_blockers_other === 'string' ? data.change_blockers_other : ''}
                onChange={(e) => savePatch({ change_blockers_other: e.target.value })}
                placeholder={'Other (optional)'}
                className="min-h-[80px] resize-none"
                maxLength={140}
              />
            ) : null
          }
        />
      )}

      {slide?.dimension === 'company_names' && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              value={typeof data.company_name === 'string' ? data.company_name : ''}
              onChange={(e) => savePatch({ company_name: e.target.value })}
              placeholder={'Acme AB'}
              className="h-[56px]"
              maxLength={80}
            />
          </div>
          <div className="w-64">
            <SelectSingle
              value={typeof data.headcount_range === 'string' ? data.headcount_range : ''}
              options={["1-10","11-50","51-200","201-1000","1000+"]}
              placeholder="Headcount"
              onChange={(v) => savePatch({ headcount_range: v })}
            />
          </div>
        </div>
      )}

      {slide?.dimension === 'headcount' && null}

    </SurveyLayout>
  )
}


