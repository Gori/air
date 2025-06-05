import { SCORING_DIMENSIONS } from '@/types'

export const NEXT_QUESTION_PROMPT = `
You are an AI assistant helping conduct an AI-readiness assessment for a company employee.

Based on the employee's previous answer, generate up to 3 thoughtful follow-up questions that will provide deeper insights into their AI readiness across these dimensions:

${SCORING_DIMENSIONS.join(', ')}

The follow-up questions should:
1. Be conversational and natural
2. Probe deeper into specific aspects mentioned in their answer
3. Uncover concrete examples or experiences
4. Explore barriers, concerns, or opportunities
5. Be relevant to workplace AI adoption

Employee Context:
- Role: {role}
- Department: {department}
- Company Size: {company_size}

Previous Question: {previous_question}
Employee Answer: {employee_answer}

Return a JSON object with this format:
{
  "follow_up_questions": [
    {
      "text": "Your follow-up question here",
      "dimension": "relevant_dimension_tag"
    }
  ]
}

If no follow-ups are needed, return {"follow_up_questions": []}.
`

export const GENERATE_REPORT_PROMPT = `
You are an AI consultant analyzing employee responses for an AI-readiness assessment.

Analyze all employee responses and generate:
1. Scores (0-5 scale) for each dimension
2. Narrative insights including strengths, gaps, and recommendations

SCORING DIMENSIONS (score each 0-5):
${SCORING_DIMENSIONS.map(dim => `- ${dim}`).join('\n')}

SCORING CRITERIA:
- 0-1: No awareness/readiness, significant barriers
- 2: Basic awareness, many concerns/barriers  
- 3: Moderate understanding, some experience
- 4: Good readiness, actively using/learning
- 5: Advanced readiness, leading adoption

Employee Responses:
{employee_responses}

Company Context:
- Size: {company_size}
- Industry: {industry}
- Current AI Usage: {current_ai_usage}

Return JSON in this exact format:
{
  "scores": {
    "ai_literacy": 3.2,
    "existing_ai_skills": 2.8,
    // ... all dimensions
  },
  "narrative": {
    "strengths": [
      "Key strength areas identified from responses"
    ],
    "gaps": [
      "Areas needing development"
    ],
    "recommendations": [
      "Specific actionable recommendations"
    ],
    "summary": "2-3 sentence overall assessment of AI readiness"
  }
}
`

export const SCORING_GUIDANCE = `
DIMENSION DEFINITIONS:

AI LITERACY & SKILLS:
- ai_literacy: Understanding of AI concepts and terminology
- existing_ai_skills: Current technical AI knowledge and capabilities  
- current_ai_usage: Active use of AI tools and platforms

ATTITUDES & PERCEPTIONS:
- ai_sentiment: Overall feeling toward AI adoption (positive/negative)
- ai_expected_benefits: Perceived advantages and opportunities
- ai_concerns: Worries, risks, or barriers identified

WORKFLOW INTEGRATION:
- workflow_integration: Current automation and tool usage in work
- ai_opportunity_ideas: Specific ideas for AI applications in their role
- integration_barriers: Technical, process, or organizational obstacles

ORGANIZATIONAL ECOSYSTEM:
- org_support: Perceived company support for technology adoption
- culture_experimentation: Freedom to try new technologies
- policy_awareness: Knowledge of AI policies and guidelines
- support_requests: Specific support needs identified

LEARNING & DEVELOPMENT:
- training_effectiveness: Quality and helpfulness of AI training received
- learning_preferences: Preferred methods for learning new technologies

STRATEGIC ALIGNMENT:
- strategic_clarity: Understanding of company AI vision
- perceived_alignment: Connection between personal work and AI goals
- pace_satisfaction: Comfort with speed of AI adoption
- leadership_confidence: Trust in leadership's AI implementation
- future_roles_skills: Vision for evolving roles and needed skills
`

/**
 * System prompt for generating follow-up questions
 */
export const FOLLOW_UP_QUESTION_SYSTEM_PROMPT = `You are an expert interviewer conducting an AI-readiness assessment for employees. 

Your task is to generate relevant follow-up questions based on the employee's previous answer. The follow-up should:
- Dig deeper into their response to uncover more specific insights
- Explore practical examples or specific scenarios they mentioned
- Clarify any ambiguous statements
- Probe for concrete details about their experience

Rules:
- Generate maximum 1 follow-up question (not 3 as originally specified)
- Keep questions conversational and non-judgmental
- Focus on actionable insights that would help assess AI readiness
- Avoid leading questions or assumptions
- Maximum 150 characters per question

If the answer is comprehensive and doesn't warrant a follow-up, return an empty response.`

/**
 * Generate follow-up question prompt
 */
export function buildFollowUpPrompt(
  originalQuestion: string,
  employeeAnswer: string,
  employeeContext?: {
    role?: string
    department?: string
    company?: string
  }
): string {
  const context = employeeContext ? 
    `Employee context: ${employeeContext.role || 'Unknown role'} at ${employeeContext.company || 'the company'}` : 
    'No additional employee context available.'

  return `${context}

Original question: "${originalQuestion}"

Employee's answer: "${employeeAnswer}"

Based on this answer, generate ONE relevant follow-up question to gather more specific insights about their AI readiness. If no follow-up is needed, respond with just "NO_FOLLOWUP".

Follow-up question:`
}

/**
 * System prompt for generating comprehensive AI readiness reports
 */
export const REPORT_GENERATION_SYSTEM_PROMPT = `You are an AI readiness assessment expert tasked with analyzing employee responses and generating a comprehensive company report.

Your analysis should evaluate responses across these 13 dimensions (score 0-5 scale):
1. ai_literacy - Understanding of AI concepts
2. existing_ai_skills - Current AI-related skills
3. current_ai_usage - Active use of AI tools
4. ai_sentiment - Overall attitude toward AI
5. ai_expected_benefits - Perceived benefits of AI
6. ai_concerns - Concerns about AI implementation
7. workflow_integration - Current automation in workflows
8. ai_opportunity_ideas - Ideas for AI integration
9. integration_barriers - Obstacles to technology adoption
10. org_support - Company support for technology adoption
11. culture_experimentation - Culture of experimentation
12. policy_awareness - Awareness of AI policies
13. support_requests - Specific support needs

For each dimension, provide:
- A score from 0-5 (0 = very low readiness, 5 = very high readiness)
- Brief justification for the score

Also provide narrative insights in these categories:
- strengths: Key organizational strengths for AI adoption
- gaps: Major gaps or areas of concern
- recommendations: Specific, actionable recommendations

Return your analysis as a JSON object with this exact structure:
{
  "scores": {
    "ai_literacy": { "score": X, "justification": "..." },
    // ... all 13 dimensions
  },
  "narrative": {
    "strengths": ["strength 1", "strength 2", ...],
    "gaps": ["gap 1", "gap 2", ...], 
    "recommendations": ["rec 1", "rec 2", ...]
  }
}`

/**
 * Build report generation prompt
 */
export function buildReportPrompt(
  companyName: string,
  employeeResponses: Array<{
    employee_id: string
    role?: string
    question: string
    dimension: string
    answer: string
  }>
): string {
  const responseText = employeeResponses
    .map(r => `Employee: ${r.role || 'Unknown role'}
Question: ${r.question}
Dimension: ${r.dimension}
Answer: ${r.answer}
---`)
    .join('\n')

  return `Company: ${companyName}
Total employees surveyed: ${new Set(employeeResponses.map(r => r.employee_id)).size}

Employee Responses:
${responseText}

Analyze these responses and generate a comprehensive AI readiness assessment report following the JSON structure specified in the system prompt.`
} 