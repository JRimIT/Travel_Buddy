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

const locations = [
  {
    id: 1,
    name: "Eiffel Tower",
    category: "attraction",
    city: "Paris",
    country: "France",
    rating: 4.8,
    reviews: 12543,
    priceRange: "$$$",
    featured: true,
  },
  {
    id: 2,
    name: "Tokyo Skytree",
    category: "attraction",
    city: "Tokyo",
    country: "Japan",
    rating: 4.7,
    reviews: 8932,
    priceRange: "$$",
    featured: true,
  },
  {
    id: 3,
    name: "Central Park",
    category: "attraction",
    city: "New York",
    country: "USA",
    rating: 4.9,
    reviews: 15678,
    priceRange: "Free",
    featured: false,
  },
  {
    id: 4,
    name: "Le Jules Verne",
    category: "restaurant",
    city: "Paris",
    country: "France",
    rating: 4.6,
    reviews: 3421,
    priceRange: "$$$$",
    featured: true,
  },
  {
    id: 5,
    name: "Dubai Mall",
    category: "shopping",
    city: "Dubai",
    country: "UAE",
    rating: 4.5,
    reviews: 9876,
    priceRange: "$$$",
    featured: false,
  },
]

const categoryColors = {
  attraction: "bg-blue-500/10 text-blue-600",
  restaurant: "bg-orange-500/10 text-orange-600",
  entertainment: "bg-purple-500/10 text-purple-600",
  shopping: "bg-pink-500/10 text-pink-600",
}

export function LocationsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Reviews</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">{location.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={categoryColors[location.category as keyof typeof categoryColors]}>
                  {location.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {location.city}, {location.country}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{location.rating}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{location.reviews.toLocaleString()}</TableCell>
              <TableCell className="font-medium">{location.priceRange}</TableCell>
              <TableCell>
                {location.featured ? (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Featured
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
                      Edit Location
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Location
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
