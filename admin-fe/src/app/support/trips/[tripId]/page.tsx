"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";
import axios from "axios";
import Link from "next/link";

interface Task {
  name: string;
  completed: boolean;
  bookingInfo?: string;
}

interface Trip {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "assigned" | "processing" | "done";
  tasks: Task[];
  user: { username: string };
}

export default function TripDetailPage() {
  const { tripId } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId || !token) return;
    const fetchTrip = async () => {
      try {
        const res = await axios.get(`/api/supporter/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrip(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load trip");
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId, token]);

  const handleAssign = async () => {
    if (!trip) return;
    try {
      await axios.patch(
        `/api/supporter/trips/${trip._id}/assign`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTrip({ ...trip, status: "assigned" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign trip");
    }
  };

  const handleCompleteTask = async (index: number) => {
    const bookingInfo = prompt("Nhập thông tin booking cho task này:");
    if (!bookingInfo || !trip) return;
    try {
      await axios.patch(
        `/api/supporter/trips/${trip._id}/task/${index}/complete`,
        { bookingInfo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedTasks = [...trip.tasks];
      updatedTasks[index].completed = true;
      updatedTasks[index].bookingInfo = bookingInfo;
      setTrip({ ...trip, tasks: updatedTasks });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to complete task");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!trip) return <p>Trip not found</p>;

  const allTasksCompleted = trip.tasks.every((t) => t.completed);

  const handleFinishTrip = async () => {
    try {
      await axios.patch(
        `/api/supporter/trips/${trip._id}/finish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Trip đã hoàn tất!");
      router.push("/supporter/trips/assigned");
    } catch (err: any) {
      alert(err.response?.data?.message || "Không thể hoàn tất trip");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{trip.title}</h1>
      <p>{trip.description}</p>
      <p>
        Status: <span className="font-semibold">{trip.status}</span>
      </p>
      <p>Người tạo: {trip.user.username}</p>

      {trip.status === "pending" && (
        <button
          onClick={handleAssign}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Nhận Trip
        </button>
      )}

      <h2 className="text-xl font-semibold mt-4">Tasks</h2>
      <ul className="space-y-2">
        {trip.tasks.map((task, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between border p-2 rounded"
          >
            <div>
              <span
                className={task.completed ? "line-through text-green-600" : ""}
              >
                {task.name}
              </span>
              {task.completed && task.bookingInfo && (
                <p className="text-sm text-muted-foreground">
                  {task.bookingInfo}
                </p>
              )}
            </div>
            {!task.completed && trip.status === "assigned" && (
              <button
                onClick={() => handleCompleteTask(idx)}
                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Hoàn tất
              </button>
            )}
          </li>
        ))}
      </ul>

      {trip.status === "assigned" && allTasksCompleted && (
        <button
          onClick={handleFinishTrip}
          className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Hoàn tất Trip
        </button>
      )}

      <Link
        href="/supporter/trips/assigned"
        className="text-blue-500 underline"
      >
        Quay lại danh sách
      </Link>
    </div>
  );
}
