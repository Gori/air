import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'

interface AssessmentCardProps {
  href?: string
  title: string
  subtitle?: string
  value?: number
  total?: number
  className?: string
  showChevron?: boolean
}

function ProgressRing({ value = 0, total = 1 }: { value?: number; total?: number }) {
  const clampedTotal = total > 0 ? total : 1
  const progress = Math.max(0, Math.min(1, value / clampedTotal))
  const size = 42
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dash = circumference
  const offset = circumference - progress * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="white" strokeWidth={strokeWidth} strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">{value}/{clampedTotal}</div>
    </div>
  )
}

export function AssessmentCard({ href, title, subtitle, value, total, className, showChevron = true }: AssessmentCardProps) {
  const content = (
    <Card className={className || 'bg-[#abd37a] border-[#68c282] text-black p-4 cursor-pointer transition hover:brightness-95'}>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ProgressRing value={value} total={total} />
            <div>
              <div className="font-sans text-lg font-medium">{title}</div>
              {subtitle ? <div className="text-black/80">{subtitle}</div> : null}
            </div>
          </div>
          {showChevron ? <ChevronRight className="size-6 text-black/80" /> : null}
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block" aria-label={title}>
        {content}
      </Link>
    )
  }
  return content
}

export default AssessmentCard


