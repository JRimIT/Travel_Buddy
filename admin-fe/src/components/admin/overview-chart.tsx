"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
  { name: "Jan", users: 186, trips: 80 },
  { name: "Feb", users: 305, trips: 120 },
  { name: "Mar", users: 237, trips: 95 },
  { name: "Apr", users: 273, trips: 140 },
  { name: "May", users: 209, trips: 110 },
  { name: "Jun", users: 314, trips: 165 },
  { name: "Jul", users: 428, trips: 210 },
  { name: "Aug", users: 389, trips: 185 },
  { name: "Sep", users: 356, trips: 170 },
  { name: "Oct", users: 412, trips: 195 },
  { name: "Nov", users: 445, trips: 220 },
  { name: "Dec", users: 478, trips: 245 },
]

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="trips" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
