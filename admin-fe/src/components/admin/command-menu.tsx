"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { 
  Users, Calendar, MapPin, Star, AlertCircle, 
  BarChart3, Home, LogOut, Search 
} from "lucide-react"
import { useAuth } from "../../lib/auth-context"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  // Mở/đóng bằng Ctrl+K hoặc ⌘+K
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
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
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen} 
      label="Menu lệnh toàn cục"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <Command className="w-full">
          {/* Thanh tìm kiếm */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Tìm kiếm hoặc điều hướng...</span>
            <kbd className="ml-auto rounded bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              Ctrl+K
            </kbd>
          </div>

          <Command.Input 
            autoFocus 
            className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground" 
            placeholder="Nhập lệnh hoặc tìm kiếm..." 
          />

          <Command.List className="max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
              Không tìm thấy kết quả.
            </Command.Empty>

            {/* Nhóm: Điều hướng */}
            <Command.Group heading="Điều hướng" className="px-2 py-1">
              <Command.Item 
                onSelect={() => go("/admin")} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
              >
                <Home className="h-4 w-4" /> Trang chủ
              </Command.Item>

              <Command.Item 
                onSelect={() => go("/admin/users")} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
              >
                <Users className="h-4 w-4" /> Người dùng
              </Command.Item>

              <Command.Item 
                onSelect={() => go("/admin/trips")} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
              >
                <Calendar className="h-4 w-4" /> Chuyến đi
              </Command.Item>

              <Command.Item 
                onSelect={() => go("/admin/reviews")} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
              >
                <Star className="h-4 w-4" /> Đánh giá
              </Command.Item>

              <Command.Item 
                onSelect={() => go("/admin/reports")} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
              >
                <AlertCircle className="h-4 w-4" /> Báo cáo
              </Command.Item>

              <Command.Item 
                onSelect={() => go("/admin/locations")} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
              >
                <MapPin className="h-4 w-4" /> Địa điểm
              </Command.Item>

              <Command.Item 
                onSelect={() => go("/admin/analytics")} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors"
              >
                <BarChart3 className="h-4 w-4" /> Phân tích
              </Command.Item>
            </Command.Group>

            {/* Nhóm: Phiên làm việc */}
            <Command.Group heading="Phiên" className="px-2 py-1 mt-2 border-t border-border/50">
              <Command.Item 
                onSelect={() => {
                  logout()
                  setOpen(false)
                }} 
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer text-red-600 hover:bg-red-50 aria-selected:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </Command.Dialog>
  )
}