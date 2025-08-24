'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function GuestSurveyRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/sign-up') }, [router])
  return null
}


