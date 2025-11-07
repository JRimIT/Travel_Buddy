"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useReviewStats } from "../../hooks/use-admin-data"

export function ReviewRatingChart() {
  const { data, isLoading } = useReviewStats()

  if (isLoading) return <div className="h-64 flex items-center justify-center">Loading...</div>

  const chartData = Array.from({ length: 5 }, (_, i) => ({
    rating: i + 1,
    count: data?.ratingDistribution?.find((r: any) => r.rating === i + 1)?.count || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="rating" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  )
}