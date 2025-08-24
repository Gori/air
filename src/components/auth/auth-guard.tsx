'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoaded) return

    // Not authenticated
    if (!userId) {
      router.push(redirectTo)
      return
    }

    // Check role requirement
    if (requiredRole && user?.publicMetadata?.role !== requiredRole) {
      router.push('/dashboard')
      return
    }

    // Manager redirects handled server-side in layout to avoid flash

  }, [isLoaded, userId, user, requiredRole, redirectTo, router, pathname])

  // Show loading while auth is being determined
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p >Loading...</p>
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