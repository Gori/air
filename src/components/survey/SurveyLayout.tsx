import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SurveyLayoutProps {
  current: number
  total: number
  heading?: string
  subheading?: string
  isSubmitting?: boolean
  canContinue?: boolean
  onBack: () => void
  onClose: () => void
  onContinue: () => void
  progressPercentage: number
  topChildren?: React.ReactNode
  children?: React.ReactNode
  endMode?: boolean
  prompt?: string
  suspend?: boolean
}

export function SurveyLayout({ current, total, heading, subheading, isSubmitting = false, canContinue = false, onBack, onClose, onContinue, progressPercentage, topChildren, children, endMode = false, prompt, suspend = false }: SurveyLayoutProps) {
  return (
    <div className="pt-0 pb-12">
      <div className="mx-auto max-w-full px-0 mb-2">
        <div className="h-12 flex items-center justify-between px-12 pb-8 pt-9">
          <Button variant="outline" onClick={onBack} className="gap-1 h-9 pr-6 pl-5">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back</span>
          </Button>
          <div className="text-sm text-gray-500">{current} of {total}</div>
          <Button variant="outline" onClick={onClose} className="gap-1 h-9 px-6">
            <span>Close</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Button>
        </div>
        <div className="h-1" />
        <div className="relative h-1 w-full bg-gray-300 rounded-none">
          <div className="absolute left-0 top-0 h-1 bg-black" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className="container mx-auto px-6 max-w-4xl">
        {topChildren}
        {(heading || subheading) && (
          <div className="py-12">
            {heading && <h1 className="text-[40px]/11 text-center font-serif mb-2">{heading}</h1>}
            {subheading && <p className="text-center text-lg">{subheading}</p>}
          </div>
        )}
        {!suspend && (
          <Card>
            <CardContent className="pb-3 pt-2">
              <div className="space-y-6">
                {prompt && (
                  <p className="text-base mb-3">{prompt}</p>
                )}
                {children}
              </div>
            </CardContent>
          </Card>
        )}
        {suspend && (
          <div className="py-20 flex items-center justify-center">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" aria-label="Loading" />
          </div>
        )}
        {!endMode && !suspend && (
          <div className="flex items-center justify-center sticky bottom-0 pt-7 pb-7">
            <Button variant="dark" size="xl" onClick={onContinue} disabled={isSubmitting || !canContinue} className="min-w-[120px]">
              {isSubmitting ? 'Saving...' : (
                <>
                  <span>Continue</span>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


