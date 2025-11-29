/** @format */

import { CalendarView } from "@/components/calendar";

export default function CalendarPage() {
  return (
    <>
      {/* neon background like dashboard and hives */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' />
      
      <div className="container mx-auto page-container py-4 md:py-6 lg:py-8 px-4 md:px-6">
        <CalendarView />
      </div>
    </>
  );
}