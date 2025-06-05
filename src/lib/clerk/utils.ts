import { auth, currentUser } from '@clerk/nextjs/server'
import { UserRole } from '@/types'

export async function getCurrentUser() {
  return await currentUser()
}

export async function getAuthContext() {
  const { userId, sessionClaims } = await auth()
  return {
    userId,
    companyId: sessionClaims?.company_id as string | undefined,
    userRole: sessionClaims?.role as UserRole | undefined,
  }
}

export async function requireAuth() {
  const context = await getAuthContext()
  if (!context.userId) {
    throw new Error('Unauthorized')
  }
  return context
}

export async function requireManager() {
  const context = await requireAuth()
  if (context.userRole !== 'manager') {
    throw new Error('Manager access required')
  }
  return context
}

export function extractEmailDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() || ''
}

export function validateEmailDomain(email: string, companyDomain: string): boolean {
  return extractEmailDomain(email) === companyDomain.toLowerCase()
} 