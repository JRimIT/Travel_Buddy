"use client"

import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react"
import { useTopPlaces } from "../../hooks/use-admin-data"

export function PopularDestinations() {
  const { data, isLoading } = useTopPlaces(5)

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {data?.map((place: { _id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; bookingCount: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; averageRating: number }, index: number) => (
        <div key={place._id} className="flex items-center justify-between p-3 border rounded">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
            <div>
              <p className="font-medium">{place.name}</p>
              <p className="text-sm text-muted-foreground">{place.bookingCount} bookings</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{"⭐".repeat(Math.round(place.averageRating))}</p>
            <p className="text-sm text-muted-foreground">{place.averageRating.toFixed(1)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
