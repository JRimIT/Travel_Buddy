"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../lib/api-client";

interface UseSupportTripsReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => Promise<void>;
}

export function useSupportTrips(
  type: "pending" | "assigned" | "history",
  page = 1,
  limit = 10,
  filters?: Record<string, any>
): UseSupportTripsReturn<any> {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  const fetchTrips = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      let result;
      switch (type) {
        case "pending":
          result = await apiClient.getPendingTrips(controller.signal);
          break;
        case "assigned":
          result = await apiClient.getAssignedTrips(controller.signal);
          break;
        case "history":
          result = await apiClient.getTripHistory(controller.signal);
          break;
        default:
          throw new Error("Invalid trip type");
      }

      if (!controller.signal.aborted) setData(result);
    } catch (err: any) {
      if (err.name !== "AbortError" && !controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!abortRef.current?.signal.aborted) setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchTrips();
    return () => abortRef.current?.abort();
  }, [fetchTrips]);

  return { data, error, isLoading, mutate: fetchTrips };
}
