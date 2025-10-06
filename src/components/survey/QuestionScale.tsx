import { Button } from '@/components/ui/button'

interface QuestionScaleProps {
  value: number | null
  preferNot: boolean
  onChangeValue: (value: number | null) => void
  onTogglePreferNot: () => void
  disabled?: boolean
  allowPreferNot?: boolean
  optionalTextSlot?: React.ReactNode
}

export function QuestionScale({
  value,
  preferNot,
  onChangeValue,
  onTogglePreferNot,
  disabled = false,
  allowPreferNot = false,
  optionalTextSlot,
}: QuestionScaleProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap mb-7">
        {[1, 2, 3, 4, 5].map(n => (
          <Button
            key={n}
            type="button"
            size="chip"
            variant={!preferNot && value === n ? 'chipActive' : 'chip'}
            onClick={() => { onChangeValue(n) }}
            disabled={disabled}
          >{n}</Button>
        ))}
        {allowPreferNot && (
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


