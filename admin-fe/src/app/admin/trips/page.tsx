"use client"

import { useState, useMemo } from "react"
import { Input } from "../../../components/ui/input"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { TripsTable } from "../../../components/admin/trips-table"
import { PageHeader } from "../../../components/admin/page-header"

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filters = useMemo(() => {
    const f: Record<string, any> = {}
  
    if (searchTerm.trim()) {
      f.search = searchTerm.trim()
    }
  
    if (statusFilter === "public") {
      f.isPublic = "true"
    } else if (statusFilter === "private") {
      f.isPublic = "false"
    }
  
    return f
  }, [searchTerm, statusFilter])

  return (
    <main className="flex-1 space-y-8 p-8">
      <PageHeader
        title="Trips"
        description="Manage all travel trips and itineraries"
        breadcrumbs={[{ label: "Home", href: "/admin" }, { label: "Trips" }]}
      />

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title"  // ĐÃ SỬA
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TripsTable filters={filters} />
    </main>
  )
}