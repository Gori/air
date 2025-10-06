import { Button } from '@/components/ui/button'

interface QuestionMultiChoiceProps {
  options: string[]
  values: Record<string, boolean>
  preferNot: boolean
  onToggle: (option: string) => void
  onTogglePreferNot: () => void
  disabled?: boolean
  allowPreferNot?: boolean
  optionalTextSlot?: React.ReactNode
}

export function QuestionMultiChoice({
  options,
  values,
  preferNot,
  onToggle,
  onTogglePreferNot,
  disabled = false,
  allowPreferNot = false,
  optionalTextSlot,
}: QuestionMultiChoiceProps) {
  const opts = Array.from(new Set(options))
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap mb-7">
        {opts.map(opt => (
          <Button
            key={`opt-${opt}`}
            type="button"
            size="chip"
            variant={values[opt] ? 'chipActive' : 'chip'}
            onClick={() => onToggle(opt)}
            disabled={disabled}
          >{opt}</Button>
        ))}
        {allowPreferNot && (
          <Button
            type="button"
            size="chip"
            variant={preferNot ? 'chipActive' : 'chip'}
            onClick={() => onTogglePreferNot()}
            disabled={disabled}
          >Prefer not to say</Button>
        )}
      </div>
      {optionalTextSlot}
    </div>
  )
}


