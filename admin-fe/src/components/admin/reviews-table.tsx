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
      console.error("Error hiding review:", error)
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
      console.error("Error showing review:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && !data) {
    return <div className="flex justify-center py-12">Loading reviews...</div>
  }

  const reviews: Review[] = Array.isArray(data) ? data : data?.reviews || []
  const totalPages = data?.totalPages || (Array.isArray(data) ? Math.ceil(data.length / 10) : 1)

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No reviews found.
      </div>
    )
  }

  return (
    <div className="space-y-4 relative">
      {showLoadingIndicator && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <Table className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Target Type</TableHead>
            {/* <TableHead>Target ID</TableHead> */}
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review._id}>
              <TableCell className="font-medium">
                {review.user?.username || "Unknown"}
              </TableCell>

              <TableCell>
                <Badge variant={review.targetType === "TripSchedule" ? "default" : "secondary"}>
                  {review.targetType === "TripSchedule" ? "TripSchedule" : "Place"}
                </Badge>
              </TableCell>

              {/* <TableCell className="font-mono text-xs">
                {review.targetId.slice(-8)}
              </TableCell> */}

              <TableCell>
                <span className="text-yellow-500">{"★".repeat(review.rating)}</span>
                <span className="text-muted-foreground ml-1">
                  {"☆".repeat(5 - review.rating)}
                </span>
              </TableCell>

              <TableCell className="max-w-xs truncate" title={review.comment}>
                {review.comment}
              </TableCell>

              <TableCell>
                <Badge variant={review.status === "visible" ? "default" : "secondary"}>
                  {review.status}
                </Badge>
              </TableCell>

              <TableCell>
                {review.status === "visible" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleHideReview(review._id)}
                    disabled={actionLoading === review._id}
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
          ))}
        </TableBody>
      </Table>

      {/* Pagination – chỉ hiện nếu có nhiều trang */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || showLoadingIndicator}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages || showLoadingIndicator}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}