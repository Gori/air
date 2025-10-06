interface ChoiceItem {
  id: string
  title: string
  description: string
  colorClass?: string
}

interface ChoiceGridProps {
  items: ChoiceItem[]
  onSelect: (id: string) => void
}

export function ChoiceGrid({ items, onSelect }: ChoiceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onSelect(it.id)}
          className={`text-left rounded-2xl border px-5 py-4 transition-colors hover:border-black ${it.colorClass || 'bg-white'}`}
        >
          <div className="text-base font-semibold mb-1">{it.title}</div>
          <div className="text-sm text-gray-600">{it.description}</div>
        </button>
      ))}
    </div>
  )
}


