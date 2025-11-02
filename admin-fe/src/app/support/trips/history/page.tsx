"use client";

import { useEffect, useState } from "react";

interface User {
  username: string;
  profileImage: string;
}

interface Trip {
  _id: string;
  title: string;
  description: string;
  status: string;
  tasks: { name: string; completed: boolean; bookingInfo?: string }[];
  user: User;
}

export default function History() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/supporter/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTrips(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!trips.length) return <p>No history available</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Booking History</h1>
      <ul className="space-y-4">
        {trips.map((trip) => (
          <li key={trip._id} className="border p-4 rounded">
            <h2 className="font-semibold">{trip.title}</h2>
            <p>{trip.description}</p>
            <p className="text-xs text-gray-500 mt-1">Status: {trip.status}</p>
            <ul className="mt-2 space-y-1">
              {trip.tasks.map((task, idx) => (
                <li key={idx} className="text-sm">
                  {task.name} - {task.completed ? "Completed" : "Pending"}{" "}
                  {task.bookingInfo && `(${task.bookingInfo})`}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
