import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { UserButton } from '@/components/auth/user-button'
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarSeparator,
  SidebarGroup,
  SidebarFooter,
  SidebarGroupContent,
} from '@/components/ui/sidebar'
import { AdminNav } from './_components/admin-nav'
import { AdminHeaderTitle } from './_components/admin-header-title'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  // Stronger guard: check DB source of truth first
  const { data: me } = await supabaseAdmin
    .from('users')
    .select('role, company_id')
    .eq('id', userId)
    .single()
  if (!me || me.role !== 'manager' || !me.company_id) redirect('/welcome')
  // Enforce full company setup (canonical fields copied on onboarding complete)
  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('name, industry, headcount')
    .eq('id', me.company_id as string)
    .single()
  const isComplete = Boolean(company?.name && company?.industry && typeof company?.headcount === 'number' && (company?.headcount as number) > 0)
  if (!isComplete) redirect('/welcome')
  return (
    <SidebarProvider>
      <Sidebar className="border-neutral-300">
        <SidebarHeader className="text-2xl font-normal tracking-tight font-sans p-6 flex-row items-center gap-4">
          <svg
            className="size-4"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0V2H13L16 8.5L13 15H3L0 8.5L3 2H7V0H9ZM4.59794 11.7384L8 12.2618L11.4021 11.7384L11.0979 9.76163L8 10.2382L4.90206 9.76163L4.59794 11.7384ZM7 6.75C7 7.44036 6.44036 8 5.75 8C5.05964 8 4.5 7.44036 4.5 6.75C4.5 6.05964 5.05964 5.5 5.75 5.5C6.44036 5.5 7 6.05964 7 6.75ZM10.25 8C10.9404 8 11.5 7.44036 11.5 6.75C11.5 6.05964 10.9404 5.5 10.25 5.5C9.55964 5.5 9 6.05964 9 6.75C9 7.44036 9.55964 8 10.25 8Z"
              fill="#000000"
            />
          </svg>
          <span className="pt-1 text-lg ">AIR</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <AdminNav />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="text-center text-sm pb-8 text-neutral-500">
          madebyVNTRS
        </SidebarFooter>
        <SidebarSeparator />
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between px-8 h-14 pt-6 max-w-7xl">
          <AdminHeaderTitle />
          <UserButton />
        </header>
        <main className="p-8 max-w-7xl">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}


