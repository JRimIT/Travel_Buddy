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
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Checkbox } from "../../components/ui/checkbox"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useReviews } from "../../hooks/use-admin-data"
import { apiClient } from "../../lib/api-client"
import { TableSkeleton } from "./table-skeleton"
import { format } from "date-fns"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip"

// === Types ===
interface UserBasic {
  _id: string
  username: string
  avatar?: string
}

interface PlaceTarget {
  _id: string
  name: string
  image?: string
  title: string
  startDate: string
  endDate: string
}

interface TripScheduleTarget {
  _id: string
  title: string
  image: string
  startDate: string
  endDate: string
  status: string
  user: UserBasic
}

interface Review {
  _id: string
  user: UserBasic
  targetType: "Place" | "TripSchedule"
  target: PlaceTarget | TripScheduleTarget | null
  rating: number
  comment: string
  status: "visible" | "hidden"
  createdAt: string
}

// === Helpers ===
const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy")
  } catch {
    return "—"
  }
}

const getTargetName = (target: any, type: string): string => {
  if (!target) return "Đối tượng đã xóa"
  return type === "Place" ? target.name || "Không tên" : target.title || "Không tên"
}

const getOwnerInfo = (target: any): UserBasic | null => {
  return target?.user || null
}

// === Component ===
export function ReviewsTable({ filters = {} }: { filters?: Record<string, any> }) {
  const [page, setPage] = useState(1)
  const limit = 10
  const { data, isLoading, mutate } = useReviews(page, limit, filters)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Loading indicator delay
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLoading && data) {
      timer = setTimeout(() => setShowLoadingIndicator(true), 150)
    } else {
      setShowLoadingIndicator(false)
    }
    return () => timer && clearTimeout(timer)
  }, [isLoading, data])

  // API actions
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

  const bulkHide = async () => {
    const ids = Array.from(selected)
    setActionLoading("bulk")
    for (const id of ids) {
      await apiClient.hideReview(id)
    }
    setSelected(new Set())
    await mutate()
    setActionLoading(null)
  }

  const bulkShow = async () => {
    const ids = Array.from(selected)
    setActionLoading("bulk")
    for (const id of ids) {
      await apiClient.showReview(id)
    }
    setSelected(new Set())
    await mutate()
    setActionLoading(null)
  }

  // Data handling
  const reviews: Review[] = Array.isArray(data) ? data : data?.reviews || []
  const totalPages = data?.totalPages || Math.ceil(reviews.length / limit)

  if (isLoading && !data) {
    return <TableSkeleton rows={6} cols={7} />
  }

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Không tìm thấy đánh giá nào.
      </div>
    )
  }

  // Selection logic
  const allSelected = reviews.length > 0 && selected.size === reviews.length
  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(reviews.map(r => r._id)) : new Set())
  }
  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  return (
    <div className="space-y-4 relative">
      {/* Loading overlay */}
      {showLoadingIndicator && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-card/70 p-3 text-sm">
          <span className="text-muted-foreground">{selected.size} đánh giá đã chọn</span>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={bulkShow}
              disabled={actionLoading === "bulk"}
            >
              {actionLoading === "bulk" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Hiển thị
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={bulkHide}
              disabled={actionLoading === "bulk"}
            >
              {actionLoading === "bulk" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Ẩn
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
                <TableHead className="min-w-[160px]">Người đánh giá</TableHead>
                <TableHead className="min-w-[220px]">Đối tượng</TableHead>
                <TableHead className="min-w-[100px]">Đánh giá</TableHead>
                <TableHead className="min-w-[220px]">Bình luận</TableHead>
                <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                <TableHead className="min-w-[100px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => {
                const isTrip = review.targetType === "TripSchedule"
                const target = review.target
                const owner = isTrip ? getOwnerInfo(target) : null

                return (
                  <TableRow key={review._id} className="odd:bg-muted/30 hover:bg-accent/50 transition-colors">
                    {/* Checkbox */}
                    <TableCell>
                      <Checkbox
                        checked={selected.has(review._id)}
                        onCheckedChange={(v) => toggleOne(review._id, Boolean(v))}
                        aria-label="Chọn đánh giá"
                      />
                    </TableCell>

                    {/* Người đánh giá */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={review.user.avatar} />
                          <AvatarFallback>{review.user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{review.user.username}</span>
                      </div>
                    </TableCell>

                    {/* Đối tượng (Place / TripSchedule) */}
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          {/* Hình ảnh */}
                          {isTrip && target ? (
                            <img
                              src={target.image || "https://static.vecteezy.com/system/resources/previews/000/209/171/non_2x/road-trip-scene-vector.jpg"}
                              alt={target.title || "Lịch trình"}
                              className="w-12 h-12 rounded object-cover border"
                              onError={(e) => {
                                const img = e.currentTarget
                                img.src = "https://static.vecteezy.com/system/resources/previews/000/209/171/non_2x/road-trip-scene-vector.jpg"
                                img.onerror = null
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs font-medium text-muted-foreground">
                              {review.targetType === "Place" ? "P" : "T"}
                            </div>
                          )}

                          {/* Thông tin */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getTargetName(target, review.targetType)}
                            </p>
                            {isTrip && target && (
                              <p className="text-xs text-muted-foreground">
                                {formatDate(target.startDate)} → {formatDate(target.endDate)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Chủ lịch trình (chỉ với TripSchedule) */}
                        {owner && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Chủ:</span>
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={owner.avatar} />
                            </Avatar>
                            <span>{owner.username}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Đánh giá sao */}
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                        <span className="text-muted-foreground ml-1">{"☆".repeat(5 - review.rating)}</span>
                      </div>
                    </TableCell>

                    {/* Bình luận */}
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="max-w-xs truncate text-sm cursor-help" title={review.comment}>
                              {review.comment || "—"}
                            </p>
                          </TooltipTrigger>
                          {review.comment && (
                            <TooltipContent>
                              <p className="max-w-md">{review.comment}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    {/* Trạng thái */}
                    <TableCell>
                      <Badge variant={review.status === "visible" ? "default" : "secondary"}>
                        {review.status === "visible" ? "Hiển thị" : "Ẩn"}
                      </Badge>
                    </TableCell>

                    {/* Hành động */}
                    <TableCell>
                      {review.status === "visible" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleHideReview(review._id)}
                          disabled={actionLoading === review._id}
                          className="h-8 w-8 p-0"
                        >
                          {actionLoading === review._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowReview(review._id)}
                          disabled={actionLoading === review._id}
                          className="h-8 w-8 p-0"
                        >
                          {actionLoading === review._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} ({reviews.length} đánh giá)
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || showLoadingIndicator}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
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