"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BarChart3, Users, FileText } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const navItems = [
  { href: "/admin/overview", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/answers", label: "Answers", Icon: BarChart3 },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/report", label: "Report", Icon: FileText },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {navItems.map(({ href, label, Icon }) => {
        const isActive = pathname.startsWith(href)
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={href} className="flex w-full">
                <Icon className="text-neutral-500 mr-2" />
                <span>{label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}


