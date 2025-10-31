"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { AnalyticsChart } from "../../../components/admin/analytics-chart"
import { useSalesTotal, useSalesWeekly } from "../../../hooks/use-admin-data"
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react"

export default function AnalyticsPage() {
  const { data: totalData } = useSalesTotal()
  const { data: weeklyData } = useSalesWeekly()

  const metrics = [
    {
      title: "Total Revenue",
      value: totalData ? `${totalData.totalRevenue.toLocaleString("vi-VN")}đ` : "Loading...",
      icon: DollarSign,
    },
    {
      title: "Weekly Revenue",
      value: weeklyData ? `${weeklyData.total.toLocaleString("vi-VN")}đ` : "Loading...",
      icon: TrendingUp,
    },
    {
      title: "Total Bookings",
      value: totalData ? totalData.totalBookings : "Loading...",
      icon: Calendar,
    },
    {
      title: "Active Users",
      value: "1,234",// cần lấy từ api nếu có
      icon: Users,
    },
  ]

  return (
    <main className="flex-1 space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track performance metrics and insights</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {/* <p className="text-xs text-muted-foreground">{metric.change} from last period</p> */}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsChart />
        </CardContent>
      </Card>
    </main>
  )
}
