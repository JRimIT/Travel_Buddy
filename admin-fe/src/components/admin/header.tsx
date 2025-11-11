"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { useAuth } from "../../lib/auth-context"
import { ThemeToggle } from "../../components/ui/theme-toggle"
import { CommandMenu } from "./command-menu"

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm supports-[backdrop-filter]:bg-card/70 transition-all">
      {/* CommandMenu được gọi ở đây để có thể dùng Ctrl+K */}
      <CommandMenu />

      {/* Thanh tìm kiếm */}
      <div className="flex flex-1 items-center gap-4 max-w-2xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm người dùng, chuyến đi, địa điểm..."
            className="h-10 w-full rounded-full pl-10 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Bên phải: Theme, Thông báo, Avatar */}
      <div className="flex items-center gap-2">
        {/* Nút chuyển theme */}
        <ThemeToggle />

        {/* Thông báo */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-accent/80 transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="sr-only">Có thông báo mới</span>
        </Button>

        {/* Avatar + Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-2 ring-transparent hover:ring-primary/20 transition-all"
              aria-label="Menu người dùng"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  // @ts-expect-error: Property 'avatar' might not exist on User type
                  src={user && typeof user === "object" && "avatar" in user && user.avatar ? user.avatar : ""}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary to-primary/80 text-white">
                  {user?.role === "admin"
                    ? "AD"
                    : user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-3 shadow-xl">
            {/* Thông tin người dùng */}
            <DropdownMenuLabel className="p-0">
              <div className="flex flex-col space-y-1.5">
                <p className="text-base font-semibold text-foreground">{user?.name || "Quản trị viên"}</p>
                <p className="text-sm text-muted-foreground">{user?.email || "admin@domain.com"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user?.role === "admin" 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" 
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}>
                    {user?.role === "admin" ? "Quản trị viên" : "Nhân viên"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-2" />

            {/* Các mục menu */}
            <DropdownMenuItem className="cursor-pointer rounded-lg">
              Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg">
              Cài đặt
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            {/* Đăng xuất */}
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}