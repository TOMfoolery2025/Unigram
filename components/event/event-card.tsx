/** @format */

"use client";

import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Users, ExternalLink, User as UserIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventWithRegistration } from "@/types/event";
import { format } from "date-fns";
import { UserAvatar } from "@/components/profile/user-avatar";

interface EventCardProps {
  event: EventWithRegistration;
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  isLoading?: boolean;
  currentUserId?: string;
  showCreatorActions?: boolean;
  onPublish?: (eventId: string) => void;
  onUnpublish?: (eventId: string) => void;
}

export function EventCard({
  event,
  onRegister,
  onUnregister,
  onView,
  isLoading = false,
  currentUserId,
  showCreatorActions = false,
  onPublish,
  onUnpublish,
}: EventCardProps) {
  const router = useRouter();
  
  const handleRegistrationToggle = () => {
    if (event.is_registered) {
      onUnregister?.(event.id);
    } else {
      onRegister?.(event.id);
    }
  };

  const isFull =
    event.max_attendees && event.registration_count
      ? event.registration_count >= event.max_attendees
      : false;

  const canRegister = !event.is_registered && !isFull;

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.creator_id) {
      router.push(`/profile/${event.creator_id}`);
    }
  };

  return (
    <Card className='hover:shadow-md transition-shadow cursor-pointer bg-gray-800 border-gray-700'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1' onClick={() => onView?.(event.id)}>
            <div className='flex items-center gap-2 mb-2'>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  event.event_type === "tum_native"
                    ? "bg-violet-600/20 text-violet-400"
                    : "bg-blue-600/20 text-blue-400"
                }`}>
                {event.event_type === "tum_native" ? "TUM Native" : "External"}
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
            <CardTitle className='text-lg font-semibold text-violet-400 hover:text-violet-300 transition-colors'>
              {event.title}
            </CardTitle>
            <CardDescription className='mt-1 text-sm text-gray-400 line-clamp-2'>
              {event.description}
            </CardDescription>
          </div>
          <div className='flex gap-2'>
            {showCreatorActions && currentUserId === event.creator_id && (
              <>
                {event.is_published ? (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpublish?.(event.id);
                    }}
                    disabled={isLoading}
                    className='border-yellow-600 text-yellow-400 hover:bg-yellow-600/10'>
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish?.(event.id);
                    }}
                    disabled={isLoading}
                    className='border-green-600 text-green-400 hover:bg-green-600/10'>
                    Publish
                  </Button>
                )}
              </>
            )}
            <Button
              variant={event.is_registered ? "secondary" : "default"}
              size='sm'
              onClick={handleRegistrationToggle}
              disabled={isLoading || (!event.is_registered && isFull)}
              className={
                event.is_registered
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-violet-600 hover:bg-violet-700 text-white"
              }>
              {isLoading
                ? "..."
                : event.is_registered
                ? "Unregister"
                : isFull
                ? "Full"
                : "Register"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='space-y-2 text-sm text-gray-400'>
          {event.creator_id && (
            <div 
              className='flex items-center gap-2 cursor-pointer hover:text-violet-300 transition-colors'
              onClick={handleCreatorClick}
            >
              <UserAvatar
                userId={event.creator_id}
                displayName={event.creator_name}
                size="sm"
                className="h-4 w-4"
              />
              <span>Created by {event.creator_name || "Unknown"}</span>
            </div>
          )}
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-violet-400' />
            <span>{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-violet-400' />
            <span>{event.time}</span>
          </div>
          <div className='flex items-center gap-2'>
            <MapPin className='h-4 w-4 text-violet-400' />
            <span>{event.location}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Users className='h-4 w-4 text-violet-400' />
            <span>
              {event.registration_count || 0}
              {event.max_attendees ? ` / ${event.max_attendees}` : ""}{" "}
              registered
            </span>
          </div>
          {event.event_type === "external" && event.external_link && (
            <div className='flex items-center gap-2'>
              <ExternalLink className='h-4 w-4 text-blue-400' />
              <a
                href={event.external_link}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-400 hover:text-blue-300 underline'
                onClick={(e) => e.stopPropagation()}>
                External Registration
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
