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
- **Storage**: Single JSONB payload per company in `company_onboarding.data` (no normalization).
- **Completion redirect**: After completion, redirect to `/onboarding/welcome` confirmation page.
- **Edits**: Onboarding can be revisited later to edit answers; no versioning.
- **AI suggestions**: Log prompts/responses to `prompt_logs` only; do not persist suggestion lists in onboarding data.
- **Ranking**: Allow fewer than 3 selections; capture whatever order exists and top-3 if available.
- **Company names**: No constraints beyond being strings.

---

### New question types (in addition to existing)
Existing: `welcome`, `intro`, `text`, `scale`, `mc_single`, `mc_multi`, `matrix`, `ai_followup`, `end`.

New types to add:
- **select_single**: Dropdown single-select (e.g., industry)
- **inline_template**: Inline sentence with 4 short-text inputs (value statement)
- **multi_slider**: One slide that contains one or more discrete sliders. Each slider has a prompt, min label, max label, and an array of mid-value descriptions used to describe the current position.
- **ranked_list**: Drag-and-drop rank ordering; we capture full order and top-3
- **tags_multi**: Chips with freeform add (user can add custom items in addition to options)

Each new type gets a focused component and a compact value schema. They should be designed with the same “chip/scale” style as survey inputs.

---

### Question set and component mapping
1. Which industry are you in?
   - Type: `select_single`
   - Options (16 + Other): B2B SaaS & Developer Tools • Fintech • Healthtech & Digital Health • Biotech & Pharma • E‑commerce & D2C • Retail & Omnichannel • Manufacturing & Industrial • Supply Chain, Logistics & Mobility • Media, Marketing & Entertainment • Gaming • Edtech • Energy & Climate (Cleantech) • PropTech & Real Estate • Travel & Hospitality • Telecommunications & Connectivity • Professional Services & Agencies • Other
   - Persist: `industry: string`

2. Which niche/segment best fits you?
   - Type: `mc_multi` (chips)
   - AI suggests 3–16 options based on Q1, always includes “Other”
   - Persist: `niches: string[]`, `niches_other?: string`

3. Complete your one-line value statement.
   - Type: `inline_template`
   - Template: “We help {buyer role/title}, {verb} {object} so they can {outcome}.”
   - Persist raw fields + composed string:
     - `value_stmt: { buyer_role: string, verb: string, object: string, outcome: string, text: string }`

4. Who usually buys your product?
   - Type: `mc_multi` (chips) with AI suggestions from Q1–Q3
   - Persist: `buyer_roles: string[]`

5. Who uses it day to day?
   - Type: `mc_multi` (chips) with AI suggestions from Q1–Q3
   - Persist: `user_roles: string[]`

6. How documented are your workflows (be honest)?
   - Type: `multi_slider`
   - Sliders:
     - "How documented are your workflows?" — min "✋ Not at all" to max "📗 Perfectly documented"
     - "How important is documentation to your process?" — min "✋ Not at all" to max "👩‍🏫 Document first, work later"
   - Persist: `workflow_docs: { documented: number, importance: number }` where 0 is min and max equals descriptors+1

7. What slows your teams down most in a normal week?
   - Type: `mc_single` + Other short text
   - Core list + AI adds 4–10 industry-specific items
   - Persist: `biggest_slowdown: string`, `biggest_slowdown_other?: string`

8. What did people stop doing after your last change to how you work?
   - Type: `text` (≤100 chars)
   - Persist: `stopped_doing: string`

9. If you got 10 hours/week back per team, where would you reinvest first?
   - Type: `ranked_list` (drag top — up to 3; fewer allowed). 6–12 tailored options with “Other”
   - Persist: `reinvest: { ranking: string[], top3: string[], other?: string }`

10. Which business outcome matters most right now?
    - Type: `mc_single`
    - AI offers 6–10 KPI phrasings aligned with industry/value statement (no numbers)
    - Persist: `primary_outcome: string`

11. What would make now the RIGHT time to change how you work?
    - Type: `mc_multi` + Other short text, with AI suggestions
    - Persist: `change_enablers: string[]`, `change_enablers_other?: string`

12. What would make now the WRONG time to change how you work?
    - Type: `mc_multi` + Other short text, with AI suggestions
    - Persist: `change_blockers: string[]`, `change_blockers_other?: string`

13. What is the name of your company?
    - Type: `tags_multi` (chips with free add) with AI-suggested names
    - Persist: `company_names: string[]`

14. How many employees do you have?
    - Type: `number`
    - Persist: `headcount: number`

Notes:
- All AI‑suggested items are labeled “Suggested” in the UI and are fully editable.
- No hidden follow‑ups; expansions are additive and visible.

---

### Data model
Add a new table to store onboarding answers per company. Keep structured, evolvable, and minimal.

Table: `company_onboarding`
- `company_id` (text, PK, references `companies.id`)
- `data` (jsonb) – the full payload described above
- `created_at` (timestamptz default now)
- `updated_at` (timestamptz default now)

Example `data` shape:
```json
{
  "industry": "Fintech",
  "niches": ["Payments orchestration", "KYC/KYB"],
  "value_stmt": {"buyer_role":"CFOs","verb":"forecast","object":"cash with confidence","outcome":"avoid shortfalls","text":"We help CFOs, forecast cash with confidence so they can avoid shortfalls."},
  "buyer_roles": ["CFO", "VP Operations"],
  "user_roles": ["Accountants", "CS reps"],
  "workflow_docs": {"documented":4,"importance":3},
  "biggest_slowdown": "Handoffs",
  "stopped_doing": "Stopped double-entering invoices in two systems.",
  "reinvest": {"ranking":["Ship faster","Fix data hygiene","More customer time"],"top3":["Ship faster","Fix data hygiene","More customer time"],"other":null},
  "primary_outcome": "Retention/churn reduction",
  "change_enablers": ["Leadership air-cover"],
  "change_blockers": ["Peak season"],
  "company_names": ["Acme AB", "Acme Labs", "Acme AI"],
  "headcount": 180
}
```

Additional logging:
- Reuse `prompt_logs` for any AI suggestions (source: `question_selection`). Include context inputs and the final suggestions returned.

---

### API
Base: `/api/onboarding`

- `POST /api/onboarding/start` → returns current onboarding `data` for the manager’s company or `{}` if none
- `PATCH /api/onboarding/save` → upsert partial `data` JSON for the company (id from Clerk session)
- `POST /api/onboarding/complete` → marks onboarding complete; copies selected canonical fields onto `companies` (e.g., `industry`, `headcount`) and redirects to `/onboarding/welcome`
- `POST /api/onboarding/suggest` → returns AI suggestions given the current context (Q1–Qx)

Auth:
- Clerk required; role must be `manager`.

AI:
- Model: `gpt-4.1-mini-2025-04-14` (single source of truth)
- Log prompt/response to `prompt_logs` with `source = 'question_selection'`

---

### UI/UX
Routes: `/onboarding/`, `/onboarding/welcome`
- Use the existing `SurveyLayout` for header, progress, and footer controls.
- Each question is a slide. Keyboard shortcuts match survey (Enter/→ for next, ← for back).
- “Suggested” items are visually tagged next to the chip/text.
- After completion, show the `/onboarding/welcome` confirmation page.
- Onboarding can be revisited later without versioning; edits overwrite previous values.

Reusable components to add under `src/components/survey/`:
- `SelectSingle.tsx` – dropdown single-select (wraps shadcn `Select`)
- `InlineTemplate.tsx` – renders the sentence with four `Input`s; emits both fields and composed text
- `MultiSlider.tsx` – reusable multi-slider component used by onboarding
- `RankedList.tsx` – drag-and-drop list; capture full order and top3 (recommended: `@hello-pangea/dnd`)
- `TagsMulti.tsx` – chips with add/remove; accepts initial suggestions

Composition:
- New page `src/app/onboarding/page.tsx` builds a `slides: Slide[]` array using new types and existing ones (`text`, `mc_multi`, `mc_single`, `scale`).
- For dynamic suggestion calls, prefetch when a prior slide completes; show suggestions inline with a “Suggested” badge.
 - Add `src/app/onboarding/welcome/page.tsx` for the confirmation screen.

---

### Persistence rules
- Save on each Continue click (PATCH), optimistic UI.
- Headcount numeric validation (positive integer, max reasonable bound e.g., 100000).
- Always store user edits over suggestions; suggestions are not required to persist.
- Ranked list: allow fewer than 3 items; compute `top3` from available items (<= 3).

---

### Migration plan
1) DB
- Create `company_onboarding` as above.
- Generate types via Supabase types pipeline.

2) API
- Add `/api/onboarding/start|save|complete|suggest` routes.
- Remove `/api/company/register` after `/onboarding` is live.

3) UI
- Create `/onboarding/page.tsx`.
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


