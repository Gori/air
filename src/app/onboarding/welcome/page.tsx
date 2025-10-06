'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function OnboardingWelcome() {
  const router = useRouter()
  return (
    <div className="container mx-auto px-6 max-w-2xl py-16 text-center">
      <h1 className="text-[40px]/11 font-serif mb-3">You&apos;re set</h1>
      <p className="text-lg mb-8">Thanks — your onboarding is saved. You can update it any time.</p>
      <div className="flex gap-3 justify-center">
        <Button variant="dark" onClick={() => router.push('/admin/overview')}>Go to admin</Button>
      </div>
    </div>
  )
}


