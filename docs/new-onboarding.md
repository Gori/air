### Onboarding refactor: replace `company/register` with `/onboarding/`

This spec introduces a new, survey-style onboarding flow at `/onboarding/` that replaces `company/register`. It reuses the refactored survey components and adds a few new question types. All answers are saved per company and can be edited during the flow before completion. AI-suggested items are clearly labeled “Suggested” and always editable.

---

### Goals
- **Unify UX**: Onboarding should look and behave like the survey (same layout, inputs, keyboard flow).
- **Reusability**: Implement onboarding inputs as reusable components living alongside `src/components/survey/`.
- **Data-first**: Persist all answers for each company; log AI suggestions via existing prompt logs.
- **Minimal changes**: Remove `company/register` and its API; route managers to `/onboarding/`.

---

### Decisions
- **Storage**: Current implementation stores a single JSON payload per company in `companies.description` (JSON string). Migration to `company_onboarding.data` is planned.
- **Completion redirect**: After completion, redirect to `/onboarding/welcome` confirmation page.
- **Edits**: Onboarding can be revisited later to edit answers; no versioning.
- **AI suggestions**: Log prompts/responses to `prompt_logs` only; do not persist suggestion lists in onboarding data.
- **Ranking**: Allow fewer than 3 selections; capture whatever order exists and top-3 if available.
- **Company names**: No constraints beyond being strings.

---

### Implemented input types
Existing: `text`, `scale`, `mc_single`, `mc_multi`.

New/used here:
- **select_single**: Single selection (industry; implemented with `ChoiceList`).
- **multi_slider**: Multiple discrete sliders rendered on one slide.
- Note: `inline_template`, `ranked_list`, and `tags_multi` are not used in v1 of onboarding.

All inputs use the same “chip/scale” visual style as the survey components.

---

### Question set and component mapping (current code)
1. Which industry are you in?
   - Type: `select_single` (implemented via `ChoiceList`)
   - Options (16 + Other): B2B SaaS & Developer Tools • Fintech • Healthtech & Digital Health • Biotech & Pharma • E‑commerce & D2C • Retail & Omnichannel • Manufacturing & Industrial • Supply Chain, Logistics & Mobility • Media, Marketing & Entertainment • Gaming • Edtech • Energy & Climate (Cleantech) • PropTech & Real Estate • Travel & Hospitality • Telecommunications & Connectivity • Professional Services & Agencies • Other
   - Persist: `industry: string`

2. Which niche/segment best fits you?
   - Type: `mc_multi` (chips)
   - AI suggests 3–12 options based on Q1, always includes “Other”
   - Persist: `niches: string[]`, `niches_other?: string`

3. Foundations & Workflows
   - Type: `multi_slider`
   - Sliders (in order):
     - How documented are your workflows? (✋ Not at all → 📗 Perfectly documented)
     - 🧹 Data quality — How clean and reliable is your operational data? (😬 Messy and inconsistent → 💎 Clean, trusted source of truth)
     - 🔗 Tool integration — How integrated are your tools and systems? (🔒 Mostly siloed → 🌐 Fully connected)
   - Persist: `workflow_docs: { documented: number, data_quality: number, tool_integration: number }`

4. AI Readiness & Culture
   - Type: `multi_slider`
   - Sliders (in order):
     - Employees understand why AI matters to our strategy
     - Employees use AI tools as part of their daily workflow.
     - Employees are comfortable experimenting with new AI tools
     - Leaders actively use and encourage AI tools
     - We share what works with AI on a regular rhythm
   - Persist: `ai_readiness: { ai_understanding?: number, ai_usage_learning?: number, ai_experimentation_culture?: number, ai_leadership_engagement?: number, ai_sharing_rhythm?: number }`

5. What slows your teams down most in a normal week?
   - Type: `mc_multi` + Other short text
   - Uses curated list (no AI) + “Other”
   - Persist: `biggest_slowdown_multi: string[]`, `biggest_slowdown_other?: string`

6. If you got 10 hours/week back per team, where would you reinvest first?
   - Type: `mc_multi` (select up to three) + “Other”
   - Persist: `reinvest: string[] (<= 3)`, `reinvest_other?: string`

7. Which business outcome matters most right now?
   - Type: `mc_single`
   - Persist: `primary_outcome: string`

8. Why now for AI-based workflows?
    - Type: `mc_multi` + Other short text, with AI suggestions
    - Persist: `change_enablers: string[]`, `change_enablers_other?: string`

9. Why not now for AI-based workflows?
    - Type: `mc_multi` + Other short text, with AI suggestions
    - Persist: `change_blockers: string[]`, `change_blockers_other?: string`

10. Company basics
    - Type: input + select
    - Persist: `company_name: string`, `headcount_range: "1-10"|"11-50"|"51-200"|"201-1000"|"1000+"`

Notes:
- AI‑suggested items are presented inline and always editable. No explicit “Suggested” badge in v1.
- No hidden follow‑ups; expansions are additive and visible.

---

### Data model
Current (v1): store onboarding JSON in `companies.description` (stringified JSON) keyed by company.

Planned: `company_onboarding`
- `company_id` (text, PK, references `companies.id`)
- `data` (jsonb) – the full payload
- `created_at` (timestamptz default now)
- `updated_at` (timestamptz default now)

Example `data` shape (current code):
```json
{
  "industry": "Fintech",
  "niches": ["Payments orchestration", "KYC/KYB"],
  "niches_other": "",
  "workflow_docs": {"documented": 4, "data_quality": 3, "tool_integration": 4},
  "ai_readiness": {"ai_understanding": 3, "ai_usage_learning": 4, "ai_experimentation_culture": 4, "ai_leadership_engagement": 3, "ai_sharing_rhythm": 2},
  "biggest_slowdown_multi": ["Handoffs", "Manual data"],
  "biggest_slowdown_other": null,
  "reinvest": ["Ship faster", "Fix data hygiene"],
  "reinvest_other": null,
  "primary_outcome": "Retention/churn reduction",
  "change_enablers": ["Leadership air cover"],
  "change_enablers_other": null,
  "change_blockers": ["Peak season"],
  "change_blockers_other": null,
  "company_name": "Acme AB",
  "headcount_range": "51-200"
}
```

Additional logging:
- Reuse `prompt_logs` for any AI suggestions (source: `question_selection`). Include context inputs and the final suggestions returned.

---

### API
Base: `/api/onboarding`

- `POST /api/onboarding/start`
  - Returns: `{ data: Record<string, unknown> }` from `companies.description` (JSON-parsed; `{}` if none)
- `PATCH /api/onboarding/save`
  - Body: `{ data: object }` (partial patch)
  - Merges into existing JSON and saves back to `companies.description`
  - Returns: `{ success: true, data: object }`
- `POST /api/onboarding/complete`
  - Copies canonical fields onto `companies`:
    - `industry` from `data.industry`
    - `headcount` from `data.headcount` if present; otherwise maps `headcount_range` → approximate number
    - `name` from `data.company_name`
  - Returns: `{ success: true, redirect: "/onboarding/welcome" }`
- `POST /api/onboarding/suggest`
  - Body: `{ type: string, context: object }`
  - Returns: `{ suggestions: string[] }` (deduped, concise, with `Other` appended when applicable)

Auth:
- Clerk auth required. Endpoints ensure the user is linked to a company and set role to `manager` if missing.

AI:
- Model: `gpt-4.1-mini-2025-04-14`
- The prompt requests strict JSON: `{ "suggestions": ["..."] }`; response is logged to `prompt_logs` with `source = 'question_selection'`.

---

### UI/UX
Routes: `/onboarding/`, `/onboarding/welcome`
- Use the existing `SurveyLayout` for header, progress, and footer controls.
- Each question is a slide. Keyboard shortcuts match survey (Enter/→ for next, ← for back).
- AI suggestions are shown inline with options; no explicit “Suggested” label in v1.
- After completion, show the `/onboarding/welcome` confirmation page.
- Onboarding can be revisited later without versioning; edits overwrite previous values.

Reusable components under `src/components/survey/`:
- `SelectSingle.tsx` – dropdown single-select (wraps shadcn `Select`)
- `MultiSlider.tsx` – reusable multi-slider component used by onboarding
- `ChoiceList.tsx`, `MultiChoiceList.tsx`, `QuestionMultiChoice.tsx` – chips and list helpers

Composition:
- `src/app/onboarding/page.tsx` builds a `slides: Slide[]` array using `select_single`, `mc_multi`, `mc_single`, and `multi_slider`.
- Suggestions are prefetched when a prior slide completes and shown inline.
- `src/app/onboarding/welcome/page.tsx` renders the confirmation screen.

---

### Persistence rules
- Persist on each change (optimistic) and on Continue.
- Store user edits over suggestions; suggestions themselves are not persisted.
- `reinvest` allows up to three selections; no ranking UI.
- `headcount` is inferred from `headcount_range` on completion if not provided.

---

### Migration plan
1) DB
- Keep current storage in `companies.description` for v1.
- Introduce `company_onboarding` and migrate existing JSON there.
- Generate/update Supabase types.

2) API
- Continue using `/api/onboarding/start|save|complete|suggest` with `company_onboarding` once migration is done.
- Remove `/api/company/register` after `/onboarding` is live.

3) UI
- Keep `/onboarding/page.tsx`.
- Delete `src/app/(dashboard)/company/register/*` and `CompanyOnboardingForm` after parity verification.

4) Navigation
- Anywhere we route to `company/register`, update to `/onboarding`.

5) Cleanup
- Remove now-unused `industry` picker from the old form.

---

### Open questions
- None (decisions captured above)

### Delivery plan (phased)
Phase 1 – Foundations (0.5–1 day)
- Schema: add `company_onboarding`
- API: `start`, `save` (no AI), `complete`
- UI: `/onboarding` scaffolding with 1–2 simple slides (Q1, Q14) and `/onboarding/welcome`

Phase 2 – Components (1–1.5 days)
- Implement `SelectSingle`, `InlineTemplate`, `MultiSlider`, `RankedList`, `TagsMulti`
- Wire remaining slides without AI suggestions

Phase 3 – AI suggestions (1 day)
- `suggest` endpoint using `gpt-4.1-mini-2025-04-14`
- Tag “Suggested” UX; log to `prompt_logs`

Phase 4 – Replace and clean (0.5 day)
- Remove `company/register` page + API
- Update links/redirects

Risk/notes
- Ranking drag-and-drop adds a small dependency (`@hello-pangea/dnd`), but keeps code minimal and modern.
- JSONB storage keeps the model evolvable without frequent migrations.


