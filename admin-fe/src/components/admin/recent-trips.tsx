"use client"

import { useState } from "react"
import { useTripApprovals } from "../../hooks/use-admin-data"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { toast } from "../../components/ui/use-toast"
import { format, isValid } from "date-fns"
import { Key } from "react"
import { apiClient } from "../../lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { ScrollArea } from "../../components/ui/scroll-area"

const formatVND = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDateSafe = (dateInput: string | number | Date): string => {
  if (!dateInput) return "N/A"
  const date = new Date(dateInput)
  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid"
}

interface TripPending {
  _id: Key
  title: string
  startDate: string | number | Date
  endDate: string | number | Date
  user: { username: string; email: string }
  status?: string
  isPublic: boolean
}

interface TripDetail extends TripPending {
  description: string
  budget: { flight: number; hotel: number; fun: number }
  days: Array<any>
  image: string
  hotelDefault: any
  flightTicket: any
  reviewedBy?: { username: string }
  rejectReason?: string
}

const ITEMS_PER_PAGE = 5

export function RecentTrips() {
  const { data, isLoading, mutate } = useTripApprovals()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTrip, setSelectedTrip] = useState<TripDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Reject modal
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const rawTrips: any[] = data?.trips || []
  const pendingTrips: TripPending[] = rawTrips
    .filter((trip): trip is TripPending => {
      return trip.status === "pending_review" || (!trip.status && !trip.isPublic)
    })

  const totalPages = Math.ceil(pendingTrips.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayedTrips = pendingTrips.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const openDetail = async (id: string) => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return
    setIsLoadingDetail(true)
    try {
      const detail = await apiClient.getTripDetail(id)
      setSelectedTrip(detail)
      setIsModalOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load trip details.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    try {
      await apiClient.approveTripApproval(id)
      toast({ title: "Success", description: "Trip approved and published." })
      mutate()
      setIsModalOpen(false)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setApprovingId(null)
    }
  }

  const openRejectDialog = (id: string) => {
    setRejectingId(id)
    setRejectReason("")
    setShowRejectDialog(true)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({ title: "Required", description: "Please provide a reason.", variant: "destructive" })
      return
    }
    try {
      await apiClient.rejectTripApproval(rejectingId!, rejectReason.trim())
      toast({ title: "Rejected", description: "Trip has been rejected." })
      mutate()
      setShowRejectDialog(false)
      setIsModalOpen(false)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setRejectingId(null)
    }
  }

  if (isLoading) return <div className="text-center py-4">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trips Pending Review</h3>
        <Badge variant="secondary">{pendingTrips.length}</Badge>
      </div>

      {pendingTrips.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No trips are pending review
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {displayedTrips.map((trip) => (
              <div
                key={trip._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => openDetail(trip._id as string)}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{trip.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateSafe(trip.startDate)} - {formatDateSafe(trip.endDate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    by {trip.user.username}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">Click to review</div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm self-center">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTrip?.title}</DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-8 text-center">Loading details...</div>
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
                  <strong>Created by:</strong> {selectedTrip.user.username} ({selectedTrip.user.email})
                </div>
                <div>
                  <strong>Duration:</strong> {formatDateSafe(selectedTrip.startDate)} to {formatDateSafe(selectedTrip.endDate)}
                </div>
                <div>
                  <strong>Budget:</strong>
                  <br />
                  Flight: {formatVND(selectedTrip.budget.flight)}
                  <br />
                  Hotel: {formatVND(selectedTrip.budget.hotel)}
                  <br />
                  Activities: {formatVND(selectedTrip.budget.fun)}
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
                    <div key={i} className="mb-4">
                      <p className="font-medium">
                        Day {day.day}: {formatDateSafe(day.date)}
                      </p>
                      <ul className="ml-4 mt-1 space-y-1 text-sm">
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

              <DialogFooter className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => {
                    setIsModalOpen(false)
                    openRejectDialog(selectedTrip._id as string)
                  }}
                  disabled={rejectingId === selectedTrip._id}
                >
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(selectedTrip._id as string)}
                  disabled={approvingId === selectedTrip._id}
                >
                  {approvingId === selectedTrip._id ? "Approving..." : "Approve & Publish"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* REJECT REASON DIALOG */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for rejection <span className="text-red-500">*</span></Label>
              <Textarea
                id="reason"
                placeholder="Enter detailed reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 min-h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectingId === null}
            >
              {rejectingId ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}