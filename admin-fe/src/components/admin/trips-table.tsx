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
import { MoreHorizontal, Eye, Edit, Trash2, MapPin } from "lucide-react"
import { Card } from "../../components/ui/card"

const trips = [
  {
    id: 1,
    title: "Paris Adventure",
    user: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "Paris, France",
    startDate: "2024-12-15",
    endDate: "2024-12-22",
    status: "ongoing",
    budget: "$3,500",
    participants: 2,
  },
  {
    id: 2,
    title: "Tokyo Experience",
    user: "Sarah Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "Tokyo, Japan",
    startDate: "2025-01-05",
    endDate: "2025-01-15",
    status: "planning",
    budget: "$4,200",
    participants: 3,
  },
  {
    id: 3,
    title: "NYC Weekend",
    user: "Mike Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "New York, USA",
    startDate: "2024-12-01",
    endDate: "2024-12-05",
    status: "completed",
    budget: "$2,800",
    participants: 1,
  },
  {
    id: 4,
    title: "London Getaway",
    user: "Emily Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "London, UK",
    startDate: "2025-02-10",
    endDate: "2025-02-17",
    status: "planning",
    budget: "$3,100",
    participants: 2,
  },
  {
    id: 5,
    title: "Dubai Luxury",
    user: "David Lee",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "Dubai, UAE",
    startDate: "2025-03-20",
    endDate: "2025-03-28",
    status: "planning",
    budget: "$5,500",
    participants: 4,
  },
]

const statusColors = {
  planning: "bg-yellow-500/10 text-yellow-600",
  ongoing: "bg-blue-500/10 text-blue-600",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-red-500/10 text-red-600",
}

export function TripsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trip</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">{trip.title}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={trip.avatar || "/placeholder.svg"} alt={trip.user} />
                    <AvatarFallback>
                      {trip.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{trip.user}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{trip.destination}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {trip.startDate} - {trip.endDate}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[trip.status as keyof typeof statusColors]}>
                  {trip.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{trip.budget}</TableCell>
              <TableCell>{trip.participants}</TableCell>
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
                      Edit Trip
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Trip
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
