"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/utils"
import { LayoutDashboard, Users, MapPin, Star, Calendar, BarChart3, AlertCircle } from "lucide-react"
import { useAuth } from "../../lib/auth-context"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { name: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { name: "Trips", href: "/admin/trips", icon: Calendar, roles: ["admin"] },
  { name: "Reviews", href: "/admin/reviews", icon: Star, roles: ["admin"] },
  { name: "Reports", href: "/admin/reports", icon: AlertCircle, roles: ["admin"] },
  { name: "Locations", href: "/admin/locations", icon: MapPin, roles: ["admin"] },
  // { name: "Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["admin"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredNavigation = navigation.filter((item) => user && item.roles.includes(user.role))

  return (
    <aside className="w-72 border-r border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center border-b border-border px-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold">Travel Buddy</div>
            <div className="text-xs text-muted-foreground">Admin Console</div>
          </div>
        </Link>
      </div>
      {user && (
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Signed in as</span>
            <div
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide",
                user.role === "admin" ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600",
              )}
            >
              {user.role === "admin" ? "ADMIN" : "SUPPORT"}
            </div>
          </div>
          <div className="mt-1 text-sm font-medium">{user.name}</div>
        </div>
      )}
      <nav className="p-3">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-primary transition-all",
                    isActive ? "w-1 opacity-100" : "w-0 opacity-0 group-hover:w-1 group-hover:opacity-100",
                  )}
                />
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
