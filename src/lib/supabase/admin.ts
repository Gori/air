import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

/**
 * Supabase Admin Client - BYPASSES Row Level Security (RLS)
 *
 * This client uses the service role key and should only be used in
 * server-side code where RLS bypass is intentional and necessary.
 *
 * APPROVED USE CASES:
 * - Cross-company data access (admin operations)
 * - User creation/updates before user context exists
 * - Aggregations across multiple companies
 * - Background jobs without user context
 * - Auth helper functions that verify permissions before querying
 *
 * SECURITY REQUIREMENTS:
 * - Always verify user permissions BEFORE using this client
 * - Never expose in client-side code
 * - Log sensitive operations for audit trails
 * - Prefer user-scoped client when RLS can handle authorization
 *
 * For user-scoped operations with RLS, use createServerClient from
 * @supabase/ssr with the user's session instead.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) 