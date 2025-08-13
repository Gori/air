'use client'

import { UserButton as ClerkUserButton, useUser } from '@clerk/nextjs'
import { Badge } from '@/components/ui/badge'

export function UserButton() {
  const { user } = useUser()
  
  if (!user) return null

  const userRole = user.publicMetadata?.role as string
  const companyName = user.publicMetadata?.company_name as string

  return (
    <div className="flex items-center space-x-3">
      <div className="text-right ">
        <div>{user.fullName}</div>
        <div className="flex items-center space-x-2">
          <Badge variant={userRole === 'manager' ? 'default' : 'secondary'}>
            {userRole || 'user'}
          </Badge>
          {companyName && (
            <span>{companyName}</span>
          )}
        </div>
      </div>
      <ClerkUserButton 
        appearance={{
          elements: {
            userButtonAvatarBox: "w-10 h-10",
            userButtonPopoverCard: ""
          }
        }}
        afterSignOutUrl="/sign-in"
      />
    </div>
  )
} 