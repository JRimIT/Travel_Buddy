"use client"

import { useUsersStats } from "../../hooks/use-admin-data"
import { Badge } from "../../components/ui/badge"

export function TopContributors() {
  const { data, isLoading } = useUsersStats()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-3">
      {data?.topUsers?.slice(0, 5).map((user: any, i: number) => (
        <div key={user._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
              {i + 1}
            </div>
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">
                {user.tripCount} trips • {user.bookingCount} bookings
              </p>
            </div>
          </div>
          <Badge variant={i === 0 ? "default" : "secondary"}>
            {user.bookingCount > 5 ? "VIP" : "Active"}
          </Badge>
        </div>
      ))}
    </div>
  )
}