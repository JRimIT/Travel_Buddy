"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Star } from "lucide-react"
import { Card } from "../../components/ui/card"

const hotels = [
  {
    id: 1,
    name: "The Ritz Paris",
    city: "Paris",
    country: "France",
    rating: 5,
    reviews: 3421,
    pricePerNight: "$850",
    amenities: ["wifi", "restaurant", "gym", "spa"],
    rooms: 142,
    partner: true,
  },
  {
    id: 2,
    name: "Park Hyatt Tokyo",
    city: "Tokyo",
    country: "Japan",
    rating: 5,
    reviews: 2876,
    pricePerNight: "$720",
    amenities: ["wifi", "restaurant", "gym", "pool"],
    rooms: 177,
    partner: true,
  },
  {
    id: 3,
    name: "The Plaza Hotel",
    city: "New York",
    country: "USA",
    rating: 5,
    reviews: 4532,
    pricePerNight: "$995",
    amenities: ["wifi", "restaurant", "gym", "spa"],
    rooms: 282,
    partner: false,
  },
  {
    id: 4,
    name: "Burj Al Arab",
    city: "Dubai",
    country: "UAE",
    rating: 5,
    reviews: 5123,
    pricePerNight: "$1,500",
    amenities: ["wifi", "restaurant", "gym", "spa", "pool"],
    rooms: 201,
    partner: true,
  },
  {
    id: 5,
    name: "The Savoy",
    city: "London",
    country: "UK",
    rating: 5,
    reviews: 3987,
    pricePerNight: "$680",
    amenities: ["wifi", "restaurant", "gym"],
    rooms: 267,
    partner: false,
  },
]

export function HotelsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hotel Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Reviews</TableHead>
            <TableHead>Price/Night</TableHead>
            <TableHead>Rooms</TableHead>
            <TableHead>Partner</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {hotels.map((hotel) => (
            <TableRow key={hotel.id}>
              <TableCell className="font-medium">{hotel.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {hotel.city}, {hotel.country}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {Array.from({ length: hotel.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{hotel.reviews.toLocaleString()}</TableCell>
              <TableCell className="font-medium">{hotel.pricePerNight}</TableCell>
              <TableCell>{hotel.rooms}</TableCell>
              <TableCell>
                {hotel.partner ? (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                    Partner
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
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
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Hotel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Hotel
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
