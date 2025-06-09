'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart } from '@/components/charts/bar-chart'
import { RadarChart } from '@/components/charts/radar-chart'
import { 
  TrendingUp, 
  Users, 
  Calendar,
  Building,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ReportData {
  id: string
  companyName: string
  generatedAt: string
  totalEmployees: number
  totalResponses: number
  averageScore: number
  scores: Record<string, { score: number; justification: string }>
  narrative: {
    strengths: string[]
    gaps: string[]
    recommendations: string[]
  }
}

interface SharePageProps {
  params: Promise<{ slug: string }>
}

export default function SharePage({ params }: SharePageProps) {
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!resolvedParams?.slug) return

    const loadReport = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/reports/share/${resolvedParams.slug}`)
        
        if (response.status === 404) {
          notFound()
        }
        
        if (!response.ok) {
          throw new Error('Failed to load report')
        }

        const data = await response.json()
        setReport(data.report)

      } catch (error) {
        console.error('Report load error:', error)
        setError('Failed to load report')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [resolvedParams])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Report Not Available
          </h1>
          <p className="text-gray-600">
            {error || 'The requested report could not be found or is no longer available.'}
          </p>
        </div>
      </div>
    )
  }

  const dimensionScores = Object.entries(report.scores).map(([dimension, data]) => ({
    dimension: dimension.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score: data.score,
    justification: data.justification
  }))

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-100'
    if (score >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'Strong'
    if (score >= 3) return 'Moderate'
    if (score >= 2) return 'Developing'
    return 'Needs Focus'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Readiness Assessment Report
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {report.companyName}
            </p>
            <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Generated {new Date(report.generatedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {report.totalResponses} responses
              </div>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {report.averageScore.toFixed(1)}/5.0 average
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{report.totalResponses}</div>
              <div className="text-sm text-gray-600">Employee Responses</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{report.averageScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {dimensionScores.filter(d => d.score >= 4).length}
              </div>
              <div className="text-sm text-gray-600">Strong Areas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {dimensionScores.filter(d => d.score < 3).length}
              </div>
              <div className="text-sm text-gray-600">Focus Areas</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Dimension Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={dimensionScores} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Readiness Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <RadarChart data={dimensionScores} />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dimensionScores.map((item, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.dimension}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getScoreColor(item.score)}>
                        {getScoreLabel(item.score)}
                      </Badge>
                      <span className="font-bold text-lg">{item.score.toFixed(1)}</span>
                    </div>
                  </div>
                  <Progress value={(item.score / 5) * 100} className="mb-2" />
                  <p className="text-sm text-gray-600">{item.justification}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Narrative Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.narrative.strengths.map((strength, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Areas for Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.narrative.gaps.map((gap, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {gap}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <TrendingUp className="h-5 w-5 mr-2" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.narrative.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-sm text-gray-500">
            This report was generated using AI analysis of employee survey responses.
            <br />
            Powered by AIR - AI Readiness Assessment Platform
          </p>
        </div>
      </div>
    </div>
  )
} 