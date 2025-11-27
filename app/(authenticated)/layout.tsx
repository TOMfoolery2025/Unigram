/** @format */

import type { ReactNode } from "react";
import { MainNav } from "@/components/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className='flex h-screen bg-background text-foreground'>
      {/* fixed sidebar */}
      <MainNav />

      {/* main area fills screen and scrolls internally if needed */}
      <main className='ml-72 flex-1 h-screen overflow-y-auto p-6 lg:p-8'>
        {children}
      </main>
    </div>
  );
}
