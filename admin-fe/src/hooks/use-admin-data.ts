"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient } from "../lib/api-client"
import useSWR from "swr";

interface UseDataReturn<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  mutate: () => Promise<void>
}

function useData<T>(fetcher: () => Promise<T>): UseDataReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const mutate = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    mutate()
  }, [mutate])

  return { data, error, isLoading, mutate }
}

// === SALES ===
export function useSalesTotal() {
  return useSWR("sales-total", () => apiClient.getSalesTotal(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
}

export function useSalesWeekly() {
  return useSWR("sales-weekly", () => apiClient.getSalesWeekly(), {
    revalidateOnFocus: false,
  })
}

export function useSalesTrends(params?: { groupBy?: string; fromDate?: string; toDate?: string }) {
  const key = params ? ["sales-trends", params] : "sales-trends"
  return useSWR(key, () => apiClient.getSalesTrends(params), {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000, // 5 phút
  })
}

// === USERS ===
export function useUsersStats() {
  return useSWR("users-stats", () => apiClient.getUsersStats(), {
    revalidateOnFocus: false,
    dedupingInterval: 10 * 60 * 1000,
  })
}

// === TRIPS ===
export function useTripStatistics(params?: { fromDate?: string; toDate?: string }) {
  const key = params ? ["trips-stats", params] : "trips-stats"
  return useSWR(key, () => apiClient.getTripStatistics(params), {
    revalidateOnFocus: false,
  })
}

// === REVIEWS ===
export function useReviewStats(params?: { targetId?: string; fromDate?: string; toDate?: string }) {
  const key = params ? ["reviews-stats", params] : "reviews-stats"
  return useSWR(key, () => apiClient.getReviewStats(params), {
    revalidateOnFocus: false,
  })
}

export function useTopPlaces(limit = 5) {
  return useData(useCallback(() => apiClient.getTopPlaces(limit), [limit]))
}

export function useTripApprovals() {
  const { data, error, mutate } = useSWR("trip-approvals", () =>
    apiClient.getTripApprovals()
  )

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}

export function useTrips(page = 1, limit = 10, filters?: Record<string, any>) {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchTrips = useCallback(async (
    currentPage: number,
    currentLimit: number,
    currentFilters?: Record<string, any>
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.getTrips(currentPage, currentLimit, currentFilters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchTrips(page, limit, filters)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [page, limit, filters, fetchTrips])

  const mutate = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    setIsLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      const result = await apiClient.getTrips(page, limit, filters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [page, limit, filters])

  return { data, error, isLoading, mutate }
}

export function useReviews(page = 1, limit = 10, filters?: Record<string, any>) {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchReviews = useCallback(async (
    currentPage: number,
    currentLimit: number,
    currentFilters?: Record<string, any>
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.getReviews(currentPage, currentLimit, currentFilters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchReviews(page, limit, filters)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [page, limit, filters, fetchReviews])

  const mutate = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    setIsLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      // THÊM SIGNAL VÀO ĐÂY
      const result = await apiClient.getReviews(page, limit, filters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [page, limit, filters])

  return { data, error, isLoading, mutate }
}

export function useReports(page = 1, limit = 10, filters?: Record<string, any>) {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchReports = useCallback(async (
    currentPage: number,
    currentLimit: number,
    currentFilters?: Record<string, any>
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.getReports(currentPage, currentLimit, currentFilters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchReports(page, limit, filters)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [page, limit, filters, fetchReports])

  const mutate = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    setIsLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      const result = await apiClient.getReports(page, limit, filters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [page, limit, filters])

  return { data, error, isLoading, mutate }
}

export function useUsers(page = 1, limit = 10, filters?: Record<string, any>) {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchUsers = useCallback(async (
    currentPage: number,
    currentLimit: number,
    currentFilters?: Record<string, any>
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.getUsers(currentPage, currentLimit, currentFilters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchUsers(page, limit, filters)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [page, limit, filters, fetchUsers])

  const mutate = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    setIsLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      const result = await apiClient.getUsers(page, limit, filters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setIsLoading(false)
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
      }
    }
  }, [page, limit, filters])

  return { data, error, isLoading, mutate }
}