/** @format */

import type { ReactNode } from "react";
import { MainNav, MobileBottomNav } from "@/components/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className='flex h-screen bg-background text-foreground'>
      {/* Desktop sidebar - hidden on mobile */}
      <MainNav />

      {/* Mobile bottom navigation - hidden on desktop */}
      <MobileBottomNav />

      {/* Main content area - responsive margin and padding */}
      <main className='ml-0 lg:ml-72 flex-1 h-screen overflow-y-auto p-4 pb-20 md:p-6 md:pb-20 lg:p-8 lg:pb-8'>
        {children}
      </main>
    </div>
  );
}
