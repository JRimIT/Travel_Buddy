"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useUsersStats } from "../../hooks/use-admin-data"

// Định dạng tên kỳ (ví dụ: 2025-03 → Tháng 3/25)
const formatPeriod = (period: string): string => {
  return period.replace(/(\d{4})-(\d{2})/, (match, year, month) => {
    return `Tháng ${parseInt(month)}/${year.slice(2)}`
  })
}

// Tooltip tùy chỉnh
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload[0]) {
    const value = payload[0].value
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700">
          {formatPeriod(payload[0].payload.name)}
        </p>
        <p className="text-sm text-emerald-600 font-bold">
          {value.toLocaleString("vi-VN")} người dùng mới
        </p>
      </div>
    )
  }
  return null
}

export function UserGrowthChart() {
  const { data, isLoading } = useUsersStats()

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  const chartData = data?.growthTrends?.map((t: { period: string; newUsers: number }) => ({
    name: t.period,
    users: t.newUsers,
  })) || []

  // Nếu không có dữ liệu
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Không có dữ liệu người dùng mới
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        
        <XAxis
          dataKey="name"
          tickFormatter={formatPeriod}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        
        <YAxis
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Bar
          dataKey="users"
          fill="#10b981"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}