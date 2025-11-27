/** @format */

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { EventList } from "@/components/event/event-list";
import { CreateEventDialog } from "@/components/event/create-event-dialog";

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canCreateEvents = user?.can_create_events || user?.is_admin;

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-white'>Events</h1>
          <p className='text-gray-400 mt-2'>
            Discover and register for campus and external events
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => router.push("/calendar")}
            className='border-gray-700 text-gray-300 hover:text-white'>
            <Calendar className='h-4 w-4 mr-2' />
            Calendar View
          </Button>
          {canCreateEvents && (
            <Button
              variant='outline'
              onClick={() => router.push("/events/my-events")}
              className='border-gray-700 text-gray-300 hover:text-white'>
              <Calendar className='h-4 w-4 mr-2' />
              My Events
            </Button>
          )}
          <CreateEventDialog />
        </div>
      </div>

      <EventList />
    </div>
  );
}
