"use client"

import { useState } from "react"
import { useTripApprovals } from "../../hooks/use-admin-data"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { toast } from "../../components/ui/use-toast"
import { format, isValid } from "date-fns"
import { Key } from "react"
import { apiClient } from "../../lib/api-client"

interface TripApproval {
  _id: Key
  tripSchedule: {
    title: string
    startDate: string | number | Date
    endDate: string | number | Date
  }
  status: "pending" | "approved" | "rejected"
}

const formatDateSafe = (dateInput: string | number | Date): string => {
  if (!dateInput) return "N/A"
  const date = new Date(dateInput)
  return isValid(date) ? format(date, "dd/MM/yyyy") : String(dateInput)
}

export function RecentTrips() {
  const { data, isLoading, mutate } = useTripApprovals() // mutate để refetch sau khi thay đổi
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const approvals: TripApproval[] = data || []
  const pendingApprovals = approvals
    .filter((a) => a.status === "pending")
    .slice(0, 5)

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    try {
      await apiClient.approveTripApproval(id)
      toast({
        title: "Thành công",
        description: "Chuyến đi đã được duyệt.",
      })
      mutate() // Refetch danh sách
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể duyệt chuyến đi.",
        variant: "destructive",
      })
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (id: string) => {
    setRejectingId(id)
    try {
      await apiClient.rejectTripApproval(id)
      toast({
        title: "Đã từ chối",
        description: "Chuyến đi đã bị từ chối.",
      })
      mutate()
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể từ chối chuyến đi.",
        variant: "destructive",
      })
    } finally {
      setRejectingId(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chuyến đi chờ duyệt</h3>
        {pendingApprovals.length > 0 && (
          <Badge variant="secondary">{pendingApprovals.length}</Badge>
        )}
      </div>

      {pendingApprovals.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Không có chuyến đi nào đang chờ duyệt
        </p>
      ) : (
        <div className="space-y-3">
          {pendingApprovals.map((approval) => (
            <div
              key={approval._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-sm leading-tight">{approval.tripSchedule.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateSafe(approval.tripSchedule.startDate)} -{" "}
                  {formatDateSafe(approval.tripSchedule.endDate)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => handleApprove(approval._id as string)}
                  disabled={approvingId === approval._id || rejectingId === approval._id}
                >
                  {approvingId === approval._id ? "Đang duyệt..." : "Duyệt"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => handleReject(approval._id as string)}
                  disabled={approvingId === approval._id || rejectingId === approval._id}
                >
                  {rejectingId === approval._id ? "Đang từ chối..." : "Từ chối"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}