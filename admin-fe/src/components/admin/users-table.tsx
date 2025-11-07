"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { useUsers } from "../../hooks/use-admin-data"
import { apiClient } from "../../lib/api-client"
import { Loader2, Lock, Unlock } from "lucide-react"
import { TableSkeleton } from "./table-skeleton"

export function UsersTable({ filters = {} }: { filters?: Record<string, any> }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, mutate } = useUsers(page, 10, filters)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (isLoading && data) {
      timer = setTimeout(() => setShowLoadingIndicator(true), 150)
    } else {
      setShowLoadingIndicator(false)
    }
    return () => timer && clearTimeout(timer)
  }, [isLoading, data])

  const handleLockUser = async (userId: string) => {
    try {
      setActionLoading(userId)
      await apiClient.lockUser(userId)
      await mutate()
    } catch (error) {
      console.error("Lỗi khi khóa người dùng:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnlockUser = async (userId: string) => {
    try {
      setActionLoading(userId)
      await apiClient.unlockUser(userId)
      await mutate()
    } catch (error) {
      console.error("Lỗi khi mở khóa người dùng:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && !data) {
    return <TableSkeleton rows={6} cols={5} />
  }

  const users = data?.users || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-4 relative">
      {showLoadingIndicator && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[160px]">Tên người dùng</TableHead>
                <TableHead className="min-w-[220px]">Email</TableHead>
                {/* <TableHead className="min-w-[140px]">Số điện thoại</TableHead> */}
                <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                <TableHead className="min-w-[120px]">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Không tìm thấy người dùng nào.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user._id} className="odd:bg-muted/30 hover:bg-accent/50">
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    {/* <TableCell>{user.phone || "N/A"}</TableCell> */}
                    <TableCell>
                      <Badge variant={user.isLocked ? "destructive" : "default"}>
                        {user.isLocked ? "Đã khóa" : "Hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isLocked ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnlockUser(String(user._id))}
                          disabled={actionLoading === user._id}
                        >
                          {actionLoading === user._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleLockUser(String(user._id))}
                          disabled={actionLoading === user._id}
                        >
                          {actionLoading === user._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}