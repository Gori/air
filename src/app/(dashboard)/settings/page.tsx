'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@/components/auth/user-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
// icons removed
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface CompanyInfo {
  id: string
  name: string
  domain: string
  invite_code: string
  headcount: number
  industry: string
}

interface Employee {
  id: string
  email: string
  full_name: string | null
  role: string
  last_login_at: string | null
  created_at: string
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl mb-2">Settings moved</h1>
      <p>The settings content has moved to the Admin area.</p>
    </div>
  )
} 