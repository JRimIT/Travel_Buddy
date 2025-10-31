"use client"
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { useTopPlaces } from "../../hooks/use-admin-data"

export function LocationsTable() {
  const { data, isLoading } = useTopPlaces(10)

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading locations...</div>
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Booking Count</TableHead>
            <TableHead>Average Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((place: { _id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; bookingCount: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; averageRating: number }) => (
            <TableRow key={place._id}>
              <TableCell>{place.name}</TableCell>
              <TableCell>{place.bookingCount}</TableCell>
              <TableCell>
                {"⭐".repeat(Math.round(place.averageRating))} {place.averageRating.toFixed(1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
