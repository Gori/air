# AIR - Development Roadmap

**AI-Readiness Assessment SaaS Tool**

*(React 19.1 · Next 15.3 · Supabase · Vercel · June 2025)*

---

## Build Rules

1. **Always build the minimal, clean, performant solution.**
2. **Always use the latest versions of everything.**
3. **Never build fallbacks or workarounds to anything.**

## 🧪 **MANDATORY Testing Rules**

**⚠️ CRITICAL: These rules are non-negotiable for all developers**

### Daily Testing Workflow
```bash
# Before starting work
npm run test:ci

# During development (keep running)
npm run test

# Before every commit (mandatory)
npm run test:all

# Before every PR (mandatory)  
npm run test:e2e
```

### Testing Requirements
- ✅ **80% minimum code coverage** (branches, functions, lines, statements)
- ✅ **All unit tests pass** before committing
- ✅ **All integration tests pass** before pushing
- ✅ **All E2E tests pass** before merging to main
- ✅ **Mock all external APIs** (OpenAI, Supabase, Clerk) in tests
- ✅ **Test RLS policies** for every database query
- ✅ **Pre-commit hooks** must be installed and working

### Testing Stack
- **Jest 29+**: Unit and integration testing
- **React Testing Library 14+**: Component testing  
- **Playwright 1.45+**: End-to-end testing
- **Husky + lint-staged**: Pre-commit testing enforcement

---

## Current Status

✅ **Initial Setup Complete**
- Next.js 15.3.3 with React 19.0.0
- TypeScript configuration
- Tailwind CSS 4.x
- Basic project structure

🔄 **In Progress**
- Project architecture design
- Database schema implementation

❌ **Not Started**
- Authentication system
- Core application features
- AI integration
- UI components

---

## Phase 1: Foundation & Infrastructure (Week 1-2)

### 1.1 Environment & Dependencies Setup

**Priority: Critical**

- [ ] **Install Core Dependencies**
  ```bash
  npm install @supabase/supabase-js@latest
  npm install @clerk/nextjs@latest
  npm install @tanstack/react-router@1.0.5
  npm install @radix-ui/react-* # ShadCN dependencies
  npm install class-variance-authority clsx tailwind-merge
  npm install lucide-react
  npm install ai@latest # Vercel AI SDK
  npm install openai@latest
  npm install resend@latest
  npm install react-email@latest
  npm install @react-email/components@latest
  npm install react-charts@5
  npm install zod@latest
  npm install react-hook-form@latest
  npm install @hookform/resolvers@latest
  ```

- [ ] **Development Dependencies**
  ```bash
  npm install -D @types/uuid
  npm install -D prettier prettier-plugin-tailwindcss
  npm install -D @tailwindcss/typography
  ```

- [ ] **Testing Dependencies**
  ```bash
  npm install -D jest@latest
  npm install -D @testing-library/react@latest
  npm install -D @testing-library/jest-dom@latest
  npm install -D @testing-library/user-event@latest
  npm install -D @playwright/test@latest
  npm install -D jest-environment-jsdom@latest
  npm install -D supertest@latest
  npm install -D @types/supertest
  npm install -D husky@latest
  npm install -D lint-staged@latest
  ```

- [ ] **Environment Variables Setup**
  ```env
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

  # OpenAI
  OPENAI_API_KEY=

  # Resend Email
  RESEND_API_KEY=

  # Next.js
  NEXTAUTH_URL=http://localhost:3000
  ```

### 1.2 Project Structure Setup

**Priority: Critical**

- [ ] **Create Directory Structure**
  ```
  src/
  ├── app/
  │   ├── (auth)/
  │   │   ├── sign-in/
  │   │   └── sign-up/
  │   ├── (dashboard)/
  │   │   ├── dashboard/
  │   │   ├── survey/
  │   │   ├── report/
  │   │   └── settings/
  │   ├── join/[invite_code]/
  │   ├── share/[slug]/
  │   ├── api/
  │   │   ├── ai/
  │   │   ├── auth/
  │   │   ├── company/
  │   │   └── survey/
  │   └── globals.css
  ├── components/
  │   ├── ui/ # ShadCN components
  │   ├── forms/
  │   ├── charts/
  │   └── layouts/
  ├── lib/
  │   ├── supabase/
  │   ├── clerk/
  │   ├── ai/
  │   ├── email/
  │   └── utils/
  └── types/
  ```

- [ ] **Configure ShadCN/UI**
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card input label form select textarea
  npx shadcn@latest add dialog alert progress badge table
  npx shadcn@latest add navigation-menu dropdown-menu
  ```

- [ ] **Setup Testing Infrastructure**
  ```bash
  # Initialize Playwright
  npx playwright install

  # Setup test configuration files
  # jest.config.js, playwright.config.ts, jest.setup.js
  
  # Setup pre-commit hooks
  npx husky init
  echo "npm run test:all" > .husky/pre-commit
  
  # Create test directory structure
  mkdir -p __tests__/{unit,integration,e2e}
  mkdir -p __tests__/unit/{components,lib,utils,api}
  mkdir -p __tests__/integration/{auth,survey,reports}
  ```

- [ ] **Testing Package.json Scripts**
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

### 1.3 Database Setup

**Priority: Critical**

- [ ] **Supabase Project Setup**
  - Create new Supabase project
  - Configure authentication providers (Google OAuth + Email/Password)
  - Set up Row Level Security policies

- [ ] **Run Database Schema** (from project.md Section 10)
  - Execute complete SQL schema in Supabase SQL editor
  - Verify all tables, enums, and policies are created
  - Test RLS policies with sample data

- [ ] **Storage Bucket Setup**
  - Create `reports` bucket in Supabase Storage
  - Configure public access for shared reports
  - Set up CORS for file uploads

---

## Phase 2: Authentication & User Management (Week 2-3)

### 2.1 Clerk Integration

**Priority: Critical**

- [ ] **Clerk Configuration**
  - Set up Clerk application with Google OAuth + Email/Password
  - Configure JWT template with custom `company_id` claim
  - Set up redirect URLs and webhooks

- [ ] **Authentication Components**
  - `src/app/(auth)/sign-in/page.tsx`
  - `src/app/(auth)/sign-up/page.tsx`
  - `src/components/auth/auth-guard.tsx`
  - `src/components/auth/user-button.tsx`

- [ ] **Middleware Setup**
  - `src/middleware.ts` for route protection
  - Auth guards for dashboard routes
  - Domain validation for employee signups

### 2.2 User Onboarding Flow

**Priority: High**

- [ ] **Manager Registration**
  - Company information form
  - Domain validation and setup
  - Invite code generation
  - Initial user profile creation

- [ ] **Employee Invitation System**
  - `/join/[invite_code]` route implementation
  - Domain verification logic
  - Automatic company assignment
  - Welcome email integration

---

## Phase 3: Core Application Logic (Week 3-5)

### 3.1 Database Layer

**Priority: Critical**

- [ ] **Supabase Client Setup**
  - `src/lib/supabase/client.ts` - Browser client
  - `src/lib/supabase/server.ts` - Server client with RLS
  - `src/lib/supabase/admin.ts` - Service role client

- [ ] **Type Generation**
  ```bash
  npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/database.ts
  ```

- [ ] **Database Utilities**
  - `src/lib/supabase/queries.ts` - Common queries
  - `src/lib/supabase/mutations.ts` - Data mutations
  - `src/lib/supabase/rls.ts` - RLS helpers

### 3.2 Question System

**Priority: Critical**

- [ ] **Question Flow Components**
  - `src/components/survey/question-card.tsx`
  - `src/components/survey/progress-indicator.tsx`
  - `src/components/survey/answer-form.tsx`

- [ ] **Survey Logic**
  - Question sequencing algorithm
  - Answer persistence per question
  - Progress tracking
  - Completion validation

- [ ] **Survey API Routes**
  - `src/app/api/survey/start/route.ts`
  - `src/app/api/survey/answer/route.ts`
  - `src/app/api/survey/progress/route.ts`

---

## Phase 4: AI Integration (Week 4-6)

### 4.1 OpenAI Integration

**Priority: Critical**

- [ ] **AI Service Setup**
  - `src/lib/ai/client.ts` - OpenAI client configuration
  - `src/lib/ai/prompts.ts` - Prompt templates
  - `src/lib/ai/types.ts` - AI response types

- [ ] **Follow-up Question Generation**
  - `src/app/api/ai/nextQuestion/route.ts`
  - Implement streaming SSE responses
  - Context building from previous answers
  - Prompt logging to database

- [ ] **Report Generation**
  - `src/app/api/ai/generateReport/route.ts`
  - Scoring algorithm implementation
  - Narrative generation
  - JSON structure validation

### 4.2 Prompt Engineering

**Priority: High**

- [ ] **Question Generation Prompts**
  - Context-aware follow-up generation
  - Maximum 3 follow-ups per core question
  - Relevance scoring

- [ ] **Report Analysis Prompts**
  - 13-dimension scoring (0-5 scale)
  - Narrative bullet points generation
  - Strengths/gaps/recommendations format

---

## Phase 5: Dashboard & UI Components (Week 5-7)

### 5.1 Manager Dashboard

**Priority: High**

- [ ] **Dashboard Overview**
  - `src/app/(dashboard)/dashboard/page.tsx`
  - Employee progress tracking
  - Survey statistics
  - Report generation controls

- [ ] **Employee Management**
  - Employee list with status
  - Invite link management
  - Progress monitoring
  - Remove/re-invite functionality

### 5.2 Employee Survey Interface

**Priority: Critical**

- [ ] **Survey Flow**
  - `src/app/(dashboard)/survey/page.tsx`
  - Question progression UI
  - Answer forms with validation
  - Progress persistence
  - Completion confirmation

- [ ] **Survey Components**
  - Textarea with character limits
  - Progress bar with module indicators
  - Navigation controls
  - Auto-save functionality

---

## Phase 6: Reporting System (Week 6-8)

### 6.1 Report Generation

**Priority: High**

- [ ] **Report Processing**
  - Aggregate all employee answers
  - AI-powered analysis and scoring
  - JSON data structure creation
  - HTML report compilation

- [ ] **React Email Templates**
  - `src/components/email/report-template.tsx`
  - Inline Tailwind CSS compilation
  - Chart generation for email
  - Responsive design

### 6.2 Chart Components

**Priority: Medium**

- [ ] **Visualization Library Setup**
  - Configure `react-charts@5`
  - Custom chart themes
  - Responsive design

- [ ] **Chart Types Implementation**
  - `src/components/charts/bar-chart.tsx` - Dimension averages
  - `src/components/charts/radar-chart.tsx` - Module overview
  - `src/components/charts/heatmap.tsx` - Employee × dimensions
  - `src/components/charts/trend-chart.tsx` - Optional trends

### 6.3 Report Sharing

**Priority: High**

- [ ] **Public Report Access**
  - `src/app/share/[slug]/page.tsx`
  - Static HTML serving from Supabase Storage
  - No authentication required
  - SEO optimization

- [ ] **Share Management**
  - Toggle sharing on/off
  - Regenerate share links
  - Access analytics (optional)

---

## Phase 7: Email & Notifications (Week 7-8)

### 7.1 Email System

**Priority: Medium**

- [ ] **Resend Integration**
  - `src/lib/email/client.ts`
  - Email template compilation
  - Send queue management

- [ ] **Email Templates**
  - Employee invitation emails
  - Survey completion reminders
  - Report ready notifications
  - Welcome messages

---

## Phase 8: Advanced Features (Week 8-9)

### 8.1 Data Export

**Priority: Low**

- [ ] **CSV Export**
  - Raw answer data export
  - Filtered by date/employee
  - Formatted for analysis

- [ ] **Report History** (Optional)
  - Previous report versions
  - Comparison tools
  - Archive management

### 8.2 Analytics Integration

**Priority: Low**

- [ ] **Usage Analytics** (Optional)
  - Plausible Analytics integration
  - Survey completion rates
  - User engagement metrics

---

## Phase 9: Testing & Quality Assurance (Week 9-10)

### 9.1 Testing Strategy

**Priority: Critical**

#### **MANDATORY Developer Testing Workflow**

**Before Every Commit:**
```bash
# 1. Run unit tests for changed files
npm run test

# 2. Run integration tests for affected modules
npm run test:integration

# 3. Run E2E tests for complete user flows
npm run test:e2e

# 4. Verify all tests pass
npm run test:all
```

#### **Testing Requirements by Layer**

- [ ] **Unit Tests (Jest + React Testing Library)**
  - **API Routes**: Test with mocked dependencies
    - `/api/auth/*` - Authentication flows
    - `/api/survey/*` - Question and answer handling
    - `/api/ai/*` - AI integration with mocked OpenAI
    - `/api/company/*` - Company management
  - **Components**: Test rendering and interactions
    - Form components with validation
    - Chart components with data
    - Layout components
    - UI components (ShadCN wrapped)
  - **Utilities**: Test pure functions
    - Database helpers
    - AI prompt builders
    - Email template generators
    - Validation schemas

- [ ] **Integration Tests (Jest)**
  - **Authentication Flow**: Clerk + RLS integration
  - **Survey System**: Question flow + answer persistence
  - **Report Generation**: AI + database + storage integration
  - **Email System**: Resend + template compilation

- [ ] **E2E Tests (Playwright)**
  - **Manager Journey**:
    ```typescript
    test('complete manager workflow', async ({ page }) => {
      // 1. Register company
      // 2. Invite employees
      // 3. Monitor progress
      // 4. Generate report
      // 5. Share report
    })
    ```
  - **Employee Journey**:
    ```typescript
    test('complete employee survey', async ({ page }) => {
      // 1. Accept invitation
      // 2. Complete all questions
      // 3. Handle follow-up questions
      // 4. Submit survey
    })
    ```
  - **Report Sharing**:
    ```typescript
    test('public report access', async ({ page }) => {
      // 1. Access shared report URL
      // 2. Verify chart rendering
      // 3. Test responsive design
      // 4. Validate SEO elements
    })
    ```

#### **AI Testing Strategy**

- [ ] **Mock OpenAI Responses**
  ```typescript
  // __tests__/unit/lib/ai/client.test.ts
  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockResponse)
        }
      }
    }))
  }))
  ```

- [ ] **Cost Control Testing**
  - Token counting accuracy
  - Rate limiting enforcement
  - Error handling for API failures
  - Prompt template validation

#### **Database Testing**

- [ ] **RLS Policy Testing**
  ```sql
  -- Test in Supabase SQL editor
  SET request.jwt.claims = '{"company_id": "test-company-id"}';
  SELECT * FROM companies; -- Should only return test company
  ```

- [ ] **Migration Testing**
  - Test schema changes in development branches
  - Validate data integrity after migrations
  - Test rollback procedures

- [ ] **Performance Testing**
  - Lighthouse audit (target ≥90)
  - Core Web Vitals optimization
  - Database query optimization
  - Bundle size analysis

### 9.2 Security Audit

**Priority: Critical**

- [ ] **Security Review**
  - RLS policy verification
  - JWT claim validation
  - Input sanitization
  - Rate limiting implementation

### 9.3 Test Coverage Requirements

**MANDATORY Coverage Thresholds**
- **Branches**: 80% minimum
- **Functions**: 80% minimum  
- **Lines**: 80% minimum
- **Statements**: 80% minimum

**Testing Gates (CI/CD)**
- ❌ **No deployment without 80%+ coverage**
- ❌ **No PR merge without all tests passing**
- ❌ **No E2E test failures in production**

**Daily Testing Workflow**
```bash
# Morning routine (start of development)
npm run test:ci  # Verify baseline

# During development (after each feature)
npm run test     # Watch mode for immediate feedback

# Before commit (mandatory)
npm run test:all # Full test suite

# Before PR (mandatory)
npm run test:e2e # Cross-browser validation
```

---

## Phase 10: Deployment & Launch (Week 10-11)

### 10.1 Production Setup

**Priority: Critical**

- [ ] **Vercel Deployment**
  - Environment variables configuration
  - Domain setup
  - Edge function optimization

- [ ] **Database Migration**
  - Production Supabase setup
  - Data migration scripts
  - Backup procedures

### 10.2 Monitoring & Maintenance

**Priority: High**

- [ ] **Error Tracking**
  - Sentry integration (optional)
  - Error logging
  - Performance monitoring

- [ ] **Backup & Recovery**
  - Database backup automation
  - File storage backup
  - Disaster recovery plan

---

## Success Metrics

### Technical KPIs
- [ ] **Performance**: Lighthouse score ≥90
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Security**: Zero critical vulnerabilities
- [ ] **Reliability**: 99.9% uptime

### Business KPIs
- [ ] **User Experience**: Survey completion rate >85%
- [ ] **AI Quality**: Report relevance score >4.0/5.0
- [ ] **Performance**: Report generation <30 seconds
- [ ] **Cost Efficiency**: <€0.05 per report generation

---

## Risk Mitigation

### Technical Risks
- **AI Cost Control**: Implement token counting and rate limiting
- **Database Performance**: Optimize queries and implement caching
- **Security**: Regular security audits and RLS testing

### Business Risks
- **User Adoption**: Comprehensive onboarding and documentation
- **Data Quality**: Input validation and AI prompt refinement
- **Scalability**: Monitor usage patterns and optimize accordingly

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1-2 | Week 1-3 | Foundation, Auth, User Management |
| Phase 3-4 | Week 3-6 | Core Logic, AI Integration |
| Phase 5-6 | Week 5-8 | UI, Reporting System |
| Phase 7-8 | Week 7-9 | Email, Advanced Features |
| Phase 9-10 | Week 9-11 | Testing, Deployment |

**Total Estimated Timeline: 11 Weeks**

---

*This roadmap follows the principle of building minimal, clean, and performant solutions using the latest versions of all technologies without fallbacks or workarounds.* 