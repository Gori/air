## AIR Refactor 2 — Invite-only, Personal Insights, and Canonical Reports

### Original request (verbatim)

> 1. The tests for a company are not tied to email domains any more. They are strictly tied to the special invite / sharing link that managers can create. This sharing link should clearly say what company they are signing up to take the test for. 
> 2. When a new user signs up on the front page, they are asked (after signing up) if they want to Take the Test or Register a Company. This page is designed very similar to the company/register page. One card with two colored cards inside it, each with its own button.
> 3. Each user gets their own Personal Insights after taking the test. When logging in after getting personal insights, they can go back and see them. Personal Insights are generated and saved, and go back to (they are not re-generated several times)
> 4. The admin / manager can also see the personal insights by clicking a users name (if they have completed the test) on the Users page in Admin.
> 5. Reports in admin are saved when created, there is one saved per company, and if a user goes back it should see the old one but still have the button to generate a new one at top.

### Clarified decisions

- Remove all domain checks entirely. Company association is only via invite link (`/join/[invite_code]`). Keep `companies.domain` as metadata only (display), not enforcement.
- Introduce a post-auth “hub” page shown on every login or registration for any user who is not an admin/manager. Options shown depend on user state:
  - a) Take the test for <company_name> — shown only for users associated to a company (joined via invite link)
  - b) Take the personal test! — shown only for users not associated to any company
  - c) View your personal insights — shown if the user has completed any test (company or personal) and has insights generated
  - d) Register a company — shown if the user is not tied to a company
  - e) Invite your manager — shown if the user is not tied to a company
- Personal Insights: server-side persistence. Generated once per user (no re-generation). Shown on subsequent logins.
- Managers can view a user’s personal insights from `Admin → Users` by clicking the user’s name (when completed). No extra privacy constraints beyond existing role checks.
- Company Reports: maintain a single canonical report per company. Generating a new report replaces the old one (old data deleted).

---

## 1) Remove domain coupling and enforce invite-only join

Scope: Replace all domain validations with invite-link association.

- Remove/replace checks in:
  - `src/app/api/auth/join/[invite_code]/route.ts`: delete calls to `validateEmailDomain`; proceed if invite exists; associate user to company.
  - `src/app/api/company/self-enroll/route.ts`: deprecate this endpoint entirely (no domain‑based self-enroll). If needed, keep as 410 Gone with guidance to use invite.
  - `src/app/(auth)/welcome/page.tsx`: remove domain extraction logic and any domain-based branching.
  - `src/lib/clerk/utils.ts`: remove `validateEmailDomain` usage and dead helpers.

- Join flow updates:
  - `/join/[invite_code]` page continues to fetch `company.name` and displays clear copy: “You’re about to take the assessment for <company_name>.”
  - `GET /api/auth/join/[invite_code]`:
    - Validate invite exists; associate user in `public.users (company_id, role='employee')` if not already.
    - Update Clerk publicMetadata `company_id` for fast lookups (idempotent).
    - Redirect to the new hub page (see Section 2).

Notes:
- Keep `companies.domain` for display/admin only. No validation against user email anywhere.

---

## 2) Post-auth Hub page (universal for non-admin users)

Purpose: Central, simple decision page after sign-up or login for all non-admins.

- Route: repurpose `/(auth)/welcome` as the persistent hub. Always route non-managers here after auth.
- Visibility rules:
  - a) “Take the test for <company_name>”: show if `users.company_id` is set AND role !== 'manager'. Action → `/survey` (company mode).
  - b) “Take the personal test!”: show if `users.company_id` is null. Action → `/survey?mode=personal` (server‑persisted; see Section 3).
  - c) “View your personal insights”: show if `personal_insights` exists for `user_id`. Action → `/personal/insights`.
  - d) “Register a company”: show if `users.company_id` is null. Action → `/company/register`.
  - e) “Invite your manager”: show if `users.company_id` is null. Action → opens email flow to send a “manager invite” email (Section 6).

- Redirect rules:
  - In `src/app/page.tsx`: if authenticated and role === 'manager' → `/admin/overview`; else → `/(auth)/welcome` (this hub).
  - Avoid silent redirects to `/dashboard` for non-admins; the hub replaces that.

UI:
- Layout mirrors `company/register` visual style: one parent Card with two colored subcards for primary choices; additional links below for insights/manager invite.

---

## 3) Personal Insights (server‑persisted, single generation)

Goal: Every user gets personal insights after completing a test (company or personal). Insights are generated once and saved server-side.

### 3.1 Data model (new)

```sql
create table personal_surveys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  created_at   timestamptz default now(),
  completed_at timestamptz
);

create table personal_answers (
  id           uuid primary key default gen_random_uuid(),
  survey_id    uuid not null references personal_surveys(id) on delete cascade,
  dimension    text not null,
  answer_text  text not null,
  created_at   timestamptz default now()
);

create table personal_insights (
  user_id        uuid primary key references users(id) on delete cascade,
  survey_id      uuid not null references personal_surveys(id) on delete cascade,
  generated_at   timestamptz default now(),
  scores_json    jsonb not null,
  narrative_json jsonb not null
);
```

RLS (user-scoped):

```sql
alter table personal_surveys  enable row level security;
alter table personal_answers  enable row level security;
alter table personal_insights enable row level security;

create policy personal_surveys_sel on personal_surveys for select using (id in (
  select s.id from personal_surveys s join users u on s.user_id = u.id
  where u.id = current_setting('request.jwt.claims', true)::json->>'sub'
));
create policy personal_surveys_ins on personal_surveys for insert with check (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);

create policy personal_answers_sel on personal_answers for select using (survey_id in (
  select id from personal_surveys where user_id = current_setting('request.jwt.claims', true)::json->>'sub'
));
create policy personal_answers_ins on personal_answers for insert with check (survey_id in (
  select id from personal_surveys where user_id = current_setting('request.jwt.claims', true)::json->>'sub'
));

create policy personal_insights_sel on personal_insights for select using (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
create policy personal_insights_ins on personal_insights for insert with check (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);
```

### 3.2 API (new)

- `POST /api/personal/survey/start` → create or resume a `personal_surveys` row; return a simple `dimension → ordinal` map for the UI.
- `POST /api/personal/survey/answer` → upsert by `(survey_id, dimension)` into `personal_answers`.
- `POST /api/personal/survey/complete` → mark `completed_at`; if no `personal_insights` exists for `user_id`, queue/generate insights and persist; otherwise no-op (no regeneration).
- `GET /api/personal/insights` → return `personal_insights` for the current user.

Generation:
- New route `POST /api/ai/generatePersonalInsights` (internal use from `complete`): aggregate the user’s answers (company or personal), call AI via `OPENAI_MODEL`, persist to `personal_insights` if not present; enforce uniqueness by `primary key (user_id)`.

### 3.3 UI

- “View your personal insights” page at `/(dashboard)/personal/insights`:
  - Reads from `GET /api/personal/insights`.
  - If missing, shows guidance to finish a test first.
  - No regenerate button.

### 3.4 Company test also yields personal insights

- On company survey completion (existing flow), trigger the same insights generation for that `user_id` if not yet present.

---

## 4) Admin: view a user’s personal insights

Updates:
- `/(dashboard)/admin/users/page.tsx`:
  - Render each user’s name as a link to `/(dashboard)/admin/users/[id]`.
  - Only show the link as enabled if that user has `personal_insights`.

- New page: `/(dashboard)/admin/users/[id]/page.tsx`:
  - Manager-only. Fetch that user’s `personal_insights`.
  - Show a simple read-only insights view.

- API:
  - `GET /api/admin/users/[id]/personal-insights` → manager-only, same-company check, returns the insights if present.

---

## 5) Canonical company report (single, replace on generate)

Data model:

- Add a unique index on `reports.company_id` to enforce one row per company:

```sql
create unique index if not exists reports_company_id_key on reports(company_id);
```

API:
- Update `POST /api/ai/generateReport` to upsert:
  - Option A (preferred): `insert ... on conflict (company_id) do update set (scores_json, narrative_json, html_path, shared_slug, created_by, generated_at) = (...)`.
  - Option B: delete existing `reports` row (and its `report_scores`) for the company first, then insert a new one.

UI:
- `/(dashboard)/admin/report/page.tsx`:
  - On load, fetch current company’s single report via `GET /api/reports/current`.
  - Show the existing report if present, plus a “Generate new” button at the top.
  - After generation, refresh the view to show the new canonical report.

Sharing:
- Keep public share route `/api/reports/share/[slug]` unchanged. When generating a new canonical report, write a fresh `shared_slug` (replaces previous share link).

---

## 6) “Invite your manager” flow

Purpose: Help users without a company association bring their manager in.

- UI button on the hub page opens a simple form (manager name, manager email). Submits to `POST /api/invites/manager`.
- Email content: “You’ve been invited to register your company and invite employees” with a CTA to `/company/register`.
- Track a lightweight invite row (optional): `manager_invites (id, inviter_user_id, manager_email, created_at)` for analytics only.

---

## 7) Routing & redirects

- `src/app/page.tsx` (home):
  - If authenticated and `role === 'manager'` → `/admin/overview`.
  - Else (any non-manager) → `/(auth)/welcome` hub.

- `/(auth)/welcome` hub:
  - Server component that fetches `users.company_id`, `role`, and presence of `personal_insights`. Renders the correct options.

- `/join/[invite_code]`:
  - On success, redirect to the hub.

---

## 8) Survey flows (summary of changes)

- Company survey: unchanged endpoints, but ensure completion triggers personal insights generation once for that user.
- Personal survey: switch from localStorage to server persistence via new `personal_*` APIs and tables; no AI follow-ups in personal mode for v1 (keeps cost minimal). The existing `PersonalSurveyDriver` can be refactored to call the new endpoints.

---

## 9) Security & RLS

- Remove reliance on email domain for any access decisions.
- Company data remains protected by `company_id` scoping and existing RLS.
- New `personal_*` tables use user-scoped RLS shown above; only the owner user can read/write their own personal survey data and insights; managers can only read those insights via the admin API with same-company check on `users`.

---

## 10) Migrations (summary)

1. Drop domain checks in code; keep `companies.domain` column.
2. Create `personal_surveys`, `personal_answers`, `personal_insights` with RLS policies (Section 3.1).
3. Add unique index on `reports.company_id` (Section 5).

---

## 11) Implementation checklist

- Remove domain validation from join and welcome flows; deprecate self-enroll.
- Build the universal hub page with conditional options.
- Add personal survey persistence APIs and tables; wire up the personal survey driver.
- Implement personal insights generation on survey completion (company or personal) with one-time persistence.
- Admin can view a user’s insights from the Users list → detail page.
- Enforce single canonical company report (upsert or delete+insert) and update admin report page to load existing.
- Add “Invite your manager” email flow.
- Update redirects to land non-admins on the hub page after auth.
- Tests: unit/integration for new APIs and routing; adjust E2E flows.

---

## 12) Testing notes

- Remove/adjust any tests asserting domain enforcement.
- Add tests for:
  - Invite join without domain check.
  - Hub option visibility matrix for different user states.
  - Personal survey persistence and insights generation (single-run).
  - Admin viewing user insights.
  - Canonical report upsert behavior.

---

## 13) Out of scope (v1 of this refactor)

- Regenerating personal insights.
- AI follow-ups in personal mode (can be added later if needed).
- Report history/versions (we keep single canonical).


