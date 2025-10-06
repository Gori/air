import { Button } from '@/components/ui/button'

interface QuestionSingleChoiceProps {
  options: string[]
  value: string | null
  preferNot: boolean
  onSelect: (value: string | null) => void
  onTogglePreferNot: () => void
  disabled?: boolean
  allowPreferNot?: boolean
  showBuiltInPreferNot?: boolean
  optionalTextSlot?: React.ReactNode
}

export function QuestionSingleChoice({
  options,
  value,
  preferNot,
  onSelect,
  onTogglePreferNot,
  disabled = false,
  allowPreferNot = false,
  showBuiltInPreferNot = false,
  optionalTextSlot,
}: QuestionSingleChoiceProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap pb-2">
        {options.map(opt => (
          <Button
            key={opt}
            type="button"
            size="chip"
            variant={!preferNot && value === opt ? 'chipActive' : 'chip'}
            onClick={() => { onSelect(opt) }}
            disabled={disabled}
          >{opt}</Button>
        ))}
        {allowPreferNot && !showBuiltInPreferNot && (
          <Button
            type="button"
            size="chip"
            variant={preferNot ? 'chipActive' : 'chip'}
            onClick={() => { onTogglePreferNot() }}
            disabled={disabled}
          >Prefer not to say</Button>
        )}
      </div>
      {optionalTextSlot}
    </div>
  )
}


