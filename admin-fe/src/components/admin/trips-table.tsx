"use client"

import { Key, useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { useTrips } from "../../hooks/use-admin-data"
import { format, isValid, parse } from "date-fns"
import { Loader2 } from "lucide-react"

interface Trip {
  _id: Key | null | undefined
  title: string
  user: { username: string }
  startDate: string | number | Date
  endDate: string | number | Date
  isPublic: boolean
}

interface TripsTableProps {
  filters?: Record<string, any>
}

const formatDateSafe = (dateInput: string | number | Date): string => {
  if (!dateInput) return "N/A"
  const dateString = String(dateInput)
  let date = parse(dateString, 'dd/MM/yyyy', new Date())
  if (!isValid(date)) date = new Date(dateInput)
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateString
}

export function TripsTable({ filters = {} }: TripsTableProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useTrips(page, 10, filters)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (isLoading && data) {
      timer = setTimeout(() => setShowLoadingIndicator(true), 150)
    } else {
      setShowLoadingIndicator(false)
    }
    return () => timer && clearTimeout(timer)
  }, [isLoading, data])

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading trips...</div>
  }

  const trips: Trip[] = data?.trips || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-4">
      {showLoadingIndicator && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <Table className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Visibility</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No trips found.
              </TableCell>
            </TableRow>
          ) : (
            trips.map((trip) => (
              <TableRow key={trip._id}>
                <TableCell>{trip.title}</TableCell>
                <TableCell>{trip.user.username}</TableCell>
                <TableCell>{formatDateSafe(trip.startDate)}</TableCell>
                <TableCell>{formatDateSafe(trip.endDate)}</TableCell>
                <TableCell>
                  <Badge variant={trip.isPublic ? "default" : "secondary"}>
                    {trip.isPublic ? "Public" : "Private"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}