/** @format */

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { EventList } from "@/components/event/event-list";

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canCreateEvents = user?.can_create_events || user?.is_admin;

  return (
    <>
      {/* neon background like dashboard and hives */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' />
      
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
      <div className='flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl md:text-4xl font-bold text-primary'>Events</h1>
          <p className='text-muted-foreground mt-2'>
            Discover and register for campus and external events
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push("/calendar")}
            className='border-border/60'>
            <Calendar className='h-4 w-4 mr-2' />
            Calendar View
          </Button>
          {canCreateEvents && (
            <Button
              variant='outline'
              onClick={() => router.push("/events/my-events")}
              className='border-border/60'>
              <Calendar className='h-4 w-4 mr-2' />
              My Events
            </Button>
          )}
          {canCreateEvents && (
            <Button
              onClick={() => router.push("/events/create")}
              className='bg-primary text-primary-foreground hover:bg-primary/90'>
              <Plus className='h-4 w-4 mr-2' />
              Create Event
            </Button>
          )}
          {user && (
            <Button
              onClick={() => router.push("/events/create-private")}
              className='bg-primary text-primary-foreground hover:bg-primary/90'>
              <Plus className='h-4 w-4 mr-2' />
              Create Private Event
            </Button>
          )}
        </div>
      </div>

      <EventList />
      </div>
    </>
  );
}
