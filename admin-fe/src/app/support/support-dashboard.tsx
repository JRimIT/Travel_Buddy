"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Clock, CheckCircle2, XCircle, Hotel, Utensils, Car, Calendar, MapPin, DollarSign, Clock as TimeIcon, AlertCircle, Send } from "lucide-react"
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
import { ScrollArea } from "../../components/ui/scroll-area"
import { Separator } from "../../components/ui/separator"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "../../components/ui/toast"

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
  status: "pending" | "confirmed" | "cancelled" | "change_requested"
  createdAt: string
  notes?: string
  changeNotes?: string
}

interface Activity {
  day: number
  location: string
  time: string
  transport: string
  cost: number
  type: "hotel" | "restaurant" | "transport" | "sightseeing" | "other"
  details: string
  guests?: number
  checkIn?: string
  checkOut?: string
}

interface Itinerary {
  id: string
  userId: string
  userName: string
  userEmail: string
  days: number
  activities: Activity[]
  createdAt: string
  status: "assigned" | "processing" | "confirmed" | "changes_requested" | "finalized"
  supportNotes?: string
}

// Mock itineraries assigned to this support
const mockItineraries: Itinerary[] = [
  {
    id: "IT001",
    userId: "U123",
    userName: "John Doe",
    userEmail: "john@example.com",
    days: 5,
    createdAt: "2025-10-20T10:00:00",
    status: "assigned",
    activities: [
      {
        day: 1,
        location: "Paris, France",
        time: "14:00",
        transport: "Flight",
        cost: 500,
        type: "transport",
        details: "Flight from London to Paris, 2 passengers",
        guests: 2,
      },
      {
        day: 1,
        location: "Paris, France",
        time: "20:00",
        transport: "Walking",
        cost: 100,
        type: "restaurant",
        details: "Dinner at Le Bistro Parisien, reservation for 2",
        guests: 2,
      },
      {
        day: 2,
        location: "Paris, France",
        time: "09:00",
        transport: "Metro",
        cost: 200,
        type: "sightseeing",
        details: "Visit to Eiffel Tower",
      },
      {
        day: 2,
        location: "Paris, France",
        time: "18:00",
        transport: "Walking",
        cost: 0,
        type: "hotel",
        details: "Check-in at Grand Hotel Paris, 2 adults",
        checkIn: "2025-10-21",
        checkOut: "2025-10-25",
        guests: 2,
      },
      {
        day: 3,
        location: "Versailles, France",
        time: "10:00",
        transport: "Train",
        cost: 80,
        type: "transport",
        details: "Train to Versailles, round trip for 2",
        guests: 2,
      },
      {
        day: 3,
        location: "Versailles, France",
        time: "12:00",
        transport: "Walking",
        cost: 150,
        type: "sightseeing",
        details: "Tour of Palace of Versailles",
      },
      {
        day: 4,
        location: "Paris, France",
        time: "19:00",
        transport: "Taxi",
        cost: 120,
        type: "restaurant",
        details: "Dinner at La Tour d'Argent, reservation for 2",
        guests: 2,
      },
      {
        day: 5,
        location: "Paris, France",
        time: "08:00",
        transport: "Flight",
        cost: 550,
        type: "transport",
        details: "Return flight to London, 2 passengers",
        guests: 2,
      },
    ],
  },
  {
    id: "IT002",
    userId: "U124",
    userName: "Jane Smith",
    userEmail: "jane@example.com",
    days: 3,
    createdAt: "2025-10-21T09:00:00",
    status: "assigned",
    activities: [
      {
        day: 1,
        location: "Tokyo, Japan",
        time: "15:00",
        transport: "Flight",
        cost: 600,
        type: "transport",
        details: "Flight from Seoul to Tokyo, 1 passenger",
        guests: 1,
      },
      {
        day: 1,
        location: "Tokyo, Japan",
        time: "20:00",
        transport: "Walking",
        cost: 80,
        type: "restaurant",
        details: "Sushi dinner at Sushi Saito, reservation for 1",
        guests: 1,
      },
      {
        day: 2,
        location: "Tokyo, Japan",
        time: "10:00",
        transport: "Metro",
        cost: 0,
        type: "hotel",
        details: "Check-in at Park Hyatt Tokyo, 1 adult",
        checkIn: "2025-10-22",
        checkOut: "2025-10-24",
        guests: 1,
      },
      {
        day: 3,
        location: "Tokyo, Japan",
        time: "09:00",
        transport: "Walking",
        cost: 100,
        type: "sightseeing",
        details: "Visit to Meiji Shrine",
      },
    ],
  },
]

const stats = [
  { title: "Assigned Itineraries", value: "2", icon: Calendar, color: "text-blue-600" },
  { title: "Pending Bookings", value: "7", icon: Clock, color: "text-yellow-600" },
  { title: "Confirmed Today", value: "3", icon: CheckCircle2, color: "text-green-600" },
  { title: "Change Requests", value: "0", icon: AlertCircle, color: "text-orange-600" },
]

export function SupportDashboard() {
  const [itineraries, setItineraries] = useState<Itinerary[]>(mockItineraries)
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null)
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false)
  const [bookingDetails, setBookingDetails] = useState("")
  const [bookingReference, setBookingReference] = useState("")
  const [changeNotes, setChangeNotes] = useState("")
  const [openToast, setOpenToast] = useState(false)
  const [toastData, setToastData] = useState<{ title: string; description: string; variant?: "default" | "destructive" }>({
    title: "",
    description: "",
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (selectedItinerary) {
      const generatedRequests: BookingRequest[] = selectedItinerary.activities
        .filter(activity => ["hotel", "restaurant", "transport"].includes(activity.type))
        .map((activity, index) => ({
          id: `BR${selectedItinerary.id.slice(2)}${String(index + 1).padStart(3, '0')}`,
          userId: selectedItinerary.userId,
          userName: selectedItinerary.userName,
          userEmail: selectedItinerary.userEmail,
          type: activity.type as "hotel" | "restaurant" | "transport",
          destination: activity.location,
          details: activity.details,
          checkIn: activity.checkIn,
          checkOut: activity.checkOut,
          guests: activity.guests,
          status: "pending",
          createdAt: selectedItinerary.createdAt,
        }))

      setRequests(generatedRequests)
    }
  }, [selectedItinerary])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hotel":
        return <Hotel className="h-4 w-4" />
      case "restaurant":
        return <Utensils className="h-4 w-4" />
      case "transport":
        return <Car className="h-4 w-4" />
      case "sightseeing":
        return <MapPin className="h-4 w-4" />
      default:
        return null
    }
  }

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    setToastData({ title, description, variant })
    setOpenToast(true)
    timerRef.current = setTimeout(() => {
      setOpenToast(false)
    }, 3000)
  }

  const handleSelectItinerary = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary)
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
      showToast("Booking Confirmed", "The booking has been successfully confirmed.")
      checkAllConfirmed()
      setIsDialogOpen(false)
      setBookingDetails("")
      setBookingReference("")
      setSelectedRequest(null)
    }
  }

  const handleCancel = (id: string) => {
    setRequests(requests.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)))
    showToast("Request Cancelled", "The booking request has been cancelled.", "destructive")
  }

  const handleRequestChange = (request: BookingRequest) => {
    setSelectedRequest(request)
    setChangeNotes(request.changeNotes || "")
    setIsChangeDialogOpen(true)
  }

  const handleSubmitChange = () => {
    if (selectedRequest) {
      setRequests(
        requests.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: "pending", changeNotes: changeNotes, notes: undefined }
            : r,
        ),
      )
      showToast("Changes Applied", "Changes have been applied and the booking is set to pending.")
      setIsChangeDialogOpen(false)
      setChangeNotes("")
      setSelectedRequest(null)
    }
  }

  const checkAllConfirmed = () => {
    if (requests.every(r => r.status === "confirmed" || r.status === "cancelled")) {
      setItineraries(itineraries.map(i => 
        i.id === selectedItinerary?.id ? { ...i, status: "confirmed" } : i
      ))
    }
  }

  const handleSendConfirmation = () => {
    if (selectedItinerary) {
      setItineraries(itineraries.map(i => 
        i.id === selectedItinerary.id ? { ...i, status: "finalized" } : i
      ))
      showToast("Confirmation Sent", `Final itinerary sent to ${selectedItinerary.userName}.`)
    }
  }

  const handleProcessChanges = () => {
    if (selectedItinerary) {
      setItineraries(itineraries.map(i => 
        i.id === selectedItinerary.id ? { ...i, status: "processing" } : i
      ))
      // Mock: Add change requests to bookings
      setRequests(requests.map((r, index) => 
        index % 3 === 0 ? { ...r, status: "change_requested", changeNotes: "User requested alternative option" } : r
      ))
      showToast("Processing Changes", "User change requests are being processed.")
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const confirmedRequests = requests.filter((r) => r.status === "confirmed")
  const cancelledRequests = requests.filter((r) => r.status === "cancelled")
  const changeRequests = requests.filter((r) => r.status === "change_requested")

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Dashboard</h1>
          <p className="text-muted-foreground">Manage assigned user itineraries and bookings</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Assigned Itineraries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {itineraries.map((itinerary) => (
                <Card key={itinerary.id} onClick={() => handleSelectItinerary(itinerary)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{itinerary.userName}'s Trip to {itinerary.activities[0].location}</CardTitle>
                      <p className="text-sm text-muted-foreground">Days: {itinerary.days} | Created: {new Date(itinerary.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={itinerary.status === "assigned" ? "default" : itinerary.status === "confirmed" ? "outline" : "secondary"}>
                      {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedItinerary && (
          <>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Itinerary Details - {selectedItinerary.userName}</CardTitle>
                  {selectedItinerary.status === "confirmed" && (
                    <Button onClick={handleSendConfirmation}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Confirmation to User
                    </Button>
                  )}
                  {selectedItinerary.status === "changes_requested" && (
                    <Button onClick={handleProcessChanges}>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Process User Changes
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total days: {selectedItinerary.days} | Status: {selectedItinerary.status}
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {Array.from({ length: selectedItinerary.days }, (_, dayIndex) => dayIndex + 1).map((day) => (
                    <div key={day} className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Day {day}</h3>
                      <div className="space-y-2">
                        {selectedItinerary.activities
                          .filter((activity) => activity.day === day)
                          .map((activity, index) => (
                            <div key={index} className="rounded-lg bg-muted p-3 text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(activity.type)}
                                <span className="font-medium capitalize">{activity.type}</span>
                              </div>
                              <div className="grid gap-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{activity.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TimeIcon className="h-4 w-4 text-muted-foreground" />
                                  <span>{activity.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-muted-foreground" />
                                  <span>{activity.transport}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span>${activity.cost.toFixed(2)}</span>
                                </div>
                                <div className="text-muted-foreground">{activity.details}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending <Badge className="ml-2">{pendingRequests.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                <TabsTrigger value="changes">Change Requests <Badge className="ml-2">{changeRequests.length}</Badge></TabsTrigger>
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
                            For {request.userName} ({request.userEmail})
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

              <TabsContent value="changes" className="space-y-4">
                {changeRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(request.type)}
                            <CardTitle className="text-lg">
                              {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Change Request
                            </CardTitle>
                            <Badge variant="outline">{request.id}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            For {request.userName} ({request.userEmail})
                          </p>
                        </div>
                        <Badge className="bg-orange-500">Change Requested</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Destination:</span>
                          <span>{request.destination}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Original Details:</span>
                          <span>{request.details}</span>
                        </div>
                        {request.changeNotes && (
                          <div className="rounded-lg bg-muted p-3 text-sm">
                            <span className="font-medium">User Change Notes:</span>
                            <p className="mt-1">{request.changeNotes}</p>
                          </div>
                        )}
                      </div>
                      <Button onClick={() => handleRequestChange(request)}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Handle Change
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {changeRequests.length === 0 && (
                  <Card>
                    <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
                      No change requests
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

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

        <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Handle Change Request</DialogTitle>
              <DialogDescription>
                Review user notes and update the booking details accordingly.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="change-notes">Updated Details / Notes</Label>
                <Textarea
                  id="change-notes"
                  placeholder="Enter updated booking details based on user request"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitChange} disabled={!changeNotes}>
                Apply Changes and Re-process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ToastViewport />
        <Toast open={openToast} onOpenChange={setOpenToast} variant={toastData.variant}>
          <ToastTitle>{toastData.title}</ToastTitle>
          <ToastDescription>{toastData.description}</ToastDescription>
          <ToastClose />
        </Toast>
      </div>
    </ToastProvider>
  )
}