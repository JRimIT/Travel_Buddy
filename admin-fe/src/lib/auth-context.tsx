"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "./api-client"

type UserRole = "admin" | "support" | "user"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("admin_user")
        const token = localStorage.getItem("admin_token")

        if (storedUser && token) {
          const parsed = JSON.parse(storedUser)
          setUser(parsed)
          apiClient.setToken(token)
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error)
        localStorage.removeItem("admin_user")
        localStorage.removeItem("admin_token")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      const response = await apiClient.login(email, password)

      const { token, user: backendUser } = response

      const frontendUser: User = {
        id: backendUser._id,
        name: backendUser.username,
        email: backendUser.email,
        role: backendUser.role,
      }

      setUser(frontendUser)
      apiClient.setToken(token)
      localStorage.setItem("admin_user", JSON.stringify(frontendUser))
      localStorage.setItem("admin_token", token)

      router.push("/admin")
      return { success: true }
    } catch (error: any) {
      console.error("Login failed:", error)
      const errorMessage = error.message || "Login failed. Please try again."
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    apiClient.clearToken()
    localStorage.removeItem("admin_user")
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
