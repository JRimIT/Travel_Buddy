"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SupportSidebar } from "@/src/components/support/sidebar";
import { AuthProvider, useAuth } from "@/src/lib/auth-context";

function SupportLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      !isLoading &&
      (!user || user.role !== "support") &&
      pathname !== "/support/login"
    ) {
      router.push("/support/login");
    }
  }, [user, isLoading, router, pathname]);

  if (pathname === "/support/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <SupportSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SupportLayoutContent>{children}</SupportLayoutContent>
    </AuthProvider>
  );
}
