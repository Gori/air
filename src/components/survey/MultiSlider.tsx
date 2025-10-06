import { useEffect, useMemo, useState } from 'react'

export interface SliderQuestionSpec {
  id: string
  prompt: string
  minLabel: string
  maxLabel: string
  descriptions: string[]
}

export interface MultiSliderProps {
  items: SliderQuestionSpec[]
  values: Record<string, number | undefined>
  onChange: (next: Record<string, number>) => void
}

function getBucketCount(descriptions: string[]): number {
  return (descriptions?.length || 0) + 2
}

function getDescriptorForIndex(index: number, minLabel: string, maxLabel: string, descriptions: string[]): string {
  const ordered = [minLabel, ...(descriptions || []), maxLabel]
  const clamped = Math.max(0, Math.min(index, ordered.length - 1))
  return ordered[clamped]
}

export function MultiSlider({ items, values, onChange }: MultiSliderProps) {
  const specs = useMemo(() => items || [], [items])
  const [localPos, setLocalPos] = useState<Record<string, number>>({})

  // Sync local state with incoming values when specs change or values are unset
  useEffect(() => {
    setLocalPos(prev => {
      const next = { ...prev }
      for (const q of specs) {
        if (next[q.id] === undefined) {
          const bucketCount = getBucketCount(q.descriptions)
          const maxIndex = Math.max(1, bucketCount - 1)
          const idx = typeof values[q.id] === 'number' ? (values[q.id] as number) : Math.floor(maxIndex / 2)
          next[q.id] = idx / maxIndex
        }
      }
      return next
    })
  }, [specs, values])

  return (
    <div className="space-y-10">
      {specs.map((q) => {
        const bucketCount = getBucketCount(q.descriptions)
        const maxIndex = Math.max(1, bucketCount - 1)
        const normalized = localPos[q.id] ?? (typeof values[q.id] === 'number' ? (values[q.id] as number) / maxIndex : 0.5)
        const nearestIndex = Math.round(normalized * maxIndex)
        const currentLabel = getDescriptorForIndex(nearestIndex, q.minLabel, q.maxLabel, q.descriptions)

        return (
          <div key={q.id} className="space-y-3">
            <div className="text-[18px] font-medium">{q.prompt}</div>

            <div className="px-1">
              <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={normalized}
                onChange={(e) => {
                  const raw = Number(e.target.value)
                  setLocalPos(p => ({ ...p, [q.id]: raw }))
                  const snapped = Math.round(raw * maxIndex)
                  onChange({ [q.id]: snapped })
                }}
                className="air-range w-full cursor-pointer"
                aria-label={q.prompt}
              />

              <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                <div>{q.minLabel}</div>
                <div>{q.maxLabel}</div>
              </div>

              <div className="text-center text-sm text-gray-800 mt-2">{currentLabel}</div>
            </div>
          </div>
        )
      })}
      <style jsx global>{`
        .air-range { -webkit-appearance: none; appearance: none; background: transparent; height: 22px; border-radius: 9999px; }
        .air-range:focus { outline: none; }
        .air-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; height: 22px; width: 22px; background: #ffffff; border: 2px solid #000000; border-radius: 9999px; margin-top: -7px; }
        .air-range::-moz-range-thumb { height: 22px; width: 22px; background: #ffffff; border: 2px solid #000000; border-radius: 9999px; transform: translateY(-7px); }
        .air-range::-ms-thumb { height: 22px; width: 22px; background: #ffffff; border: 2px solid #000000; border-radius: 9999px; }
        .air-range::-webkit-slider-runnable-track { height: 8px; border-radius: 9999px; background: #e5e7eb; }
        .air-range::-moz-range-track { height: 8px; border-radius: 9999px; background: #e5e7eb; }
        .air-range::-ms-track { height: 8px; border-radius: 9999px; background: transparent; border-color: transparent; color: transparent; }
      `}</style>
    </div>
  )
}


