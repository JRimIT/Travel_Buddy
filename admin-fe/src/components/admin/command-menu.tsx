"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Users, Calendar, MapPin, Star, AlertCircle, BarChart3, Home, LogOut } from "lucide-react"
import { useAuth } from "../../lib/auth-context"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <Command className="w-full">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">Search or jump…</span>
            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Ctrl/⌘ K</span>
          </div>
          <Command.Input autoFocus className="w-full bg-transparent px-3 py-3 text-sm outline-none" placeholder="Type a command or search…" />
          <Command.List className="max-h-[50vh] overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">No results found.</Command.Empty>
            <Command.Group heading="Navigate" className="px-1 py-1">
              <Command.Item onSelect={() => go("/admin")} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <Home className="h-4 w-4" /> Dashboard
              </Command.Item>
              <Command.Item onSelect={() => go("/admin/users")} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <Users className="h-4 w-4" /> Users
              </Command.Item>
              <Command.Item onSelect={() => go("/admin/trips")} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <Calendar className="h-4 w-4" /> Trips
              </Command.Item>
              <Command.Item onSelect={() => go("/admin/reviews")} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <Star className="h-4 w-4" /> Reviews
              </Command.Item>
              <Command.Item onSelect={() => go("/admin/reports")} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <AlertCircle className="h-4 w-4" /> Reports
              </Command.Item>
              <Command.Item onSelect={() => go("/admin/locations")} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <MapPin className="h-4 w-4" /> Locations
              </Command.Item>
              <Command.Item onSelect={() => go("/admin/analytics")} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <BarChart3 className="h-4 w-4" /> Analytics
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Session" className="px-1 py-1">
              <Command.Item onSelect={() => logout()} className="flex items-center gap-2 rounded px-2 py-2 text-sm aria-selected:bg-accent">
                <LogOut className="h-4 w-4" /> Log out
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  )
}


