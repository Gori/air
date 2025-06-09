'use client'

import { useMemo } from 'react'

interface RadarChartProps {
  data: Array<{
    dimension: string
    score: number
    justification: string
  }>
}

export function RadarChart({ data }: RadarChartProps) {
  const size = 300
  const center = size / 2
  const maxRadius = size * 0.4
  const maxScore = 5

  const chartData = useMemo(() => {
    // Take first 6 dimensions for better radar chart display
    const limitedData = data.slice(0, 6)
    const angleStep = (2 * Math.PI) / limitedData.length

    return limitedData.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2 // Start from top
      const radius = (item.score / maxScore) * maxRadius
      
      return {
        ...item,
        angle,
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        labelX: center + Math.cos(angle) * (maxRadius + 30),
        labelY: center + Math.sin(angle) * (maxRadius + 30),
      }
    })
  }, [data])

  // Generate grid circles
  const gridCircles = [1, 2, 3, 4, 5].map(level => ({
    level,
    radius: (level / maxScore) * maxRadius
  }))

  // Generate axis lines
  const axisLines = chartData.map(item => ({
    x1: center,
    y1: center,
    x2: center + Math.cos(item.angle) * maxRadius,
    y2: center + Math.sin(item.angle) * maxRadius,
  }))

  // Generate polygon path for the data
  const polygonPath = chartData.length > 0 
    ? `M ${chartData.map(d => `${d.x},${d.y}`).join(' L ')} Z`
    : ''

  const getScoreColor = (score: number) => {
    if (score >= 4) return '#10b981' // green-500
    if (score >= 3) return '#eab308' // yellow-500
    if (score >= 2) return '#f97316' // orange-500
    return '#ef4444' // red-500
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid circles */}
        {gridCircles.map(circle => (
          <circle
            key={circle.level}
            cx={center}
            cy={center}
            r={circle.radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        {polygonPath && (
          <path
            d={polygonPath}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        )}

        {/* Data points */}
        {chartData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={getScoreColor(point.score)}
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {chartData.map((point, index) => (
          <text
            key={index}
            x={point.labelX}
            y={point.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-gray-700"
          >
            <tspan x={point.labelX} dy="0">
              {point.dimension.split(' ')[0]}
            </tspan>
            {point.dimension.split(' ').length > 1 && (
              <tspan x={point.labelX} dy="12">
                {point.dimension.split(' ').slice(1).join(' ')}
              </tspan>
            )}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Strong (4-5)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Moderate (3-4)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Developing (2-3)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Needs Focus (0-2)</span>
        </div>
      </div>
    </div>
  )
} 