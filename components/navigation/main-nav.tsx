/** @format */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, signOut } from "@/lib/auth";
import {
  Home,
  MessageSquare,
  Calendar,
  Users,
  BookOpen,
  LogOut,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/forums",
      label: "Forums",
      icon: MessageSquare,
      active: pathname.startsWith("/forums"),
    },
    {
      href: "/channels",
      label: "Channels",
      icon: Hash,
      active: pathname.startsWith("/channels"),
    },
    {
      href: "/wiki",
      label: "Wiki",
      icon: BookOpen,
      active: pathname.startsWith("/wiki"),
    },
  ];

  return (
    <nav className='bg-gray-900 border-b border-gray-700'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center space-x-8'>
            <Link href='/dashboard' className='flex items-center'>
              <span className='text-xl font-bold text-violet-400'>
                TUM Community
              </span>
            </Link>

            <div className='hidden md:flex space-x-4'>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      item.active
                        ? "bg-violet-900 text-violet-300"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}>
                    <Icon className='h-4 w-4 mr-2' />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className='flex items-center space-x-4'>
            <span className='text-sm text-gray-400 hidden sm:block'>
              {user?.email}
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleSignOut}
              className='text-gray-400 hover:text-white'>
              <LogOut className='h-4 w-4 mr-2' />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
