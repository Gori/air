'use client'

import { UserButton as ClerkUserButton, useUser } from '@clerk/nextjs'

export function UserButton() {
  const { user } = useUser()
  
  if (!user) return null

  // metadata optionally used later

  return (
    <div className="flex items-center space-x-3">
      <div className="text-right ">
        <div>{user.fullName}</div>
        <div className="flex items-center space-x-2">
          {/* <Badge variant={userRole === 'manager' ? 'default' : 'secondary'}>
            {userRole || 'user'}
          </Badge>
          {companyName && (
            <span>{companyName}</span>
          )} */}
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