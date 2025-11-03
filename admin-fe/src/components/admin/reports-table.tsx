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
      console.error("Error resolving report:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && !data) {
    return <TableSkeleton rows={6} cols={5} />
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
          <span className="text-muted-foreground">{selected.size} selected</span>
          <div className="space-x-2">
            <Button size="sm" onClick={bulkResolve} disabled={showLoadingIndicator}>Resolve</Button>
          </div>
        </div>
      )}

      <div className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8">
                  <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(Boolean(v))} aria-label="Select all" />
                </TableHead>
                <TableHead className="min-w-[160px]">Reporter</TableHead>
                <TableHead className="min-w-[160px]">Target Type</TableHead>
                <TableHead className="min-w-[280px]">Reason</TableHead>
                <TableHead className="min-w-[140px]">Status</TableHead>
                <TableHead className="min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report._id} className="odd:bg-muted/30 hover:bg-accent/50">
                  <TableCell>
                    <Checkbox checked={selected.has(report._id)} onCheckedChange={(v) => toggleOne(report._id, Boolean(v))} aria-label="Select row" />
                  </TableCell>
                  <TableCell className="font-medium">{report.reporter?.username || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.targetType}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={report.reason}>{report.reason}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "pending" ? "destructive" : report.status === "reviewed" ? "secondary" : "default"
                      }
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.status === "pending" && (
                      <Button size="sm" onClick={() => handleResolveReport(report._id)} disabled={actionLoading === report._id}>
                        {actionLoading === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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
          <div className="text-sm text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || showLoadingIndicator}>
              Previous
            </Button>
            <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages || showLoadingIndicator}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}