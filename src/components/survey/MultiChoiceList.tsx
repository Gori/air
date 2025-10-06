interface MultiChoiceListProps {
  items: string[]
  selected: string[]
  onToggle: (id: string) => void
}

export function MultiChoiceList({ items, selected, onToggle }: MultiChoiceListProps) {
  const set = new Set(selected)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((it) => {
        const isActive = set.has(it)
        return (
          <button
            key={it}
            type="button"
            onClick={() => onToggle(it)}
            className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors flex items-center gap-3 ${isActive ? 'border-black bg-gray-50' : 'bg-white hover:border-black hover:bg-gray-50'}`}
          >
            <span className={`inline-flex items-center justify-center w-4 h-4 rounded ${isActive ? 'bg-black text-white' : 'border'}`}>{isActive ? '✓' : ''}</span>
            <div className="text-base font-medium">{it}</div>
          </button>
        )
      })}
    </div>
  )
}


