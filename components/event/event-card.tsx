/** @format */

"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventWithRegistration, EventCategory } from "@/types/event";
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

// Helper function to get category display information
function getCategoryDisplay(category: EventCategory): {
  label: string;
  className: string;
} {
  const categoryMap: Record<
    EventCategory,
    { label: string; className: string }
  > = {
    social: {
      label: "Social",
      className: "bg-pink-600/20 text-pink-400 border-pink-600/30",
    },
    academic: {
      label: "Academic",
      className: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    },
    sports: {
      label: "Sports",
      className: "bg-green-600/20 text-green-400 border-green-600/30",
    },
    cultural: {
      label: "Cultural",
      className: "bg-purple-600/20 text-purple-400 border-purple-600/30",
    },
    other: {
      label: "Other",
      className: "bg-gray-600/20 text-gray-400 border-gray-600/30",
    },
  };
  return categoryMap[category] || categoryMap.other;
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

  const categoryDisplay = getCategoryDisplay(event.category);

  return (
    <Card className='card-hover-glow border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 cursor-pointer transition-transform hover:-translate-y-0.5'>
      <CardHeader className='pb-3'>
        {/* Mobile: vertical stack, Desktop: horizontal layout */}
        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
          <div className='flex-1 min-w-0' onClick={() => onView?.(event.id)}>
            {/* Badges row - responsive wrapping */}
            <div className='flex items-center gap-2 mb-2 flex-wrap'>
              <Badge
                variant='outline'
                className={
                  event.event_type === "tum_native"
                    ? "bg-violet-600/20 text-violet-400 border-violet-600/30"
                    : "bg-blue-600/20 text-blue-400 border-blue-600/30"
                }>
                {event.event_type === "tum_native" ? "TUM" : "External"}
              </Badge>

              <Badge variant='outline' className={categoryDisplay.className}>
                {categoryDisplay.label}
              </Badge>

              {event.is_private && (
                <Badge
                  variant='outline'
                  className='bg-orange-600/20 text-orange-400 border-orange-600/30'>
                  <Lock className='h-3 w-3 mr-1' />
                  Private
                </Badge>
              )}

              {!event.is_published && (
                <Badge
                  variant='outline'
                  className='bg-yellow-600/20 text-yellow-400 border-yellow-600/30'>
                  Draft
                </Badge>
              )}

              {event.is_registered && (
                <Badge
                  variant='outline'
                  className='bg-green-600/20 text-green-400 border-green-600/30'>
                  Registered
                </Badge>
              )}

              {isFull && (
                <Badge
                  variant='outline'
                  className='bg-red-600/20 text-red-400 border-red-600/30'>
                  Full
                </Badge>
              )}
            </div>

            {/* Title - responsive text size with truncation */}
            <CardTitle className='text-base md:text-lg font-semibold text-white hover:text-primary/80 transition-colors mb-2 line-clamp-2'>
              {event.title}
            </CardTitle>

            {/* Description - text truncation for long content */}
            <CardDescription className='text-sm text-muted-foreground line-clamp-2'>
              {event.description}
            </CardDescription>
          </div>

          {/* Action buttons - mobile: full width stack, desktop: side by side */}
          <div className='flex gap-2 w-full md:w-auto md:flex-shrink-0'>
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
                    className='border-yellow-600/60 text-yellow-400 hover:bg-yellow-600/10 min-h-[44px] flex-1 md:flex-initial'>
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
                    className='border-green-600/60 text-green-400 hover:bg-green-600/10 min-h-[44px] flex-1 md:flex-initial'>
                    Publish
                  </Button>
                )}
              </>
            )}
            <Button
              variant={event.is_registered ? "outline" : "default"}
              size='sm'
              onClick={handleRegistrationToggle}
              disabled={isLoading || (!event.is_registered && isFull)}
              className={`min-h-[44px] flex-1 md:flex-initial ${
                event.is_registered
                  ? "border-border/70 text-foreground hover:bg-muted/60"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}>
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

      <CardContent className='pt-0 space-y-2'>
        {/* Essential information only */}
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Calendar className='h-4 w-4 text-primary flex-shrink-0' />
          <span className='truncate'>{format(new Date(event.date), "MMM d, yyyy")}</span>
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Clock className='h-4 w-4 text-primary flex-shrink-0' />
          <span className='truncate'>
            {event.start_time}
            {event.end_time && ` - ${event.end_time}`}
          </span>
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground min-w-0'>
          <MapPin className='h-4 w-4 text-primary flex-shrink-0' />
          <span className='truncate'>{event.location}</span>
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Users className='h-4 w-4 text-primary flex-shrink-0' />
          <span className='truncate'>
            {event.registration_count || 0}
            {event.max_attendees ? ` / ${event.max_attendees}` : ""} registered
          </span>
        </div>

        {event.event_type === "external" && event.external_link && (
          <div className='flex items-center gap-2 text-sm min-w-0'>
            <ExternalLink className='h-4 w-4 text-blue-400 flex-shrink-0' />
            <a
              href={event.external_link}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-400 hover:text-blue-300 underline truncate'
              onClick={(e) => e.stopPropagation()}>
              External Link
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
