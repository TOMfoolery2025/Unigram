/** @format */

import type { ReactNode } from "react";
import { MainNav } from "@/components/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className='flex min-h-screen bg-background text-foreground'>
      {/* Left sidebar */}
      <MainNav />

      {/* Main content (pushed right by w-72 sidebar) */}
      <main className='ml-72 flex-1 p-6 lg:p-8'>{children}</main>
    </div>
  );
}
