'use client'

import { Button } from '@/components/ui/button'

export function CopyInviteButton({ inviteCode }: { inviteCode: string }) {
  return (
    <Button
      size="default"
      variant="black"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`)
        } catch {}
      }}
    >
      Copy link
    </Button>
  )
}


