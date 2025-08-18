'use client'

import { CompanyOnboardingForm } from '@/components/forms/company-onboarding-form'

export default function CompanyRegisterPage() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-5">
        <h1 className="text-[40px] text-center font-serif font-base">
          Setup your organization.
        </h1>
      </div>
      <CompanyOnboardingForm />
    </div>
  )
} 