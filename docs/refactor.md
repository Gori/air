## AIR refactor specification (flows, routes, APIs, data) — based on current code

### Scope
- Align the product with seven behaviors you described by refactoring routing, onboarding, survey modes, and the manager experience.
- This spec derives only from the codebase (Clerk + Supabase + Next.js app dir, shadcn UI).

### Design intent
- Reduce cognitive load and branches at every step by offering only meaningful choices.
- Default to the highest‑trust path; make progress visible and next actions obvious.
- Keep experiences role‑appropriate: managers manage; employees answer; guests preview.
- Preserve data safety: never persist personal/guest answers; never leak company context.

### Guiding UX principles
- One decision per screen (use concise modals for branching moments).
- Progressive disclosure (show admin controls only after a company exists; show report only after answers exist).
- Role‑appropriate defaults (managers → Admin, employees → Survey, guests → Guest Survey).
- Minimal chrome (shadcn components only, consistent spacing, clear hierarchy).
- Visible status (progress and counts are explicit; avoid hidden states).
- Safe destructive actions (confirmations and immediate UI updates).

### Current system (from code)
- **Auth**: Clerk via `src/middleware.ts` protects all except `['/', '/sign-in(.*)', '/sign-up(.*)', '/share/(.*)', '/api/webhooks/(.*)']`. `src/components/auth/auth-guard.tsx` redirects unauthenticated to `/sign-in`, and employees without `company_id` to `/dashboard`.
- **Sign-in/up**: `SignIn` and `SignUp` pages redirect to `/dashboard`. No post‑signup branching.
- **Company**: Manager creates company via `POST /api/company/register` and `src/app/(dashboard)/company/register/page.tsx` (`CompanyOnboardingForm`). Company row includes `invite_code` used by employees to join.
- **Invite/join**:
  - Public landing: `GET /join/[invite_code]` page (server) shows company by invite code; if authenticated, redirects to `GET /api/auth/join/[invite_code]`.
  - `GET /api/auth/join/[invite_code]` validates email domain, inserts `users` row (`role='employee'`), updates Clerk public metadata (`role`, `company_id`, etc.), then redirects to `/dashboard`.
- **Survey**: Client page `src/app/(dashboard)/survey/page.tsx` drives a slide engine. It calls:
  - `POST /api/survey/start`: requires Clerk user and `company_id` (from Clerk public metadata via `getCompanyId`). Starts/ensures question instances and returns progress + a dimension→instance map.
  - `POST /api/survey/answer`: requires `company_id`. Upserts answer per instance.
  - `POST /api/ai/nextQuestion`: requires `company_id`. Generates follow‑ups.
  If `POST /api/survey/start` returns 400 "No company association found", the home `/src/app/page.tsx` code redirects to `/company/register`.
- **Dashboard**: `src/app/(dashboard)/dashboard/page.tsx` shows a progress card (fetches `POST /api/survey/start`). Rich content.
- **Settings**: `src/app/(dashboard)/settings/page.tsx` shows invite code, fake company data, and employees list (placeholder client‑side data).
- **Reports**:
  - Manager-only `POST /api/ai/generateReport` aggregates answers and uses AI to produce scores/narrative, saves `reports` + `report_scores`, returns a `shared_slug`.
  - Public share page `src/app/share/[slug]/page.tsx` pulls from `GET /api/reports/share/[slug]`.
- **Data model (Supabase types)**: `companies`, `users (role: 'manager'|'employee')`, `questions`, `question_instances`, `answers`, `reports`, `report_scores`, `prompt_logs`, `feedback_survey_ratings`.

### Target behaviors and required changes

#### 1) New user registers and no manager for their email domain → modal: register a company or just take the test
- Why: Avoid forcing organizational setup before intent is known; users can experience value first, managers can formalize later.
- Flow: After signup, `/welcome` inspects email domain. If no company exists, show a single modal with two primary CTAs.
- UX spec:
  - Modal title: "How do you want to start?"
  - Primary: "Register a company" → `/(dashboard)/company/register`
  - Secondary: "Just take the test" → `/(dashboard)/survey?mode=personal`
  - Helper text: "You can register a company later."
- **Add a post‑signup route** `/(auth)/welcome` (server component) and set `SignUp.redirectUrl` → `/welcome`.
- **Logic (server side in `/welcome`)**:
  - Read authenticated user and primary email domain via Clerk.
  - Query `companies` by domain. If no row exists, show a modal with two actions:
    - "Register company" → link to `/(dashboard)/company/register` (existing).
    - "Just take the test" → start Personal mode (see section 3) by sending them to `/(dashboard)/survey?mode=personal`.
- **Middleware**: keep `/welcome` protected. No public access.

#### 2) If they register a company → they are managers and land on a new Admin area (replace Settings)
- Why: Settings is ambiguous. Managers need a single, obvious home for actions and insights; employees don’t need admin constructs.
- Flow: Completing company registration sets `role='manager'` and routes to Admin Overview.
- UX spec (shadcn only):
  - Admin layout with left sidebar: Overview, Answers, Users, Report.
  - Overview: 3 cards (Employees, Responses, Overall status), Invite block (copy URL), and a "Take the test" button if manager hasn’t answered.
  - Answers: per‑dimension rows with Answered/Total and simple distributions where answer JSON allows.
  - Users: list with email, name, role, last activity; row action: Delete (confirm dialog: "Delete user and their answers? This cannot be undone.").
  - Report: move existing report UI unchanged.
- **Remove** `/(dashboard)/settings/page.tsx`.
- **Add** Admin area under `/(dashboard)/admin` (protected: manager only). Sidebar + subpages built with shadcn:
  - `/(dashboard)/admin/overview/page.tsx`
    - Cards: total employees (count `users` where `role='employee'`), total responses (unique `employee_id` with at least one answer), latest activity.
    - Invite section: copy invite link using `companies.invite_code` (move copy logic from current Settings).
    - "Take the test" button if the manager has not answered anything (i.e., no answers for `employee_id = manager.id`). Route to `/(dashboard)/survey`.
  - `/(dashboard)/admin/answers/page.tsx`
    - Per dimension/question stats: for each active `questions.dimension`, compute answered count, completion rate, and simple distributions for structured answers where applicable.
    - Data source: aggregate on `question_instances` joined with `answers` grouped by `questions.dimension`.
  - `/(dashboard)/admin/users/page.tsx`
    - List employees in `users` for the manager's `company_id`. Optionally filter to "has answered" users.
    - Actions: Delete employee (see Admin API below).
  - `/(dashboard)/admin/report/page.tsx`
    - Move current `/(dashboard)/report/page.tsx` here unchanged (manager‑only), keeping Generate and Share.
- **Admin APIs (server routes)**:
  - `DELETE /api/admin/users/[employeeId]` (manager‑only):
    - Validate the target user belongs to manager's `company_id`.
    - Delete rows in `answers` (by `employee_id`), then `question_instances` (by `employee_id`), then `users` row. Return 204.
  - `GET /api/admin/stats/overview` (manager‑only): summary counts used by Overview.
  - `GET /api/admin/stats/answers` (manager‑only): per‑dimension aggregates for Answers page.
- **Routing**: Managers should never see Dashboard. Add a role redirect (see section 6).

#### 3) If they don’t register a company → direct to the test and get personal results
- Why: Let users experience value immediately without organizational commitment; reduces drop‑off.
- Flow: Personal mode reuses the survey UI but persists locally.
- UX spec:
  - Subheader banner: "Personal mode — your answers are stored only on this device."
  - End screen summary with CTAs: "Register a company" and "Start over".
- **Personal survey mode (authenticated, no `company_id`)**:
  - Reuse the existing survey UI (`/(dashboard)/survey/page.tsx`) via a driver abstraction:
    - Extract a "SurveyDriver" interface: `loadStart()`, `saveAnswer()`, `maybeCreateFollowUp()`.
    - Implement two drivers:
      - CompanyDriver: current behavior using `/api/survey/*` and `/api/ai/nextQuestion`.
      - PersonalDriver: client‑only storage (local state + `localStorage`) and optional AI follow‑ups disabled by default. No writes to Supabase.
  - Activate Personal mode when visiting `/(dashboard)/survey?mode=personal` OR when the user has no `company_id` and chooses "Just take the test" on `/welcome`.
  - Personal results: simple client summary screen at end (dimension list and any structured aggregates). No server persistence.

#### 4) If there is a manager for the email domain → ask if they want to submit for themselves or for the company
- Why: Acknowledge org ownership and avoid duplicates while preserving autonomy for a personal run‑through.
- Flow: `/welcome` sees company+manager → show two CTAs.
- UX spec:
  - Modal title: "Use your company domain?"
  - Primary: "Submit to [Company]" → self‑enroll then survey.
  - Secondary: "Just for me" → personal mode.
- **Post‑signup `/welcome`** finds a `company` by domain and validates at least one `users.role='manager'` exists for that `company_id`.
- Show modal with two actions:
  - "Submit for the company" → self‑enroll as employee without an invite:
    - New `POST /api/company/self-enroll` (auth required): verify email domain equals `company.domain`, create `users` row with `role='employee'` for that `company_id`, update Clerk public metadata (`role`, `company_id`), then redirect to `/(dashboard)/survey`.
  - "Just for me" → `/(dashboard)/survey?mode=personal` (PersonalDriver).

#### 5) If invited by manager (share link) → go directly to the test
- Why: The job to be done is to answer; extra stops reduce completion.
- Flow: After join completes, send directly to `/(dashboard)/survey`.
- Keep `/join/[invite_code]` + `GET /api/auth/join/[invite_code]` flow, but change final redirect from `/dashboard` to `/(dashboard)/survey`.
- Update `EmployeeJoinForm` `SignUp.redirectUrl` remains the `/api/auth/join/[invite_code]` path. The API completes DB + metadata and then routes directly to the survey page.

#### 6) Replace Dashboard with a minimal progress page; managers never see it
- Why: Focus the dashboard to one message: where you are, and what to do next.
- UX spec:
  - Title: "Welcome back".
  - If progress exists, show percent + CTA "Continue survey".
  - Else, two CTAs: "Register company" and "Take test for myself".
  - Managers auto‑redirect to Admin Overview (they never see this page).
- **Replace** `/(dashboard)/dashboard/page.tsx` with a minimal component:
  - Heading "Welcome back".
  - Progress: use `POST /api/survey/start` when the user has `company_id`; otherwise show "No company assessment yet" with buttons: "Register company" and "Take test for myself".
  - A manager should never land here: add a server guard in `/(dashboard)/layout.tsx` or a lightweight client effect to redirect managers to `/(dashboard)/admin`.
- **Role redirect**:
  - Option A (server): In `/(dashboard)/layout.tsx`, fetch Clerk metadata; if `role==='manager'`, `redirect('/admin/overview')`.
  - Option B (client): Amend `AuthGuard` to route managers to `/admin/overview`.

#### 7) Add a button on the start page to take the test without logging in
- Why: Let prospects understand the experience without account creation; increases conversion to company setup.
- Flow: Public CTA → guest survey using the Personal driver.
- UX spec:
  - Banner: "Guest preview — nothing is saved."
  - End: prompt to sign up or register a company.
- **Home page** `src/app/page.tsx`:
  - Add a prominent button linking to `/survey/guest`.
  - The guest route must be public in middleware.
- **Guest survey mode (unauthenticated)**:
  - Route `/(public)/survey/guest/page.tsx` reuses the same survey UI with PersonalDriver.
  - Results shown client‑side; no persistence; no access to company/report features.
- **Middleware**: add `'/survey/guest(.*)'` to public routes.

### Detailed implementation plan

- **Routing changes**
  - Add: `/(auth)/welcome/page.tsx` (server) — post‑signup branch.
  - Add: `/(dashboard)/admin/(overview|answers|users|report)/page.tsx` and `/(dashboard)/admin/layout.tsx` (sidebar, shadcn only).
  - Move: report UI from `/(dashboard)/report/page.tsx` → `/(dashboard)/admin/report/page.tsx` (manager only). Keep the API unchanged.
  - Replace: `/(dashboard)/dashboard/page.tsx` content with minimal progress page.
  - Remove: `/(dashboard)/settings/page.tsx`.
  - Add: `/(public)/survey/guest/page.tsx`.

- **Middleware** (`src/middleware.ts`)
  - Extend `isPublicRoute` to include `'/survey/guest(.*)'`.

- **Auth guard and redirects**
  - Update `AuthGuard`:
    - If `requiredRole==='manager'` and user not manager → redirect to `/dashboard` (unchanged behavior).
    - If user is manager and path under `/(dashboard)` not `/admin/*` → redirect to `/admin/overview`.
    - Remove the unconditional redirect of employees with missing `company_id` to `/dashboard`; allow Personal mode.
  - Update `SignUp` components to `redirectUrl="/welcome"`.

- **Welcome page logic**
  - Server fetch: Clerk user + email domain.
  - Supabase query: `companies` by domain; if found, query managers in `users` for that `company_id`.
  - Render modal based on cases in sections 1 and 4.

- **Self‑enroll API** `POST /api/company/self-enroll`
  - Auth required.
  - Validate request domain matches `companies.domain`.
  - If the user already has a `users` row, return 200 with no‑op.
  - Else, insert `users` row (`role='employee'`) and update Clerk public metadata.
  - Return `{ success: true }`.

- **Survey driver refactor**
  - Create `src/lib/survey/driver.ts`:
    - `export interface SurveyDriver { loadStart(): Promise<StartPayloadLike>; saveAnswer(dimensionOrInstanceId, payload): Promise<void>; maybeCreateFollowUp(...): Promise<FollowUp | null>; }`
    - `CompanySurveyDriver` wraps existing `/api/survey/start`, `/api/survey/answer`, `/api/ai/nextQuestion`.
    - `PersonalSurveyDriver` is client‑only: builds the same slides and persists to `localStorage` by dimension key; `maybeCreateFollowUp` returns `null`.
  - In `/(dashboard)/survey/page.tsx`, select driver based on `mode` query and presence of `company_id`.

- **Admin area pages** (shadcn only)
  - `overview`: fetch from `GET /api/admin/stats/overview`; show counts, invite link (copy to clipboard using existing logic from Settings), and self‑assessment button state.
  - `answers`: fetch `GET /api/admin/stats/answers`; table per dimension with answered count and completion rate.
  - `users`: fetch `GET /api/admin/users` (new) → list; `DELETE /api/admin/users/[id]` to remove.
  - `report`: reuse current page (generate + share) under admin.

- **Admin APIs** (manager‑only guards using Clerk + company_id checks)
  - `GET /api/admin/stats/overview`: total employees (`users` count by `company_id`), respondents (distinct `answers.employee_id`), recent activity snapshot.
  - `GET /api/admin/stats/answers`: for each active question dimension, answered count and, where JSON shaped (`scale`, `mc_*`, `usage_matrix`), simple distributions.
  - `GET /api/admin/users`: list `users` by `company_id`, with last activity (latest `answers.created_at`).
  - `DELETE /api/admin/users/[id]`: delete cascading in app order (answers → question_instances → users). Return 204.

- **Dashboard minimal page**
  - If employee with `company_id`: call `POST /api/survey/start` only for progress; render percentage + CTA to `/survey`.
  - Else: render two buttons: "Register company" (→ `/company/register`) and "Take test for myself" (→ `/survey?mode=personal`).
  - Ensure managers are redirected away to Admin.

- **Home page CTA**
  - Add button "Take the test without logging in" linking to `/survey/guest`.

### Copy deck (microcopy)
- Welcome (no company): "How do you want to start?" — Primary: "Register a company" — Secondary: "Just take the test" — Helper: "You can register later."
- Welcome (company exists): "Use your company domain?" — Primary: "Submit to [Company]" — Secondary: "Just for me" — Helper: "You can switch later."
- Admin Users delete confirm: "Delete user and their answers? This cannot be undone."
- Personal mode banner: "Personal mode — your answers are stored only on this device."
- Guest banner: "Guest preview — nothing is saved."
- Minimal dashboard CTAs: "Continue survey", "Register company", "Take test for myself".

### Accessibility & interaction
- Modals: focus trap, Esc to close, default action on Enter, clear button labels.
- Keyboard navigation: survey keeps Arrow/Enter controls; all buttons have visible focus states.
- Destructive actions require confirmation; confirm buttons styled as primary‑destructive.

### Edge cases
- Self‑enroll domain mismatch: inline error "Use your work email @domain.com" with retry.
- Duplicate user on self‑enroll: treat as success and continue.
- Missing Clerk `company_id` while answering: allow Personal mode rather than blocking.
- Offline/latency during company survey: show non‑blocking error toast; retry next step.

### Analytics (minimal)
- Events: `signup_welcome_view`, `choose_register_company`, `choose_personal`, `self_enroll_success`, `invite_join_success`, `survey_continue`, `survey_complete`, `admin_delete_user`, `report_generate_success`.

### Data model considerations
- No schema change is required for company/employee flow.
- Guest/Personal modes intentionally avoid DB writes (no new tables). Personal/guest responses are not counted in Admin stats or Reports.
- Employee deletion must remove dependent rows in order via application code unless DB foreign keys are configured with `ON DELETE CASCADE` (not visible in types). Implement defensive deletes in API.

### Security & permissions
- Keep existing middleware protections.
- New public routes: `/survey/guest(.*)` and share URLs remain public.
- All new Admin APIs and Admin pages must verify `role==='manager'` and `company_id` ownership server‑side.

### Redirect matrix (summary)
- SignUp → `/welcome`.
- `/welcome`:
  - No `company` for domain → choose register → `/company/register` OR personal → `/survey?mode=personal`.
  - `company` exists with manager(s) → choose company → self‑enroll API then `/survey`; or personal → `/survey?mode=personal`.
- Invite flow: `/api/auth/join/[invite_code]` → `/survey`.
- Manager visiting any `/(dashboard)` non‑admin page → `/admin/overview`.

### Test updates (high level)
- Update integration tests to cover:
  - Post‑signup branching (`/welcome`).
  - Self‑enroll happy‑path and domain mismatch.
  - Manager redirects to Admin.
  - Admin endpoints authz and deletion behavior.
  - Guest survey access without auth and non‑persistence.

### AI model standardization
- Set `AI_MODEL = 'gpt-4.1-mini-2025-04-14'` in `src/lib/ai/client.ts` and ensure all AI routes reference it.

### Implementation order (minimal risk)
1) Add `/welcome` route and update SignUp redirect.
2) Implement self‑enroll API and role redirects (manager to Admin).
3) Add Admin area (Overview, then Users, then Answers, then move Report).
4) Replace Dashboard with minimal version.
5) Introduce SurveyDriver abstraction and Personal mode; add Guest route and middleware public rule.
6) Update invite flow final redirect to `/survey`.
7) Remove old Settings page.

### UI element specifications (new/relocated pages)

#### /(auth)/welcome — post‑signup choice
- Protected.
- Elements
  - Title: "How do you want to start?"
  - Subtitle: concise one‑liner.
  - Primary button: "Register a company" → `/(dashboard)/company/register`
  - Secondary button: "Just take the test" → `/(dashboard)/survey?mode=personal`
  - Helper text: "You can register a company later."
  - Loading: subtle spinner overlay on click until navigation.
  - Error: inline message if lookup fails.
  - A11y: focus trap; Enter triggers focused action; Esc closes and defaults to secondary.
- Variant (company exists with manager)
  - Title: "Use your company domain?"
  - Primary: "Submit to {CompanyName}" → self‑enroll then `/(dashboard)/survey`
  - Secondary: "Just for me" → `/(dashboard)/survey?mode=personal`
  - Helper: "You can switch later."

#### /(dashboard)/admin/layout — manager shell
- Manager‑only.
- Elements
  - Sidebar (left): Overview, Answers, Users, Report (current item highlighted).
  - Top bar: Company name; `UserButton`.
  - Content outlet for child pages.
  - A11y: visible focus for nav; current route announced.

#### /(dashboard)/admin/overview — manager home
- Elements
  - Header: "Overview"
  - Stat cards (3)
    - Employees (count of `users` where role=employee)
    - Responses (distinct employees with ≥1 answer; response rate if headcount known)
    - Report status ("None yet" or "Generated {date}")
  - Invite block
    - Invite code chip
    - Share URL (readonly; or copyable text)
    - Copy button with "Copied" state
    - Helper: "Share with your team to join the assessment."
  - Manager self‑assessment CTA (conditional)
    - If no answers for manager: "Take the test" → `/(dashboard)/survey`
  - Recent respondents list (up to 5)
    - Name/email; "Answered {relative time}"
    - Empty state
  - Feedback: copy success toast; error toast for failed loads
  - Loading/empty states per block

#### /(dashboard)/admin/answers — per‑question stats
- Elements
  - Header: "Answers"
  - Table
    - Columns: Dimension | Answered | Total | Completion % | Distribution
    - Distribution: mini bars or inline counts for `scale`/`mc`/`matrix` JSON answers
    - Row order: by module or completion %
  - Empty state: "No responses yet."
  - Loading state
  - A11y: table semantics

#### /(dashboard)/admin/users — roster and controls
- Elements
  - Header: "Users"
  - Toolbar: filter toggle (All | Answered)
  - Table
    - Columns: Name | Email | Role (badge) | Last Active | Actions
    - Action: Delete → confirm dialog
      - Title: "Delete user and their answers?"
      - Body: "This cannot be undone."
      - Buttons: "Cancel" | "Delete"
  - Empty state: "No team members yet."
  - Toasts: deletion success/error
  - Loading state

#### /(dashboard)/admin/report — relocated (manager‑only)
- Elements (as current Report page)
  - Generate card: title, explainer, "Generate Report" (loading state)
  - After generation
    - Header: success with generated date
    - Buttons: "Share" (copy), "Download"
    - Summary cards: Employees Surveyed | Overall Score (+ progress) | Readiness Level | Report Status
    - Usage snapshot (if present): counts by matrix level
    - Dimension scores: list with bars and justifications
    - Narrative: Strengths | Areas for Improvement | Recommendations
    - Next steps: "Generate New Report", "Share with Team"
  - Errors: inline alert
  - Loading states retained

#### /(dashboard)/dashboard — minimal landing (employee)
- Elements
  - Title: "Welcome back"
  - If `company_id` exists
    - Progress: Percent | Completed/Total | Button: "Continue survey"
    - If completed: optional "View Reports"
  - If no `company_id`
    - Buttons: "Register company" → `/(dashboard)/company/register`; "Take test for myself" → `/(dashboard)/survey?mode=personal`
  - Error/Loading: inline alert, skeletons

#### /(public)/survey/guest — unauth preview
- Elements
  - Banner: "Guest preview — nothing is saved."
  - Survey UI (same as employee)
  - End screen
    - Summary (local only)
    - Buttons: "Sign up to save" | "Register a company" | "Start over"
  - A11y: same as survey

#### /(dashboard)/survey — employee survey (Personal mode deltas)
- Elements (current survey)
  - If `mode=personal`: banner + end screen summary with CTAs (Register company, Start over)


