import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
    }

    // Get the report by shared slug (no auth needed for public sharing)
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        generated_at,
        scores_json,
        narrative_json,
        companies (
          name
        )
      `)
      .eq('shared_slug', slug)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get report statistics
    const { data: employeeStats, error: statsError } = await supabaseAdmin
      .from('question_instances')
      .select(`
        employee_id,
        answers!inner (
          id
        )
      `)
      .eq('company_id', report.companies?.name || '')
      .not('answers', 'is', null)

    if (statsError) {
      console.error('Error getting employee stats:', statsError)
    }

    // Calculate response statistics
    const uniqueEmployees = new Set(
      employeeStats?.map(stat => stat.employee_id).filter(Boolean) || []
    )
    const totalResponses = uniqueEmployees.size
    const totalAnswers = employeeStats?.length || 0

    // Calculate average score from the scores JSON
    const scores = report.scores_json as Record<string, { score: number; justification: string }>
    const scoreValues = Object.values(scores || {}).map(s => s.score)
    const averageScore = scoreValues.length > 0 
      ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length 
      : 0

    // Format the response
    const formattedReport = {
      id: report.id,
      companyName: report.companies?.name || 'Unknown Company',
      generatedAt: report.generated_at,
      totalEmployees: totalResponses,
      totalResponses: totalResponses,
      averageScore: averageScore,
      scores: scores || {},
      narrative: report.narrative_json as {
        strengths: string[]
        gaps: string[]
        recommendations: string[]
      }
    }

    return NextResponse.json({
      report: formattedReport
    })

  } catch (error) {
    console.error('Shared report fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 