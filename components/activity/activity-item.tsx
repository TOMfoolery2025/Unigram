/** @format */

"use client";

import { Activity } from "@/types/activity";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/profile/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Calendar, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  activity: Activity;
  onClick?: (activity: Activity) => void;
}

/**
 * ActivityItem component displays a single activity in the feed
 * Supports different activity types: post, event_registration, friendship
 */
export function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const timeAgo = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
  });

  const actorName = activity.actor_name || "Unknown user";

  // Determine icon and styling based on activity type
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case "post":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "event_registration":
        return <Calendar className="h-4 w-4 text-green-500" />;
      case "friendship":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  // Generate activity description text
  const getActivityText = () => {
    switch (activity.activity_type) {
      case "post":
        return (
          <>
            <span className="font-semibold">{actorName}</span> created a post
            {activity.context_name && (
              <span className="text-muted-foreground">
                {" "}
                in {activity.context_name}
              </span>
            )}
          </>
        );
      case "event_registration":
        return (
          <>
            <span className="font-semibold">{actorName}</span> registered for
            an event
          </>
        );
      case "friendship":
        return (
          <>
            <span className="font-semibold">{actorName}</span> made a new
            friend connection
          </>
        );
      default:
        return null;
    }
  };

  const isClickable = activity.activity_type !== "friendship";

  return (
    <Card
      className={cn(
        "border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 transition-all",
        isClickable &&
          "cursor-pointer card-hover-glow hover:-translate-y-0.5 active:scale-[0.99]"
      )}
      onClick={() => isClickable && onClick?.(activity)}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Avatar */}
          <UserAvatar
            userId={activity.actor_id}
            displayName={activity.actor_name}
            avatarUrl={activity.actor_avatar}
            size="md"
            className="flex-shrink-0"
          />

          {/* Content */}
          <div className="flex-1 space-y-1 sm:space-y-1.5 min-w-0">
            {/* Activity description */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              {getActivityIcon()}
              <p className="text-foreground truncate sm:whitespace-normal">{getActivityText()}</p>
            </div>

            {/* Activity title */}
            <h4 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2">
              {activity.activity_title}
            </h4>

            {/* Activity description (for posts) */}
            {activity.activity_description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {activity.activity_description}
              </p>
            )}

            {/* Timestamp */}
            <p className="text-[10px] sm:text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
