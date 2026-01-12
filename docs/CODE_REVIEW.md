# Code Review: AIR (AI Readiness Assessment)

**Review Date:** January 2026
**Codebase:** Next.js 15 + Supabase + Clerk + OpenAI
**Reviewer:** Claude Code Analysis
**Status:** Follow-up review after initial fixes

---

## Executive Summary

AIR is a well-structured Next.js application for conducting AI readiness assessments. The codebase demonstrates solid architectural decisions with clear separation of concerns.

**Previous Review (January 2026):** Fixed 12 high/medium priority issues including standardized API error responses, type definitions, auth helpers, and coverage thresholds.

**This Review:** Identifies 28 remaining issues across security, code quality, and architecture categories. Most are medium or low priority, but several security concerns warrant attention.

**Overall Assessment:** Good foundation with room for improvement in security hardening and type safety.

---

## Issue Summary by Severity

| Severity | Count | Categories |
|----------|-------|------------|
| High | 5 | Security (weak invite codes, unvalidated shared reports, RLS bypass) |
| Medium | 10 | Type assertions, error handling, validation |
| Low | 8 | Code organization, logging, edge cases |
| Info | 5 | Optimization opportunities |

---

## High Priority Issues

### 1. Weak Invite Code Generation
**Location:** `src/app/api/company/register/route.ts:91`
**Severity:** HIGH

The invite code uses only 3 random bytes (24 bits of entropy):
```typescript
const inviteCode = `INV-${randomBytes(3).toString('hex').toUpperCase()}`
```

This produces only ~16.7 million possible codes, making brute-force attacks feasible.

**Recommendation:** Increase to at least 8 bytes (64 bits):
```typescript
const inviteCode = `INV-${randomBytes(8).toString('hex').toUpperCase()}`
```

---

### 2. Shared Report Access Without Rate Limiting
**Location:** `src/app/api/reports/share/[slug]/route.ts`
**Severity:** HIGH

The shared report endpoint has no authentication and no rate limiting. Combined with short shared slugs, this could allow enumeration of reports.

**Issues:**
- No rate limiting on public endpoint
- No logging of access attempts
- Slug validation is minimal

**Recommendation:**
- Add rate limiting (e.g., via middleware or Vercel edge)
- Log access attempts for monitoring
- Consider longer/more complex slugs

---

### 3. Service Role Key Bypasses RLS Globally
**Location:** `src/lib/supabase/admin.ts`
**Severity:** HIGH

The `supabaseAdmin` client uses the service role key which bypasses all Row Level Security policies. This is used throughout the codebase for convenience but increases risk if any endpoint has authorization bugs.

**Current Pattern:**
```typescript
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Recommendation:**
- Audit all uses of `supabaseAdmin`
- Where possible, use user-scoped client with RLS
- Document which operations genuinely require admin access

---

### 4. Personal Survey Tables Use Type Assertions
**Location:** Multiple files in `src/app/api/personal/survey/`
**Severity:** HIGH

Personal survey routes use `as never` assertions to work around missing/incomplete types:
```typescript
await supabaseAdmin.from('personal_surveys' as never)
await supabaseAdmin.from('personal_answers' as never)
```

This bypasses TypeScript's type checking entirely, hiding potential errors.

**Files Affected:**
- `src/app/api/personal/survey/start/route.ts`
- `src/app/api/personal/survey/answer/route.ts`
- `src/app/api/personal/survey/complete/route.ts`
- `src/app/api/onboarding/complete/route.ts`
- `src/lib/insights/company.ts`

**Recommendation:** Add proper types to `src/types/database.ts` for personal tables (same fix as done previously for `personal_insights`).

---

### 5. Missing HTTPS Enforcement
**Location:** `src/middleware.ts`, `next.config.ts`
**Severity:** HIGH (Production)

No explicit HTTPS enforcement in middleware. In production, sensitive data (auth tokens, survey answers) should only be transmitted over HTTPS.

**Recommendation:** Add security headers middleware or rely on hosting provider (Vercel handles this automatically).

---

## Medium Priority Issues

### 6. Remaining `as never` Assertions
**Location:** Various files
**Severity:** MEDIUM

Several files still use `as never` assertions:
- `src/app/(auth)/welcome/page.tsx`
- `src/lib/insights/company.ts`
- `src/app/api/reports/current/route.ts:17`

**Recommendation:** Fix underlying type issues rather than suppressing with assertions.

---

### 7. No Validation on Invite Code Join
**Location:** `src/app/api/auth/join/[invite_code]/route.ts`
**Severity:** MEDIUM

Should validate invite code format before database lookup to fail fast on invalid codes.

---

### 8. Error Details Exposed in Development
**Location:** Multiple API routes
**Severity:** MEDIUM

Some routes expose detailed error messages that could leak implementation details:
```typescript
return NextResponse.json({ error: 'DB error', details: error.message }, { status: 500 })
```

**Recommendation:** Only expose detailed errors in development mode.

---

### 9. Large File: Survey Page
**Location:** `src/app/(dashboard)/survey/page.tsx`
**Severity:** MEDIUM

This file is 1048+ lines. Consider splitting into smaller components:
- SurveyProgress
- QuestionRenderer
- AnswerInput
- SurveyNavigation

---

### 10. Missing Pagination on Large Queries
**Location:** `src/app/api/ai/generateReport/route.ts:84-103`
**Severity:** MEDIUM

Fetches all answers for a company without pagination, which could be problematic for companies with many employees.

---

### 11. No Request Body Size Limits
**Location:** API routes
**Severity:** MEDIUM

No explicit body size limits on POST requests. The 16KB limit on answer text is good, but consider enforcing at the middleware level.

---

### 12. Inconsistent Error Response Adoption
**Location:** Various API routes
**Severity:** MEDIUM

Some routes still use manual error responses instead of the standardized `ApiErrors`:
- `src/app/api/company/register/route.ts`
- `src/app/api/auth/join/[invite_code]/route.ts`

---

### 13. Missing Input Sanitization
**Location:** `src/app/api/company/register/route.ts`
**Severity:** MEDIUM

Company name and description are validated for length but not sanitized for potential XSS in downstream rendering.

---

### 14. Sequential Database Operations
**Location:** `src/app/api/admin/users/[id]/route.ts:33-35`
**Severity:** MEDIUM

Delete operations run sequentially:
```typescript
await supabaseAdmin.from('answers').delete().eq('employee_id', targetId)
await supabaseAdmin.from('question_instances').delete().eq('employee_id', targetId)
await supabaseAdmin.from('users').delete().eq('id', targetId)
```

**Recommendation:** Use `Promise.all()` or database transaction if order doesn't matter.

---

### 15. Coverage Thresholds Too Low
**Location:** `jest.config.js`
**Severity:** MEDIUM

Current thresholds are minimal:
```javascript
coverageThreshold: {
  global: {
    branches: 0.5,
    functions: 2,
    lines: 2,
    statements: 2
  }
}
```

**Recommendation:** Incrementally raise thresholds as test coverage improves.

---

## Low Priority Issues

### 16. Broad `select('*')` Queries
**Location:** Multiple files
**Severity:** LOW

Several queries use `select('*')` instead of specifying needed columns. This fetches unnecessary data.

---

### 17. Missing Loading State Skeletons
**Location:** Dashboard pages
**Severity:** LOW

Pages show blank or minimal loading states while fetching data.

---

### 18. Console.error Without Structured Logging
**Location:** All API routes
**Severity:** LOW

Using `console.error` for logging. Consider a structured logging solution for production.

---

### 19. Hardcoded Survey Question Count
**Location:** `src/app/api/personal/survey/start/route.ts:68`
**Severity:** LOW

```typescript
const total = 20
```

This should be derived from the actual questions configuration.

---

### 20. Missing Accessibility Attributes
**Location:** Various components
**Severity:** LOW

Some interactive elements lack proper ARIA labels and keyboard navigation support.

---

### 21. No CSP Headers
**Location:** `next.config.ts`
**Severity:** LOW

No Content Security Policy headers configured. While not critical for an internal tool, it's a security best practice.

---

### 22. Email Send Failures Silently Ignored
**Location:** `src/app/api/company/register/route.ts:153-156`
**Severity:** LOW

Email failures are logged but not surfaced to the user or admin. Consider queuing failed emails for retry.

---

### 23. Missing Index Hints
**Location:** Database queries
**Severity:** LOW

Complex queries might benefit from explicit index usage. Monitor query performance in production.

---

## Info/Optimization Opportunities

### 24. Duplicate Type Definitions
**Location:** `src/types/database.ts`, `src/lib/supabase/database.types.ts`
**Severity:** INFO

Two files define database types. One is auto-generated from Supabase, the other has manual additions.

**Recommendation:** Use a single source of truth, extending the auto-generated types.

---

### 25. Integration Tests Have Mock Issues
**Location:** `__tests__/integration/`
**Severity:** INFO

Integration tests fail due to Clerk/Supabase mock setup issues. These need proper mock configuration to run.

---

### 26. No Query Caching Strategy
**Location:** API routes
**Severity:** INFO

Frequently accessed data (questions, company info) could benefit from caching.

---

### 27. Environment Variable Validation
**Location:** Startup
**Severity:** INFO

No validation that required environment variables are set at startup. Consider using a schema validator.

---

### 28. Bundle Size Optimization
**Location:** Build output
**Severity:** INFO

Consider analyzing and optimizing the client bundle size for better initial load performance.

---

## Test Coverage

### Current State
- **Unit tests:** 3 files (clerk/utils, api-response, validation)
- **Integration tests:** 2 files (have mock issues)
- **E2E tests:** Playwright configured but minimal tests

### Test Commands
```bash
npm run test          # Watch mode
npm run test:ci       # CI mode with coverage
```

### Recommendations
1. Fix integration test mocks
2. Add tests for critical auth flows
3. Add tests for survey start/answer/complete flow
4. Gradually increase coverage thresholds

---

## Positive Patterns to Preserve

1. **Zod validation** - Consistent schema validation across API routes
2. **Two-tier Supabase clients** - Separation of admin vs user access (though audit usage)
3. **Prompt logging** - Good for debugging and cost tracking
4. **Route groups** - Clean URL structure with logical grouping
5. **TypeScript strict mode** - Catches many issues at compile time
6. **Clerk integration** - Well-implemented authentication layer
7. **ApiErrors utility** - Consistent error responses (expand adoption)
8. **Auth helpers** - Reusable authorization patterns

---

## Files Modified Since Last Review

### New Files Created (Previous Review)
- `src/lib/utils/api-response.ts`
- `src/lib/auth/api-auth.ts`
- `__tests__/unit/lib/utils/api-response.test.ts`
- `__tests__/unit/lib/utils/validation.test.ts`

### Files Still Needing Attention
- `src/app/api/personal/survey/*.ts` - Type assertions
- `src/app/api/company/register/route.ts` - Invite code strength
- `src/app/api/reports/share/[slug]/route.ts` - Rate limiting
- `src/lib/insights/company.ts` - Type assertions

---

## Priority Action Items

### Immediate (Security)
1. Increase invite code entropy to 8+ bytes
2. Add rate limiting to shared report endpoint
3. Fix `as never` assertions in personal survey routes

### Short-term (Code Quality)
4. Extend `ApiErrors` adoption to all routes
5. Split large survey page component
6. Fix integration test mocks

### Medium-term (Technical Debt)
7. Audit `supabaseAdmin` usage
8. Add structured logging
9. Increase test coverage thresholds
10. Implement query caching

---

## Conclusion

The AIR codebase has a solid foundation with good architectural patterns. The previous review's fixes improved error handling and type safety significantly. The remaining issues are primarily:

1. **Security hardening** - Stronger invite codes, rate limiting
2. **Type safety** - Eliminating remaining `as never` assertions
3. **Testing** - Expanding coverage and fixing integration tests

No critical vulnerabilities were found, but the high-priority items should be addressed before a production launch with sensitive data.
