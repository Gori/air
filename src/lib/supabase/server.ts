import { createServerClient } from '@supabase/ssr'
import { auth } from '@clerk/nextjs/server'
import type { Database } from './database.types'

export async function createServerSupabaseClient() {
  const { sessionClaims } = await auth()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )

  // Set RLS context with company_id from Clerk JWT
  if (sessionClaims?.company_id) {
    await supabase.rpc('set_claim', {
      claim: 'company_id',
      value: sessionClaims.company_id as string
    })
  }

  return supabase
}

// Utility function to get company_id from Clerk auth
export async function getCompanyId(): Promise<string | null> {
  const { sessionClaims } = await auth()
  return sessionClaims?.company_id as string || null
}

// Utility function to get user_id from Clerk auth
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
} 