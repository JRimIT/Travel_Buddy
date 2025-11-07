"use client"

import { useState, useMemo } from "react"
import { Input } from "../../../components/ui/input"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { TripsTable } from "../../../components/admin/trips-table"
import { PageHeader } from "../../../components/admin/page-header"
import { useRouter } from "next/navigation" // ← ĐÃ THÊM

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter() // ← ĐÃ THÊM

  const filters = useMemo(() => {
    const f: Record<string, any> = {}
    if (searchTerm.trim()) f.search = searchTerm.trim()
    if (statusFilter === "public") f.isPublic = "true"
    else if (statusFilter === "private") f.isPublic = "false"
    return f
  }, [searchTerm, statusFilter])

  return (
    <main className="flex-1 space-y-8 p-8">
      <PageHeader
        title="Chuyến đi"
        description="Quản lý tất cả chuyến đi du lịch và lịch trình"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Chuyến đi" }]}
      />

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề hoặc người dùng"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Lọc theo chế độ hiển thị" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="public">Công khai</SelectItem>
            <SelectItem value="private">Riêng tư</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TripsTable filters={filters} />
    </main>
  )
}