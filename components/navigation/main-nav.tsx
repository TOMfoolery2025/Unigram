/** @format */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, signOut } from "@/lib/auth";
import {
  Home,
  MessageSquare,
  Calendar,
  Users,
  BookOpen,
  LogOut,
  Hash,
  Settings,
  Search,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/forums", label: "Forums", icon: MessageSquare },
    { href: "/channels", label: "Channels", icon: Hash },
    { href: "/wiki", label: "Wiki", icon: BookOpen },
    // example future items:
    // { href: "/events", label: "Events", icon: Calendar },
    // { href: "/people", label: "People", icon: Users },
  ];

  return (
    <aside className='fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-border/60 bg-background/80 bg-gradient-to-b from-background to-background/60 backdrop-blur-xl shadow-xl'>
      {/* Brand */}
      <div className='flex items-center gap-3 px-4 pt-4 pb-6'>
        <div className='h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg'>
          <span className='text-xl font-bold text-white'>U</span>
        </div>
        <div>
          <p className='text-sm font-semibold tracking-widest text-primary uppercase'>
            Unigram
          </p>
          <p className='text-xs text-muted-foreground'>TUM Community</p>
        </div>
      </div>

      {/* Search (for channels / forums) */}
      <div className='px-4 pb-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search channels...'
            className='pl-9 bg-muted/40 border-border/60 text-sm'
          />
        </div>
      </div>

      {/* Nav items */}
      <nav className='flex-1 space-y-1 px-2'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary shadow-sm"
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
          <div className='h-9 w-9 rounded-full bg-muted flex items-center justify-center'>
            <User className='h-4 w-4 text-muted-foreground' />
          </div>
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
            className='flex-1 justify-start text-xs text-muted-foreground hover:text-foreground'>
            <Settings className='mr-2 h-3 w-3' />
            Settings
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
