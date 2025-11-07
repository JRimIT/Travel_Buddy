"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useReviewStats } from "../../hooks/use-admin-data"

// Tooltip tùy chỉnh
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload[0]) {
    const rating = payload[0].payload.rating
    const count = payload[0].value
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700">
          {rating} sao
        </p>
        <p className="text-sm font-medium text-amber-600">
          {count.toLocaleString("vi-VN")} lượt đánh giá
        </p>
      </div>
    )
  }
  return null
}

export function ReviewRatingChart() {
  const { data, isLoading } = useReviewStats()

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  const chartData = Array.from({ length: 5 }, (_, i) => ({
    rating: i + 1,
    count: data?.ratingDistribution?.find((r: any) => r.rating === i + 1)?.count || 0,
  }))

  const hasData = chartData.some(item => item.count > 0)

  if (!hasData) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Không có đánh giá nào
      </div>
    )
  }

  // Tìm giá trị lớn nhất để scale trục Y hợp lý
  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const yMax = Math.ceil(maxCount * 1.1) // thêm 10% khoảng trống

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        
        <XAxis
          dataKey="rating"
          tickFormatter={(value) => `${value} sao`}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        
        <YAxis
          domain={[0, yMax]}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
          allowDecimals={false}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Bar
          dataKey="count"
          fill="#f59e0b"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}