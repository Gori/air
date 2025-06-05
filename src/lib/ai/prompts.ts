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