import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SelectSingleProps {
  value: string
  options: string[]
  placeholder?: string
  onChange: (value: string) => void
}

export function SelectSingle({ value, options, placeholder, onChange }: SelectSingleProps) {
  return (
    <Select onValueChange={onChange} defaultValue={value}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder || 'Select'} />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}


