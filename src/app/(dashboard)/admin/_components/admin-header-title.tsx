"use client"

import { usePathname } from "next/navigation"

const map: Record<string, string> = {
  "/admin/overview": "Overview",
  "/admin/answers": "Answers",
  "/admin/users": "Users",
  "/admin/report": "Report",
}

export function AdminHeaderTitle() {
  const pathname = usePathname()
  const entry = Object.keys(map).find((k) => pathname.startsWith(k))
  const title = entry ? map[entry] : "Admin"
  return <h1 className="text-2xl font-medium tracking-normal font-sans">{title}</h1>
}


