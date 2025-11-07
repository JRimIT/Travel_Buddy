"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useSalesTrends } from "../../hooks/use-admin-data"

// Format large numbers: 1234567 → "1.23M", 1234 → "1.23K"
const formatAxis = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString("en-US")
}

// Tooltip: show full number + currency
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload[0]) {
    const value = payload[0].value
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700">
          {payload[0].payload.name}
        </p>
        <p className="text-sm text-blue-600 font-bold">
          ${value.toLocaleString("en-US")}
        </p>
      </div>
    )
  }
  return null
}

export function SalesTrendsChart() {
  const { data, isLoading } = useSalesTrends({ groupBy: "month" })

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  const chartData = data?.trends?.map(t => ({
    name: t.period,
    value: t.totalRevenue,
  })) || []

  // If no data
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No revenue data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 50, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        
        <YAxis
          tickFormatter={formatAxis}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
          width={5}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: "#3b82f6", r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}