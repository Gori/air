import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/supabase/server'
import { ApiErrors } from '@/lib/utils/api-response'
import { NextResponse } from 'next/server'

export interface AuthContext {
  userId: string
  companyId: string | null
  user?: {
    id: string
    role: 'manager' | 'employee'
    company_id: string | null
    email: string | null
    full_name: string | null
  }
}

export type AuthResult =
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse }

export type ManagerAuthResult =
  | { success: true; context: AuthContext & { companyId: string; user: NonNullable<AuthContext['user']> } }
  | { success: false; response: NextResponse }

/**
 * Verify basic authentication for API routes.
 * Returns either auth context or an error response.
 */
export async function verifyAuth(): Promise<AuthResult> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, response: ApiErrors.unauthorized() }
  }

  const companyId = await getCompanyId()

  return {
    success: true,
    context: { userId, companyId }
  }
}

/**
 * Verify authentication and require a company association.
 * Returns either auth context or an error response.
 */
export async function verifyAuthWithCompany(): Promise<AuthResult> {
  const result = await verifyAuth()
  if (!result.success) return result

  if (!result.context.companyId) {
    return { success: false, response: ApiErrors.noCompany() }
  }

  return result
}

/**
 * Verify authentication and require manager role.
 * Fetches user from database to verify role.
 * Returns either auth context with user details or an error response.
 */
export async function verifyManagerAuth(): Promise<ManagerAuthResult> {
  const { userId } = await auth()
  if (!userId) {
    return { success: false, response: ApiErrors.unauthorized() }
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, role, company_id, email, full_name')
    .eq('id', userId)
    .single()

  if (!user || user.role !== 'manager') {
    return { success: false, response: ApiErrors.managerRequired() }
  }

  if (!user.company_id) {
    return { success: false, response: ApiErrors.noCompany() }
  }

  return {
    success: true,
    context: {
      userId,
      companyId: user.company_id,
      user: user as NonNullable<AuthContext['user']>
    }
  }
}

/**
 * Verify that a target user belongs to the same company as the authenticated user.
 * Useful for manager operations on employee data.
 */
export async function verifySameCompany(
  managerCompanyId: string,
  targetUserId: string
): Promise<{ success: true; targetUser: { id: string; company_id: string | null } } | { success: false; response: NextResponse }> {
  const { data: target } = await supabaseAdmin
    .from('users')
    .select('id, company_id')
    .eq('id', targetUserId)
    .single()

  if (!target || target.company_id !== managerCompanyId) {
    return { success: false, response: ApiErrors.notFound('User') }
  }

  return { success: true, targetUser: target }
}
