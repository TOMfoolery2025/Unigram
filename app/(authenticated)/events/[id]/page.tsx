/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QRCodeDisplay } from "@/components/event/qr-code-display";
import { EventWithRegistration } from "@/types/event";
import {
  getEvent,
  registerForEvent,
  unregisterFromEvent,
  publishEvent,
  unpublishEvent,
} from "@/lib/event/events";
import { generateEventQRCode } from "@/lib/event/qr-codes";
import { useAuth } from "@/lib/auth/auth-provider";
import { format } from "date-fns";

export default function EventDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventWithRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [params.id, user]);

  const loadEvent = async () => {
    setIsLoading(true);
    const { data, error } = await getEvent(params.id, user?.id);
    if (data) {
      setEvent(data);
    } else if (error) {
      alert(error.message);
    }
    setIsLoading(false);
  };

  const handleRegister = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    const { error } = await registerForEvent(event.id, user.id);

    if (!error) {
      // Generate QR code for TUM native events
      if (event.event_type === "tum_native") {
        await generateEventQRCode(event.id, user.id);
      }
      await loadEvent();
    } else {
      alert(error.message);
    }

    setActionLoading(false);
  };

  const handleUnregister = async () => {
    if (!user || !event) return;

    const confirmed = confirm(
      "Are you sure you want to unregister from this event?"
    );
    if (!confirmed) return;

    setActionLoading(true);
    const { error } = await unregisterFromEvent(event.id, user.id);

    if (!error) {
      await loadEvent();
    } else {
      alert(error.message);
    }

    setActionLoading(false);
  };

  const handlePublish = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    const { error } = await publishEvent(event.id, user.id);

    if (!error) {
      await loadEvent();
    } else {
      alert(error.message);
    }

    setActionLoading(false);
  };

  const handleUnpublish = async () => {
    if (!user || !event) return;

    setActionLoading(true);
    const { error } = await unpublishEvent(event.id, user.id);

    if (!error) {
      await loadEvent();
    } else {
      alert(error.message);
    }

    setActionLoading(false);
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

  if (!event) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center py-12'>
          <p className='text-gray-400'>Event not found</p>
          <Button
            onClick={() => router.push("/events")}
            className='mt-4 bg-violet-600 hover:bg-violet-700'>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const isFull =
    event.max_attendees && event.registration_count
      ? event.registration_count >= event.max_attendees
      : false;

  const canRegister = user && !event.is_registered && !isFull;

  return (
    <div className='container mx-auto px-4 py-8'>
      <Button
        variant='ghost'
        onClick={() => router.push("/events")}
        className='mb-6 text-gray-400 hover:text-white'>
        <ArrowLeft className='h-4 w-4 mr-2' />
        Back to Events
      </Button>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          <Card className='bg-gray-800 border-gray-700'>
            <CardHeader>
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
                {!event.is_published && (
                  <span className='text-xs px-2 py-1 rounded-full bg-yellow-600/20 text-yellow-400'>
                    Draft
                  </span>
                )}
                {event.is_registered && (
                  <span className='text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-400'>
                    Registered
                  </span>
                )}
                {isFull && (
                  <span className='text-xs px-2 py-1 rounded-full bg-red-600/20 text-red-400'>
                    Full
                  </span>
                )}
              </div>
              <CardTitle className='text-2xl text-white'>
                {event.title}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h3 className='text-lg font-semibold text-white mb-2'>
                  Description
                </h3>
                <p className='text-gray-400 whitespace-pre-wrap'>
                  {event.description}
                </p>
              </div>

              {event.event_type === "external" && event.external_link && (
                <div>
                  <h3 className='text-lg font-semibold text-white mb-2'>
                    External Registration
                  </h3>
                  <a
                    href={event.external_link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 text-blue-400 hover:text-blue-300 underline'>
                    <ExternalLink className='h-4 w-4' />
                    Register on external platform
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Event Details */}
          <Card className='bg-gray-800 border-gray-700'>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start gap-3'>
                <Calendar className='h-5 w-5 text-violet-400 mt-0.5' />
                <div>
                  <p className='text-sm text-gray-400'>Date</p>
                  <p className='text-white'>
                    {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Clock className='h-5 w-5 text-violet-400 mt-0.5' />
                <div>
                  <p className='text-sm text-gray-400'>Time</p>
                  <p className='text-white'>{event.time}</p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <MapPin className='h-5 w-5 text-violet-400 mt-0.5' />
                <div>
                  <p className='text-sm text-gray-400'>Location</p>
                  <p className='text-white'>{event.location}</p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Users className='h-5 w-5 text-violet-400 mt-0.5' />
                <div>
                  <p className='text-sm text-gray-400'>Attendees</p>
                  <p className='text-white'>
                    {event.registration_count || 0}
                    {event.max_attendees ? ` / ${event.max_attendees}` : ""}{" "}
                    registered
                  </p>
                </div>
              </div>

              {user && (
                <div className='pt-4 space-y-2'>
                  {/* Creator actions */}
                  {user.id === event.creator_id && (
                    <>
                      {event.is_published ? (
                        <Button
                          onClick={handleUnpublish}
                          disabled={actionLoading}
                          variant='outline'
                          className='w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600/10'>
                          {actionLoading ? "Processing..." : "Unpublish Event"}
                        </Button>
                      ) : (
                        <Button
                          onClick={handlePublish}
                          disabled={actionLoading}
                          variant='outline'
                          className='w-full border-green-600 text-green-400 hover:bg-green-600/10'>
                          {actionLoading ? "Processing..." : "Publish Event"}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Registration actions */}
                  {event.is_registered ? (
                    <Button
                      onClick={handleUnregister}
                      disabled={actionLoading}
                      variant='secondary'
                      className='w-full bg-gray-700 hover:bg-gray-600'>
                      {actionLoading ? "Processing..." : "Unregister"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      disabled={actionLoading || !canRegister}
                      className='w-full bg-violet-600 hover:bg-violet-700'>
                      {actionLoading
                        ? "Processing..."
                        : isFull
                        ? "Event Full"
                        : "Register"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code for registered TUM native events */}
          {user &&
            event.is_registered &&
            event.event_type === "tum_native" && (
              <QRCodeDisplay
                eventId={event.id}
                userId={user.id}
                eventTitle={event.title}
              />
            )}
        </div>
      </div>
    </div>
  );
}
