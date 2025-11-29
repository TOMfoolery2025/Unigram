/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EventCard } from "./event-card";
import { EventFilters } from "./event-filters";
import { EventWithRegistration, EventFilters as EventFiltersType, EventCategory, EventType } from "@/types/event";
import {
  getEvents,
  registerForEvent,
  unregisterFromEvent,
  publishEvent,
  unpublishEvent,
} from "@/lib/event/events";
import { generateEventQRCode } from "@/lib/event/qr-codes";
import { useAuth } from "@/lib/auth/auth-provider";
import { Loader2 } from "lucide-react";

export function EventList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithRegistration[]>([]);
  const [filters, setFilters] = useState<EventFiltersType>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const initialFilters: EventFiltersType = {};
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      initialFilters.dateRange = {
        start: startDate || '',
        end: endDate || '',
      };
    }
    
    const eventType = searchParams.get('eventType');
    if (eventType === 'tum_native' || eventType === 'external') {
      initialFilters.eventType = eventType as EventType;
    }
    
    const category = searchParams.get('category');
    if (category && ['social', 'academic', 'sports', 'cultural', 'other'].includes(category)) {
      initialFilters.category = category as EventCategory;
    }
    
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      initialFilters.searchQuery = searchQuery;
    }
    
    setFilters(initialFilters);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [filters, user]);

  const loadEvents = async () => {
    setIsLoading(true);
    const { data, error } = await getEvents(filters, user?.id);
    if (data) {
      setEvents(data);
    }
    setIsLoading(false);
  };

  const handleFiltersChange = (newFilters: EventFiltersType) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    
    if (newFilters.dateRange?.start) {
      params.set('startDate', newFilters.dateRange.start);
    }
    if (newFilters.dateRange?.end) {
      params.set('endDate', newFilters.dateRange.end);
    }
    if (newFilters.eventType) {
      params.set('eventType', newFilters.eventType);
    }
    if (newFilters.category) {
      params.set('category', newFilters.category);
    }
    if (newFilters.searchQuery) {
      params.set('search', newFilters.searchQuery);
    }
    
    // Update URL without page reload
    const newUrl = params.toString() ? `?${params.toString()}` : '/events';
    router.push(newUrl, { scroll: false });
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    setActionLoading(eventId);
    const { error } = await registerForEvent(eventId, user.id);

    if (!error) {
      // Check if it's a TUM native event and generate QR code
      const event = events.find((e) => e.id === eventId);
      if (event?.event_type === "tum_native") {
        await generateEventQRCode(eventId, user.id);
      }

      // Reload events to update registration status
      await loadEvents();
    } else {
      alert(error.message);
    }

    setActionLoading(null);
  };

  const handleUnregister = async (eventId: string) => {
    if (!user) return;

    setActionLoading(eventId);
    const { error } = await unregisterFromEvent(eventId, user.id);

    if (!error) {
      await loadEvents();
    } else {
      alert(error.message);
    }

    setActionLoading(null);
  };

  const handleView = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handlePublish = async (eventId: string) => {
    if (!user) return;

    setActionLoading(eventId);
    const { error } = await publishEvent(eventId, user.id);

    if (!error) {
      await loadEvents();
    } else {
      alert(error.message);
    }

    setActionLoading(null);
  };

  const handleUnpublish = async (eventId: string) => {
    if (!user) return;

    setActionLoading(eventId);
    const { error } = await unpublishEvent(eventId, user.id);

    if (!error) {
      await loadEvents();
    } else {
      alert(error.message);
    }

    setActionLoading(null);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      <EventFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {events.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-sm sm:text-base text-muted-foreground'>No events found</p>
        </div>
      ) : (
        <div className='grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-2'>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              onView={handleView}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              isLoading={actionLoading === event.id}
              currentUserId={user?.id}
              showCreatorActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
