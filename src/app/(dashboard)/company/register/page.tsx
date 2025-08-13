'use client'

import { CompanyOnboardingForm } from '@/components/forms/company-onboarding-form'

export default function CompanyRegisterPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 >
          Company Setup
        </h1>
        <p className=" mt-2">
          Set up your organization to start the AI readiness assessment.
        </p>
      </div>
      <CompanyOnboardingForm />
    </div>
  )
} 