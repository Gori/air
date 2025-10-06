import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface TagsMultiProps {
  values: string[]
  suggestions?: string[]
  onChange: (next: string[]) => void
}

export function TagsMulti({ values, suggestions = [], onChange }: TagsMultiProps) {
  const [draft, setDraft] = useState('')
  const add = (v: string) => {
    const val = v.trim()
    if (!val) return
    if (values.includes(val)) return
    onChange([...values, val])
    setDraft('')
  }
  const remove = (v: string) => onChange(values.filter(x => x !== v))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {values.map(v => (
          <span key={v} className="px-3 py-1 rounded-full border text-sm flex items-center gap-2">
            {v}
            <button type="button" onClick={() => remove(v)} aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add name" className="max-w-sm" />
        <Button type="button" variant="outline" onClick={() => add(draft)}>Add</Button>
      </div>
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Suggested</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} type="button" className="px-3 py-1 rounded-full border text-sm" onClick={() => add(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


