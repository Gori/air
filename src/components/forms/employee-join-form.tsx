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
        <CardTitle className="text-xl">Join {companyName}</CardTitle>
        <div className="space-y-2">
          <Badge variant="outline">@{companyDomain}</Badge>
          <p className="text-sm text-gray-600">
            Complete the sign-up process to access your AI readiness assessment
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertDescription>
            <strong>Important:</strong> Please use your work email address with the domain @{companyDomain} 
            to ensure proper access to your company&apos;s assessment.
          </AlertDescription>
        </Alert>

        <SignUp 
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl={`/api/auth/join/${inviteCode}`}
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 p-0",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border border-gray-300",
              formFieldInput: "border border-gray-300",
              footerActionLink: "text-blue-600 hover:text-blue-700"
            }
          }}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a 
              href={`/sign-in?redirect_url=/api/auth/join/${inviteCode}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in instead
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 