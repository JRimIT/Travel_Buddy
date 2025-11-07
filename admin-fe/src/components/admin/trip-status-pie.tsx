"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LabelList } from "recharts"
import { useTripStatistics } from "../../hooks/use-admin-data"

const COLORS = {
  approved: "#10b981",   // green
  rejected: "#ef4444",   // red
  pending: "#f59e0b",    // amber
  draft: "#6b7280",      // gray
}

const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  draft: "Draft",
  null: "Pending",
}

export function TripStatusPie() {
  const { data, isLoading } = useTripStatistics()

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Loading data...
      </div>
    )
  }

  const rawData = data?.statusDistribution || []

  const chartData = rawData.map((item: any) => {
    const statusKey = item.status === null ? "pending" : item.status
    return {
      name: STATUS_LABELS[statusKey] || "Other",
      value: item.count,
      rawStatus: item.status,
    }
  })

  // Calculate total to display in the center
  const total = chartData.reduce((sum: number, item: any) => sum + item.value, 0)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          cornerRadius={6}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.rawStatus === null ? "pending" : (entry.rawStatus as keyof typeof COLORS)]}
            />
          ))}
          <LabelList
            dataKey="value"
            position="inside"
            content={({ value }) => (
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: "12px", fontWeight: "bold", fill: "white" }}
              >
                {value}
              </text>
            )}
          />
        </Pie>

        {/* Display total in the center */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-gray-700"
        >
          {total}
        </text>

        <Tooltip
          formatter={(value: number) => `${value} trips`}
          contentStyle={{ borderRadius: "8px", border: "none", background: "#f9fafb" }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => <span className="text-sm">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}