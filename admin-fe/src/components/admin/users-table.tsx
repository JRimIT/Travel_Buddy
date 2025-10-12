"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Ban, CheckCircle } from "lucide-react"
import { Card } from "../../components/ui/card"

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "user",
    status: "active",
    trips: 12,
    joinedAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Sarah Smith",
    email: "sarah.smith@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "user",
    status: "active",
    trips: 8,
    joinedAt: "2024-02-20",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "moderator",
    status: "active",
    trips: 5,
    joinedAt: "2024-03-10",
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily.brown@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "user",
    status: "inactive",
    trips: 3,
    joinedAt: "2024-04-05",
  },
  {
    id: 5,
    name: "David Lee",
    email: "david.lee@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "user",
    status: "active",
    trips: 15,
    joinedAt: "2024-01-08",
  },
]

const roleColors = {
  user: "bg-blue-500/10 text-blue-600",
  moderator: "bg-purple-500/10 text-purple-600",
  admin: "bg-red-500/10 text-red-600",
}

const statusColors = {
  active: "bg-green-500/10 text-green-600",
  inactive: "bg-gray-500/10 text-gray-600",
}

export function UsersTable() {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Trips</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={roleColors[user.role as keyof typeof roleColors]}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[user.status as keyof typeof statusColors]}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>{user.trips}</TableCell>
              <TableCell className="text-muted-foreground">{user.joinedAt}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.status === "active" ? (
                      <DropdownMenuItem className="text-yellow-600">
                        <Ban className="mr-2 h-4 w-4" />
                        Suspend User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Activate User
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
