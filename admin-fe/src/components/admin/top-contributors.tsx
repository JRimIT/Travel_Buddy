"use client"

import { useUsersStats } from "../../hooks/use-admin-data"
import { Badge } from "../../components/ui/badge"
import { User, MapPin, Calendar } from "lucide-react"

export function TopContributors() {
  const { data, isLoading } = useUsersStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  const topUsers = data?.topUsers?.slice(0, 5) || []

  if (topUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có người dùng nổi bật
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {topUsers.map((user: any, i: number) => {
        const isVIP = user.bookingCount > 5
        return (
          <div
            key={user._id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Hạng */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-600" :
                  i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500" :
                  i === 2 ? "bg-gradient-to-br from-orange-400 to-amber-700" :
                  "bg-primary/10 text-primary"
                }`}
              >
                {i + 1}
              </div>

              <div>
                <p className="font-semibold text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {user.tripCount} chuyến
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {user.bookingCount} đặt chỗ
                  </span>
                </p>
              </div>
            </div>

            {/* Badge VIP / Hoạt động */}
            <Badge
              variant={isVIP ? "default" : "secondary"}
              className={isVIP ? "bg-emerald-600 text-white" : ""}
            >
              {isVIP ? "VIP" : "Hoạt động"}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}