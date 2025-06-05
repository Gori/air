'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Download, 
  Share, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface ReportSummary {
  totalEmployees: number
  totalResponses: number
  averageScore: number
  completionDate: string
}

interface ReportData {
  id: string
  shareSlug: string
  createdAt: string
  scores: Record<string, { score: number; justification: string }>
  narrative: {
    strengths: string[]
    gaps: string[]
    recommendations: string[]
  }
  summary: ReportSummary
}

export default function ReportPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load existing reports (in a real app, this would fetch from an API)
  useEffect(() => {
    setIsLoading(false)
  }, [])

  const generateReport = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const response = await fetch('/api/ai/generateReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeAllEmployees: true })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      const data = await response.json()
      setReport(data.report)

    } catch (error) {
      console.error('Report generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const shareReport = () => {
    if (report?.shareSlug) {
      const shareUrl = `${window.location.origin}/share/${report.shareSlug}`
      navigator.clipboard.writeText(shareUrl)
      // In a real app, you'd show a toast notification here
      alert('Share URL copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          AI Readiness Reports
        </h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive AI readiness assessments for your organization.
        </p>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Generation Section */}
      {!report && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Generate New Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Create a comprehensive AI readiness assessment report based on employee survey responses. 
                The report includes scoring across 13 dimensions and actionable recommendations.
              </p>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={generateReport} 
                  disabled={isGenerating}
                  className="flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>

              {isGenerating && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-blue-200 border">
                  <div className="flex items-center mb-2">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Analyzing survey responses...
                    </span>
                  </div>
                  <p className="text-sm text-blue-600">
                    This may take 30-60 seconds as we process all employee responses and generate insights.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      {report && (
        <div className="space-y-8">
          {/* Report Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-green-700">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Report Generated Successfully
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Generated on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={shareReport}>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employees Surveyed</CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.totalEmployees}</div>
                <p className="text-xs text-gray-600">{report.summary.totalResponses} total responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.summary.averageScore}/5.0</div>
                <Progress value={report.summary.averageScore * 20} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Readiness Level</CardTitle>
                <Badge variant={
                  report.summary.averageScore >= 4 ? "default" :
                  report.summary.averageScore >= 3 ? "secondary" : "destructive"
                }>
                  {report.summary.averageScore >= 4 ? "High" :
                   report.summary.averageScore >= 3 ? "Medium" : "Low"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Based on 13 assessment dimensions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Report Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-green-700">Complete</div>
                <p className="text-xs text-gray-600">Ready for sharing</p>
              </CardContent>
            </Card>
          </div>

          {/* Dimension Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Dimensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.scores).map(([dimension, data]) => (
                  <div key={dimension} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {dimension.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-bold">{data.score}/5</span>
                    </div>
                    <Progress value={data.score * 20} className="h-2" />
                    <p className="text-xs text-gray-600">{data.justification}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Narrative Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.narrative.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-orange-700">Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.narrative.gaps.map((gap, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {gap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.narrative.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your AI readiness report is complete and ready to share with stakeholders. 
                  Use the insights to guide your organization's AI adoption strategy.
                </p>
                <div className="flex space-x-4">
                  <Button onClick={() => setReport(null)}>
                    Generate New Report
                  </Button>
                  <Button variant="outline" onClick={shareReport}>
                    <Share className="mr-2 h-4 w-4" />
                    Share with Team
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 