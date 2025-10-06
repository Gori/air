import { Textarea } from '@/components/ui/textarea'

interface EndSlideProps {
  prompt?: string
  comment: string
  onCommentChange: (value: string) => void
  disabled?: boolean
}

export function EndSlide({ prompt, comment, onCommentChange, disabled = false }: EndSlideProps) {
  return (
    <div className="space-y-3">
      <p>{prompt || 'How would you rate this survey experience?'}</p>
      {/* Consumers should render rating buttons to match their UI */}
      <Textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Any quick feedback? (optional, 140 chars)"
        className="min-h-[80px] resize-none"
        maxLength={140}
        disabled={disabled}
      />
    </div>
  )
}


