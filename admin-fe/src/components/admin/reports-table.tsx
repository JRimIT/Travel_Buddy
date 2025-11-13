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
import { useReports } from "../../hooks/use-admin-data"
import { apiClient } from "../../lib/api-client"
import { Loader2, CheckCircle } from "lucide-react"
import { Checkbox } from "../../components/ui/checkbox"
import { TableSkeleton } from "./table-skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

interface Report {
  _id: string
  reporter: { username: string; profileImage?: string }
  reason: string
  description?: string
  status: "pending" | "reviewed" | "resolved"
  createdAt: string
  target: {
    _id: string
    title: string
    image?: string
    isPublic: boolean
    owner: {
      _id: string
      username: string
      profileImage?: string
    } | null
  } | null
}

export function ReportsTable({ filters = {} }: { filters?: Record<string, any> }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, mutate } = useReports(page, 10, filters)
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

  const handleResolveReport = async (reportId: string) => {
    try {
      setActionLoading(reportId)
      await apiClient.resolveReport(reportId, "resolved")
      await mutate()
    } catch (error) {
      console.error("Lỗi khi giải quyết báo cáo:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && !data) {
    return <TableSkeleton rows={6} cols={6} />
  }

  const reports: Report[] = Array.isArray(data) ? data : data?.reports || []
  const totalPages = data?.totalPages || (Array.isArray(data) ? Math.ceil(reports.length / 10) : 1)

  if (reports.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Không tìm thấy báo cáo nào.
      </div>
    )
  }

  const allSelected = reports.length > 0 && selected.size === reports.length
  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(reports.map(r => r._id)))
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

  const bulkResolve = async () => {
    const ids = Array.from(selected)
    for (const id of ids) {
      await apiClient.resolveReport(id, "resolved")
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
            <Button size="sm" onClick={bulkResolve} disabled={showLoadingIndicator}>
              Giải quyết
            </Button>
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
                <TableHead className="min-w-[160px]">Người báo cáo</TableHead>
                <TableHead className="min-w-[300px]">Lịch trình bị báo cáo</TableHead>
                <TableHead className="min-w-[180px]">Lý do</TableHead>
                <TableHead className="min-w-[140px]">Trạng thái</TableHead>
                <TableHead className="min-w-[120px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id} className="odd:bg-muted/30 hover:bg-accent/50">
                  <TableCell>
                    <Checkbox checked={selected.has(report._id)} onCheckedChange={(v) => toggleOne(report._id, Boolean(v))} aria-label="Chọn dòng" />
                  </TableCell>

                  {/* Người báo cáo */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={report.reporter.profileImage} />
                        <AvatarFallback>{report.reporter.username[0]}</AvatarFallback>
                      </Avatar>
                      <span>{report.reporter.username}</span>
                    </div>
                  </TableCell>

                  {/* Lịch trình bị báo cáo */}
                  <TableCell>
                    {report.target ? (
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                          <img
                            src={report.target.image || "data:image/png;base64,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"}
                            alt={report.target.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/png;base64,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"
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="truncate font-medium text-sm" title={report.target.title}>
                                  {report.target.title}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{report.target.title}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <p className="text-xs text-muted-foreground">
                            bởi <span className="font-medium">{report.target.owner?.username || "Không xác định"}</span>
                            {!report.target.isPublic && " (Riêng tư)"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Lịch trình đã xóa</span>
                    )}
                  </TableCell>

                  {/* Lý do */}
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="truncate font-medium" title={report.reason}>
                        {report.reason}
                      </p>
                      {report.description && (
                        <p className="mt-1 text-xs text-muted-foreground truncate" title={report.description}>
                          {report.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "pending" ? "destructive" :
                          report.status === "reviewed" ? "secondary" : "default"
                      }
                    >
                      {report.status === "pending" ? "Đang chờ xử lý" :
                        report.status === "reviewed" ? "Đã xem xét" : "Đã giải quyết"}
                    </Badge>
                  </TableCell>

                  {/* Hành động */}
                  <TableCell>
                    {report.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleResolveReport(report._id)}
                        disabled={actionLoading === report._id}
                      >
                        {actionLoading === report._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">Trang {page} / {totalPages}</div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || showLoadingIndicator}>
              Trước
            </Button>
            <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages || showLoadingIndicator}>
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}