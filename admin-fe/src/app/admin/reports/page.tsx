"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { ReportsTable } from "../../../components/admin/reports-table"
import { PageHeader } from "../../../components/admin/page-header"

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filters = useMemo(() => {
    const f: Record<string, any> = {}

    if (searchTerm.trim()) {
      f.search = searchTerm.trim()
    }
    if (statusFilter !== "all") {
      f.status = statusFilter
    }

    return f
  }, [searchTerm, statusFilter])

  return (
    <main className="flex-1 space-y-8 p-8">
      <PageHeader
        title="Báo cáo Vi phạm"
        description="Xem và quản lý các báo cáo vi phạm"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Báo cáo" }]}
      />

      <div className="flex gap-4">
        {/* <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm báo cáo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div> */}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Trạng thái</SelectItem>
            <SelectItem value="pending">Đang chờ xử lý</SelectItem>
            <SelectItem value="reviewed">Đã xem xét</SelectItem>
            <SelectItem value="resolved">Đã giải quyết</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ReportsTable filters={filters} />
    </main>
  )
}