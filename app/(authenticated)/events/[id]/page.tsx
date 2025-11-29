/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Users, ExternalLink, Loader2, MessageSquare, Lock } from "lucide-react";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Generate QR code only for public TUM native events
      // Private events do not use QR codes (Requirement 5.6)
      if (event.event_type === "tum_native" && !event.is_private) {
        await generateEventQRCode(event.id, user.id);
      }
      
      // Show appropriate confirmation message
      if (event.is_private) {
        alert("Successfully registered! You now have access to the private chat.");
      } else {
        alert("Successfully registered for the event!");
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
    <>
      {/* neon background like dashboard and hives */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' />
      
      <div className='container mx-auto page-container py-4 md:py-6 lg:py-8 max-w-6xl px-4 md:px-6'>
        <Button
          variant='ghost'
          onClick={() => router.push("/events")}
          className='mb-4 md:mb-6 text-muted-foreground hover:text-foreground min-h-[44px]'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Events
        </Button>

      <div className='grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-4 md:space-y-6'>
          {/* Event Header Section */}
          <Card className='card-hover-glow border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90'>
            <CardHeader className='pb-3 md:pb-4 p-4 md:p-6'>
              <div className='flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap'>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    event.event_type === "tum_native"
                      ? "bg-violet-600/20 text-violet-400 border border-violet-600/30"
                      : "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                  }`}>
                  {event.event_type === "tum_native" ? "TUM" : "External"}
                </span>
                {event.category && (
                  <span className='text-xs px-2.5 py-1 rounded-full font-medium bg-muted/50 text-muted-foreground border border-border/40 capitalize'>
                    {event.category}
                  </span>
                )}
                {event.is_private && (
                  <span className='text-xs px-2.5 py-1 rounded-full font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30'>
                    Private
                  </span>
                )}
                {!event.is_published && (
                  <span className='text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'>
                    Draft
                  </span>
                )}
                {event.is_registered && (
                  <span className='text-xs px-2.5 py-1 rounded-full font-medium bg-green-600/20 text-green-400 border border-green-600/30'>
                    Registered
                  </span>
                )}
                {isFull && (
                  <span className='text-xs px-2.5 py-1 rounded-full font-medium bg-red-600/20 text-red-400 border border-red-600/30'>
                    Full
                  </span>
                )}
              </div>
              <CardTitle className='text-xl md:text-2xl lg:text-3xl text-primary font-bold'>
                {event.title}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 md:space-y-6 p-4 md:p-6'>
              {/* Description Section */}
              <div className='border-t border-border pt-4 md:pt-6'>
                <h3 className='text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3'>
                  About This Event
                </h3>
                <p className='text-sm md:text-base text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                  {event.description}
                </p>
              </div>

              {/* External Link Section */}
              {event.event_type === "external" && event.external_link && (
                <div className='border-t border-border pt-4 md:pt-6'>
                  <h3 className='text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3'>
                    External Registration
                  </h3>
                  <a
                    href={event.external_link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 underline transition-colors'>
                    <ExternalLink className='h-4 w-4' />
                    Register on external platform
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication Channel Section */}
          {user && event.is_registered && (event.forum_id || event.cluster_id) && (
            <Card className='card-hover-glow bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30'>
              <CardHeader className='pb-3 md:pb-4 p-4 md:p-6'>
                <CardTitle className='text-base md:text-lg flex items-center gap-2'>
                  <MessageSquare className='h-5 w-5 text-primary' />
                  Event Communication
                </CardTitle>
                <CardDescription className='text-sm text-muted-foreground'>
                  Connect with other attendees
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 md:space-y-4 p-4 md:p-6'>
                {/* Public Event Forum */}
                {!event.is_private && event.forum_id && (
                  <div className='bg-background/50 rounded-lg p-4 border border-border/60'>
                    <div className='flex items-start gap-3 mb-3'>
                      <MessageSquare className='h-5 w-5 text-primary mt-0.5 flex-shrink-0' />
                      <div className='flex-1'>
                        <h4 className='text-foreground font-semibold mb-1'>
                          Event Forum
                        </h4>
                        <p className='text-sm text-muted-foreground mb-3'>
                          {event.forum_name || "Discussion forum for this event"}
                        </p>
                        <Button
                          onClick={() => router.push(`/hives/${event.forum_id}`)}
                          className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
                          <MessageSquare className='h-4 w-4 mr-2' />
                          Join Discussion
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Private Event Cluster */}
                {event.is_private && event.cluster_id && (
                  <div className='bg-background/50 rounded-lg p-4 border border-purple-700/50'>
                    <div className='flex items-start gap-3 mb-3'>
                      <Lock className='h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0' />
                      <div className='flex-1'>
                        <h4 className='text-foreground font-semibold mb-1'>
                          Private Chat
                        </h4>
                        <p className='text-sm text-muted-foreground mb-3'>
                          {event.cluster_name || "Private chat for event attendees"}
                        </p>
                        
                        {/* Display Cluster PIN */}
                        {event.cluster_pin_display && (
                          <div className='bg-purple-900/30 rounded-lg p-3 mb-3 border border-purple-700/30'>
                            <p className='text-xs text-purple-300 mb-1 font-medium'>
                              Cluster PIN
                            </p>
                            <p className='text-2xl font-bold text-purple-200 tracking-wider font-mono'>
                              {event.cluster_pin_display}
                            </p>
                            <p className='text-xs text-muted-foreground mt-2'>
                              Use this PIN to access the private chat
                            </p>
                          </div>
                        )}
                        
                        <Button
                          onClick={() => router.push(`/clusters/${event.cluster_id}`)}
                          className='w-full bg-purple-600 hover:bg-purple-700 text-white'>
                          <Lock className='h-4 w-4 mr-2' />
                          Join Private Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <p className='text-xs text-muted-foreground text-center'>
                  Connect with other attendees before and after the event
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-4 md:space-y-6'>
          {/* Event Details Card */}
          <Card className='card-hover-glow border-border/70 bg-card/90'>
            <CardHeader className='pb-3 md:pb-4 p-4 md:p-6'>
              <CardTitle className='text-base md:text-lg'>Event Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 md:space-y-5 p-4 md:p-6'>
              <div className='flex items-start gap-3'>
                <Calendar className='h-5 w-5 text-primary mt-0.5 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground mb-1'>Date</p>
                  <p className='text-foreground font-medium'>
                    {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Clock className='h-5 w-5 text-primary mt-0.5 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground mb-1'>Time</p>
                  <p className='text-foreground font-medium'>
                    {event.start_time}
                    {event.end_time && ` - ${event.end_time}`}
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <MapPin className='h-5 w-5 text-primary mt-0.5 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground mb-1'>Location</p>
                  <p className='text-foreground font-medium'>{event.location}</p>
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Users className='h-5 w-5 text-primary mt-0.5 flex-shrink-0' />
                <div className='flex-1'>
                  <p className='text-sm text-muted-foreground mb-1'>Attendees</p>
                  <p className='text-foreground font-medium'>
                    {event.registration_count || 0}
                    {event.max_attendees ? ` / ${event.max_attendees}` : ""}{" "}
                    registered
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Actions Card */}
          {user && (
            <Card className='card-hover-glow border-border/70 bg-card/90'>
              <CardHeader className='pb-3 md:pb-4 p-4 md:p-6'>
                <CardTitle className='text-base md:text-lg'>Registration</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 p-4 md:p-6'>
                {/* Creator actions */}
                {user.id === event.creator_id && (
                  <>
                    {event.is_published ? (
                      <Button
                        onClick={handleUnpublish}
                        disabled={actionLoading}
                        variant='outline'
                        className='w-full border-yellow-600/60 text-yellow-400 hover:bg-yellow-600/10 min-h-[44px]'>
                        {actionLoading ? "Processing..." : "Unpublish Event"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePublish}
                        disabled={actionLoading}
                        variant='outline'
                        className='w-full border-green-600/60 text-green-400 hover:bg-green-600/10 min-h-[44px]'>
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
                    variant='outline'
                    className='w-full border-border/70 hover:bg-muted/60 min-h-[44px]'>
                    {actionLoading ? "Processing..." : "Unregister"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleRegister}
                    disabled={actionLoading || !canRegister}
                    className='w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]'>
                    {actionLoading
                      ? "Processing..."
                      : isFull
                      ? "Event Full"
                      : "Register for Event"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* QR Code for registered TUM native events */}
          {user &&
            event.is_registered &&
            event.event_type === "tum_native" &&
            !event.is_private && (
              <QRCodeDisplay
                eventId={event.id}
                userId={user.id}
                eventTitle={event.title}
              />
            )}
        </div>
      </div>
      </div>
    </>
  );
}
