/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventRow } from "@/types/event";
import {
  getUserCreatedEvents,
  publishEvent,
  unpublishEvent,
  deleteEvent,
} from "@/lib/event/events";
import { useAuth } from "@/lib/auth/auth-provider";
import { format } from "date-fns";

export default function MyEventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await getUserCreatedEvents(user.id);
    if (data) {
      setEvents(data);
    } else if (error) {
      alert(error.message);
    }
    setIsLoading(false);
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

  const handleDelete = async (eventId: string) => {
    if (!user) return;

    const confirmed = confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    );
    if (!confirmed) return;

    setActionLoading(eventId);
    const { error } = await deleteEvent(eventId, user.id);

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

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-violet-400' />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <Button
        variant='ghost'
        onClick={() => router.push("/events")}
        className='mb-6 text-gray-400 hover:text-white'>
        <ArrowLeft className='h-4 w-4 mr-2' />
        Back to Events
      </Button>

      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-white'>My Events</h1>
        <p className='text-gray-400 mt-2'>
          Manage events you&apos;ve created
        </p>
      </div>

      {events.length === 0 ? (
        <Card className='bg-gray-800 border-gray-700'>
          <CardContent className='py-12 text-center'>
            <p className='text-gray-400'>You haven&apos;t created any events yet</p>
            <Button
              onClick={() => router.push("/events")}
              className='mt-4 bg-violet-600 hover:bg-violet-700'>
              Browse Events
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {events.map((event) => (
            <Card
              key={event.id}
              className='bg-gray-800 border-gray-700 hover:shadow-md transition-shadow'>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          event.event_type === "tum_native"
                            ? "bg-violet-600/20 text-violet-400"
                            : "bg-blue-600/20 text-blue-400"
                        }`}>
                        {event.event_type === "tum_native"
                          ? "TUM Native"
                          : "External"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          event.is_published
                            ? "bg-green-600/20 text-green-400"
                            : "bg-yellow-600/20 text-yellow-400"
                        }`}>
                        {event.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <CardTitle
                      className='text-xl text-white cursor-pointer hover:text-violet-400 transition-colors'
                      onClick={() => handleView(event.id)}>
                      {event.title}
                    </CardTitle>
                    <CardDescription className='mt-1 line-clamp-2'>
                      {event.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-400'>
                    <p>
                      {format(new Date(event.date), "MMM d, yyyy")} at{" "}
                      {event.start_time}
                      {event.end_time && ` - ${event.end_time}`}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                      Created {format(new Date(event.created_at), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleView(event.id)}
                      className='text-gray-400 hover:text-white'>
                      <Eye className='h-4 w-4' />
                    </Button>

                    {event.is_published ? (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleUnpublish(event.id)}
                        disabled={actionLoading === event.id}
                        className='text-yellow-400 hover:text-yellow-300'>
                        <EyeOff className='h-4 w-4' />
                      </Button>
                    ) : (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handlePublish(event.id)}
                        disabled={actionLoading === event.id}
                        className='text-green-400 hover:text-green-300'>
                        <Eye className='h-4 w-4' />
                      </Button>
                    )}

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleDelete(event.id)}
                      disabled={actionLoading === event.id}
                      className='text-red-400 hover:text-red-300'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
