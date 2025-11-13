"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { useSalesTotal, useSalesTrends, useUsersStats } from "../../hooks/use-admin-data"
import { DollarSign, TrendingUp, Users, UserCheck, AlertCircle, Calendar } from "lucide-react"

export function DashboardStats() {
  const { data: totalSales } = useSalesTotal()
  const { data: trends } = useSalesTrends({ groupBy: "month" })
  const { data: userStats } = useUsersStats()

  const currentMonth = trends?.trends?.[trends.trends.length - 1]
  const prevMonth = trends?.trends?.[trends.trends.length - 2]
  const revenueGrowth = prevMonth && currentMonth
    ? ((currentMonth.totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue * 100).toFixed(1)
    : null

  const stats = [
    {
      title: "Tổng Doanh Thu",
      value: totalSales?.totalRevenue ? `${totalSales.totalRevenue.toLocaleString("vi-VN")}` : "-",
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      bg: "bg-emerald-50 hover:bg-emerald-100",
    },
    {
      title: "Doanh Thu Tháng",
      value: currentMonth ? `${currentMonth.totalRevenue.toLocaleString("vi-VN")}` : "-",
      change: revenueGrowth !== null
        ? `${parseFloat(revenueGrowth) > 0 ? "+" : ""}${revenueGrowth}%`
        : null,
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      bg: "bg-blue-50 hover:bg-blue-100",
    },
    {
      title: "Tổng Đặt Chỗ",
      value: totalSales?.totalBookings ?? "-",
      icon: <Calendar className="w-5 h-5 text-orange-600" />,
      bg: "bg-orange-50 hover:bg-orange-100",
    },
    {
      title: "Tổng Người Dùng",
      value: userStats?.summary.totalUsers ?? "-",
      icon: <Users className="w-5 h-5 text-purple-600" />,
      bg: "bg-purple-50 hover:bg-purple-100",
    },
    {
      title: "Bị Khóa",
      value: userStats?.summary.lockedUsers ?? "-",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      bg: "bg-red-50 hover:bg-red-100",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {stats.slice(0, 2).map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        {stats.slice(2).map((stat, i) => ( 
          <StatCard key={i + 2} stat={stat} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ stat }: { stat: any }) {
  return (
    <Card className={`shadow-sm border transition-all duration-200 ${stat.bg} hover:shadow-md hover:-translate-y-0.5`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
        <div className="p-2 rounded-full bg-white/80">
          {stat.icon}
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
        {stat.change && (
          <p
            className={`text-xs font-medium mt-1 ${
              stat.change.startsWith("+") ? "text-green-600" : "text-red-600"
            }`}
          >
            {stat.change} so với tháng trước
          </p>
        )}
      </CardContent>
    </Card>
  )
}