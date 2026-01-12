import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit, getClientIdentifier, rateLimiters } from '@/lib/utils/rate-limit'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Apply rate limiting to prevent enumeration attacks
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(`shared-report:${clientId}`, rateLimiters.strict)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
    }

    // Validate slug format (should be alphanumeric with hyphens, reasonable length)
    if (!/^[a-zA-Z0-9-]{8,64}$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })
    }

    // Log access attempt for monitoring
    console.log(`[shared-report] Access attempt for slug: ${slug.substring(0, 8)}... from ${clientId}`)

    // Get the report by shared slug (no auth needed for public sharing)
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select(`
        id,
        company_id,
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
      .eq('company_id', report.company_id as string)
      .not('answers', 'is', null)

    if (statsError) {
      console.error('Error getting employee stats:', statsError)
    }

    // Calculate response statistics
    const uniqueEmployees = new Set(
      employeeStats?.map(stat => stat.employee_id).filter(Boolean) || []
    )
    const totalResponses = uniqueEmployees.size

    // Calculate average score from the scores JSON
    const scores = report.scores_json as Record<string, { score: number; justification: string }>
    const scoreValues = Object.values(scores || {}).map(s => s.score)
    const averageScore = scoreValues.length > 0 
      ? scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length 
      : 0

    // Build usage summary from answers of usage_* dimensions
    const { data: usageResponses } = await supabaseAdmin
      .from('question_instances')
      .select(`
        questions (
          dimension
        ),
        answers (
          answer_text
        )
      `)
      .eq('company_id', report.company_id as string)
      .not('answers', 'is', null)

    type UsageItem = { name: string, level: string }
    const usageRaw = (usageResponses || [])
      .filter(r => (r.questions?.dimension || '').startsWith('usage_') && r.answers?.[0]?.answer_text)
      .map(r => {
        try {
          const parsed = JSON.parse(r.answers![0].answer_text as unknown as string)
          if (parsed?.type === 'usage_matrix' && Array.isArray(parsed.selections)) {
            return parsed.selections as UsageItem[]
          }
        } catch {}
        return [] as UsageItem[]
      })
      .flat()

    const usageSummary: Record<string, Record<string, number>> = {}
    for (const item of usageRaw) {
      if (!usageSummary[item.name]) usageSummary[item.name] = {
        'Never tried': 0,
        "I've tried it": 0,
        'I use it regularly': 0,
        "I'm dependant on it": 0
      }
      if (usageSummary[item.name][item.level] !== undefined) {
        usageSummary[item.name][item.level] += 1
      }
    }

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
      },
      usageSummary
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