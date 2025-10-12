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
import { MoreHorizontal, Eye, CheckCircle, XCircle, Trash2, Star } from "lucide-react"
import { Card } from "../../components/ui/card"

const reviews = [
  {
    id: 1,
    user: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Eiffel Tower",
    rating: 5,
    comment: "Absolutely stunning! A must-visit when in Paris. The views are breathtaking.",
    status: "approved",
    date: "2024-12-10",
  },
  {
    id: 2,
    user: "Sarah Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Tokyo Skytree",
    rating: 4,
    comment: "Great experience but quite crowded. Go early in the morning for best views.",
    status: "pending",
    date: "2024-12-11",
  },
  {
    id: 3,
    user: "Mike Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Central Park",
    rating: 5,
    comment: "Perfect place to relax and enjoy nature in the heart of NYC.",
    status: "approved",
    date: "2024-12-09",
  },
  {
    id: 4,
    user: "Emily Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Le Jules Verne",
    rating: 3,
    comment: "Food was good but overpriced. Service could be better.",
    status: "pending",
    date: "2024-12-12",
  },
  {
    id: 5,
    user: "David Lee",
    avatar: "/placeholder.svg?height=40&width=40",
    location: "Dubai Mall",
    rating: 2,
    comment: "Too crowded and commercialized. Not worth the hype.",
    status: "rejected",
    date: "2024-12-08",
  },
]

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-600",
}

export function ReviewsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.user} />
                    <AvatarFallback>
                      {review.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{review.user}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{review.location}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="truncate text-sm text-muted-foreground">{review.comment}</p>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[review.status as keyof typeof statusColors]}>
                  {review.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{review.date}</TableCell>
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
                      View Full Review
                    </DropdownMenuItem>
                    {review.status === "pending" && (
                      <>
                        <DropdownMenuItem className="text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Review
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
