'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRole } from '@/types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requiredRole,
  redirectTo = '/sign-in' 
}: AuthGuardProps) {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    // Not authenticated
    if (!userId) {
      router.push(redirectTo)
      return
    }

    // Check role requirement
    if (requiredRole && user?.publicMetadata?.role !== requiredRole) {
      router.push('/dashboard') // Redirect to appropriate page
      return
    }

    // Check company assignment for employees
    if (user?.publicMetadata?.role === 'employee' && !user?.publicMetadata?.company_id) {
      router.push('/dashboard') // Will show onboarding
      return
    }

  }, [isLoaded, userId, user, requiredRole, redirectTo, router])

  // Show loading while auth is being determined
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Not authenticated
  if (!userId) {
    return null // Redirecting
  }

  // Role check failed
  if (requiredRole && user?.publicMetadata?.role !== requiredRole) {
    return null // Redirecting
  }

  return <>{children}</>
} 