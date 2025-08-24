import * as React from "react"
import { cn } from "@/lib/utils"

type DivProps = React.HTMLAttributes<HTMLDivElement>
type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>

export function PageHeader({ className, ...props }: DivProps) {
  return (
    <div
      {...props}
      className={cn("flex items-center justify-between mb-6", className)}
    />
  )
}

export function PageTitle({ className, ...props }: HeadingProps) {
  return (
    <h1
      {...props}
      className={cn("text-xl font-medium tracking-tight", className)}
    />
  )
}


