## AIR Survey v2 — Narrative Flow and Implementation Spec (Single Document)

This is the end‑to‑end specification for the AIR employee survey. It is designed as a clean, linear sequence of single‑purpose slides with autosave and low cognitive load. Every instruction required to implement the flow is included here.

Key rules
- One screen = one slide. Next/Back available everywhere (except the final End screen). Header shows a tiny “X of 28”.
- Autosave after every submission. Text slides show a reassurance note about not pasting sensitive data.
- Text questions are skippable. Choice/scale/matrix slides are required.
- Usage categories always appear as: Intro slide → Matrix slide (same four‑point scale).
- A thank‑you slide asks for a 1–5 service rating that is saved to a separate store (not mixed with survey answers) with an optional 140‑character comment.
 - Sensitive opinion/MC slides include a “Prefer not to say” option (see slide specs).

Scale used in all matrices
- Never tried
- I've tried it
- I use it regularly
- I'm dependent on it

---

### Slide‑by‑slide flow (28 slides)

1) Welcome — Overview
- Type: Welcome
- Copy: “Thanks for taking the AI Readiness assessment. It takes 7–10 minutes. Your input helps us learn what’s working, where to support, and how to move at the right pace.”

2) Contact — Job title
- Type: Short Text (required)
- Prompt: “What’s your job title?”

3) Attitude toward AI
- Type: Opinion scale (1–5) + optional text
- Prompt: “Overall, how do you feel about AI becoming more common at work?”
- Optional text: “What makes you feel that way? (optional)”

4) Intro — Research & Knowledge (what this section covers)
- Type: Statement (Intro)
- Copy: “AI can help you find and understand information quickly. Common uses include asking questions about long documents, turning meetings into notes, translating, and getting coding help. Choose what matches your real use—there are no right or wrong answers.”
- Examples: Perplexity, Elicit, Notion AI, ChatGPT, Claude

5) Matrix — Research & Knowledge (required) 
- Type: Matrix
- Items with explanations:
  - Summarizing/synthesizing — Condense long docs, pages, or threads into key takeaways and actions.
  - Research support — Discover sources, compare viewpoints, draft outlines or literature reviews.
  - Translation/transcription — Translate languages, transcribe audio or video, generate subtitles.
  - Code generation & debugging — Suggest code, tests, refactors, and diagnostics.
  - Personalized learning — Generate short lessons, examples, and quizzes for your level.

6) Expected benefits
- Type: Multiple choice (multi) + optional text
- Options: Faster work; Fewer repetitive tasks; Better quality; New ideas; Better decisions; Cost savings; Other
- Optional text: “Add detail or examples (optional).”

7) Human‑led work — what should stay human (and roughly how much)
- Type: Opinion scale (1–5) + optional text
- Prompt: “Thinking about your role, how much of your work requires distinctly human judgment and should remain human‑led?”
- Scale guidance: 1 = almost none (0–20%), 2 = some (20–40%), 3 = about half (40–60%), 4 = most (60–80%), 5 = nearly all (80–100%)
- Optional text (skippable): “Which tasks should stay human‑led, and why? (optional)”
- Reassurance: “Please don’t paste sensitive personal, customer, or confidential data.”
- Prefer not to say: Available as an alternative to the scale (selectable chip).

8) Intro — Business & Productivity (what this section covers)
- Type: Statement (Intro)
- Copy: “This section looks at day‑to‑day efficiency. AI can tidy inboxes, summarize meetings, draft documents, analyze trends, and automate routine steps between apps. Think about what actually saves you time.”
- Examples: Microsoft Copilot, Google Gemini for Workspace, Notion AI, Zapier

9) Matrix — Business & Productivity (required)
- Type: Matrix
- Items with explanations:
  - Customer service automation — Triage questions, surface answers, and hand off to humans.
  - Meeting/email/doc summaries — Turn long exchanges into clear bullets, tasks, and deadlines.
  - Market & trend analysis — Scan reports/data to spot changes, competitors, or customer signals.
  - Forecasting & risk modeling — Explore scenarios and likely outcomes from historical data.
  - Workflow/process automation — Connect tools so routine steps run automatically.

10) Training received?
- Type: Multiple choice (single)
- Options: Yes; No; Not sure
- Conditional: If Yes → Slide 10a; If No/Not sure → Slide 10b

10a) Training effectiveness (conditional)
- Type: Opinion scale (1–5) + optional text
- Prompt: “If you’ve had AI training, how helpful was it overall?” (1 = not helpful, 5 = very helpful)
- Optional text: “What would have made it better? (optional)”

10b) Training needs (conditional)
- Type: Long Text (skippable)
- Prompt: “If you haven’t had training yet, what training or formats would help you get started?”
- Reassurance: “Please don’t paste sensitive personal, customer, or confidential data.”

11) What gets in the way
- Type: Multiple choice (multi) + optional text
- Options: Access/permissions; Time to learn; Tool quality; Missing data; Process/policy limits; Stakeholder buy‑in; Cost; Other
- Optional text: “Add detail (optional).”

12) Intro — Creative & Content (what this section covers)
- Type: Statement (Intro)
- Copy: “Here we cover creative work: drafting text, creating images or video, making audio, and building game assets. AI can turn rough ideas into first drafts, help with edits, and produce visual and audio variations quickly.”
- Examples: Midjourney, DALL·E, Adobe Firefly, Runway, Pika, ElevenLabs

13) Matrix — Creative & Content (required)
- Type: Matrix
- Items with explanations:
  - Image/graphics — Generate concepts, variants, and production‑ready assets.
  - Video — Create b‑roll, captions, and edits from scripts or rough clips.
  - Music/audio — Compose beds, clean audio, and synthesize voices where permitted.
  - Writing/storytelling — Outline, draft, and edit copy in your tone.
  - Game assets & NPC/dialogue — Produce sprites, textures, and believable character dialogue.

14) Skills you already have
- Type: Long Text (skippable)
- Prompt: “What AI‑related skills have you learned—formal or self‑taught?”
- Reassurance: “Please don’t paste sensitive personal, customer, or confidential data.”

15) How you learn best
- Type: Multiple choice (multi) + optional text
- Options: Short videos; Written guides; Live workshops; 1:1 coaching; Practice by doing; Other
- Optional text: “Anything else that works for you? (optional)”

16) Intro — Decision Support (what this section covers)
- Type: Statement (Intro)
- Copy: “Decision support covers pattern‑finding and judgment under uncertainty. AI can highlight anomalies, project likely outcomes, and surface sentiment so you can make faster, better decisions—while keeping humans in the loop.”
- Examples: Tableau + AI, Power BI + Copilot, Amazon Fraud Detector, OpenAI text analytics

17) Matrix — Decision Support (required)
- Type: Matrix
- Items with explanations:
  - Predictive analytics — Forecast demand, churn, or workload from historical patterns.
  - Medical/diagnostic support — Provide suggestions for review; clinicians make final calls.
  - Fraud/anomaly detection — Flag unusual events for investigation.
  - Sentiment analysis — Track voice‑of‑customer across reviews, tickets, and surveys.

18) Support from the organization
- Type: Opinion scale (1–5) + optional text
- Prompt: “How supported do you feel to try useful new tools?”
- Optional text: “What would improve this? (optional)”
 - Prefer not to say: Available as an alternative to the scale (selectable chip).

19) Culture of experimentation
- Type: Opinion scale (1–5) + optional text
- Prompt: “How easy is it to experiment safely with new tools?”
- Optional text: “Where does it feel hard? (optional)”
 - Prefer not to say: Available as an alternative to the scale (selectable chip).

20) Policy awareness
- Type: Multiple choice (single) + optional text
- Options: Yes; No; Not sure; Prefer not to say
- Optional text: “Anything unclear in the policy? (optional)”

21) Intro — Personal Assistance (what this section covers)
- Type: Statement (Intro)
- Copy: “Personal assistants help you plan, write, and stay organized. They can draft messages, prepare agendas, propose schedules, and remind you of deadlines so you can focus on the work that matters.”
- Examples: Apple Intelligence, Google Assistant with Gemini, Microsoft Copilot, Reclaim

22) Matrix — Personal Assistance (required)
- Type: Matrix
- Items with explanations:
  - Personal assistants — Plan tasks, schedule, and reminders across apps.
  - Content recommendations — Suggest articles, videos, or playlists that fit your interests.
  - Wellness & mental health chat — Supportive check‑ins and coping tips; not a substitute for care.

23) Pace that feels right
- Type: Opinion scale (1–5) + optional text
- Prompt: “How do you feel about the pace of AI adoption here?”
- Scale guidance: 1 = far too slow, 3 = about right, 5 = far too fast

24) Confidence in leadership
- Type: Opinion scale (1–5) + optional text
- Prompt: “How confident are you in leadership’s ability to implement AI well?”
- Optional text: “What would increase your confidence? (optional)”
 - Prefer not to say: Available as an alternative to the scale (selectable chip).

25) Intro — Security & Moderation (what this section covers)
- Type: Statement (Intro)
- Copy: “Security and moderation tools help protect people and systems. AI can detect threats in logs, filter harmful content at scale, and assist with identity checks or fraud risk—always with proper oversight.”
- Examples: Azure Content Moderator, OpenAI Moderation, Perspective API, Sift

26) Matrix — Security & Moderation (required)
- Type: Matrix
- Items with explanations:
  - Threat detection & prevention — Spot suspicious patterns in network or app logs.
  - Content moderation — Flag hateful, violent, or unsafe content for review.
  - Identity verification & fraud prevention — Check documents and behavior to reduce risk.

27) Final vision (optional)
- Type: Long Text (skippable)
- Prompt: “If AI progress goes right over the next 6–12 months, what would success look like for your work and team? Share concrete outcomes you’d love to see.”
- Reassurance: “Please don’t paste sensitive personal, customer, or confidential data.”
- Small nudge: “We’re listening. Be candid—specifics help us help you.”

28) Thank you + Service rating
- Type: End Screen + Opinion scale (1–5) captured separately
- Copy: “Thanks—your answers are saved.”
- Prompt: “How would you rate this survey experience?”
- Optional comment (140 chars): “Any quick feedback?”
- Data handling: Store rating and comment in a separate feedback/telemetry system, not with survey responses.

---

### Notes for Implementation (UX, shortcuts, mobile)
- Slide types: Welcome, Statement/Intro, Matrix, Multiple choice (single/multi), Opinion scale (1–5), Short/Long Text, End Screen.
- Keyboard shortcuts: Left/Right arrows = Back/Next; Enter = submit current slide when valid; Esc = close any helper/tooltips.
- Focus order: Primary actions first (Next), then secondary (Back), then Skip (if present).
- Validation: Disable Next until a required choice is selected; for text slides, Next always enabled (skippable).
- Mobile tap targets: Minimum 44×44 px; vertical spacing 12–16 px; sticky Next/Back bar on small screens.
- Matrix ergonomics: Entire row is tappable; selecting a scale highlights the row; maintain visible column headers when scrolling.
- Autosave: Persist after every action; show inline “Saved” text beneath the primary button for ~800 ms.
- Conditional logic: Implement slide 10a/10b branching; training effectiveness is hidden unless “Yes” on slide 10. If effectiveness ≤ 2, show the “Training needs” text as an additional prompt.
- Privacy: Show the reassurance note on all free‑text slides. Add a retention note in Welcome footer: “Your responses are used for an internal readiness report; not shared outside your company.”
 - Prefer not to say: Where offered, render as a distinct, clearly labeled choice. Treat as null for scoring/aggregation.
 - Analytics: Service rating (slide 28) is written to a separate feedback table/endpoint.

---

### Service rating — separate API/data schema

Store the end‑screen service rating and short comment in a separate feedback store/service, not alongside survey answers.

Endpoint (example)
```http
POST /api/feedback/survey-rating
Content-Type: application/json

{
  "companyId": "uuid",
  "userId": "uuid",
  "surveyVersion": "v2",
  "rating": 1,               // integer 1–5
  "comment": "Great flow",   // optional, max 140 chars
  "userAgent": "...",        // optional metadata
  "submittedAt": "2025-06-15T12:34:56Z"
}
```

TypeScript types
```ts
export interface SurveyRatingFeedback {
  companyId: string
  userId: string
  surveyVersion: 'v2'
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string // <= 140 chars
  userAgent?: string
  submittedAt: string // ISO8601
}
```

Suggested table (separate DB/schema)
```sql
create table feedback_survey_ratings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  user_id uuid not null,
  survey_version text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 140),
  user_agent text,
  submitted_at timestamptz not null default now()
);
```


