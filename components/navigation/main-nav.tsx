/** @format */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, signOut } from "@/lib/auth";
import {
  Home,
  MessageSquare,
  Calendar,
  CalendarDays,
  BookOpen,
  LogOut,
  Hash,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UserAvatar } from "@/components/profile/user-avatar";

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, color: "primary" },
    { href: "/hives", label: "Hives", icon: MessageSquare, color: "orange" },
    { href: "/clusters", label: "Clusters", icon: Hash, color: "green" },
    { href: "/events", label: "Events", icon: Calendar, color: "red" },
    { href: "/calendar", label: "Calendar", icon: CalendarDays, color: "primary" },
    { href: "/wiki", label: "Wiki", icon: BookOpen, color: "blue" },
    // example future items:
    // { href: "/people", label: "People", icon: Users },
  ];

  return (
    <aside className='hidden lg:flex fixed left-0 top-0 z-40 h-screen w-72 flex-col border-r border-border/60 bg-background/80 bg-gradient-to-b from-background to-background/60 backdrop-blur-xl shadow-xl' aria-label="Desktop navigation">
      {/* Brand */}
      <div className='flex items-center gap-3 px-4 pt-4 pb-6'>
        <div className='h-10 w-10 rounded-xl shadow-lg overflow-hidden flex items-center justify-center bg-background'>
          <Image
            src='/logo.svg'
            alt='Unigram logo'
            width={32}
            height={32}
            className='object-contain'
            priority
          />
        </div>

        <div>
          <p className='text-lg font-semibold tracking-widest text-white uppercase'>
            Unigram
          </p>
          <p className='text-xs text-muted-foreground'>TUM Community</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className='flex-1 space-y-1 px-2'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          const colorClasses = {
            primary: active ? "bg-primary/15 text-white" : "",
            orange: active ? "bg-orange-500/15 text-white" : "",
            green: active ? "bg-green-500/15 text-white" : "",
            red: active ? "bg-red-500/15 text-white" : "",
            blue: active ? "bg-blue-500/15 text-white" : "",
          };

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? `${colorClasses[item.color as keyof typeof colorClasses]} shadow-sm`
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}>
              <Icon className='h-4 w-4' />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / settings / signout */}
      <div className='mt-auto border-t border-border/60 px-4 py-4 space-y-3'>
        <div className='flex items-center gap-3'>
          {user?.id ? (
            <UserAvatar
              userId={user.id}
              displayName={user.display_name}
              avatarUrl={user.avatar_url}
              size='sm'
            />
          ) : (
            <div className='h-9 w-9 rounded-full overflow-hidden bg-muted flex items-center justify-center'>
              <User className='h-4 w-4 text-muted-foreground' />
            </div>
          )}
          <div className='min-w-0'>
            <p className='truncate text-xs font-medium text-foreground'>
              {user?.email ?? "Guest"}
            </p>
            <p className='text-[11px] text-muted-foreground'>Signed in</p>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push(`/profile/${user?.id}`)}
            className='flex-1 justify-start text-xs text-muted-foreground hover:text-foreground'>
            <User className='mr-2 h-3 w-3' />
            Profile
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={handleSignOut}
            className='flex-1 justify-start text-xs text-red-300 hover:text-red-400 hover:bg-red-500/10'>
            <LogOut className='mr-2 h-3 w-3' />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
