# AIR - Master Specification & Implementation Guide

**AI-Readiness Assessment SaaS Tool**

*(React 19.1 · Next 15.3 · Supabase · Vercel · June 2025)*

---

## Build Rules

1. **Always build the minimal, clean, performant solution.**
2. **Always use the latest versions of everything.**
3. **Never build fallbacks or workarounds to anything.**

---

## 0 · Version Pins

| Layer               | Version / Commit                     |
| ------------------- | ------------------------------------ |
| **React**           | **19.1**                             |
| **Next JS**         | 15.3                                 |
| **TanStack Router** | 1.0.5                                |
| **Tailwind CSS**    | 4.1.8                                |
| **ShadCN/ui**       | commit `f31a97`                      |
| **OpenAI model**    | `gpt-4o-mini-2025-05-28` (“GPT-4.1”) |

---

## 1 · Purpose & Product Scope

A single-tenant SaaS tool where **one manager per company** collects AI-readiness input from co-workers, uses GPT-4.1 to adapt / follow-up questions, automatically scores answers, and produces a shareable, read-only HTML report.

* **Employees cannot edit answers once submitted.**
* Manager may regenerate the report at any time (previous report rows & files are overwritten; no history).
* A public link is generated only when the manager toggles "Share".
* **Languages**: English-only UI/content.
* **Domains**: every employee's email domain must match the manager's domain; sign-in is blocked otherwise.
* **Region** is collected (for optional filtering) but **ignored in scoring**.

---

## 2 · Tech Stack & Libraries

| Tier           | Choice / Library                              | Notes                                              |
| -------------- | --------------------------------------------- | -------------------------------------------------- |
| **Frontend**   | Next JS 15.3 app-router + React 19.1          | Strict server components where possible.           |
|                | TanStack Router 1.0.5                         | Nested layouts & auth guards.                      |
|                | ShadCN/ui + Tailwind 4.1.8                    | *Default ShadCN theme, no custom branding for v1.* |
| **Backend**    | Next JS Route Handlers on Vercel (edge-ready) | All business logic lives here.                     |
| **Auth**       | Clerk (Google OAuth + email/password)         | Custom claim `company_id` injected into JWT.       |
| **Database**   | Supabase (Postgres 15 + Storage)              | Full Row-Level Security.                           |
| **AI Runtime** | Vercel AI SDK  →  OpenAI GPT-4.1              | SSE streaming; prompts logged.                     |
| **Email**      | Resend                                        | Invite & "report ready" mail.                      |
| **Testing**    | Jest + React Testing Library + Playwright     | Unit, integration, and E2E testing.               |
| **Analytics**  | *None for MVP (can add Plausible later).*     |                                                    |

---

## 3 · Architecture (High-Level)

```mermaid
graph TD
  A[Client<br/>(Next JS 19.1)]
  B[Route Handler<br/>/api/ai/nextQuestion]
  C[Route Handler<br/>/api/ai/generateReport]
  D[(Supabase Postgres + RLS)]
  E[[Supabase Storage /reports]]
  A -- Clerk JWT --> B
  A -- Clerk JWT --> C
  B -- SQL + prompt_log --> D
  C -- SQL + prompt_log --> D
  C -- PUT report.html --> E
  A -- GET signed URL --> E
```

---

## 4 · Data Model (ERD excerpt)

```
companies──┐
           ├─< users (role: manager|employee)
           └─< reports ──< report_scores
modules ──< questions ──< question_instances ──< answers
prompt_logs
```

**Key points**

* Every table (except reference tables) carries `company_id` for RLS.
* No soft-delete; rows are removed when needed.
* `question_instances.parent_instance` links follow-ups to the original question.
* Report HTML is stored in Supabase Storage bucket `reports`.

---

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

**Follow-up logic**
`/api/ai/nextQuestion` feeds the **last answer text** plus minimal employee context to GPT-4.1. The model may return up to **three** follow-up probes (stored as extra `question_instances`, linked through `parent_instance`).

---

## 6 · Workflow & Business Rules

1. **Manager onboarding**

   * Registers via Clerk → fills *company name, domain, head-count, industry, region*.
   * App displays invite URL `/join/[invite_code]`.

2. **Employee intake**

   * Visits invite URL → Clerk sign-up (Google OAuth or email/password).
   * Domain enforcement: if `emailDomain !== company.domain` → hard stop.
   * Employee walks through question flow; answers saved immediately per question.

3. **Progress tracking**

   * Manager dashboard polls a materialized view: `Not started / In progress / Submitted`.

4. **Report generation**

   * Manager clicks **Generate report**.
   * Server collects all answers → GPT-4.1 → produces:

     * **Likert scores** for 13 dimensions (0–5 scale).
     * **Narrative bullet-points** (strengths, gaps, recs).
   * JSON saved to `reports`; HTML compiled with React-Email + inlined Tailwind; file placed in Supabase Storage (`reports/<uuid>.html`).

5. **Sharing**

   * Manager toggles "Share" → app sets `shared_slug` (random 8 chars).
   * Public endpoint `/share/[slug]` serves the static HTML (no DB call).

6. **Re-generate**

   * Subsequent generate deletes previous `reports` row, `report_scores` rows and Storage file, then writes fresh data.

---

## 7 · Reporting & Visuals

* **Bar chart**: dimension averages.
* **Radar**: 6 module averages.
* **Heat-map matrix**: employees × dimensions.
* **CSV export**: raw answers.

Charts rendered client-side with `react-charts@5`.

---

## 8 · AI Operations & Cost Guardrails

| Endpoint                 | --Input--                  | Average tokens | Notes                                     |
| ------------------------ | -------------------------- | -------------- | ----------------------------------------- |
| `/api/ai/nextQuestion`   | `employee_id, last_answer` | 50             | Generates next core / follow-up question. |
| `/api/ai/generateReport` | `company_id`               | 4 k            | Streams JSON then HTML; ≈ €0.04 per run.  |

*All* prompts + responses are persisted to `prompt_logs` (for debugging/audit). Purge schedule optional.

---

## 9 · Security & RLS

* Clerk JWT → custom claim `company_id`.
* All tables enforce:

  ```sql
  USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id')
  ```

  plus role checks where needed (e.g. only managers INSERT into `reports`).
* Invite URL is an opaque UUID; expires only when manager resets it.
* No soft-delete, no data-retention timer requested.

---

## 10 · Database Schema + Seed Script (Supabase SQL)

> **Run once** in the Supabase SQL editor.

```sql
-- ENUMS --------------------------------------------------------------
create type user_role as enum ('manager','employee');
create type prompt_source as enum ('question_selection','report_generation');

-- CORE TABLES --------------------------------------------------------
create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text not null unique,
  headcount   int,
  industry    text,
  region      text,
  invite_code uuid unique default gen_random_uuid(),
  created_at  timestamptz default now()
);

create table users (
  id           uuid primary key, -- Clerk user_id
  company_id   uuid references companies(id) on delete cascade,
  role         user_role not null,
  email        text not null,
  full_name    text,
  last_login_at timestamptz,
  created_at   timestamptz default now()
);

create table modules (
  id   int primary key,  -- 1-6
  name text not null
);

insert into modules (id,name) values
 (1,'AI Literacy & Skills'),
 (2,'Attitudes & Perceptions'),
 (3,'Workflow Integration & Opportunities'),
 (4,'Organizational Ecosystem'),
 (5,'Learning & Development'),
 (6,'Strategic Alignment & Vision');

create table questions (
  id        serial primary key,
  module_id int references modules(id),
  dimension text,
  text      text not null,
  active    boolean default true
);

-- 20 core questions (truncated for brevity—paste full texts here)
insert into questions (module_id,dimension,text) values
 (1,'ai_literacy','Could you describe your current understanding of Artificial Intelligence …?'),
 -- … 18 more rows …
 (6,'future_roles_skills','Imagine we grow 10× through AI—what roles & skills would we need?');

create table question_instances (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null,
  employee_id     uuid references users(id) on delete cascade,
  question_id     int references questions(id),
  parent_instance uuid references question_instances(id),
  ordinal         int not null
);

create table answers (
  id              uuid primary key default gen_random_uuid(),
  question_instance_id uuid references question_instances(id) on delete cascade,
  company_id      uuid,
  employee_id     uuid,
  answer_text     text not null,
  created_at      timestamptz default now()
);

create table reports (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies(id) on delete cascade,
  generated_at  timestamptz default now(),
  scores_json   jsonb not null,
  narrative_json jsonb not null,
  html_path     text not null,
  shared_slug   text unique,
  created_by    uuid references users(id)
);

create table report_scores (
  report_id  uuid references reports(id) on delete cascade,
  dimension  text,
  score      numeric(5,2),
  primary key (report_id,dimension)
);

create table prompt_logs (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid,
  employee_id uuid,
  source      prompt_source,
  prompt      text,
  response    text,
  model       text default 'gpt-4.1',
  created_at  timestamptz default now()
);

-- ENABLE RLS ---------------------------------------------------------
alter table companies          enable row level security;
alter table users              enable row level security;
alter table question_instances enable row level security;
alter table answers            enable row level security;
alter table reports            enable row level security;
alter table prompt_logs        enable row level security;
alter table report_scores      enable row level security;

-- APPLY COMPANY-SCOPED POLICIES -------------------------------------
do $$
declare
  t text;
begin
  for t in select tablename
           from pg_tables
           where schemaname='public'
             and tablename in
              ('companies','users','question_instances',
               'answers','reports','prompt_logs','report_scores') loop
    execute format($$
      create policy %I_select on %I for select
      using (company_id = current_setting('request.jwt.claims', true)::json->>'company_id');$$,
      t||'_sel', t);

    execute format($$
      create policy %I_insert on %I for insert
      with check (company_id = current_setting('request.jwt.claims', true)::json->>'company_id');$$,
      t||'_ins', t);
  end loop;
end$$;
```

---

## 11 · Build / Deployment Checklist

1. **Clone Next JS repo** → set env vars:

   * `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   * `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   * `OPENAI_API_KEY`
2. **Run SQL** above in Supabase.
3. **Configure Clerk**

   * Allow Google OAuth & email/password.
   * Add JWT template:

     ```json
     {
       "jwt_claims": {
         "company_id": "{{ user.publicMetadata.company_id }}"
       }
     }
     ```
4. **Implement pages** from Section 5 with ShadCN components.
5. **AI endpoints**: build `/api/ai/nextQuestion` and `/api/ai/generateReport` using Vercel AI SDK; stream SSE to client.
6. **Report HTML**: compile with React-Email; upload to Supabase Storage bucket `reports`.
7. **Charts**: render in `/app/report` with `react-charts@5`.
8. **Launch on Vercel**; run lighthouse → aim ≥ 90.

---

## 12 · Testing Strategy & Developer Workflow

### 12.1 Testing Stack

**Core Testing Tools**
- **Jest** 29+ : Unit testing framework
- **React Testing Library** 14+ : Component testing
- **Playwright** 1.45+ : End-to-end testing
- **@testing-library/jest-dom** : Custom Jest matchers

### 12.2 Test Structure

```
__tests__/
├── unit/
│   ├── components/
│   ├── lib/
│   ├── utils/
│   └── api/
├── integration/
│   ├── auth/
│   ├── survey/
│   └── reports/
└── e2e/
    ├── manager-flow.spec.ts
    ├── employee-flow.spec.ts
    └── report-sharing.spec.ts
```

### 12.3 Developer Workflow Requirements

**MANDATORY: Run tests before every commit**

```bash
# 1. Unit tests (run on every file change)
npm run test

# 2. Integration tests (run before push)
npm run test:integration

# 3. E2E tests (run before PR)
npm run test:e2e

# 4. Full test suite (CI/CD)
npm run test:all
```

### 12.4 Test Configuration

**Jest Configuration** (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/page.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

module.exports = createJestConfig(customJestConfig)
```

**Playwright Configuration** (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 12.5 Testing Requirements by Component

**API Routes** (Jest + Supertest)
```typescript
// __tests__/unit/api/survey/answer.test.ts
import { POST } from '@/app/api/survey/answer/route'
import { createMocks } from 'node-mocks-http'

describe('/api/survey/answer', () => {
  it('saves answer with RLS validation', async () => {
    // Test implementation
  })
})
```

**Components** (React Testing Library)
```typescript
// __tests__/unit/components/survey/question-card.test.tsx
import { render, screen } from '@testing-library/react'
import QuestionCard from '@/components/survey/question-card'

describe('QuestionCard', () => {
  it('renders question text correctly', () => {
    // Test implementation
  })
})
```

**E2E Flows** (Playwright)
```typescript
// __tests__/e2e/manager-flow.spec.ts
import { test, expect } from '@playwright/test'

test('manager can create company and generate report', async ({ page }) => {
  // Test full manager workflow
})
```

### 12.6 AI Testing Strategy

**Prompt Testing**
- Mock OpenAI responses for consistent tests
- Test prompt template variations
- Validate response parsing logic

**Cost Control Testing**
- Mock API calls to prevent charges during testing
- Test token counting accuracy
- Validate rate limiting logic

### 12.7 Database Testing

**RLS Policy Testing**
```sql
-- Test in Supabase SQL editor
SELECT test_rls_policy('companies', 'manager_user_id');
```

**Migration Testing**
- Test schema changes in branch databases
- Validate data integrity after migrations
- Test rollback procedures

### 12.8 Development Commands

**Package.json Scripts**
```json
{
  "scripts": {
    "test": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:ci && npm run test:e2e"
  }
}
```

### 12.9 Pre-commit Hooks

**Husky + lint-staged** (mandatory)
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "jest --bail --findRelatedTests",
      "git add"
    ]
  }
}
```

### 12.10 CI/CD Testing Pipeline

**GitHub Actions** (`.github/workflows/test.yml`)
1. **Unit Tests**: Run on every push
2. **Integration Tests**: Run on PR to main
3. **E2E Tests**: Run on main branch
4. **Coverage Reports**: Upload to Codecov
5. **Performance Tests**: Lighthouse CI

**Testing Gates**
- ❌ No deployment without 80%+ coverage
- ❌ No PR merge without all tests passing
- ❌ No E2E test failures in production deployment

---