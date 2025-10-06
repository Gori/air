import { Button } from '@/components/ui/button'
import { MATRIX_LEVELS, MatrixLevel } from './types'

interface QuestionMatrixProps {
  items: string[]
  selections: Record<string, MatrixLevel>
  onSelect: (item: string, level: MatrixLevel) => void
  disabled?: boolean
  itemDescriptions?: Record<string, string>
}

export function QuestionMatrix({ items, selections, onSelect, disabled = false, itemDescriptions = {} }: QuestionMatrixProps) {
  return (
    <div className="space-y-5">
      {items.map(item => (
        <div key={item} className="space-y-0 pb-3">
          <div className="pt-0 pb-3">
            <div className="font-semibold text-lg">{item}</div>
            {itemDescriptions[item] && (
              <div className="text-sm text-gray-600 mt-1">{itemDescriptions[item]}</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {MATRIX_LEVELS.map(level => (
              <Button
                key={level}
                type="button"
                size="chip"
                variant={selections[item] === level ? 'chipActive' : 'chip'}
                onClick={() => onSelect(item, level)}
                disabled={disabled}
              >{level}</Button>
            ))}
          </div>
        </div>
      ))}
      {!items.every(it => selections[it]) && (
        <div className="text-sm">Please answer every item to continue.</div>
      )}
    </div>
  )
}


