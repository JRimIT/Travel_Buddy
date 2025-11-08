"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { AnalyticsChart } from "../../../components/admin/analytics-chart"
import { useSalesTotal, useSalesWeekly } from "../../../hooks/use-admin-data"
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react"
import { PageHeader } from "../../../components/admin/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"

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
      <PageHeader
        title="Analytics"
        description="Track performance metrics and insights"
        breadcrumbs={[{ label: "Home", href: "/admin" }, { label: "Analytics" }]}
        actions={
          <Select defaultValue="this-week">
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Timeframe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This week</SelectItem>
              <SelectItem value="this-month">This month</SelectItem>
              <SelectItem value="this-year">This year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-6 md:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index} className="shadow-sm">
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

      <Card className="shadow-sm">
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
