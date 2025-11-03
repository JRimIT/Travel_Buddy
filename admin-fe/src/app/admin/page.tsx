"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { DashboardStats } from "../../components/admin/dashboard-stats"
import { RecentTrips } from "../../components/admin/recent-trips"
import { PopularDestinations } from "../../components/admin/popular-destinations"
import { useAuth } from "@/src/lib/auth-context"
import { SupportDashboard } from "../support/support-dashboard"
import Unauthorized from "../unauthorized/page"
import { PageHeader } from "../../components/admin/page-header"

export default function AdminDashboard() {

  const { user } = useAuth()

  if (user?.role === "support") {
    return <SupportDashboard />
  }

  if (user?.role === "user") {
    return <Unauthorized />
  }

  return (
    <main className="flex-1 space-y-8 p-8">
      <PageHeader
        title="Dashboard"
        description="Welcome to your admin dashboard"
        breadcrumbs={[{ label: "Home", href: "/admin" }, { label: "Dashboard" }]}
      />

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTrips />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Popular Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <PopularDestinations />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
