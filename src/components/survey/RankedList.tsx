interface RankedListProps {
  items: string[]
  value: string[]
  onChange: (next: { ranking: string[]; top3: string[] }) => void
}

export function RankedList({ items, value, onChange }: RankedListProps) {
  // Minimal: click to toggle inclusion and move to top; no DnD to keep footprint small
  const toggle = (item: string) => {
    const exists = value.includes(item)
    const next = exists ? value.filter(v => v !== item) : [item, ...value]
    onChange({ ranking: next, top3: next.slice(0, 3) })
  }
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">Tap to select and prioritize (top first). Fewer than 3 allowed.</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {value.map(v => (
          <span key={v} className="px-3 py-1 rounded-full bg-black text-white text-sm">{v}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, idx) => (
          <button key={`${it}-${idx}`} type="button" onClick={() => toggle(it)} className={`px-3 py-1 rounded-full border text-sm ${value.includes(it) ? 'bg-black text-white' : 'bg-white'}`}>
            {it}
          </button>
        ))}
      </div>
    </div>
  )
}


