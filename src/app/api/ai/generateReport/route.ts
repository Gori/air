import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCompanyId } from '@/lib/supabase/server'
import { generateAIResponse } from '@/lib/ai/client'
import {
  REPORT_GENERATION_SYSTEM_PROMPT,
  buildReportPrompt
} from '@/lib/ai/prompts'
import { getCompany, getUser } from '@/lib/supabase/queries'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/client'
import { z } from 'zod'
import { ApiErrors } from '@/lib/utils/api-response'

// Validation schema for report generation request
const reportRequestSchema = z.object({
  includeAllEmployees: z.boolean().optional().default(true)
})

// Expected structure of AI-generated report
const reportScoreSchema = z.object({
  score: z.number().min(0).max(5),
  justification: z.string()
})

const reportSchema = z.object({
  scores: z.object({
    ai_literacy: reportScoreSchema,
    existing_ai_skills: reportScoreSchema,
    current_ai_usage: reportScoreSchema,
    ai_sentiment: reportScoreSchema,
    ai_expected_benefits: reportScoreSchema,
    ai_concerns: reportScoreSchema,
    workflow_integration: reportScoreSchema,
    ai_opportunity_ideas: reportScoreSchema,
    integration_barriers: reportScoreSchema,
    org_support: reportScoreSchema,
    culture_experimentation: reportScoreSchema,
    policy_awareness: reportScoreSchema,
    support_requests: reportScoreSchema
  }),
  narrative: z.object({
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    recommendations: z.array(z.string())
  })
})

export async function POST(request: NextRequest) {
  try {
    // Get authentication details
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return ApiErrors.unauthorized()
    }

    const companyId = await getCompanyId()
    if (!companyId) {
      return ApiErrors.noCompany()
    }

    // Verify user is a manager
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', clerkUserId)
      .single()

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can generate reports' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { includeAllEmployees } = reportRequestSchema.parse(body)
    void includeAllEmployees

    // Get company information
    const company = await getCompany(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get all employee responses with answers
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('question_instances')
      .select(`
        id,
        employee_id,
        questions (
          id,
          text,
          dimension
        ),
        answers (
          answer_text
        ),
        users (
          full_name,
          email
        )
      `)
      .eq('company_id', companyId)
      .not('answers', 'is', null)

    if (responsesError) {
      throw responsesError
    }

    if (!responses || responses.length === 0) {
      return NextResponse.json({ 
        error: 'No survey responses found. Employees must complete the survey first.' 
      }, { status: 400 })
    }

    // Transform responses for AI analysis
    const employeeResponses = responses
      .filter(r => r.questions && r.answers?.[0]?.answer_text)
      .map(r => ({
        employee_id: r.employee_id || '',
        role: r.users?.full_name || 'Employee',
        question: r.questions!.text,
        dimension: r.questions!.dimension || 'general',
        answer: r.answers![0].answer_text
      }))

    if (employeeResponses.length === 0) {
      return NextResponse.json({ 
        error: 'No valid survey responses found for analysis.' 
      }, { status: 400 })
    }

    // Helper: exclude answers marked prefer-not (for structured JSON answers)
    const isPreferNot = (answer: string): boolean => {
      try {
        const parsed = JSON.parse(answer)
        if (parsed && typeof parsed === 'object') {
          if (parsed.type === 'scale') {
            return parsed.preferNot === true || parsed.value == null
          }
          if (parsed.type === 'mc_single' || parsed.type === 'mc_multi') {
            return parsed.preferNot === true
          }
        }
      } catch {}
      return false
    }

    // Generate the report using AI (exclude usage_* and prefer-not answers from scoring input)
    const scoringInputs = employeeResponses.filter(r => {
      const dim = (r.dimension || '')
      if (dim.startsWith('usage_')) return false
      return !isPreferNot(r.answer)
    })
    const prompt = buildReportPrompt(company.name, scoringInputs)
    const aiResponse = await generateAIResponse(prompt, REPORT_GENERATION_SYSTEM_PROMPT)

    // Parse and validate the AI response
    let parsedReport
    try {
      const reportData = JSON.parse(aiResponse.content)
      parsedReport = reportSchema.parse(reportData)
    } catch (parseError) {
      console.error('AI response parsing error:', parseError)
      console.error('Raw AI response:', aiResponse.content)
      return NextResponse.json({ 
        error: 'Failed to parse AI-generated report. Please try again.' 
      }, { status: 500 })
    }

    // Generate a unique slug for sharing
    const shareSlug = `${company.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`

    // Enforce canonical report: delete existing then insert fresh
    const { data: existing } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle()
    if (existing?.id) {
      await supabaseAdmin.from('report_scores').delete().eq('report_id', existing.id)
      await supabaseAdmin.from('reports').delete().eq('id', existing.id)
    }

    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        company_id: companyId,
        created_by: clerkUserId,
        generated_at: new Date().toISOString(),
        scores_json: parsedReport.scores,
        narrative_json: parsedReport.narrative,
        html_path: '', // Will be generated separately
        shared_slug: shareSlug
      })
      .select()
      .single()

    if (reportError) {
      throw reportError
    }

    // Save individual dimension scores for easier querying
    const scoreEntries = Object.entries(parsedReport.scores).map(([dimension, scoreData]) => ({
      report_id: report.id,
      dimension,
      score: scoreData.score
    }))

    const { error: scoresError } = await supabaseAdmin
      .from('report_scores')
      .insert(scoreEntries)

    if (scoresError) {
      console.error('Error saving report scores:', scoresError)
      // Continue anyway - scores are saved in the main report JSON
    }

    // Log the AI prompt and response
    await supabaseAdmin
      .from('prompt_logs')
      .insert({
        company_id: companyId,
        employee_id: clerkUserId,
        source: 'report_generation',
        model: aiResponse.model,
        prompt,
        response: aiResponse.content
      })

    // Calculate summary statistics
    const totalEmployees = new Set(employeeResponses.map(r => r.employee_id)).size
    const avgScore = Object.values(parsedReport.scores)
      .reduce((sum, score) => sum + score.score, 0) / Object.keys(parsedReport.scores).length

    // Aggregate usage matrix (usage_* dimensions): parse JSON answers and tally counts per level
    type UsageItem = { name: string, level: string }
    const usageRaw = responses
      .filter(r => (r.questions?.dimension || '').startsWith('usage_') && r.answers?.[0]?.answer_text)
      .map(r => {
        try {
          const parsed = JSON.parse(r.answers![0].answer_text)
          if (parsed?.type === 'usage_matrix' && Array.isArray(parsed.selections)) {
            return parsed.selections as UsageItem[]
          }
        } catch {}
        return [] as UsageItem[]
      })
      .flat()

    const usageSummary: Record<string, Record<string, number>> = {}
    const normalizeLevel = (level: string): string => {
      if (level === "I'm dependant on it") return "I'm dependent on it"
      return level
    }
    for (const item of usageRaw) {
      const level = normalizeLevel(item.level)
      if (!usageSummary[item.name]) usageSummary[item.name] = {
        'Not applicable to my role': 0,
        'Never tried': 0,
        "I've tried it": 0,
        'I use it regularly': 0,
        "I'm dependent on it": 0
      }
      if (usageSummary[item.name][level] !== undefined) {
        usageSummary[item.name][level] += 1
      }
    }

    // Send email notification to the manager
    try {
      const manager = await getUser(clerkUserId)
      if (manager?.email) {
        await sendEmail({
          to: manager.email,
          subject: `AI Readiness Report Ready - ${company.name}`,
          template: 'report-ready',
          data: {
            managerName: manager.full_name || 'Manager',
            companyName: company.name,
            reportUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/report`,
            shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${report.shared_slug}`
          }
        })
      }
    } catch (emailError) {
      console.error('Failed to send report ready email:', emailError)
      // Don't fail the report generation if email fails
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        shareSlug: report.shared_slug,
        createdAt: report.generated_at,
        scores: parsedReport.scores,
        narrative: parsedReport.narrative,
        summary: {
          totalEmployees,
          totalResponses: employeeResponses.length,
          averageScore: Math.round(avgScore * 10) / 10,
          completionDate: new Date().toISOString()
        },
        usageSummary
      },
      tokenUsage: aiResponse.usage
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return ApiErrors.internal('Failed to generate report. Please try again.')
  }
} 