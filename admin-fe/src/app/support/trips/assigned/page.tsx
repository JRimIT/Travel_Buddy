"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/lib/auth-context";
import axios from "axios";
import Link from "next/link";

interface Trip {
  _id: string;
  title: string;
  status: string;
}

export default function AssignedTripsPage() {
  const { token } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchTrips = async () => {
      try {
        const res = await axios.get("/api/supporter/trips/assigned", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrips(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [token]);

  if (loading) return <p>Loading...</p>;
  if (trips.length === 0) return <p>Không có trip nào đang xử lý</p>;

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-bold">Trip đang xử lý</h1>
      <ul className="space-y-2">
        {trips.map((trip) => (
          <li
            key={trip._id}
            className="border p-2 rounded flex justify-between items-center"
          >
            <span>{trip.title}</span>
            <Link
              href={`/supporter/trips/${trip._id}`}
              className="text-blue-500 underline"
            >
              Xem chi tiết
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
