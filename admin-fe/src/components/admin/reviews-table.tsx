"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { useReviews } from "../../hooks/use-admin-data"
import { apiClient } from "../../lib/api-client"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Checkbox } from "../../components/ui/checkbox"
import { TableSkeleton } from "./table-skeleton"

interface Review {
  _id: string
  user: { username: string }
  targetType: "Place" | "TripSchedule"
  targetId: string
  rating: number
  comment: string
  status: "visible" | "hidden"
  createdAt: string
}

export function ReviewsTable({ filters = {} }: { filters?: Record<string, any> }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, mutate } = useReviews(page, 10, filters)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (isLoading && data) {
      timer = setTimeout(() => setShowLoadingIndicator(true), 150)
    } else {
      setShowLoadingIndicator(false)
    }
    return () => timer && clearTimeout(timer)
  }, [isLoading, data])

  const handleHideReview = async (reviewId: string) => {
    try {
      setActionLoading(reviewId)
      await apiClient.hideReview(reviewId)
      await mutate()
    } catch (error) {
      console.error("Lỗi khi ẩn đánh giá:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleShowReview = async (reviewId: string) => {
    try {
      setActionLoading(reviewId)
      await apiClient.showReview(reviewId)
      await mutate()
    } catch (error) {
      console.error("Lỗi khi hiển thị đánh giá:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && !data) {
    return <TableSkeleton rows={6} cols={6} />
  }

  const reviews: Review[] = Array.isArray(data) ? data : data?.reviews || []
  const totalPages = data?.totalPages || (Array.isArray(data) ? Math.ceil(data.length / 10) : 1)

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Không tìm thấy đánh giá nào.
      </div>
    )
  }

  const allSelected = reviews.length > 0 && selected.size === reviews.length
  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(reviews.map(r => r._id)))
    else setSelected(new Set())
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const bulkHide = async () => {
    const ids = Array.from(selected)
    for (const id of ids) {
      await apiClient.hideReview(id)
    }
    setSelected(new Set())
    await mutate()
  }

  const bulkShow = async () => {
    const ids = Array.from(selected)
    for (const id of ids) {
      await apiClient.showReview(id)
    }
    setSelected(new Set())
    await mutate()
  }

  return (
    <div className="space-y-4 relative">
      {showLoadingIndicator && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!!selected.size && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card/70 p-3 text-sm">
          <span className="text-muted-foreground">{selected.size} đã chọn</span>
          <div className="space-x-2">
            <Button size="sm" variant="outline" onClick={bulkShow} disabled={showLoadingIndicator}>Hiển thị</Button>
            <Button size="sm" variant="destructive" onClick={bulkHide} disabled={showLoadingIndicator}>Ẩn</Button>
          </div>
        </div>
      )}

      <div className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8">
                  <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} aria-label="Chọn tất cả" />
                </TableHead>
                <TableHead className="min-w-[160px]">Người dùng</TableHead>
                <TableHead className="min-w-[140px]">Loại đối tượng</TableHead>
                <TableHead className="min-w-[140px]">Đánh giá</TableHead>
                <TableHead className="min-w-[260px]">Bình luận</TableHead>
                <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                <TableHead className="min-w-[120px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review._id} className="odd:bg-muted/30 hover:bg-accent/50">
                  <TableCell>
                    <Checkbox checked={selected.has(review._id)} onCheckedChange={(v) => toggleOne(review._id, Boolean(v))} aria-label="Chọn dòng" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {review.user?.username || "Không xác định"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={review.targetType === "TripSchedule" ? "default" : "secondary"}>
                      {review.targetType === "TripSchedule" ? "Lịch trình" : "Địa điểm"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                    <span className="text-muted-foreground ml-1">{"☆".repeat(5 - review.rating)}</span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={review.comment}>
                    {review.comment}
                  </TableCell>
                  <TableCell>
                    <Badge variant={review.status === "visible" ? "default" : "secondary"}>
                      {review.status === "visible" ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {review.status === "visible" ? (
                      <Button size="sm" variant="destructive" onClick={() => handleHideReview(review._id)} disabled={actionLoading === review._id}>
                        {actionLoading === review._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleShowReview(review._id)} disabled={actionLoading === review._id}>
                        {actionLoading === review._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || showLoadingIndicator}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages || showLoadingIndicator}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}