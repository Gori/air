'use client'

interface BarChartProps {
  data: Array<{
    dimension: string
    score: number
    justification: string
  }>
}

export function BarChart({ data }: BarChartProps) {
  const maxScore = 5
  
  const getBarColor = (score: number) => {
    if (score >= 4) return 'bg-green-500'
    if (score >= 3) return 'bg-yellow-500'
    if (score >= 2) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 truncate">
              {item.dimension}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {item.score.toFixed(1)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getBarColor(item.score)}`}
              style={{ width: `${(item.score / maxScore) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
} 