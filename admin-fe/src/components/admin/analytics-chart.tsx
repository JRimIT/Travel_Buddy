"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts"

const data = [
  { month: "Jan", revenue: 12400, bookings: 186 },
  { month: "Feb", revenue: 15800, bookings: 305 },
  { month: "Mar", revenue: 13200, bookings: 237 },
  { month: "Apr", revenue: 18900, bookings: 273 },
  { month: "May", revenue: 16500, bookings: 209 },
  { month: "Jun", revenue: 21400, bookings: 314 },
  { month: "Jul", revenue: 24800, bookings: 428 },
  { month: "Aug", revenue: 22300, bookings: 389 },
  { month: "Sep", revenue: 19800, bookings: 356 },
  { month: "Oct", revenue: 23400, bookings: 412 },
  { month: "Nov", revenue: 26100, bookings: 445 },
  { month: "Dec", revenue: 28900, bookings: 478 },
]

export function AnalyticsChart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
        <Line type="monotone" dataKey="bookings" stroke="hsl(var(--chart-3))" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
