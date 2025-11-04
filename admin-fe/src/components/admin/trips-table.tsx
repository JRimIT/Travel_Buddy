"use client"

import { Key, useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { useTrips } from "../../hooks/use-admin-data"
import { format, isValid, parse } from "date-fns"
import { Loader2 } from "lucide-react"
import { TableSkeleton } from "./table-skeleton"
import { apiClient } from "../../lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Button } from "../../components/ui/button"

// Format VND
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDateSafe = (dateInput: string | number | Date): string => {
  if (!dateInput) return "N/A"
  const dateString = String(dateInput)
  let date = parse(dateString, 'dd/MM/yyyy', new Date())
  if (!isValid(date)) date = new Date(dateInput)
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateString
}

interface Trip {
  _id: Key | null | undefined
  title: string
  user: { username: string }
  startDate: string | number | Date
  endDate: string | number | Date
  isPublic: boolean
}

interface TripDetail extends Trip {
  description: string
  budget: { flight: number; hotel: number; fun: number }
  days: Array<any>
  image: string
  user: { username: string; email: string }
}

interface TripsTableProps {
  filters?: Record<string, any>
}

export function TripsTable({ filters = {} }: TripsTableProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useTrips(page, 10, filters)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)

  // Modal state
  const [selectedTrip, setSelectedTrip] = useState<TripDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (isLoading && data) {
      timer = setTimeout(() => setShowLoadingIndicator(true), 150)
    } else {
      setShowLoadingIndicator(false)
    }
    return () => timer && clearTimeout(timer)
  }, [isLoading, data])

  const openDetail = async (id: string) => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return
    setIsLoadingDetail(true)
    try {
      const detail = await apiClient.getTripDetail(id)
      setSelectedTrip(detail)
      setIsModalOpen(true)
    } catch (error) {
      console.error("Failed to load trip detail:", error)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  if (isLoading && !data) {
    return <TableSkeleton rows={6} cols={5} />
  }

  const trips: Trip[] = data?.trips || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-4 relative">
      {showLoadingIndicator && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Title</TableHead>
                <TableHead className="min-w-[160px]">User</TableHead>
                <TableHead className="min-w-[140px]">Start Date</TableHead>
                <TableHead className="min-w-[140px]">End Date</TableHead>
                <TableHead className="min-w-[120px]">Visibility</TableHead>
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
                  <TableRow
                    key={trip._id}
                    className="odd:bg-muted/30 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => openDetail(trip._id as string)}
                  >
                    <TableCell className="font-medium">{trip.title}</TableCell>
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
        </div>
      </div>

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

      {/* DETAIL MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedTrip?.title}</DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedTrip ? (
            <div className="space-y-6">
              {selectedTrip.image && (
                <img
                  src={selectedTrip.image}
                  alt={selectedTrip.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Created by:</strong> {selectedTrip.user.username} ({selectedTrip.user.email || "N/A"})
                </div>
                <div>
                  <strong>Duration:</strong> {formatDateSafe(selectedTrip.startDate)} to {formatDateSafe(selectedTrip.endDate)}
                </div>
                <div>
                  <strong>Budget:</strong>
                  <div className="ml-2">
                    <div>Flight: {formatVND(selectedTrip.budget.flight)}</div>
                    <div>Hotel: {formatVND(selectedTrip.budget.hotel)}</div>
                    <div>Activities: {formatVND(selectedTrip.budget.fun)}</div>
                  </div>
                </div>
                <div>
                  <strong>Total:</strong>{" "}
                  {formatVND(selectedTrip.budget.flight + selectedTrip.budget.hotel + selectedTrip.budget.fun)}
                </div>
              </div>

              {selectedTrip.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedTrip.description}</p>
                </div>
              )}

              <div>
                <strong>Itinerary:</strong>
                <ScrollArea className="h-64 mt-2 border rounded p-3">
                  {selectedTrip.days.map((day: any, i: number) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <p className="font-medium text-sm">
                        Day {day.day}: {formatDateSafe(day.date)}
                      </p>
                      <ul className="ml-4 mt-1 space-y-1 text-xs">
                        {day.activities.map((act: any, j: number) => (
                          <li key={j}>
                            <strong>{act.time}</strong>: {act.name} ({act.place?.name || "N/A"}) - {formatVND(act.cost)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}