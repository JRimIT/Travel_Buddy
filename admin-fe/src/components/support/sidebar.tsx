"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { ClipboardCheck, Clock, History, MapPin } from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";

const navigation = [
  {
    name: "Pending Trips",
    href: "/support/pending",
    icon: Clock,
    roles: ["support"],
  },
  {
    name: "Assigned Trips",
    href: "/support/assigned",
    icon: ClipboardCheck,
    roles: ["support"],
  },
  {
    name: "History",
    href: "/support/history",
    icon: History,
    roles: ["support"],
  },
];

export function SupportSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/support/pending" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Support Panel</span>
        </Link>
      </div>

      {user && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600">
              Support
            </div>
            <span className="text-sm text-muted-foreground">{user.name}</span>
          </div>
        </div>
      )}

      <nav className="space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
