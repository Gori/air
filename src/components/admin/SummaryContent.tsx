'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SummaryV2 } from '@/types/summary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SummaryBarChart } from '@/components/charts/summary-bar-chart'
import { SummaryRadarChart } from '@/components/charts/summary-radar-chart'
import {
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Lightbulb,
  Activity,
  Zap,
  Shield,
  Building2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react'

interface SummaryContentProps {
  summary: SummaryV2
  companyId: string
}

export function SummaryContent({ summary }: SummaryContentProps) {
  const router = useRouter()
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = async () => {
    if (!confirm('This will regenerate the summary from scratch. Continue?')) {
      return
    }

    setIsRegenerating(true)
    try {
      const response = await fetch('/api/admin/summary/generate', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate')
      }

      const reader = response.body?.getReader()
      if (reader) {
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
      }

      router.refresh()
    } catch (error) {
      console.error('Regeneration error:', error)
      alert('Failed to regenerate summary. Please try again.')
    } finally {
      setIsRegenerating(false)
    }
  }

  const foundationsData = [
    { dimension: 'Documentation', score: summary.foundations_check.documentation },
    { dimension: 'Data Quality', score: summary.foundations_check.data_quality },
    { dimension: 'Tool Integration', score: summary.foundations_check.tool_integration },
  ]

  const cultureData = Object.entries(summary.culture_boosters).map(([key, value]) => ({
    dimension: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    score: value,
  }))

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Regenerate Button */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div className="flex-1" />
        <Button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          variant="outline"
          className="gap-2"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate (Beta)
            </>
          )}
        </Button>
      </div>

      {/* 1. Headline Takeaway - Hero Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Target className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                Where You Stand
              </h2>
              <p className="text-2xl font-medium leading-relaxed text-neutral-900">
                {summary.headline_takeaway}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2 & 3. Top 3 AI Bets + Why These 3 */}
      <div className="grid md:grid-cols-3 gap-6">
        {summary.top_3_bets.map((bet, index) => {
          const why = summary.why_these_3[index]
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Bet #{index + 1}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{bet.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base text-neutral-600">{bet.description}</p>
                {why && (
                  <div className="pt-3 border-t border-neutral-100">
                    <p className="text-sm font-medium text-neutral-500 mb-1">Why this bet:</p>
                    <p className="text-base text-neutral-700">{why.rationale}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 4. Primary Outcome Focus */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <CardTitle>Primary Outcome Focus</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{summary.primary_outcome_focus}</p>
        </CardContent>
      </Card>

      {/* 5. What We&apos;ll Measure */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle>What We&apos;ll Measure</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {summary.metrics_to_measure.map((metric, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-base">{metric}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6. Quick Wins vs Longer Plays */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              <CardTitle className="text-green-900">Quick Wins (This Quarter)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.quick_wins_vs_longer_plays.quick_wins.map((win, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span className="text-base">{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-900">Longer Plays (Next Phase)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.quick_wins_vs_longer_plays.longer_plays.map((play, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span className="text-base">{play}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 7. Time Allocation - Bar Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        <SummaryBarChart
          title="Current Time Allocation"
          data={summary.time_allocation.current}
          color="#ef4444"
        />
        <SummaryBarChart
          title="Proposed Time Allocation"
          data={summary.time_allocation.proposed}
          color="#10b981"
        />
      </div>

      {/* 8. Team Slowdowns */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <CardTitle>What Slows Teams Down</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.team_slowdowns.map((slowdown, index) => (
              <div key={index} className="flex items-start justify-between gap-4 p-3 bg-neutral-50 rounded-lg">
                <span className="text-base flex-1">{slowdown.issue}</span>
                <Badge variant="outline" className="bg-white flex-shrink-0">
                  {slowdown.frequency}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 9 & 10. Foundations + Culture - Radar Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <SummaryRadarChart
          title="Foundations Check"
          data={foundationsData}
          color="#3b82f6"
        />
        <SummaryRadarChart
          title="Culture Boosters"
          data={cultureData}
          color="#8b5cf6"
        />
      </div>

      {/* 11 & 12. Timing Enablers & Cautions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <CardTitle className="text-green-900">Right-Now Timing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.right_now_timing.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-900">Cautions to Watch</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.cautions.map((caution, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-base font-medium text-amber-900">{caution.blocker}</p>
                  <p className="text-sm text-neutral-600 pl-3 border-l-2 border-amber-200">
                    {caution.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 13 & 14. Context Lenses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <CardTitle>Industry Lens</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{summary.industry_lens}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <CardTitle>Team Size Lens</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{summary.team_size_lens}</p>
          </CardContent>
        </Card>
      </div>

      {/* 15. First 30 Days */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-blue-900">First 30 Days Checklist</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {summary.first_30_days.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold text-lg">□</span>
                <span className="text-base">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 16. Who to Involve */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <CardTitle>Who to Involve</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {summary.who_to_involve.map((person, index) => (
              <div key={index} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="font-medium text-base text-purple-900">{person.function}</p>
                <p className="text-sm text-neutral-600 mt-1">{person.role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 17 & 18. Assumptions & Open Questions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <CardTitle>Assumptions We Made</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.assumptions.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 text-sm mt-1">▸</span>
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <CardTitle>Open Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.open_questions.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">?</span>
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

