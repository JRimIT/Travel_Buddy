"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { useSalesTotal, useSalesWeekly } from "../../hooks/use-admin-data"
import { DollarSign, TrendingUp, Calendar } from "lucide-react"

interface Stat {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
}

export function DashboardStats() {
  const { data: totalData, isLoading: totalLoading } = useSalesTotal()
  const { data: weeklyData, isLoading: weeklyLoading } = useSalesWeekly()

  const stats: Stat[] = [
    {
      title: "Total Revenue",
      value: totalData ? `${totalData.totalRevenue.toLocaleString("vi-VN")}đ` : "Loading...",
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      title: "Weekly Revenue",
      value: weeklyData ? `${weeklyData.total.toLocaleString("vi-VN")}đ` : "Loading...",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      title: "Total Trips",
      value: totalData ? totalData.totalBookings : "Loading...",
      icon: <Calendar className="w-4 h-4" />,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change && <p className="text-xs text-muted-foreground">{stat.change}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
