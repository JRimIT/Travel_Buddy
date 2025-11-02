"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/lib/auth-context";
import { PlaneTakeoff } from "lucide-react";

export default function PendingTrips() {
  const { token } = useAuth();
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:3000/api/supporter/trips?status=pending", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTrips(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Pending Trips</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip: any) => (
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

            <CardContent>
              <p className="text-sm">
                📍 {trip.days?.[0]?.activities?.[0]?.place?.city}
              </p>
              <p className="text-sm">
                📅 {new Date(trip.startDate).toLocaleDateString()} →{" "}
                {new Date(trip.endDate).toLocaleDateString()}
              </p>
              <p className="text-sm">
                💰 Budget:{" "}
                {trip.budget?.flight + trip.budget?.hotel + trip.budget?.fun}$
              </p>
              <p className="text-xs mt-2">
                Tasks: {trip.tasks?.filter((t: any) => t.completed).length}/
                {trip.tasks?.length}
              </p>
            </CardContent>

            <CardFooter className="flex justify-end">
              <Link
                href={`/support/trips/${trip._id}`}
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/80"
              >
                View Details
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
