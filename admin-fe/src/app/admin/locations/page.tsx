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
        title="Locations"
        description="Manage tourist attractions and points of interest"
        breadcrumbs={[{ label: "Home", href: "/admin" }, { label: "Locations" }]}
        actions={<Button><Plus className="w-4 h-4 mr-2" />Add Location</Button>}
      />

      <div className="sticky top-16 z-10 flex gap-4 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50 p-3 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="attraction">Attraction</SelectItem>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="shopping">Shopping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FilterChips
        chips={[
          ...(searchTerm ? [{ label: `Search: ${searchTerm}`, onRemove: () => setSearchTerm("") }] : []),
          ...(categoryFilter !== "all" ? [{ label: `Category: ${categoryFilter}`, onRemove: () => setCategoryFilter("all") }] : []),
        ]}
        onClear={() => { setSearchTerm(""); setCategoryFilter("all") }}
      />

      <LocationsTable />
    </main>
  )
}
