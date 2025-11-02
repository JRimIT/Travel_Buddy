"use client"

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
import { MoreHorizontal, Eye, CheckCircle, XCircle, Download } from "lucide-react"
import { Card } from "../../components/ui/card"

const bookings = [
  {
    id: "BK-001",
    user: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    type: "hotel",
    provider: "Booking.com",
    item: "The Ritz Paris",
    date: "2024-12-15",
    amount: "$2,550",
    status: "confirmed",
    reference: "BKG123456",
  },
  {
    id: "BK-002",
    user: "Sarah Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    type: "flight",
    provider: "Traveloka",
    item: "Tokyo - Paris",
    date: "2025-01-05",
    amount: "$1,850",
    status: "pending",
    reference: "FLT789012",
  },
  {
    id: "BK-003",
    user: "Mike Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    type: "activity",
    provider: "GetYourGuide",
    item: "Eiffel Tower Tour",
    date: "2024-12-20",
    amount: "$120",
    status: "confirmed",
    reference: "ACT345678",
  },
  {
    id: "BK-004",
    user: "Emily Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    type: "hotel",
    provider: "Booking.com",
    item: "Park Hyatt Tokyo",
    date: "2025-02-10",
    amount: "$3,240",
    status: "pending",
    reference: "BKG901234",
  },
  {
    id: "BK-005",
    user: "David Lee",
    avatar: "/placeholder.svg?height=40&width=40",
    type: "flight",
    provider: "Traveloka",
    item: "Dubai - London",
    date: "2025-03-20",
    amount: "$2,100",
    status: "cancelled",
    reference: "FLT567890",
  },
]

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-600",
  confirmed: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
}

const typeColors = {
  hotel: "bg-blue-500/10 text-blue-600",
  flight: "bg-purple-500/10 text-purple-600",
  activity: "bg-orange-500/10 text-orange-600",
}

export function BookingsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-mono text-sm">{booking.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={booking.avatar || "/placeholder.svg"} alt={booking.user} />
                    <AvatarFallback>
                      {booking.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{booking.user}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={typeColors[booking.type as keyof typeof typeColors]}>
                  {booking.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{booking.provider}</TableCell>
              <TableCell className="font-medium">{booking.item}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{booking.date}</TableCell>
              <TableCell className="font-medium">{booking.amount}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[booking.status as keyof typeof statusColors]}>
                  {booking.status}
                </Badge>
              </TableCell>
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
                      <Download className="mr-2 h-4 w-4" />
                      Download Invoice
                    </DropdownMenuItem>
                    {booking.status === "pending" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm Booking
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Booking
                        </DropdownMenuItem>
                      </>
                    )}
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
