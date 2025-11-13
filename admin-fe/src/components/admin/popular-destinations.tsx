"use client"

import { Key } from "react"
import { useTopPlaces } from "../../hooks/use-admin-data"
import { MapPin, Star } from "lucide-react"

export function PopularDestinations() {
  const { data, isLoading } = useTopPlaces(5)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  const places = data || []

  if (places.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có điểm đến nào
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {places.map((
        place: { 
          _id: Key | null | undefined
          name: string
          bookingCount: number
          averageRating: number
        }, 
        index: number
      ) => {
        const fullStars = Math.round(place.averageRating)
        const ratingText = place.averageRating.toFixed(1)

        return (
          <div
            key={place._id}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-all duration-200 cursor-default"
          >
            {/* Hạng + Tên + Icon */}
            <div className="flex items-center gap-3">
              {/* Hạng (1,2,3 có màu đặc biệt) */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${
                  index === 0
                    ? "bg-gradient-to-br from-yellow-400 to-amber-600"
                    : index === 1
                    ? "bg-gradient-to-br from-gray-300 to-gray-500"
                    : index === 2
                    ? "bg-gradient-to-br from-orange-400 to-amber-700"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {index + 1}
              </div>

              <div>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary/70" />
                  {place.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {place.bookingCount.toLocaleString("vi-VN")} lượt đặt
                </p>
              </div>
            </div>

            {/* Đánh giá sao */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < fullStars
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-muted text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-yellow-600 ml-1">
                  {ratingText}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                trung bình
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}