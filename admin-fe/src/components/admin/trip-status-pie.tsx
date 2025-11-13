"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LabelList } from "recharts"
import { useTripStatistics } from "../../hooks/use-admin-data"

const COLORS = {
  approved: "#10b981",   // xanh lá
  rejected: "#ef4444",   // đỏ
  pending: "#f59e0b",    // vàng
  draft: "#6b7280",      // xám
}

// Dịch trạng thái sang tiếng Việt
const STATUS_LABELS: Record<string, string> = {
  approved: "Đã duyệt",
  rejected: "Từ chối",
  pending: "Chờ duyệt",
  draft: "Nháp",
  null: "Chờ duyệt",
}

export function TripStatusPie() {
  const { data, isLoading } = useTripStatistics()

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Đang tải dữ liệu...
      </div>
    )
  }

  const rawData = data?.statusDistribution || []

  const chartData = rawData.map((item: any) => {
    const statusKey = item.status === null ? "pending" : item.status
    return {
      name: STATUS_LABELS[statusKey] || "Khác",
      value: item.count,
      rawStatus: item.status,
    }
  })

  // Tính tổng số chuyến
  const total = chartData.reduce((sum: number, item: any) => sum + item.value, 0)

  // Tooltip tùy chỉnh
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">
            {payload[0].name}
          </p>
          <p className="text-sm font-medium text-gray-600">
            {payload[0].value.toLocaleString("vi-VN")} chuyến
          </p>
        </div>
      )
    }
    return null
  }

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
                {typeof value === "number"
                  ? value >= 1000
                    ? `${(value / 1000).toFixed(1)}N`
                    : value
                  : value}
              </text>
            )}
          />
        </Pie>

        {/* Tổng số ở giữa */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-gray-700"
        >
          {total.toLocaleString("vi-VN")}
        </text>

        <Tooltip content={<CustomTooltip />} />
        
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