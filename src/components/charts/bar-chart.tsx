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
    return ''
  }

  const getScoreColor = (score: number): string => {
    return ''
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="truncate">
              {item.dimension}
            </span>
            <span>
              {item.score.toFixed(1)}
            </span>
          </div>
          
          <div className="w-full rounded-full h-3">
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