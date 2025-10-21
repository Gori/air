'use client'

import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SummaryRadarChartProps {
  title: string
  data: Array<{ dimension: string; score: number }>
  color?: string
}

export function SummaryRadarChart({ title, data, color = '#10b981' }: SummaryRadarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsRadarChart data={data}>
            <PolarGrid className="stroke-neutral-200" />
            <PolarAngleAxis dataKey="dimension" className="text-xs" />
            <PolarRadiusAxis angle={90} domain={[0, 5]} className="text-xs" />
            <Radar name="Score" dataKey="score" stroke={color} fill={color} fillOpacity={0.6} />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

