"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Clock, CheckCircle2, XCircle, Hotel, Utensils, Car, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Textarea } from "../../components/ui/textarea"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"

interface BookingRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: "hotel" | "restaurant" | "transport"
  destination: string
  details: string
  checkIn?: string
  checkOut?: string
  guests?: number
  status: "pending" | "confirmed" | "cancelled"
  createdAt: string
  notes?: string
}

const mockBookingRequests: BookingRequest[] = [
  {
    id: "BR001",
    userId: "U123",
    userName: "John Doe",
    userEmail: "john@example.com",
    type: "hotel",
    destination: "Paris, France",
    details: "4-star hotel near Eiffel Tower, 2 adults",
    checkIn: "2024-06-15",
    checkOut: "2024-06-20",
    guests: 2,
    status: "pending",
    createdAt: "2024-01-15T10:30:00",
  },
  {
    id: "BR002",
    userId: "U124",
    userName: "Jane Smith",
    userEmail: "jane@example.com",
    type: "restaurant",
    destination: "Tokyo, Japan",
    details: "Traditional sushi restaurant, reservation for 4 people",
    guests: 4,
    status: "pending",
    createdAt: "2024-01-15T09:15:00",
  },
  {
    id: "BR003",
    userId: "U125",
    userName: "Mike Johnson",
    userEmail: "mike@example.com",
    type: "transport",
    destination: "Rome, Italy",
    details: "Airport transfer to city center, 3 passengers with luggage",
    guests: 3,
    status: "pending",
    createdAt: "2024-01-15T08:45:00",
  },
  {
    id: "BR004",
    userId: "U126",
    userName: "Sarah Williams",
    userEmail: "sarah@example.com",
    type: "hotel",
    destination: "Bali, Indonesia",
    details: "Beach resort, honeymoon package",
    checkIn: "2024-07-01",
    checkOut: "2024-07-10",
    guests: 2,
    status: "confirmed",
    createdAt: "2024-01-14T16:20:00",
    notes: "Confirmed at Grand Bali Resort, booking ref: GBR12345",
  },
]

const stats = [
  { title: "Pending Requests", value: "12", icon: Clock, color: "text-yellow-600" },
  { title: "Confirmed Today", value: "8", icon: CheckCircle2, color: "text-green-600" },
  { title: "Cancelled", value: "2", icon: XCircle, color: "text-red-600" },
  { title: "Total This Week", value: "45", icon: Calendar, color: "text-blue-600" },
]

export function SupportDashboard() {
  const [requests, setRequests] = useState<BookingRequest[]>(mockBookingRequests)
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bookingDetails, setBookingDetails] = useState("")
  const [bookingReference, setBookingReference] = useState("")

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hotel":
        return <Hotel className="h-4 w-4" />
      case "restaurant":
        return <Utensils className="h-4 w-4" />
      case "transport":
        return <Car className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleConfirm = (request: BookingRequest) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)
  }

  const handleSubmitConfirmation = () => {
    if (selectedRequest) {
      setRequests(
        requests.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "confirmed", notes: `${bookingDetails} - Ref: ${bookingReference}` }
            : r,
        ),
      )
      setIsDialogOpen(false)
      setBookingDetails("")
      setBookingReference("")
      setSelectedRequest(null)
    }
  }

  const handleCancel = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)))
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const confirmedRequests = requests.filter((r) => r.status === "confirmed")
  const cancelledRequests = requests.filter((r) => r.status === "cancelled")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Dashboard</h1>
        <p className="text-muted-foreground">Manage booking requests from users</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending <Badge className="ml-2">{pendingRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(request.type)}
                      <CardTitle className="text-lg">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Booking Request
                      </CardTitle>
                      <Badge variant="outline">{request.id}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From {request.userName} ({request.userEmail})
                    </p>
                  </div>
                  <Badge className="bg-yellow-500">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Destination:</span>
                    <span>{request.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Details:</span>
                    <span>{request.details}</span>
                  </div>
                  {request.checkIn && request.checkOut && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Dates:</span>
                      <span>
                        {request.checkIn} to {request.checkOut}
                      </span>
                    </div>
                  )}
                  {request.guests && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Guests:</span>
                      <span>{request.guests}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Requested:</span>
                    <span>{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleConfirm(request)} className="flex-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </Button>
                  <Button variant="destructive" onClick={() => handleCancel(request.id)} className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingRequests.length === 0 && (
            <Card>
              <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
                No pending requests
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(request.type)}
                      <CardTitle className="text-lg">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Booking
                      </CardTitle>
                      <Badge variant="outline">{request.id}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      For {request.userName} ({request.userEmail})
                    </p>
                  </div>
                  <Badge className="bg-green-500">Confirmed</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Destination:</span> {request.destination}
                </div>
                {request.notes && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <span className="font-medium">Booking Details:</span>
                    <p className="mt-1">{request.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(request.type)}
                      <CardTitle className="text-lg">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Booking
                      </CardTitle>
                      <Badge variant="outline">{request.id}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      For {request.userName} ({request.userEmail})
                    </p>
                  </div>
                  <Badge variant="destructive">Cancelled</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="font-medium">Destination:</span> {request.destination}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              Enter the booking details and reference number to confirm this request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="booking-type">Booking Type</Label>
              <Select defaultValue={selectedRequest?.type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-details">Booking Details</Label>
              <Textarea
                id="booking-details"
                placeholder="e.g., Confirmed at Grand Hotel Paris, Room 305"
                value={bookingDetails}
                onChange={(e) => setBookingDetails(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-reference">Booking Reference</Label>
              <Input
                id="booking-reference"
                placeholder="e.g., GHP12345"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitConfirmation} disabled={!bookingDetails || !bookingReference}>
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
