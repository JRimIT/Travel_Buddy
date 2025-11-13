"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { ReviewsTable } from "../../../components/admin/reviews-table"
import { PageHeader } from "../../../components/admin/page-header"

export default function ReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")

  const filters = useMemo(() => {
    const f: Record<string, any> = {}

    if (searchTerm.trim()) {
      f.search = searchTerm.trim()
    }
    if (statusFilter !== "all") {
      f.status = statusFilter
    }
    if (ratingFilter !== "all") {
      f.rating = ratingFilter
    }

    return f
  }, [searchTerm, statusFilter, ratingFilter])

  return (
    <main className="flex-1 space-y-8 p-8">
      <PageHeader
        title="Đánh giá"
        description="Kiểm duyệt và quản lý đánh giá người dùng"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Đánh giá" }]}
      />

      {/* <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm đánh giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div> */}

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Trạng thái</SelectItem>
            <SelectItem value="visible">Hiển thị</SelectItem>
            <SelectItem value="hidden">Ẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ReviewsTable filters={filters} />
    </main>
  )
}