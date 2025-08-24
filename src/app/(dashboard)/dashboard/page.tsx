import DashboardClient from './DashboardClient'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  if (user.publicMetadata?.role === 'manager') {
    redirect('/admin/overview')
  }
  return <DashboardClient />
}