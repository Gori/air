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
  const [buyerSuggestions, setBuyerSuggestions] = useState<string[]>([])
  const [userSuggestions, setUserSuggestions] = useState<string[]>([])
  // slowdown and reinvest suggestions removed in favor of curated lists
  const [enablerSuggestions, setEnablerSuggestions] = useState<string[]>([])
  const [blockerSuggestions, setBlockerSuggestions] = useState<string[]>([])
  // company name suggestions removed; using manual input instead
  // Readiness flags to avoid infinite loading when suggestions are empty
  const [nicheReady, setNicheReady] = useState(false)
  const [buyerReady, setBuyerReady] = useState(false)
  const [userReady, setUserReady] = useState(false)
  const [enablerReady, setEnablerReady] = useState(false)
  const [blockerReady, setBlockerReady] = useState(false)
  // removed ready flags for slowdowns and names
  // Loading flags to avoid duplicate concurrent fetches
  const [nicheLoading, setNicheLoading] = useState(false)
  const [buyerLoading, setBuyerLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(false)
  const [enablerLoading, setEnablerLoading] = useState(false)
  const [blockerLoading, setBlockerLoading] = useState(false)
  // removed loading flags for slowdowns and names
  const [nicheKey, setNicheKey] = useState<string>('')
  const [buyerKey, setBuyerKey] = useState<string>('')
  const [userKey, setUserKey] = useState<string>('')
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
          { type: 'mc_multi', heading: 'Who uses it?', subheading: 'Who uses it day to day?', dimension: 'user_roles', prompt: 'Select all user roles that fit (chips). “Other” if needed.' },
          { type: 'mc_multi', heading: 'Who buys?', subheading: 'Who usually buys your product?', dimension: 'buyer_roles', prompt: 'Select all buyer roles that fit (chips). “Other” if needed.' },
          { type: 'multi_slider', heading: 'Workflow documentation', subheading: 'Adjust the sliders to best describe your documentation.', dimension: 'workflow_docs', prompt: '' },
          { type: 'multi_slider', heading: 'AI readiness', subheading: 'Rate how true these are today.', dimension: 'ai_readiness', prompt: '' },
          { type: 'mc_multi', heading: 'What slows teams down?', subheading: 'What slows your teams down most?', dimension: 'biggest_slowdown_multi', prompt: 'Select all that apply. “Other” if needed.' },
          { type: 'mc_multi', heading: 'Reinvest time', subheading: 'Where would you reinvest 10h/week?', dimension: 'reinvest', prompt: 'Select up to three priorities. “Other” if needed.' },
          { type: 'mc_single', heading: 'Primary outcome', subheading: 'Which outcome matters most right now?', dimension: 'primary_outcome', prompt: 'Pick the single best-fitting outcome.' },
          { type: 'mc_multi', heading: 'Right time enablers', subheading: 'What would make now the RIGHT time?', dimension: 'change_enablers', prompt: 'Select all enablers that apply. “Other” to add your own.' },
          { type: 'mc_multi', heading: 'Wrong time blockers', subheading: 'What would make now the WRONG time?', dimension: 'change_blockers', prompt: 'Select all blockers that apply. “Other” to add your own.' },
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

      // Buyer roles depend on ctx
      const bk = key(ctx)
      if (currentDim === 'buyer_roles' && data.industry && !buyerLoading && (bk !== buyerKey || !buyerReady)) {
        console.log('[onboarding] refetch buyer_roles', { prevKey: buyerKey, nextKey: bk })
        setBuyerKey(bk)
        setBuyerReady(false)
        setBuyerSuggestions([])
        setBuyerLoading(true)
        try {
          const s = ensureOtherLast(await suggest('buyer_roles', ctx), true)
          const capped = cap(s, 10)
          setBuyerSuggestions(capped)
          setBuyerReady(true)
          console.log('[onboarding] buyer_roles ready', { count: capped.length })
          if (Array.isArray(data.buyer_roles)) {
            const allowed = new Set(capped.concat('Other'))
            const pruned = (data.buyer_roles as string[]).filter((x: string) => allowed.has(x))
            if (pruned.length !== data.buyer_roles.length) void savePatch({ buyer_roles: pruned })
          }
        } finally {
          setBuyerLoading(false)
        }
      }

      // User roles depend on ctx
      const uk = key(ctx)
      if (currentDim === 'user_roles' && data.industry && !userLoading && (uk !== userKey || !userReady)) {
        console.log('[onboarding] refetch user_roles', { prevKey: userKey, nextKey: uk })
        setUserKey(uk)
        setUserReady(false)
        setUserSuggestions([])
        setUserLoading(true)
        try {
          const s = ensureOtherLast(await suggest('user_roles', ctx), true)
          const capped = cap(s, 12)
          setUserSuggestions(capped)
          setUserReady(true)
          console.log('[onboarding] user_roles ready', { count: capped.length })
          if (Array.isArray(data.user_roles)) {
            const allowed = new Set(capped.concat('Other'))
            const pruned = (data.user_roles as string[]).filter((x: string) => allowed.has(x))
            if (pruned.length !== data.user_roles.length) void savePatch({ user_roles: pruned })
          }
        } finally {
          setUserLoading(false)
        }
      }

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
  }, [activeIdx, slides, data.industry, data.niches, data.domain, data.buyer_roles, data.user_roles, data.change_enablers, data.change_blockers, suggest, nicheKey, buyerKey, userKey, enablerKey, blockerKey, nicheReady, buyerReady, userReady, enablerReady, blockerReady, nicheLoading, buyerLoading, userLoading, enablerLoading, blockerLoading, savePatch])

  const slide = slides[activeIdx]
  const current = activeIdx + 1
  const total = slides.length

  const isString = (v: unknown): v is string => typeof v === 'string'
  const isNumber = (v: unknown): v is number => typeof v === 'number'
  const get = (obj: Record<string, unknown>, key: string): unknown => obj[key]
  const workflowDocs = (get(data, 'workflow_docs') as Record<string, unknown> | undefined) || undefined
  const aiReadiness = (get(data, 'ai_readiness') as Record<string, unknown> | undefined) || undefined

  const canContinue = useMemo(() => {
    if (!slide) return false
    if (slide.dimension === 'headcount') return true // no standalone headcount slide anymore
    if (slide.type === 'text') {
      const v = get(data, slide.dimension)
      return isString(v) && v.trim().length > 0
    }
    if (slide.type === 'select_single') {
      const industry = get(data, 'industry')
      return isString(industry) && industry.length > 0
    }
    // inline_template removed
    if (slide.type === 'multi_slider') {
      const wd = get(data, 'workflow_docs') as Record<string, unknown> | undefined
      const documented = wd ? wd['documented'] : undefined
      const importance = wd ? wd['importance'] : undefined
      return isNumber(documented) && isNumber(importance)
    }
    if (slide.type === 'mc_single') {
      const v = get(data, slide.dimension)
      return isString(v) && v.length > 0
    }
    if (slide.type === 'mc_multi') {
      const v = get(data, slide.dimension)
      return Array.isArray(v) && (v as unknown[]).every(isString) && (v as unknown[]).length > 0
    }
    // ranked_list no longer used
    if (slide.type === 'tags_multi') {
      const cn = get(data, 'company_name')
      return isString(cn) && cn.trim().length > 0
    }
    return false
  }, [slide, data])

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
    if (slide.dimension === 'buyer_roles') return buyerSuggestions.length === 0
    if (slide.dimension === 'user_roles') return userSuggestions.length === 0
    if (slide.dimension === 'change_enablers') return enablerSuggestions.length === 0
    if (slide.dimension === 'change_blockers') return blockerSuggestions.length === 0
    // value statement removed
    return false
  }, [slide, isLoading, nicheSuggestions.length, buyerSuggestions.length, userSuggestions.length, enablerSuggestions.length, blockerSuggestions.length])

  // Log entering slides and suspend changes for diagnostics
  useEffect(() => {
    console.log('[onboarding] enter slide', {
      idx: activeIdx,
      dimension: slide?.dimension,
      suspend,
      ready: { nicheReady, buyerReady, userReady, enablerReady, blockerReady }
    })
  }, [activeIdx, slide?.dimension, suspend, nicheReady, buyerReady, userReady, enablerReady, blockerReady])

  // Also log when suspend flips while on a specific slide
  useEffect(() => {
    if (!slide) return
    const reason = (() => {
      if (isLoading) return 'initial-load'
      if (slide.dimension === 'niches' && !nicheReady) return 'niches-not-ready'
      if (slide.dimension === 'buyer_roles' && !buyerReady) return 'buyer-not-ready'
      if (slide.dimension === 'user_roles' && !userReady) return 'user-not-ready'
      if (slide.dimension === 'change_enablers' && !enablerReady) return 'enablers-not-ready'
      if (slide.dimension === 'change_blockers' && !blockerReady) return 'blockers-not-ready'
      // value statement removed
      return 'none'
    })()
    console.log('[onboarding] suspend', { idx: activeIdx, dimension: slide.dimension, suspend, reason })
  }, [suspend, slide, activeIdx, isLoading, nicheReady, buyerReady, userReady, enablerReady, blockerReady])

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
      onClose={() => router.push('/admin/overview')}
      onContinue={next}
      progressPercentage={total > 0 ? (current / total) * 100 : 0}
    >
      {error && (
        <Alert className="mb-6" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      )}

      {slide?.dimension === 'industry' && (
        <ChoiceList
          items={INDUSTRY_OPTIONS.map((t) => ({ id: t, title: t }))}
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

      {slide?.dimension === 'buyer_roles' && (
        <>
          <MultiChoiceList
            items={ensureOtherLast(buyerSuggestions, true)}
            selected={Array.isArray(data.buyer_roles) ? data.buyer_roles : []}
            onToggle={(opt) => {
              const list: string[] = Array.isArray(data.buyer_roles) ? data.buyer_roles : []
              const has = list.includes(opt)
              const next = has ? list.filter((x) => x !== opt) : [...list, opt]
              void savePatch({ buyer_roles: next })
            }}
          />
          {Array.isArray(data.buyer_roles) && data.buyer_roles.includes('Other') && (
            <Textarea
              value={typeof data.buyer_roles_other === 'string' ? data.buyer_roles_other : ''}
              onChange={(e) => savePatch({ buyer_roles_other: e.target.value })}
              placeholder={'Other (optional)'}
              className="min-h-[80px] resize-none mt-4"
              maxLength={140}
            />
          )}
        </>
      )}

      {slide?.dimension === 'user_roles' && (
        <>
          <MultiChoiceList
            items={ensureOtherLast(userSuggestions, true)}
            selected={Array.isArray(data.user_roles) ? data.user_roles : []}
            onToggle={(opt) => {
              const list: string[] = Array.isArray(data.user_roles) ? data.user_roles : []
              const has = list.includes(opt)
              const next = has ? list.filter((x) => x !== opt) : [...list, opt]
              void savePatch({ user_roles: next })
            }}
          />
          {Array.isArray(data.user_roles) && data.user_roles.includes('Other') && (
            <Textarea
              value={typeof data.user_roles_other === 'string' ? data.user_roles_other : ''}
              onChange={(e) => savePatch({ user_roles_other: e.target.value })}
              placeholder={'Other (optional)'}
              className="min-h-[80px] resize-none mt-4"
              maxLength={140}
            />
          )}
        </>
      )}

      {slide?.dimension === 'workflow_docs' && (
        <MultiSlider
          items={[
            {
              id: 'documented',
              prompt: 'How documented are your workflows?',
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
              id: 'importance',
              prompt: 'How important is documentation to your process?',
              minLabel: '✋ Not at all',
              maxLabel: '👩‍🏫 Document first, work later',
              descriptions: [
                'Documentation rarely considered',
                'Occasionally useful when needed',
                'Helpful for onboarding',
                'Important for consistency',
                'Critical for day‑to‑day work',
                'Foundational to how we operate',
              ],
            },
          ]}
          values={{
            documented: isNumber(workflowDocs?.['documented']) ? (workflowDocs?.['documented'] as number) : undefined,
            importance: isNumber(workflowDocs?.['importance']) ? (workflowDocs?.['importance'] as number) : undefined,
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
              prompt: 'Employees understand why AI matters to our strategy',
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
              prompt: 'Employees use AI tools and take learning opportunities',
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
              prompt: 'We share what works with AI on a regular rhythm',
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
              prompt: 'Teams have fast, reliable access to tools and data',
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
          ]}
          values={{
            ai_understanding: isNumber(aiReadiness?.['ai_understanding']) ? (aiReadiness?.['ai_understanding'] as number) : undefined,
            ai_usage_learning: isNumber(aiReadiness?.['ai_usage_learning']) ? (aiReadiness?.['ai_usage_learning'] as number) : undefined,
            ai_sharing_rhythm: isNumber(aiReadiness?.['ai_sharing_rhythm']) ? (aiReadiness?.['ai_sharing_rhythm'] as number) : undefined,
            ai_tools_data_access: isNumber(aiReadiness?.['ai_tools_data_access']) ? (aiReadiness?.['ai_tools_data_access'] as number) : undefined,
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


