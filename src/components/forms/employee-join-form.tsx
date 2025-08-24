'use client'

import { SignUp } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface EmployeeJoinFormProps {
  companyId: string
  companyName: string
  companyDomain: string
  inviteCode: string
}

export function EmployeeJoinForm({ 
  companyName, 
  companyDomain, 
  inviteCode 
}: EmployeeJoinFormProps) {

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle >Join {companyName}</CardTitle>
        <div className="space-y-2">
          <Badge variant="outline">@{companyDomain}</Badge>
          <p >
            Complete the sign-up process to access your AI readiness assessment
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Domain hint removed per invite-only policy */}

        <SignUp 
          routing="hash"
          afterSignUpUrl={`/api/auth/join/${inviteCode}`}
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border ",
              formFieldInput: "border ",
              footerActionLink: " hover:"
            }
          }}
        />

        <div className="mt-6 text-center">
          <p >
            Already have an account?{' '}
            <a href={`/sign-in?redirect_url=/api/auth/join/${inviteCode}`}>Sign in</a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 