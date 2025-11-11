"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "../../components/ui/toast";

interface Trip {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  budget: {
    flight: number;
    hotel: number;
    fun: number;
  };
  user: {
    username: string;
  };
}

interface Stats {
  assigned: number;
  pending: number;
  confirmedToday: number;
  changeRequests: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export default function SupportDashboard() {
  const [stats, setStats] = useState<Stats>({
    assigned: 0,
    pending: 0,
    confirmedToday: 0,
    changeRequests: 0,
  });
  const [assignedTrips, setAssignedTrips] = useState<Trip[]>([]);
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [openToast, setOpenToast] = useState(false);
  const [toastData, setToastData] = useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }>({ title: "", description: "" });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (
    title: string,
    description: string,
    variant: "default" | "destructive" = "default"
  ) => {
    setToastData({ title, description, variant });
    setOpenToast(true);
    timerRef.current = setTimeout(() => setOpenToast(false), 3000);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return showToast("Error", "No access token", "destructive");

      const res = await fetch(`${API_URL}/supporter/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Stats = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      showToast("Error", "Failed to fetch statistics", "destructive");
    }
  };

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return showToast("Error", "No access token", "destructive");

      const [assignedRes, pendingRes] = await Promise.all([
        fetch(`${API_URL}/supporter/assigned`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/supporter/booking_pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!assignedRes.ok)
        throw new Error(`Assigned HTTP ${assignedRes.status}`);
      if (!pendingRes.ok) throw new Error(`Pending HTTP ${pendingRes.status}`);

      const assignedData: Trip[] = await assignedRes.json();
      const pendingData: Trip[] = await pendingRes.json();

      setAssignedTrips(assignedData);
      setPendingTrips(pendingData);
    } catch (err) {
      console.error(err);
      showToast("Error", "Failed to fetch trips", "destructive");
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTrips();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Support Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage assigned user itineraries and bookings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assigned Trips
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assigned}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Trips
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmed Today
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmedToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Change Requests
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.changeRequests}</div>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Trips List */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4 space-y-4">
              {assignedTrips.length === 0 && (
                <p className="text-muted-foreground text-center py-10">
                  No assigned itineraries
                </p>
              )}
              {assignedTrips.map((trip) => (
                <Card
                  key={trip._id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedTrip(trip)}
                >
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">{trip.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.startDate).toLocaleDateString()} -{" "}
                        {new Date(trip.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{trip.user.username}</Badge>
                  </CardHeader>
                </Card>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Toast */}
        <ToastViewport />
        <Toast open={openToast} onOpenChange={setOpenToast}>
          <ToastTitle>{toastData.title}</ToastTitle>
          <ToastDescription>{toastData.description}</ToastDescription>
          <ToastClose />
        </Toast>
      </div>
    </ToastProvider>
  );
}
