import { Briefcase, Banknote, HeartPulse, FlaskConical, ShoppingBag, Store, Factory, Truck, Megaphone, Gamepad2, GraduationCap, Sun, Building2, Plane, Wifi, Users, Code2, Film, Zap, HelpCircle } from 'lucide-react'

type IconName = 'briefcase' | 'bank' | 'health' | 'flask' | 'shop' | 'store' | 'factory' | 'truck' | 'megaphone' | 'game' | 'grad' | 'sun' | 'building' | 'plane' | 'wifi' | 'users' | 'code' | 'film' | 'zap' | 'help'

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  bank: Banknote,
  health: HeartPulse,
  flask: FlaskConical,
  shop: ShoppingBag,
  store: Store,
  factory: Factory,
  truck: Truck,
  megaphone: Megaphone,
  game: Gamepad2,
  grad: GraduationCap,
  sun: Sun,
  building: Building2,
  plane: Plane,
  wifi: Wifi,
  users: Users,
  code: Code2,
  film: Film,
  zap: Zap,
  help: HelpCircle,
}

interface ChoiceItem {
  id: string
  title: string
  icon?: IconName
}

interface ChoiceListProps {
  items: ChoiceItem[]
  onSelect: (id: string) => void
  selectedId?: string
}

export function ChoiceList({ items, onSelect, selectedId }: ChoiceListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((it) => {
        const Icon = iconMap[it.icon || 'briefcase']
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onSelect(it.id)}
            className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors flex items-center gap-3 bg-white ${selectedId === it.id ? 'border-2 border-black bg-gray-50' : 'hover:border-black hover:bg-gray-50'}`}
          >
            <Icon className="w-5 h-5" />
            <div className="text-base font-medium flex-1">{it.title}</div>
            {selectedId === it.id && <span className="text-lg">✓</span>}
          </button>
        )
      })}
    </div>
  )
}


