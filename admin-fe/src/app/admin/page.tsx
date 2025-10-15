"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Users, Calendar, MapPin, TrendingUp } from "lucide-react"
import { OverviewChart } from "../../components/admin/overview-chart"
import { RecentTrips } from "../../components/admin/recent-trips"
import { PopularDestinations } from "../../components/admin/popular-destinations"
import { useAuth } from "../../lib/auth-context"
import { SupportDashboard } from "../../components/admin/support-dashboard"

const stats = [
  {
    title: "Total Users",
    value: "2,543",
    change: "+12.5%",
    icon: Users,
    trend: "up",
  },
  {
    title: "Active Trips",
    value: "1,234",
    change: "+8.2%",
    icon: Calendar,
    trend: "up",
  },
  {
    title: "Locations",
    value: "856",
    change: "+23.1%",
    icon: MapPin,
    trend: "up",
  },
  {
    title: "Monthly Revenue",
    value: "$45,231",
    change: "+15.3%",
    icon: TrendingUp,
    trend: "up",
  },
]

export default function AdminDashboard() {
  const { user } = useAuth()

  if (user?.role === "support") {
    return <SupportDashboard />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with Travel Buddy today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Popular Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <PopularDestinations />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTrips />
        </CardContent>
      </Card>
    </div>
  )
}
