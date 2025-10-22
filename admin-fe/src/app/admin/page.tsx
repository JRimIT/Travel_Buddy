"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Users, Calendar, MapPin, TrendingUp, User, Send, Hotel, Utensils, Car, Clock, DollarSign } from "lucide-react"
import { OverviewChart } from "../../components/admin/overview-chart"
import { RecentTrips } from "../../components/admin/recent-trips"
import { PopularDestinations } from "../../components/admin/popular-destinations"
import { useAuth } from "../../lib/auth-context"
import { SupportDashboard } from "../support/support-dashboard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "../../components/ui/toast"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Separator } from "../../components/ui/separator"

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
  status: "submitted" | "assigned" | "processing" | "confirmed" | "changes_requested" | "finalized"
  assignedSupportId?: string
  assignedSupportName?: string
}

interface SupportStaff {
  id: string
  name: string
  email: string
}

// Mock data for support staff
const mockSupportStaff: SupportStaff[] = [
  { id: "S001", name: "Alice Brown", email: "alice@travelbuddy.com" },
  { id: "S002", name: "Bob Wilson", email: "bob@travelbuddy.com" },
  { id: "S003", name: "Carol Davis", email: "carol@travelbuddy.com" },
]

// Mock itineraries
const mockItineraries: Itinerary[] = [
  {
    id: "IT001",
    userId: "U123",
    userName: "John Doe",
    userEmail: "john@example.com",
    days: 5,
    createdAt: "2025-10-20T10:00:00",
    status: "submitted",
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
    assignedSupportId: "S001",
    assignedSupportName: "Alice Brown",
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
  {
    title: "Total Users",
    value: "2,543",
    change: "+12.5%",
    icon: Users,
    trend: "up",
  },
  {
    title: "Active Trips",
    value: "1,234",
    change: "+8.2%",
    icon: Calendar,
    trend: "up",
  },
  {
    title: "Locations",
    value: "856",
    change: "+23.1%",
    icon: MapPin,
    trend: "up",
  },
  {
    title: "Monthly Revenue",
    value: "$45,231",
    change: "+15.3%",
    icon: TrendingUp,
    trend: "up",
  },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [itineraries, setItineraries] = useState<Itinerary[]>(mockItineraries)
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSupportId, setSelectedSupportId] = useState<string>("")
  const [openToast, setOpenToast] = useState(false)
  const [toastData, setToastData] = useState<{ title: string; description: string; variant?: "default" | "destructive" }>({
    title: "",
    description: "",
  })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    setToastData({ title, description, variant })
    setOpenToast(true)
    timerRef.current = setTimeout(() => {
      setOpenToast(false)
    }, 3000)
  }

  const handleAssignItinerary = (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary)
    setSelectedSupportId(itinerary.assignedSupportId || "")
    setIsAssignDialogOpen(true)
  }

  const handleSubmitAssignment = () => {
    if (selectedItinerary && selectedSupportId) {
      const support = mockSupportStaff.find(s => s.id === selectedSupportId)
      setItineraries(
        itineraries.map(i =>
          i.id === selectedItinerary.id
            ? { ...i, status: "assigned", assignedSupportId: selectedSupportId, assignedSupportName: support?.name }
            : i
        )
      )
      showToast("Itinerary Assigned", `Assigned to ${support?.name || "support staff"}.`)
      setIsAssignDialogOpen(false)
      setSelectedItinerary(null)
      setSelectedSupportId("")
    } else {
      showToast("Assignment Failed", "Please select a support staff member.", "destructive")
    }
  }

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

  if (user?.role === "support") {
    return <SupportDashboard itineraries={itineraries.filter(i => i.assignedSupportId === user.id)} />
  }

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage user itineraries and assign to support staff.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <OverviewChart />
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Popular Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              <PopularDestinations />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Itineraries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {itineraries.map((itinerary) => (
                <Card key={itinerary.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{itinerary.userName}'s Trip to {itinerary.activities[0].location}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Days: {itinerary.days} | Created: {new Date(itinerary.createdAt).toLocaleDateString()} | 
                        Status: {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                        {itinerary.assignedSupportName && ` | Assigned to: ${itinerary.assignedSupportName}`}
                      </p>
                    </div>
                    <Button onClick={() => handleAssignItinerary(itinerary)}>
                      <User className="mr-2 h-4 w-4" />
                      {itinerary.assignedSupportId ? "Reassign" : "Assign"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] pr-4">
                      {Array.from({ length: itinerary.days }, (_, dayIndex) => dayIndex + 1).map((day) => (
                        <div key={day} className="mb-4">
                          <h3 className="text-md font-semibold mb-2">Day {day}</h3>
                          <div className="space-y-2">
                            {itinerary.activities
                              .filter((activity) => activity.day === day)
                              .map((activity, index) => (
                                <div key={index} className="rounded-lg bg-muted p-2 text-sm">
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
                                      <Clock className="h-4 w-4 text-muted-foreground" />
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
                          <Separator className="my-2" />
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTrips />
          </CardContent>
        </Card>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Itinerary</DialogTitle>
              <DialogDescription>
                Select a support staff member to assign this itinerary to.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="support-staff">Support Staff</Label>
                <Select value={selectedSupportId} onValueChange={setSelectedSupportId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select support staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSupportStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitAssignment} disabled={!selectedSupportId}>
                Assign
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