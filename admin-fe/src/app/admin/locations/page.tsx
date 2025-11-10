"use client"

import { useState } from "react"
import { Input } from "../../../components/ui/input"
import { Search, Plus } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { LocationsTable } from "../../../components/admin/locations-table"
import { PageHeader } from "../../../components/admin/page-header"
import { FilterChips } from "../../../components/admin/filter-chips"

export default function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  return (
    <main className="flex-1 space-y-8 p-8">
      <PageHeader
        title="Địa điểm"
        description="Quản lý các điểm du lịch và địa điểm tham quan"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Địa điểm" }]}
        actions={<Button><Plus className="w-4 h-4 mr-2" />Thêm Địa điểm</Button>}
      />

      <div className="sticky top-16 z-10 flex gap-4 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 p-3 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Lọc theo danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Danh mục</SelectItem>
            <SelectItem value="attraction">Điểm tham quan</SelectItem>
            <SelectItem value="restaurant">Nhà hàng</SelectItem>
            <SelectItem value="entertainment">Giải trí</SelectItem>
            <SelectItem value="shopping">Mua sắm</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FilterChips
        chips={[
          ...(searchTerm ? [{ label: `Tìm kiếm: ${searchTerm}`, onRemove: () => setSearchTerm("") }] : []),
          ...(categoryFilter !== "all" ? [{ label: `Danh mục: ${categoryFilter}`, onRemove: () => setCategoryFilter("all") }] : []),
        ]}
        onClear={() => { setSearchTerm(""); setCategoryFilter("all") }}
      />

      <LocationsTable />
    </main>
  )
}