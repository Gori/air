'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
// icons removed

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
  usageSummary?: Record<string, Record<string, number>>
}

export default function ReportPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load existing canonical report
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/reports/current')
        if (res.ok) {
          const data = await res.json()
          if (data?.report) setReport(data.report)
        }
      } finally {
        setIsLoading(false)
      }
    }
    void load()
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
        <Card>
          <CardContent className="p-8 text-center">
            <p >Loading reports...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container">
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Generation Section */}
      {!report && (
        <Card className="mb-8">
          <CardHeader className="border-b border-neutral-200">
            <CardTitle className="flex items-center">Generate New Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p >
                Create a comprehensive AI readiness assessment report based on employee survey responses.
                The report includes scoring across 13 dimensions and actionable recommendations.
              </p>

              <div className="flex space-x-4">
                <Button
                  variant="dark"
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="flex items-center"
                >
                  {isGenerating ? (
                    <>Generating Report...</>
                  ) : (
                    <>Generate Report</>
                  )}
                </Button>
              </div>

              {isGenerating && (
                <div className="mt-4 p-4  rounded-lg  border">
                  <div className="flex items-center mb-2">Analyzing survey responses...</div>
                  <p >
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
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center ">Report Generated Successfully</CardTitle>
                  <p className=" mt-1">
                    Generated on {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="dark" onClick={shareReport}>Share</Button>
                  <Button variant="secondary">Download</Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle >Employees Surveyed</CardTitle>
              </CardHeader>
              <CardContent>
                <div >{report.summary.totalEmployees}</div>
                <p >{report.summary.totalResponses} total responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle >Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div >{report.summary.averageScore}/5.0</div>
                <Progress value={report.summary.averageScore * 20} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle >Readiness Level</CardTitle>
                <Badge variant={
                  report.summary.averageScore >= 4 ? "default" :
                    report.summary.averageScore >= 3 ? "secondary" : "destructive"
                }>
                  {report.summary.averageScore >= 4 ? "High" :
                    report.summary.averageScore >= 3 ? "Medium" : "Low"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p >
                  Based on 13 assessment dimensions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-neutral-200 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle >Report Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div>Complete</div>
                <p >Ready for sharing</p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Summary */}
          {report.usageSummary && (
            <Card>
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>AI Tool Usage Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(report.usageSummary).map(([name, counts]) => (
                    <div key={name} className="space-y-2">
                      <div className="font-medium">{name}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          'Never tried',
                          "I've tried it",
                          'I use it regularly',
                          "I'm dependant on it"
                        ].map(label => (
                          <div key={label} className="flex items-center justify-between rounded border px-2 py-1">
                            <span className="text-sm">{label}</span>
                            <Badge variant="secondary">{counts[label] ?? 0}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dimension Scores */}
          <Card>
            <CardHeader className="border-b border-neutral-200">
              <CardTitle>Assessment Dimensions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.scores).map(([dimension, data]) => (
                  <div key={dimension} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="  capitalize">
                        {dimension.replace(/_/g, ' ')}
                      </span>
                      <span >{data.score}/5</span>
                    </div>
                    <Progress value={data.score * 20} className="h-2" />
                    <p >{data.justification}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Narrative Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="border-b border-neutral-200">
                <CardTitle>Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.narrative.strengths.map((strength, index) => (
                    <li key={index} >
                      • {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-neutral-200">
                <CardTitle >Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.narrative.gaps.map((gap, index) => (
                    <li key={index} >
                      • {gap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b border-neutral-200">
                <CardTitle >Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.narrative.recommendations.map((rec, index) => (
                    <li key={index} >
                      • {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardHeader className="border-b border-neutral-200">
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p >
                  Your AI readiness report is complete and ready to share with stakeholders.
                  Use the insights to guide your organization&apos;s AI adoption strategy.
                </p>
                <div className="flex space-x-4">
                  <Button onClick={generateReport} disabled={isGenerating}>Generate New Report</Button>
                  <Button variant="outline" onClick={shareReport}>Share with Team</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 