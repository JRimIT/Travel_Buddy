"use client"

import { useState, useMemo } from "react"
import { Input } from "../../../components/ui/input"
import { Search } from "lucide-react"
import { UsersTable } from "../../../components/admin/users-table"
import { PageHeader } from "../../../components/admin/page-header"

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filters = useMemo(() => {
    const f: Record<string, any> = {}
    if (searchTerm.trim()) {
      f.search = searchTerm.trim()
    }
    return f
  }, [searchTerm])

  return (
    <main className="flex-1 space-y-8 p-8">
      <PageHeader
        title="Người dùng"
        description="Quản lý tất cả người dùng và tài khoản của họ"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Người dùng" }]}
      />

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <UsersTable filters={filters} />
    </main>
  )
}