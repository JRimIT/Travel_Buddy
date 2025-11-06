"use client"

import { useSalesWeekly } from "../../hooks/use-admin-data"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, defs, linearGradient, stop } from "recharts"

export function AnalyticsChart() {
  const { data, isLoading } = useSalesWeekly()

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading chart...</div>
  }

  const chartData = [
    { name: "This Week", value: data?.total || 0 },
  ]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--color-primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--color-primary))" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
        <XAxis dataKey="name" stroke="hsl(var(--color-muted-foreground))" tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--color-muted-foreground))" tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: 'hsl(var(--color-card))', border: '1px solid hsl(var(--color-border))', borderRadius: 8 }} />
        <Area type="monotone" dataKey="value" stroke="hsl(var(--color-primary))" fillOpacity={1} fill="url(#colorPrimary)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
