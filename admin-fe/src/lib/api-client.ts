interface ApiResponse<T> {
    data?: T
    message?: string
    error?: string
}

interface ApiError {
    message: string
    status: number
}

class ApiClient {
    private baseUrl = "http://localhost:3000/api"
    private token: string | null = null

    constructor() {
        const savedToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null
        if (savedToken) {
            this.token = savedToken
        }
    }

    setToken(token: string) {
        this.token = token
        if (typeof window !== "undefined") {
            localStorage.setItem("adminToken", token)
        }
    }

    clearToken() {
        this.token = null
    }

    private buildQuery(params: Record<string, any>): string {
        return new URLSearchParams(
            Object.fromEntries(
                Object.entries(params).filter(([_, value]) =>
                    value !== undefined && value !== null && value !== ''
                )
            )
        ).toString()
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        }

        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`
        }

        const defaultOptions: RequestInit = {
            // credentials: "include",
            headers,
        }

        const response = await fetch(url, { ...defaultOptions, ...options })

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: "Network error",
            }))
            throw {
                message: error.message || "API error",
                status: response.status,
            } as ApiError
        }

        return response.json()
    }

    async login(email: string, password: string) {
        return this.request<{
            token: string
            user: {
                _id: string
                username: string
                email: string
                role: "admin" | "support"
            }
        }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        })
    }

    // Sales endpoints
    async getSalesTotal() {
        return this.request<{
            totalRevenue: number
            totalBookings: number
        }>("/admin/sales/total")
    }

    async getSalesWeekly() {
        return this.request<{
            total: number
            count: number
            startDate: string
            endDate: string
        }>("/admin/sales/weekly")
    }

    // Places endpoints
    async getTopPlaces(limit = 5) {
        return this.request<
            Array<{
                _id: string
                name: string
                bookingCount: number
                averageRating: number
            }>
        >(`/admin/places/top?limit=${limit}&sortBy=bookingCount`)
    }

    // Trip approval endpoints
    async getTripApprovals() {
        return this.request<{
            trips: Array<{
                _id: string
                title: string
                startDate: string
                endDate: string
                isPublic: boolean
                status?: "pending_review" | "approved" | "rejected"
                user: { _id: string; username: string; email: string }
                createdAt: string
            }>
            total: number
            page: number
            totalPages: number
        }>("/admin/trips-pending")
    }

    async getTripDetail(id: string) {
        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            throw new Error("Invalid trip ID format")
        }

        return this.request<{
            _id: string
            title: string
            description: string
            budget: { flight: number; hotel: number; fun: number }
            days: Array<{
                day: number
                date: string
                activities: Array<{
                    time: string
                    name: string
                    cost: number
                    place: any
                }>
            }>
            image: string
            hotelDefault: any
            flightTicket: any
            isPublic: boolean
            status: string
            user: { _id: string; username: string; email: string; phone: string }
            reviewedBy?: { username: string }
            reviewedAt?: string
            rejectReason?: string
            createdAt: string
            startDate: string
            endDate: string
        }>(`/admin/trips/${id}`)
    }

    async approveTripApproval(id: string) {
        return this.request(`/admin/trips/${id}/approve`, {
            method: "POST",
        })
    }

    async rejectTripApproval(id: string, reason: string) {
        return this.request(`/admin/trips/${id}/reject`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        })
    }

    async getTrips(
        page = 1,
        limit = 10,
        filters?: Record<string, any>,
        signal?: AbortSignal
    ) {
        const query = this.buildQuery({ page, limit, ...filters })
        return this.request(`/admin/trips?${query}`, { signal })
    }

    async getReviews(
        page = 1,
        limit = 10,
        filters?: Record<string, any>,
        signal?: AbortSignal
    ) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters,
        })
        return this.request<{
            reviews: Array<{
                _id: string
                user: { _id: string; username: string }
                targetType: "Place" | "TripSchedule"
                targetId: string
                rating: number
                comment: string
                status: "visible" | "hidden"
                createdAt: string
            }>
            total: number
            page: number
            totalPages: number
        }>(`/admin/reviews?${params}`, { signal })
    }

    async hideReview(id: string) {
        return this.request(`/admin/reviews/${id}/hide`, { method: "PUT" })
    }

    async showReview(id: string) {
        return this.request(`/admin/reviews/${id}/show`, { method: "PUT" })
    }

    async getReports(
        page = 1,
        limit = 10,
        filters?: Record<string, any>,
        signal?: AbortSignal
    ) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters,
        })
        return this.request<{
            reports: Array<{
                _id: string
                reporter: { _id: string; username: string }
                reason: string
                status: "pending" | "reviewed" | "resolved"
                createdAt: string
            }>
            total: number
            page: number
            totalPages: number
        }>(`/admin/reports?${params}`, { signal })
    }

    async resolveReport(id: string, action: string) {
        return this.request(`/admin/reports/${id}/resolve`, {
            method: "PUT",
            body: JSON.stringify({ action }),
        })
    }

    async getUsers(page = 1, limit = 10, filters?: Record<string, any>, signal?: AbortSignal) { // THÊM signal
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(filters ? Object.fromEntries(
                Object.entries(filters).filter(([, value]) => value !== undefined)
            ) : {}),
        })
        return this.request<{
            users: Array<{
                _id: string
                username: string
                email: string
                phone: string
                isLocked: boolean
                createdAt: string
            }>
            total: number
            page: number
            totalPages: number
        }>(`/admin/users?${params}`, { signal }) // TRUYỀN signal vào request
    }

    async lockUser(id: string) {
        return this.request(`/admin/users/${id}/lock`, { method: "PUT" })
    }

    async unlockUser(id: string) {
        return this.request(`/admin/users/${id}/unlock`, { method: "PUT" })
    }
}

export const apiClient = new ApiClient()
