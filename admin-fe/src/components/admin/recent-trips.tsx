import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"

const trips = [
  {
    id: 1,
    user: "John Doe",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "Paris, France",
    dates: "Dec 15 - Dec 22, 2024",
    status: "ongoing",
    budget: "$3,500",
  },
  {
    id: 2,
    user: "Sarah Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "Tokyo, Japan",
    dates: "Jan 5 - Jan 15, 2025",
    status: "planning",
    budget: "$4,200",
  },
  {
    id: 3,
    user: "Mike Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "New York, USA",
    dates: "Dec 1 - Dec 5, 2024",
    status: "completed",
    budget: "$2,800",
  },
  {
    id: 4,
    user: "Emily Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "London, UK",
    dates: "Feb 10 - Feb 17, 2025",
    status: "planning",
    budget: "$3,100",
  },
  {
    id: 5,
    user: "David Lee",
    avatar: "/placeholder.svg?height=40&width=40",
    destination: "Dubai, UAE",
    dates: "Mar 20 - Mar 28, 2025",
    status: "planning",
    budget: "$5,500",
  },
]

const statusColors = {
  ongoing: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  planning: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  completed: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
}

export function RecentTrips() {
  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <div key={trip.id} className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={trip.avatar || "/placeholder.svg"} alt={trip.user} />
              <AvatarFallback>
                {trip.user
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{trip.user}</p>
              <p className="text-xs text-muted-foreground">{trip.destination}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{trip.dates}</p>
              <p className="text-xs text-muted-foreground">{trip.budget}</p>
            </div>
            <Badge variant="secondary" className={statusColors[trip.status as keyof typeof statusColors]}>
              {trip.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
