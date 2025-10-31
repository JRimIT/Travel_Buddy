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
      console.error("Error locking user:", error)
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
      console.error("Error unlocking user:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading && !data) {
    return <div className="flex justify-center py-12">Loading users...</div>
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

      <Table className={showLoadingIndicator ? "opacity-60 pointer-events-none" : ""}>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user: any) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={user.isLocked ? "destructive" : "default"}>
                    {user.isLocked ? "Locked" : "Active"}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}