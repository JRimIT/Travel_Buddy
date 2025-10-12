import { UsersTable } from "../../../components/admin/users-table"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Search, UserPlus } from "lucide-react"

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage all users and their accounts</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search users by name or email..." className="pl-9" />
        </div>
      </div>

      <UsersTable />
    </div>
  )
}
