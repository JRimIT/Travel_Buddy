"use client";

import { useState, useMemo } from "react";
import { PlaneTakeoff, Search as SearchIcon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { useSupportTrips } from "@/src/hooks/use-support-data";
import { useToast } from "../../components/ui/use-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface Activity {
  time: string;
  name: string;
  cost: number;
  place: { city: string; address: string };
}

interface Day {
  day: number;
  date: string;
  activities: Activity[];
}

interface FlightTicket {
  from: string;
  to: string;
  airline: string;
  price: number;
}

interface Hotel {
  name: string;
  formatted?: string;
  contact?: { phone?: string; email?: string };
  website?: string;
  facebook?: string;
}

interface Home {
  image: string;
}

interface Ticket {
  gaDi?: string;
  gaDen?: string;
  chuyenTau?: string;
  nhaXe?: string;
  diemDi?: string;
  diemDen?: string;
  soXe?: string;
  loaiXe?: string;
  ngayDi?: string;
  gioDi?: string;
  gioDen?: string;
  soGheTrong?: number;
}

interface Trip {
  _id: string;
  title: string;
  user: { _id: string; username: string; profileImage?: string };
  startDate: string;
  endDate: string;
  budget?: { flight?: number; hotel?: number; fun?: number };
  days?: Day[];
  description?: string;
  province?: string;
  mainTransport?: string;
  innerTransport?: string;
  hotelDefault?: Hotel;
  flightTicket?: FlightTicket[];
  home?: Home;
  ticket?: Ticket;
}

interface TripGridProps {
  type: "pending" | "assigned" | "history";
  title: string;
  description?: string;
}

export function TripGrid({ type, title, description }: TripGridProps) {
  const { toast } = useToast();
  const { data: trips, isLoading, error, mutate } = useSupportTrips(type);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<"date" | "budget" | "title">(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    if (!searchTerm.trim()) return trips;
    return trips.filter((trip: Trip) =>
      trip.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, trips]);

  const sortedTrips = useMemo(() => {
    const tripsToSort = [...filteredTrips];

    if (sortOption === "date") {
      tripsToSort.sort((a, b) => {
        const diff =
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        return sortOrder === "asc" ? diff : -diff;
      });
    } else if (sortOption === "budget") {
      tripsToSort.sort((a, b) => {
        const aBudget =
          (a.budget?.flight || 0) +
          (a.budget?.hotel || 0) +
          (a.budget?.fun || 0);
        const bBudget =
          (b.budget?.flight || 0) +
          (b.budget?.hotel || 0) +
          (b.budget?.fun || 0);
        return sortOrder === "asc" ? aBudget - bBudget : bBudget - aBudget;
      });
    } else if (sortOption === "title") {
      tripsToSort.sort((a, b) => a.title.localeCompare(b.title));
    }

    return tripsToSort;
  }, [filteredTrips, sortOption, sortOrder]);

  const handleAccept = async (tripId: string) => {
    try {
      const res = await fetch(`${API_URL}/supporter/assign/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to accept trip");
      toast({
        title: "✅ Assigned!",
        description: "Trip assigned successfully.",
      });
      mutate();
    } catch {
      toast({
        title: "❌ Error!",
        description: "Failed to assign trip",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (tripId: string) => {
    try {
      const res = await fetch(`${API_URL}/supporter/complete/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to complete trip");
      toast({ title: "✅ Completed!", description: "Trip marked as done." });
      mutate();
    } catch {
      toast({
        title: "❌ Error!",
        description: "Failed to complete trip",
        variant: "destructive",
      });
    }
  };

  const handleChat = async (trip: Trip) => {
    try {
      const res = await fetch(`${API_URL}/conversation/user/${trip.user._id}`);
      if (!res.ok) throw new Error("Failed to get conversation");
      const conversation = await res.json();
      window.location.href = `/admin/support-chat?conversationId=${conversation._id}`;
    } catch {
      toast({
        title: "❌ Error!",
        description: "Cannot start chat",
        variant: "destructive",
      });
    }
  };

  if (error) return <p className="text-red-500">{error.message}</p>;

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="mb-4 flex items-center gap-4">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="date">Sort by Date</option>
          <option value="budget">Sort by Budget</option>
          <option value="title">Sort by Title</option>
        </select>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as any)}
        >
          <option value="date">Date</option>
          <option value="budget">Budget</option>
          <option value="title">Title</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : sortedTrips.length === 0 ? (
        <p>No trips found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTrips.map((trip: Trip) => (
            <Card key={trip._id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlaneTakeoff className="h-5 w-5" />
                  {trip.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  By: {trip.user?.username}
                </p>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <p>📍 Location: {trip.province}</p>
                <p>🚌 Main transport: {trip.mainTransport}</p>
                <p>🚗 Inner transport: {trip.innerTransport}</p>
                {trip.ticket && (
                  <div>
                    <p className="font-semibold">🎫 Ticket Info:</p>
                    {trip.ticket.chuyenTau && (
                      <p>🚆 Train: {trip.ticket.chuyenTau}</p>
                    )}
                    {trip.ticket.gaDi && (
                      <p>🚉 Departure Station: {trip.ticket.gaDi}</p>
                    )}
                    {trip.ticket.gaDen && (
                      <p>🏁 Arrival Station: {trip.ticket.gaDen}</p>
                    )}
                    {trip.ticket.nhaXe && (
                      <p>🚌 Bus Company: {trip.ticket.nhaXe}</p>
                    )}
                    {trip.ticket.diemDi && (
                      <p>🛫 Departure Point: {trip.ticket.diemDi}</p>
                    )}
                    {trip.ticket.diemDen && (
                      <p>🛬 Arrival Point: {trip.ticket.diemDen}</p>
                    )}
                    {trip.ticket.gioDi && (
                      <p>⏰ Departure Time: {trip.ticket.gioDi}</p>
                    )}
                    {trip.ticket.gioDen && (
                      <p>⏰ Arrival Time: {trip.ticket.gioDen}</p>
                    )}
                    {/* {trip.ticket.soGheTrong !== undefined && (
                      <p>🪑 Seats Available: {trip.ticket.soGheTrong}</p>
                    )} */}
                  </div>
                )}

                <p>📝 Description: {trip.description}</p>
                <p>
                  🗓 Start Date: {new Date(trip.startDate).toLocaleDateString()}
                </p>
                <p>
                  🏁 End Date: {new Date(trip.endDate).toLocaleDateString()}
                </p>

                <div>
                  <p>💰 Budget:</p>
                  <ul className="ml-4 list-disc">
                    <li>Flight: {trip.budget?.flight || 0}$</li>
                    <li>Hotel: {trip.budget?.hotel || 0}$</li>
                    <li>Fun: {trip.budget?.fun || 0}$</li>
                  </ul>
                </div>

                {trip.hotelDefault && (
                  <div>
                    <p className="font-semibold">🏨 Hotel:</p>
                    <p>{trip.hotelDefault.name}</p>
                    <p>{trip.hotelDefault.formatted || "-"}</p>
                    <p>
                      🔗 Facebook:{" "}
                      {trip.hotelDefault.facebook ? (
                        <a
                          href={trip.hotelDefault.facebook}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {trip.hotelDefault.facebook}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                    <p className="font-semibold">
                      🌐 Website:{" "}
                      {trip.hotelDefault.website ? (
                        <a
                          href={trip.hotelDefault.website}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {trip.hotelDefault.website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                    {trip.hotelDefault.contact?.phone && (
                      <p>📞 {trip.hotelDefault.contact.phone}</p>
                    )}
                    {trip.hotelDefault.contact?.email && (
                      <p>✉ {trip.hotelDefault.contact.email}</p>
                    )}
                  </div>
                )}

                {/* {(() => {
                  const tickets = trip.flightTicket || [];
                  if (tickets.length === 0) return null;
                  return (
                    <div>
                      <p className="font-semibold">✈ Flight Tickets:</p>
                      <ul className="ml-4 list-disc">
                        {tickets.map((f: FlightTicket, idx: number) => (
                          <li key={idx}>
                            {f.airline}: {f.from} → {f.to} ({f.price}$)
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })()} */}

                {trip.home?.image && (
                  <div>
                    <p className="font-semibold">🏠 Home Image:</p>
                    <img
                      src={trip.home.image}
                      alt="Home"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                {type === "pending" && (
                  <button
                    onClick={() => handleAccept(trip._id)}
                    className="rounded-md bg-primary px-3 py-1 text-sm text-white hover:bg-primary/80"
                  >
                    Assigned
                  </button>
                )}

                {type === "assigned" && (
                  <>
                    <button
                      onClick={() => handleComplete(trip._id)}
                      className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                    >
                      Completed
                    </button>
                    <button
                      onClick={() => handleChat(trip)}
                      className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                    >
                      Chat
                    </button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
