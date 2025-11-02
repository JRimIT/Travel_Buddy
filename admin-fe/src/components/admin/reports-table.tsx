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

interface Report {
  _id: string
  reporter: { username: string }
  targetType: string
  reason: string
  status: "pending" | "reviewed" | "resolved"
}

export function ReportsTable({ filters = {} }: { filters?: Record<string, any> }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, mutate } = useReports(page, 10, filters)
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

  const handleResolveReport = async (reportId: string) => {
    try {
      setActionLoading(reportId)
      await apiClient.resolveReport(reportId, "resolved")
      await mutate()
    } catch (error) {
      console.error("Error resolving report:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && !data) {
    return <div className="flex justify-center py-12">Loading reports...</div>
  }

  const reports: Report[] = Array.isArray(data) ? data : data?.reports || []
  const totalPages = data?.totalPages || (Array.isArray(data) ? Math.ceil(reports.length / 10) : 1)

  if (reports.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No reports found.
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
            <TableHead>Reporter</TableHead>
            <TableHead>Target Type</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report._id}>
              <TableCell className="font-medium">
                {report.reporter?.username || "Unknown"}
              </TableCell>

              <TableCell>
                <Badge variant="outline">
                  {report.targetType}
                </Badge>
              </TableCell>

              <TableCell className="max-w-xs truncate" title={report.reason}>
                {report.reason}
              </TableCell>

              <TableCell>
                <Badge
                  variant={
                    report.status === "pending" ? "destructive" :
                    report.status === "reviewed" ? "secondary" : "default"
                  }
                >
                  {report.status}
                </Badge>
              </TableCell>

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