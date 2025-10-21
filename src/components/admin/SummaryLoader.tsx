'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function SummaryLoader() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    let mounted = true

    async function generateSummary() {
      try {
        const response = await fetch('/api/admin/summary/generate', {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Failed to generate summary')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        while (true) {
          const { done } = await reader.read()
          if (done) break
        }

        if (mounted) {
          router.refresh()
        }
      } catch (error) {
        console.error('Summary generation error:', error)
        if (mounted) {
          setStatus('error')
        }
      }
    }

    generateSummary()

    return () => {
      mounted = false
    }
  }, [router])

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-red-600">Failed to generate summary. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
        <div className="space-y-2">
          <p className="text-lg font-medium">Generating your AI readiness summary...</p>
          <p className="text-sm text-neutral-500">This may take a minute. Please wait.</p>
        </div>
      </div>
    </div>
  )
}

