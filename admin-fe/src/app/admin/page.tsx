"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { DashboardStats } from "../../components/admin/dashboard-stats";
import { RecentTrips } from "../../components/admin/recent-trips";
import { PopularDestinations } from "../../components/admin/popular-destinations";
import { useAuth } from "@/src/lib/auth-context";
import { SupportDashboard } from "../support/support-dashboard";
import Unauthorized from "../unauthorized/page";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (user?.role === "support") {
    return <SupportDashboard />;
  }

  if (user?.role === "user") {
    return <Unauthorized />;
  }

  return (
    <main className="flex-1 space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      <DashboardStats />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTrips />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <PopularDestinations />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
