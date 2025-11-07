"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useUsersStats } from "../../hooks/use-admin-data"

export function UserGrowthChart() {
  const { data, isLoading } = useUsersStats()

  if (isLoading) return <div className="h-64 flex items-center justify-center">Loading...</div>

  const chartData = data?.growthTrends?.map((t: { period: any; newUsers: any }) => ({
    name: t.period,
    users: t.newUsers,
  })) || []

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="users" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  )
}