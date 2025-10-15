"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/utils"
import { LayoutDashboard, Users, MapPin, Hotel, Star, Calendar, BarChart3, Settings, CreditCard } from "lucide-react"
import { useAuth } from "../../lib/auth-context"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin", "support"] },
  { name: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { name: "Trips", href: "/admin/trips", icon: Calendar, roles: ["admin"] },
  { name: "Locations", href: "/admin/locations", icon: MapPin, roles: ["admin"] },
  { name: "Hotels", href: "/admin/hotels", icon: Hotel, roles: ["admin"] },
  { name: "Reviews", href: "/admin/reviews", icon: Star, roles: ["admin"] },
  { name: "Bookings", href: "/admin/bookings", icon: CreditCard, roles: ["admin", "support"] },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["admin"] },
  { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredNavigation = navigation.filter((item) => user && item.roles.includes(user.role))

  return (
    <aside className="w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Travel Buddy</span>
        </Link>
      </div>
      {user && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                user.role === "admin" ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600",
              )}
            >
              {user.role === "admin" ? "Admin" : "Support"}
            </div>
            <span className="text-sm text-muted-foreground">{user.name}</span>
          </div>
        </div>
      )}
      <nav className="space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
