"use client"

import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react"
import { useTopPlaces } from "../../hooks/use-admin-data"

export function PopularDestinations() {
  const { data, isLoading } = useTopPlaces(5)

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return (
    <div className="space-y-3">
      {data?.map((place: { _id: Key | null | undefined; name: any; bookingCount: any; averageRating: number }, index: number) => (
        <div key={place._id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {index + 1}
            </div>
            <div>
              <p className="font-medium leading-tight">{place.name}</p>
              <p className="text-xs text-muted-foreground">{place.bookingCount} bookings</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-yellow-500">{"★".repeat(Math.round(place.averageRating))}</p>
            <p className="text-xs text-muted-foreground">{place.averageRating.toFixed(1)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
