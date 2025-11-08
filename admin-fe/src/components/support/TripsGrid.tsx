"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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

interface Trip {
  _id: string;
  title: string;
  user: { username: string; profileImage?: string };
  startDate: string;
  endDate: string;
  budget?: { flight?: number; hotel?: number; fun?: number };
  tasks?: { completed: boolean }[];
  notes?: string;
  location?: string;
  transport?: string;
  description?: string;
  status?: string;
  totalCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface TripGridProps {
  type: "pending" | "assigned" | "history";
  title: string;
  description?: string;
}

export function TripGrid({ type, title, description }: TripGridProps) {
  const { data: trips, isLoading, error, mutate } = useSupportTrips(type);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    if (!searchTerm.trim()) return trips;
    return trips.filter((trip: Trip) =>
      trip.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, trips]);

  const handleAccept = async (tripId: string) => {
    try {
      await fetch(`http://localhost:3000/api/supporter/assign/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supporterToken")}`,
        },
      });

      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  if (error) return <p className="text-red-500">{error.message}</p>;

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="mb-4 relative max-w-sm">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : filteredTrips.length === 0 ? (
        <p>No trips found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip: Trip) => (
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

              <CardContent className="space-y-1 text-sm">
                <p>📍 Location: {trip.location}</p>
                <p>🚌 Transport: {trip.transport}</p>
                <p>📝 Description: {trip.description}</p>
                <p>
                  💰 Flight: {trip.budget?.flight || 0}$ | Hotel:{" "}
                  {trip.budget?.hotel || 0}$ | Fun: {trip.budget?.fun || 0}$
                </p>
                <p>
                  ✅ Tasks completed:{" "}
                  {trip.tasks?.filter((t) => t.completed).length}/
                  {trip.tasks?.length}
                </p>

                <p>📄 Notes: {trip.notes}</p>
              </CardContent>

              <CardFooter className="flex justify-between items-center">
                <Link
                  href={`/support/trips/${trip._id}`}
                  className="rounded-md bg-secondary px-3 py-1 text-sm hover:bg-secondary/80"
                >
                  View
                </Link>

                {type === "pending" && (
                  <button
                    onClick={() => handleAccept(trip._id)}
                    className="rounded-md bg-primary px-3 py-1 text-sm text-white hover:bg-primary/80"
                  >
                    Nhận
                  </button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
