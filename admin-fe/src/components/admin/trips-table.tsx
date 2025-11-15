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
import { toast } from "../../components/ui/use-toast"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"

// Định dạng VND
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
  status?: "pending_review" | "approved" | "rejected"
}

interface TripDetail extends Trip {
  description: string
  budget: { flight: number; hotel: number; fun: number }
  days: Array<any>
  image: string
  user: { username: string; email: string }
  rejectReason?: string
}

interface TripsTableProps {
  filters?: Record<string, any>
}

export function TripsTable({ filters = {} }: TripsTableProps) {
  const [page, setPage] = useState(1)
  const { data, isLoading, mutate } = useTrips(page, 10, filters)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)

  // Modal state
  const [selectedTrip, setSelectedTrip] = useState<TripDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Reject modal
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)

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
      const mappedDetail = {
        ...detail,
        status:
          detail.status === "pending_review" ||
            detail.status === "approved" ||
            detail.status === "rejected"
            ? detail.status
            : undefined,
      } as TripDetail
      setSelectedTrip(mappedDetail)
      setIsModalOpen(true)
    } catch (error) {
      console.error("Không thể tải chi tiết chuyến đi:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin chuyến đi.",
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
      toast({ title: "Thành công", description: "Chuyến đi đã được duyệt và công khai." })
      mutate()
      setIsModalOpen(false)
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" })
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
      toast({ title: "Bắt buộc", description: "Vui lòng nhập lý do từ chối.", variant: "destructive" })
      return
    }
    try {
      await apiClient.rejectTripApproval(rejectingId!, rejectReason.trim())
      toast({ title: "Đã từ chối", description: "Chuyến đi đã bị từ chối." })
      mutate()
      setShowRejectDialog(false)
      setIsModalOpen(false)
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" })
    } finally {
      setRejectingId(null)
    }
  }

  if (isLoading && !data) {
    return <TableSkeleton rows={6} cols={6} />
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
                <TableHead className="min-w-[200px]">Tiêu đề</TableHead>
                <TableHead className="min-w-[160px]">Người tạo</TableHead>
                <TableHead className="min-w-[140px]">Ngày bắt đầu</TableHead>
                <TableHead className="min-w-[140px]">Ngày kết thúc</TableHead>
                <TableHead className="min-w-[120px]">Hiển thị</TableHead>
                <TableHead className="min-w-[120px]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Không tìm thấy chuyến đi nào.
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
                        {trip.isPublic ? "Công khai" : "Riêng tư"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trip.status === "approved" ? "default" :
                            trip.status === "rejected" ? "destructive" :
                              "outline"
                        }
                      >
                        {trip.status === "pending_review" ? "Chờ duyệt" :
                          trip.status === "approved" ? "Đã duyệt" :
                            trip.status === "rejected" ? "Bị từ chối" : "N/A"}
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
            Trang {page} / {totalPages}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}

      {/* CHI TIẾT CHUYẾN ĐI */}
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
                  src={selectedTrip.image || 'https://static.vecteezy.com/system/resources/previews/000/209/171/non_2x/road-trip-scene-vector.jpg'}
                  alt={selectedTrip.title}
                  className="w-full h-auto max-h-64 object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://static.vecteezy.com/system/resources/previews/000/209/171/non_2x/road-trip-scene-vector.jpg';
                  }}
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Người tạo:</strong> {selectedTrip.user.username} ({selectedTrip.user.email || "N/A"})
                </div>
                <div>
                  <strong>Thời gian:</strong> {formatDateSafe(selectedTrip.startDate)} → {formatDateSafe(selectedTrip.endDate)}
                </div>
                <div>
                  <strong>Ngân sách:</strong>
                  <div className="ml-2">
                    <div>Máy bay: {formatVND(selectedTrip.budget.flight)}</div>
                    <div>Khách sạn: {formatVND(selectedTrip.budget.hotel)}</div>
                    <div>Hoạt động: {formatVND(selectedTrip.budget.fun)}</div>
                  </div>
                </div>
                <div>
                  <strong>Tổng cộng:</strong>{" "}
                  {formatVND(selectedTrip.budget.flight + selectedTrip.budget.hotel + selectedTrip.budget.fun)}
                </div>
              </div>

              {selectedTrip.description && (
                <div>
                  <strong>Mô tả:</strong>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedTrip.description}</p>
                </div>
              )}

              <div>
                <strong>Lịch trình:</strong>
                <ScrollArea className="h-64 mt-2 border rounded p-3">
                  {selectedTrip.days.map((day: any, i: number) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <p className="font-medium text-sm">
                        Ngày {day.day}: {formatDateSafe(day.date)}
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

              {selectedTrip.rejectReason && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <strong>Lý do từ chối:</strong>
                  <p className="mt-1 text-sm text-red-600">{selectedTrip.rejectReason}</p>
                </div>
              )}

              <DialogFooter className="flex justify-end gap-3 pt-4 border-t">
                {selectedTrip.status === "pending_review" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => {
                        setIsModalOpen(false)
                        openRejectDialog(selectedTrip._id as string)
                      }}
                      disabled={rejectingId === selectedTrip._id}
                    >
                      Từ chối
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(selectedTrip._id as string)}
                      disabled={approvingId === selectedTrip._id}
                    >
                      {approvingId === selectedTrip._id ? "Đang duyệt..." : "Duyệt & Công khai"}
                    </Button>
                  </>
                )}
                <Button onClick={() => setIsModalOpen(false)}>Đóng</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* TỪ CHỐI CHUYẾN ĐI */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối chuyến đi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Lý do từ chối <span className="text-red-500">*</span></Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do chi tiết..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 min-h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Hủy
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectingId === null}
            >
              {rejectingId ? "Đang từ chối..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}