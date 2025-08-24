# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development Workflow
```bash
# Install dependencies
npm install

# Start development server (with Turbopack for fast refresh)
npm run dev

# Build for production
npm run build

# Production server
npm start
```

### Testing (Critical - Must Run Before Commits)
```bash
# Unit tests (watch mode during development)
npm run test

# Full test suite with coverage (pre-commit requirement)
npm run test:ci

# Integration tests only
npm run test:integration

# End-to-end tests with Playwright
npm run test:e2e

# E2E tests with UI (interactive debugging)
npm run test:e2e:ui

# Complete test suite (integration + e2e)
npm run test:all
```

### Code Quality & Formatting
```bash
# Lint code
npm run lint

# Format code with Prettier + Tailwind plugin
npm run format

# Check formatting without fixing
npm run format:check
```

### Environment Setup
```bash
# Copy environment template and fill in secrets
cp env.template .env.local

# Required environment variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - OPENAI_API_KEY (defaults to gpt-5-mini model)
# - RESEND_API_KEY
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3 + React 19.1 + App Router
- **Styling**: TailwindCSS 4.x + ShadCN/ui components
- **Authentication**: Clerk (Google OAuth + Email/Password)
- **Database**: Supabase (Postgres + Row-Level Security)
- **AI**: OpenAI GPT-5 via Vercel AI SDK
- **Email**: Resend + React Email templates
- **Testing**: Jest + React Testing Library + Playwright

### Core Business Logic
This is an **AI-Readiness Assessment SaaS platform** where:
1. **Managers** register their company and invite employees
2. **Employees** complete surveys with AI-powered follow-up questions
3. **AI analyzes responses** across 13 dimensions (0-5 scale)
4. **Reports are generated** with insights and visualizations
5. **Public sharing** via secure slug-based URLs

### Directory Structure
```
src/
├── app/
│   ├── (auth)/           # Sign-in/sign-up pages
│   ├── (dashboard)/      # Protected routes (survey, reports, settings)
│   ├── api/              # API routes for AI, surveys, company management
│   ├── join/[code]/      # Employee invitation handling
│   └── share/[slug]/     # Public report sharing
├── components/
│   ├── ui/               # ShadCN components
│   ├── forms/            # Form components with validation
│   ├── charts/           # Report visualization components
│   └── email/            # React Email templates
├── lib/
│   ├── supabase/         # Database clients and utilities
│   ├── ai/               # OpenAI integration
│   ├── clerk/            # Authentication utilities  
│   └── email/            # Email client setup
└── types/                # TypeScript type definitions
```

### Database Architecture (Supabase)
- **Row-Level Security (RLS)** enforced via `company_id` scoping
- **Service Role Client** used in API routes (admin operations)
- **Anon Client** for browser-side operations
- **Key Tables**: companies, users, questions, question_instances, answers, reports
- **AI Integration**: prompt_logs table for audit trail

### Authentication Flow (Clerk)
- **Custom JWT claims** with `company_id` for RLS
- **Domain validation** enforces single-tenant model
- **Role-based access** (manager vs employee permissions)
- **Middleware protection** for dashboard routes

### AI Integration Pattern
- **Cost controls**: Token counting and rate limiting
- **Prompt logging**: All AI interactions stored for debugging
- **Model configuration**: Environment-based (defaults to gpt-5-mini)
- **Two main workflows**:
  - `/api/ai/nextQuestion` - Dynamic follow-up generation
  - `/api/ai/generateReport` - 13-dimension scoring + narrative

## Development Rules

### Build Philosophy
1. **Minimal, clean, performant solutions only**
2. **Always use latest versions** (React 19, Next 15.3, etc.)
3. **Never build fallbacks or workarounds**
4. **No placeholder features** - everything must be functional
5. **No dev server** - always ask user to test manually

### Testing Requirements (Non-Negotiable)
- **80% minimum coverage** across branches, functions, lines, statements
- **Pre-commit hooks** enforce `npm run test:all`
- **Mock all external services** (OpenAI, Supabase, Clerk) in tests
- **E2E tests** required for all user flows
- **Integration tests** for API routes and database operations

### Code Quality Standards
- **TypeScript strict mode** with proper type safety
- **ESLint + Prettier** with Tailwind plugin
- **Zod schemas** for validation at API boundaries
- **Error handling** with comprehensive try/catch blocks
- **Server/Client component separation** following React 19 patterns

## Common Development Patterns

### API Route Structure
```typescript
// Pattern for protected API routes
const { userId } = await auth()
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const companyId = await getCompanyId()
// Use supabaseAdmin for database operations
const { data, error } = await supabaseAdmin
  .from('table_name')
  .select('*')
  .eq('company_id', companyId)
```

### Database Operations
- **Use `supabaseAdmin`** (service role) in API routes
- **Use `supabase`** (anon client) in components
- **Always include `company_id`** filtering for RLS
- **Validate with Zod schemas** before database operations

### AI Integration
```typescript
// Standard AI call pattern
const aiResponse = await generateAIResponse(prompt, systemPrompt)
// Always log prompts
await supabaseAdmin.from('prompt_logs').insert({...})
```

### Component Patterns
- **Server Components by default** unless interactivity needed
- **ShadCN/ui components** for consistent styling
- **Form validation** with react-hook-form + Zod resolvers
- **Loading states** and error boundaries throughout

## Testing Strategy

### Unit Tests (Jest + RTL)
- Focus on **pure functions** and **component rendering**
- Mock **all external dependencies**
- Test **form validation** and **user interactions**

### Integration Tests
- Test **API routes** with mocked dependencies
- Test **database operations** with test data
- Test **authentication flows** end-to-end

### E2E Tests (Playwright)
- **Manager workflow**: Register → Invite → Generate Report → Share
- **Employee workflow**: Join → Complete Survey → Submit
- **Cross-browser testing** (Chrome, Firefox, Safari)

## Key Files to Understand

### Configuration
- `jest.config.js` - Test configuration with coverage thresholds
- `jest.setup.js` - Test mocks for Clerk, Supabase, OpenAI
- `playwright.config.ts` - E2E test configuration
- `middleware.ts` - Route protection and authentication

### Core Libraries
- `src/lib/supabase/admin.ts` - Service role database client
- `src/lib/ai/client.ts` - OpenAI integration with cost controls
- `src/lib/ai/prompts.ts` - AI prompt templates
- `src/types/database.ts` - Generated Supabase types

### Documentation
- `docs/project.md` - Complete technical specification (800+ lines)
- `docs/roadmap.md` - Development phases and testing requirements
- `README.md` - Quick start guide and overview

## Performance Considerations
- **React 19** with modern patterns (Server Components)
- **Next.js 15.3** with App Router and Turbopack
- **TailwindCSS 4** with optimized builds
- **Minimal client-side JavaScript** through Server Components
- **Optimistic UI updates** where appropriate

## Security Notes
- **Row-Level Security** enforces data isolation
- **Domain validation** prevents cross-company access  
- **API rate limiting** to prevent abuse
- **Input sanitization** via Zod schemas
- **JWT validation** through Clerk middleware

This codebase follows modern React/Next.js patterns with a focus on type safety, testing, and clean architecture. The AI integration is cost-controlled and auditable, while the authentication system ensures proper multi-tenant isolation.
