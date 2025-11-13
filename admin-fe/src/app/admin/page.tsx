"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { DashboardStats } from "../../components/admin/dashboard-stats"
import { SalesTrendsChart } from "../../components/admin/sales-trends-chart"
import { UserGrowthChart } from "../../components/admin/user-growth-chart"
import { TripStatusPie } from "../../components/admin/trip-status-pie"
import { ReviewRatingChart } from "../../components/admin/review-rating-chart"
import { TopContributors } from "../../components/admin/top-contributors"
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
        title="Tổng quan Quản trị"
        description="Theo dõi doanh thu, người dùng, chuyến đi và đánh giá"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Bảng điều khiển" }
        ]}
      />

      {/* 6 quick stats cards */}
      <DashboardStats />

      {/* Revenue & user charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Xu hướng Doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTrendsChart />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tăng trưởng Người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <UserGrowthChart />
          </CardContent>
        </Card>
      </div>

      {/* Distribution charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Trạng thái Chuyến đi</CardTitle>
          </CardHeader>
          <CardContent>
            <TripStatusPie />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Phân bố Đánh giá</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewRatingChart />
          </CardContent>
        </Card>
      </div>

      {/* Top users */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Người đóng góp Hàng đầu</CardTitle>
        </CardHeader>
        <CardContent>
          <TopContributors />
        </CardContent>
      </Card>
    </main>
  )
}