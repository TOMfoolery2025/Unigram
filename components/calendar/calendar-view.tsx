/** @format */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-dark-theme.css";
import {
  CalendarEvent,
  CalendarView as CalendarViewType,
  BigCalendarEvent,
} from "@/types/calendar";
import {
  getAllCalendarEvents,
  getRegisteredCalendarEvents,
} from "@/lib/calendar";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { CalendarFilters } from "./calendar-filters";
import { CalendarExportButton } from "./calendar-export-button";
import { EventDetailsModal } from "./event-details-modal";
import { EventRegistrationIndicator } from "./event-registration-indicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  className?: string;
}

export function CalendarView({ className }: CalendarViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyRegistered, setShowOnlyRegistered] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [calendarView, setCalendarView] = useState<CalendarViewType>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const isAdmin = !!user?.is_admin;

  // Fetch events based on filter
  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = showOnlyRegistered
        ? await getRegisteredCalendarEvents(user.id)
        : await getAllCalendarEvents(user.id);

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user, showOnlyRegistered]);

  // Convert calendar events to react-big-calendar format
  const bigCalendarEvents: BigCalendarEvent[] = useMemo(() => {
    return events.map((event) => {
      // Handle events with or without a time field. If time is missing or invalid,
      // treat the event as an all-day event (start at midnight).
      let start: Date;
      if (event.time) {
        const parsed = new Date(`${event.date}T${event.time}`);
        start = isNaN(parsed.getTime()) ? new Date(event.date) : parsed;
      } else {
        start = new Date(event.date);
      }

      const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour

      return {
        id: event.id,
        title: event.title,
        start,
        end,
        resource: event,
      };
    });
  }, [events]);

  // Custom event component with registration indicator
  const EventComponent = ({ event }: { event: BigCalendarEvent }) => (
    <div className='flex items-center gap-1 text-xs'>
      <EventRegistrationIndicator
        isRegistered={event.resource.is_registered}
        size='sm'
      />
      <span className='truncate'>{event.title}</span>
    </div>
  );

  // Handle event selection
  const handleSelectEvent = (event: BigCalendarEvent) => {
    setSelectedEvent(event.resource);
  };

  // Handle view change
  const handleViewChange = (view: View) => {
    setCalendarView(view as CalendarViewType);
  };

  // Handle slot selection for admins to create a new event on that date
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (!isAdmin) return;
    const start = slotInfo.start as Date;
    const dateStr = start.toISOString().split("T")[0];
    router.push(`/events/create?date=${encodeURIComponent(dateStr)}`);
  };

  if (!user) {
    return (
      <Card className='p-6'>
        <p className='text-center text-muted-foreground'>
          Please log in to view the calendar.
        </p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with filters and export */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <div className='flex items-center gap-4 mb-2'>
            <h1 className='text-2xl font-bold text-primary'>Event Calendar</h1>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push("/events")}
                className='gap-2'>
                <CalendarIcon className='h-4 w-4' />
                Events List
              </Button>
              {isAdmin && (
                <Button
                  variant='default'
                  size='sm'
                  className='gap-1 px-3'
                  onClick={() => {
                    const dateStr = currentDate.toISOString().split("T")[0];
                    router.push(`/events/create?date=${encodeURIComponent(dateStr)}`);
                  }}>
                  +
                  <span className='hidden sm:inline'>New Event</span>
                </Button>
              )}
            </div>
          </div>
          <p className='text-muted-foreground'>
            {showOnlyRegistered
              ? "Showing only events you've registered for"
              : "Showing all published events"}
          </p>
        </div>

        <div className='flex flex-col sm:flex-row gap-2'>
          <CalendarFilters
            showOnlyRegistered={showOnlyRegistered}
            onFilterChange={setShowOnlyRegistered}
          />
          <CalendarExportButton
            userId={user.id}
            showOnlyRegistered={showOnlyRegistered}
          />
        </div>
      </div>

      {/* Calendar */}
      <Card className='p-4 bg-card/50 backdrop-blur-sm border-border/60'>
        {loading ? (
          <div className='flex items-center justify-center h-96'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
              <p className='text-muted-foreground'>Loading events...</p>
            </div>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center h-96'>
            <div className='text-center'>
              <p className='text-red-500 mb-2'>Error loading events</p>
              <p className='text-sm text-muted-foreground'>{error}</p>
              <button
                onClick={fetchEvents}
                className='mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-secondary transition-colors'>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className='h-96 sm:h-[600px]'>
            <Calendar
              localizer={localizer}
              events={bigCalendarEvents}
              startAccessor='start'
              endAccessor='end'
              view={calendarView}
              date={currentDate}
              onNavigate={(date: Date) => setCurrentDate(date)}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              selectable={isAdmin}
              onSelectSlot={handleSelectSlot}
              components={{
                event: EventComponent,
              }}
              eventPropGetter={(event) => ({
                className: event.resource.is_registered
                  ? "event-registered"
                  : "event-not-registered",
              })}
              className='dark-calendar'
              style={{
                height: "100%",
              }}
            />
          </div>
        )}
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRegistrationChange={fetchEvents}
        />
      )}
    </div>
  );
}
