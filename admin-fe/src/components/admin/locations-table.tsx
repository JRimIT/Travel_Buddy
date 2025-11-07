"use client"
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { useTopPlaces } from "../../hooks/use-admin-data"

export function LocationsTable() {
  const { data, isLoading } = useTopPlaces(10)

  if (isLoading) {
    return <div className="flex justify-center py-8">Đang tải địa điểm...</div>
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px]">Tên địa điểm</TableHead>
              <TableHead className="min-w-[160px]">Số lượt đặt</TableHead>
              <TableHead className="min-w-[180px]">Đánh giá trung bình</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((place: { _id: Key | null | undefined; name: any; bookingCount: any; averageRating: number }) => (
              <TableRow key={place._id} className="odd:bg-muted/30 hover:bg-accent/50">
                <TableCell className="font-medium">{place.name}</TableCell>
                <TableCell>{place.bookingCount}</TableCell>
                <TableCell>{"⭐".repeat(Math.round(place.averageRating))} {place.averageRating.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}