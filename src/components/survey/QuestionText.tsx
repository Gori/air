import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface QuestionTextProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  multiline?: boolean
  placeholder?: string
  maxLength?: number
  showCounter?: boolean
  showOptionalFootnote?: boolean
}

export function QuestionText({
  value,
  onChange,
  disabled = false,
  multiline = true,
  placeholder = '',
  maxLength = 2000,
  showCounter = true,
  showOptionalFootnote = true,
}: QuestionTextProps) {
  return (
    <div>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Share your thoughts. Please don’t paste sensitive data.'}
          className="min-h-[120px] resize-none placeholder:text-gray-400"
          maxLength={maxLength}
          disabled={disabled}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ''}
          className="w-full"
          maxLength={maxLength}
          disabled={disabled}
        />
      )}
      {(showCounter || showOptionalFootnote) && (
        <div className="flex justify-between items-center mt-2 text-xs">
          {showCounter ? <span>{value.length}/{maxLength}</span> : <span />}
          {showOptionalFootnote ? <span>Free‑text is optional</span> : <span />}
        </div>
      )}
    </div>
  )
}


