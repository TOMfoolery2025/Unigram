/** @format */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Calendar,
  BookOpen,
  User,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Primary navigation items for mobile (limited to 5-6 items for optimal UX)
  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home, mobileVisible: true },
    { href: "/hives", label: "Hives", icon: MessageSquare, mobileVisible: true },
    { href: "/events", label: "Events", icon: Calendar, mobileVisible: true },
    { href: "/wiki", label: "Wiki", icon: BookOpen, mobileVisible: true },
    { href: `/profile/${user?.id}`, label: "Profile", icon: User, mobileVisible: true },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems
          .filter((item) => item.mobileVisible)
          .map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 min-w-[64px] min-h-[56px] transition-all",
                  "active:scale-95",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    active && "scale-110"
                  )}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
      </div>
    </nav>
  );
}
