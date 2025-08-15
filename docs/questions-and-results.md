## Questions, Follow-ups, and Results – Implementation Guide (Code-accurate)

This document describes, in plain language and technical detail, how the survey questions, AI follow-ups, and reporting actually work in the codebase today. It is based solely on the current code under `src/` and the generated API routes.

### Audience
- Non-developers: Read the Logic Overview sections for a clear, high-level picture.
- Developers: Read the Technical Details sections for exact endpoints, data shapes, and constraints.

---

## Core Concepts

- **Base question**: A question from the `questions` table (active=true). These are pre-seeded and tied to a dimension/module.
- **Question instance**: A concrete, assigned question for a specific employee. Stored in `question_instances` with an `ordinal` to sequence.
- **Follow-up question**: A single optional AI-generated probe tied to a specific base question answer. Implemented as a `question_instance` with `question_id = null` and `parent_instance` pointing to the base `question_instance`.
- **Answer**: A row in `answers` for a `question_instance`.
- **Report**: Company-level AI-generated scores and narratives saved to `reports` and `report_scores`.

---

## How the Survey Works (Logic Overview)

1. When an employee opens the survey, the app ensures they have a full set of base question instances generated for them.
2. The employee is shown the next unanswered question (by `ordinal`).
3. After the employee submits an answer:
   - The system may ask at most one AI follow-up for that answer, shown immediately.
   - If no follow-up is needed, the survey advances to the next base question.
4. Progress updates as the employee answers questions.
5. When all question instances for the employee are answered, the survey completes.

Important:
- Answers must be non-empty and ≤ 2000 characters.
- Follow-up questions are not part of the base question bank; they are generated on-the-fly and linked to the just-answered question.

---

## How Reporting Works (Logic Overview)

1. A manager clicks Generate Report.
2. The backend gathers employee answers to base questions (not follow-ups) for the company.
3. An AI prompt analyzes these answers and returns:
   - Scores 0–5 for 13 specific dimensions, each with a short justification
   - Narrative bullet lists: strengths, gaps, recommendations
4. The report is saved and can be publicly shared via a unique slug.
5. The share page visualizes scores (bar/radar charts) and narratives.

Notes:
- Only managers can generate reports.
- Follow-up answers are currently excluded from the report analysis (see Technical Details: Report Input).

---

## Data Model (as used by the code)

- `questions`: base questions with `id`, `text`, `module_id`, `dimension`, `active`.
- `question_instances`: concrete assignment per employee (`company_id`, `employee_id`, `question_id | null`, `parent_instance | null`, `ordinal`).
  - Base instances have `question_id != null` and `parent_instance = null`.
  - Follow-ups have `question_id = null` and `parent_instance` set to the base instance id.
- `answers`: one row per answered `question_instance` with `answer_text`.
- `reports`: the saved AI report (`scores_json`, `narrative_json`, `shared_slug`, `html_path` currently unused/empty).
- `report_scores`: flattened per-dimension scores for the report (for simpler querying).
- `prompt_logs`: stored prompts/responses (`source` = `question_selection` or `report_generation`).

The project also defines `modules` and `users/companies` tables; relevant selections join these when needed.

---

## Survey – Technical Details

### Initialization and Next Question
- Endpoint: `POST /api/survey/start`
  - Auth: Clerk; requires a valid user and `company_id` from Clerk public metadata.
  - Steps:
    1. Load employee UUID (`getUserId`) and `company_id` (`getCompanyId`).
    2. If the employee has no `question_instances`, call `initializeEmployeeQuestions(employeeId, companyId)` to create one instance per active base question, with sequential `ordinal` starting at 1.
    3. Return the next unanswered instance by ascending `ordinal` via `getNextQuestion(employeeId)`.
    4. Include progress: `{ current: nextQuestion.ordinal, total: allInstances.length }`.

Implementation references:
- `src/app/api/survey/start/route.ts`
- `initializeEmployeeQuestions` and `getNextQuestion` in `src/lib/supabase/mutations.ts`

### Answer Submission
- Endpoint: `POST /api/survey/answer`
  - Body: `{ questionInstanceId: uuid, answerText: string(1..2000) }`
  - Behavior:
    - Validates auth (`clerkUserId`) and `company_id`.
    - If an answer already exists for the instance, it updates; else it inserts.
  - Returns basic answer confirmation.

Implementation references:
- `src/app/api/survey/answer/route.ts`
- `saveAnswer`, `updateAnswer` in `src/lib/supabase/mutations.ts`

### AI Follow-up (Single Probe)
- Endpoint: `POST /api/ai/nextQuestion`
  - Body: `{ questionInstanceId, originalQuestion, employeeAnswer, currentOrdinal }`
  - Behavior:
    1. Validates auth and `company_id`.
    2. Loads user/company context for prompt decoration (`getUser`, `getCompany`).
    3. Builds a prompt with `buildFollowUpPrompt` and runs `generateAIResponse` with `FOLLOW_UP_QUESTION_SYSTEM_PROMPT`.
    4. If model returns `NO_FOLLOWUP` or empty, responds `{ hasFollowUp: false }`.
    5. Otherwise, logs the prompt/response to `prompt_logs` and creates a new follow-up `question_instance`:
       - `question_id = null`
       - `parent_instance = questionInstanceId`
       - `ordinal = currentOrdinal + 1`
    6. Returns `{ hasFollowUp: true, followUpQuestion: { id, text, ordinal, parentInstance } }`.

Client behavior (`/app/(dashboard)/survey/page.tsx`):
- After saving an answer, the client calls the follow-up endpoint.
- If a follow-up is returned, the UI immediately shows it (using the returned `text`) and updates `progress.current` to the new `ordinal`.
- Otherwise, it calls `/api/survey/start` again to pull the next unanswered base instance.

Important current behavior:
- Follow-up question text is not stored in the database; only the new `question_instance` id is. The client renders the follow-up from the API response data in memory.
- `ordinal` for follow-ups is set to `currentOrdinal + 1`, which may overlap with the next base question’s `ordinal`. The server-side selection of the next question uses `order('ordinal')` without a tiebreaker; the client avoids ambiguity by showing the follow-up immediately from the same response.

Implementation references:
- `src/app/api/ai/nextQuestion/route.ts`
- `src/lib/ai/prompts.ts` (`FOLLOW_UP_QUESTION_SYSTEM_PROMPT`, `buildFollowUpPrompt`)
- `src/lib/ai/client.ts` (`generateAIResponse`)
- `src/app/(dashboard)/survey/page.tsx`

---

## Report Generation – Technical Details

### Who can generate
- Endpoint: `POST /api/ai/generateReport`
- Only users with `role = 'manager'` in `users` can generate.

### Report Input (what is analyzed)
- The backend queries `question_instances` for the company with non-null `answers` and joins `questions` (id, text, dimension) and `users` (full_name, email) for context.
- It then filters to include only rows where `questions` is present:
  - This means only base question answers are analyzed.
  - AI-generated follow-up answers (which have `question_id = null`) are excluded by design.

Implementation references:
- Selection and transform in `src/app/api/ai/generateReport/route.ts` (see the `responses` query and subsequent `.filter(r => r.questions && r.answers?.[0]?.answer_text)`).

### Prompt and Model
- System prompt: `REPORT_GENERATION_SYSTEM_PROMPT`.
- User prompt: built via `buildReportPrompt(company.name, employeeResponses)`; includes employee role/name (if available), question text, dimension tag, and the answer text.
- Model: configured through `AI_MODEL` in `src/lib/ai/client.ts` (defaults to `gpt-5-mini` via `process.env.OPENAI_MODEL` override mechanism).

Returned JSON must validate against:
```
scores: {
  ai_literacy, existing_ai_skills, current_ai_usage,
  ai_sentiment, ai_expected_benefits, ai_concerns,
  workflow_integration, ai_opportunity_ideas, integration_barriers,
  org_support, culture_experimentation, policy_awareness, support_requests
} // each: { score: 0..5, justification: string }
narrative: { strengths: string[], gaps: string[], recommendations: string[] }
```

Notes on dimensions:
- The report expects exactly 13 dimensions as above.
- Elsewhere in the code a broader constant `SCORING_DIMENSIONS` exists; it is used for prompt text in other contexts, but the report validator strictly enforces the 13-field shape shown here.

### Persistence and Logging
- The full JSON (`scores_json`, `narrative_json`) is saved in `reports`, with `shared_slug` generated as a slugified company name plus a timestamp. `html_path` is set to an empty string.
- Individual dimension scores are also saved in `report_scores` for simpler querying.
- The prompt/response pair is saved to `prompt_logs` with `source = 'report_generation'`.
- A “report ready” email is attempted via `lib/email/client.ts` (failure does not abort the request).

### API Response
Returns a `report` object including:
- id, shareSlug, createdAt
- scores (13 dimensions with `{ score, justification }`)
- narrative (arrays of strings)
- summary: totalEmployees (unique respondents), totalResponses, averageScore, completionDate

Implementation reference: `src/app/(dashboard)/report/page.tsx` consumes this response and renders cards, a list of dimension justifications, and actions.

---

## Sharing – Technical Details

### Public Share Endpoint (data API)
- Endpoint: `GET /api/reports/share/[slug]`
  - Finds the `reports` row by `shared_slug`.
  - Returns a formatted `report` object with:
    - companyName, generatedAt
    - averageScore computed from `scores_json`
    - scores and narrative as saved in the report
    - totalResponses and totalEmployees derived from answered `question_instances` (see note below)

Note on totals:
- The current implementation attempts to fetch response counts by filtering `question_instances` where `company_id` equals the company name, not the company UUID. This likely yields zero rows. The charts and scores still render correctly because they come from the saved report JSON.

Implementation references:
- `src/app/api/reports/share/[slug]/route.ts`
- UI: `src/app/share/[slug]/page.tsx` (renders summary, bar/radar charts, and narratives from the API data)

---

## Constraints and Validation

- Auth required on all employee survey endpoints; `company_id` is read from Clerk public metadata in `getCompanyId()`.
- Answer payload: `answerText` must be 1–2000 chars; the API either inserts a new row or updates an existing one for the same `question_instance_id`.
- Follow-up generation: at most one follow-up per answered base question. The sentinel response `NO_FOLLOWUP` skips creating a follow-up instance.
- Report generation restricted to managers; the report JSON must validate against the 13-dimension schema.

---

## What Users See (Non-Technical Summary)

- Employees answer a series of questions. Sometimes, a short follow-up question appears to clarify their response.
- Managers can generate a company report once there are enough answers. The report:
  - Scores readiness across 13 areas (0–5)
  - Explains the scores briefly
  - Lists strengths, gaps, and recommendations
- Managers can share a public link to the report.

---

## Developer Pointers

- Add/edit base questions: `questions` table (only `active: true` are assigned).
- Survey flow: see `src/app/api/survey/start/route.ts`, `src/app/api/survey/answer/route.ts`, and the client `src/app/(dashboard)/survey/page.tsx`.
- Follow-ups: `src/app/api/ai/nextQuestion/route.ts` + `src/lib/ai/prompts.ts` for prompt text; follow-up text is not persisted to DB.
- Report generation: `src/app/api/ai/generateReport/route.ts`; validator enforces 13 dimensions with `{ score, justification }`.
- Sharing: data API in `src/app/api/reports/share/[slug]/route.ts`; public UI in `src/app/share/[slug]/page.tsx`.
- AI client/model: `src/lib/ai/client.ts`. Prompts in `src/lib/ai/prompts.ts`.

---

## Known Behavioral Characteristics (as of current code)

- Only one follow-up question is ever generated per base answer.
- Follow-up answers are excluded from report analysis (only base question answers are used).
- Follow-up texts are not saved to the database; they are returned from the API and displayed immediately by the client.
- Follow-up `ordinal` equals base `ordinal + 1`. This may overlap with the next base question’s `ordinal`; the client shows the follow-up immediately to avoid ambiguity for that step.
- `reports.html_path` is currently unused (empty string). The share page is powered by JSON from the database, not by serving stored HTML.


---

## AI Prompts (Exact Current Text)

These are the current prompt and helper definitions used or available in the codebase.

Follow-up system prompt (used):
```124:139:src/lib/ai/prompts.ts
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
```

Follow-up user prompt builder (used):
```144:166:src/lib/ai/prompts.ts
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
```

Report system prompt (used):
```171:208:src/lib/ai/prompts.ts
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
```

Report user prompt builder (used):
```213:238:src/lib/ai/prompts.ts
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
```

Additional prompts/utilities (present but not used by routes today):

Next-question prompt template:
```3:36:src/lib/ai/prompts.ts
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
```

Report prompt template:
```38:83:src/lib/ai/prompts.ts
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
```

Scoring guidance (reference text shown in code):
```85:119:src/lib/ai/prompts.ts
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
```

---

## Full Base Question Bank (from project spec in this repository)

These are the 20 core base questions and their dimension tags, as documented in `docs/project.md`. These questions are expected to be seeded into the `questions` table (only `active: true` are assigned to employees).

```100:124:docs/project.md
## 5 · Complete Question Bank (20 core questions)

| ID    | Module                    | Dimension tag             | Question text                                                                               |
| ----- | ------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| M1-Q1 | AI Literacy & Skills      | `ai_literacy`             | Could you describe your current understanding of Artificial Intelligence …?                 |
| M1-Q2 |                           | `existing_ai_skills`      | What specific AI-related skills or knowledge have you picked up …?                          |
| M1-Q3 |                           | `current_ai_usage`        | Are you currently using any AI tools or platforms …?                                        |
| M2-Q1 | Attitudes & Perceptions   | `ai_sentiment`            | When you think about AI becoming more common … what's your overall feeling?                 |
| M2-Q2 |                           | `ai_expected_benefits`    | Looking ahead, what potential benefits … do you foresee AI bringing …?                      |
| M2-Q3 |                           | `ai_concerns`             | What are your main concerns or potential risks …?                                           |
| M3-Q1 | Workflows & Opportunities | `workflow_integration`    | Can you describe any ways automation or advanced tools are already part of your workflow …? |
| M3-Q2 |                           | `ai_opportunity_ideas`    | Thinking about your daily tasks, which are most repetitive …?                               |
| M3-Q3 |                           | `integration_barriers`    | If you've tried to integrate new tools … what challenges arose?                             |
| M4-Q1 | Org Ecosystem             | `org_support`             | How would you describe the support the company provides for adopting new technologies …?    |
| M4-Q2 |                           | `culture_experimentation` | Do you feel empowered to experiment with new technologies …?                                |
| M4-Q3 |                           | `policy_awareness`        | Are you aware of any company policies or guidelines on using AI?                            |
| M4-Q4 |                           | `support_requests`        | What specific support would help you adopt AI more confidently?                             |
| M5-Q1 | Learning & Development    | `training_effectiveness`  | Have you received any formal AI training? How helpful was it?                               |
| M5-Q2 |                           | `learning_preferences`    | When learning new tech, what's your preferred style?                                        |
| M6-Q1 | Strategy & Vision         | `strategic_clarity`       | How clearly do you understand the company's AI adoption vision?                             |
| M6-Q2 |                           | `perceived_alignment`     | Do you see a connection between your work and the company's AI goals?                       |
| M6-Q3 |                           | `pace_satisfaction`       | Is the company moving at the right pace on AI?                                              |
| M6-Q4 |                           | `leadership_confidence`   | How confident are you in leadership's ability to implement AI initiatives?                  |
| M6-Q5 |                           | `future_roles_skills`     | Imagine we grow 10× through AI—what roles & skills would we need?                           |
```

---

## Scoring Dimensions (constants referenced in code)

For reference, the project defines a broader list of dimension identifiers in `src/types/index.ts`. Not all of these are required by the report validator (which enforces 13 fields); see report section above.

```162:184:src/types/index.ts
export const SCORING_DIMENSIONS = [
  'ai_literacy',
  'existing_ai_skills', 
  'current_ai_usage',
  'ai_sentiment',
  'ai_expected_benefits',
  'ai_concerns',
  'workflow_integration',
  'ai_opportunity_ideas',
  'integration_barriers',
  'org_support',
  'culture_experimentation',
  'policy_awareness',
  'support_requests',
  'training_effectiveness',
  'learning_preferences',
  'strategic_clarity',
  'perceived_alignment',
  'pace_satisfaction',
  'leadership_confidence',
  'future_roles_skills'
] as const
```

---

## Algorithms (Readable + Developer Notes)

### Survey Initialization
- Plain-language: If an employee has no assigned questions, assign all active base questions to them in order and start at the first unanswered.
- Developer: `initializeEmployeeQuestions(employeeId, companyId)`
  - Fetch `questions where active=true order by id`.
  - Insert `question_instances` for each with sequential `ordinal` starting at 1.

```69:99:src/lib/supabase/mutations.ts
export async function initializeEmployeeQuestions(employeeId: string, companyId: string) {
  // Get all active questions
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('questions')
    .select('id')
    .eq('active', true)
    .order('id')

  if (questionsError) throw questionsError

  if (!questions || questions.length === 0) {
    throw new Error('No active questions found')
  }

  // Create question instances for each question
  const instances = questions.map((question: { id: number }, index: number) => ({
    employee_id: employeeId,
    company_id: companyId,
    question_id: question.id,
    ordinal: index + 1,
    parent_instance: null
  }))

  const { data: questionInstances, error } = await supabaseAdmin
    .from('question_instances')
    .insert(instances)
    .select()

  if (error) throw error
  return questionInstances
}
```

### Next Unanswered Question
- Plain-language: Pick the earliest `ordinal` question instance without an answer.
- Developer: `getNextQuestion(employeeId)`

```104:120:src/lib/supabase/mutations.ts
export async function getNextQuestion(employeeId: string) {
  // Get all question instances for employee that don't have answers
  const { data: unansweredInstances, error } = await supabaseAdmin
    .from('question_instances')
    .select(`
      *,
      questions (*),
      answers (id)
    `)
    .eq('employee_id', employeeId)
    .is('answers.id', null)
    .order('ordinal')
    .limit(1)

  if (error) throw error
  return unansweredInstances?.[0] || null
}
```

### Answer Submission
- Plain-language: Validate the text, then upsert an answer for that `question_instance`.
- Developer: `POST /api/survey/answer` calls `getAnswersForQuestionInstances` → `updateAnswer` or `saveAnswer`.

```13:31:src/app/api/survey/answer/route.ts
export async function POST(request: NextRequest) {
  try {
    // Get authentication details
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = await getCompanyId()
    if (!companyId) {
      return NextResponse.json({ error: 'No company association found' }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const result = answerSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: result.error.errors 
      }, { status: 400 })
    }
```

### Follow-up Generation (Single Probe)
- Plain-language: After an answer, the system may ask one short follow-up to clarify; otherwise it proceeds.
- Developer: `POST /api/ai/nextQuestion`
  - Build prompt (`buildFollowUpPrompt`), call model with `FOLLOW_UP_QUESTION_SYSTEM_PROMPT`.
  - If response is `NO_FOLLOWUP` or empty → `{ hasFollowUp: false }`.
  - Else log to `prompt_logs`, create a new `question_instances` row with `question_id=null`, `parent_instance` set, `ordinal = currentOrdinal + 1`.

```60:71:src/app/api/ai/nextQuestion/route.ts
// Generate follow-up question using AI
const prompt = buildFollowUpPrompt(originalQuestion, employeeAnswer, employeeContext)
const aiResponse = await generateAIResponse(prompt, FOLLOW_UP_QUESTION_SYSTEM_PROMPT)

// Check if AI determined no follow-up is needed
if (aiResponse.content.trim() === 'NO_FOLLOWUP' || aiResponse.content.trim().length === 0) {
  return NextResponse.json({
    hasFollowUp: false,
    message: 'No follow-up question needed'
  })
}
```

### Report Generation
- Plain-language: Only managers can generate a report. The system analyzes base-question answers to produce 13 scores with justifications and narrative lists.
- Developer: `POST /api/ai/generateReport`
  1. Check user role is `manager`.
  2. Query `question_instances` with non-null `answers` and joined `questions` + `users`.
  3. Filter to include only rows with `questions` (base questions only).
  4. Build prompt (`buildReportPrompt`) + `REPORT_GENERATION_SYSTEM_PROMPT`.
  5. Parse and validate AI JSON (`zod`) with 13 dimensions.
  6. Save `reports`, write `report_scores`, log to `prompt_logs`, attempt email, compute summary, return.

```132:147:src/app/api/ai/generateReport/route.ts
// Generate the report using AI
const prompt = buildReportPrompt(company.name, employeeResponses)
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
```

### Sharing
- Plain-language: A public slug lets anyone view the saved report JSON rendered into charts and lists.
- Developer: `GET /api/reports/share/[slug]` fetches the report by `shared_slug` and returns a formatted object for the share page.


