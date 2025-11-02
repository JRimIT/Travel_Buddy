"use client"

import { useSalesWeekly } from "../../hooks/use-admin-data"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function AnalyticsChart() {
  const { data, isLoading } = useSalesWeekly()

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading chart...</div>
  }

  const chartData = [
    {
      name: "Weekly Revenue",
      value: data?.total || 0,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  )
}
