/** @format */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, ActivityType } from "@/types/activity";
import { getActivityFeed } from "@/lib/activity/activities";
import { ActivityItem } from "./activity-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import {
  startOfToday,
  startOfYesterday,
  startOfWeek,
  isAfter,
  isBefore,
  endOfYesterday,
} from "date-fns";

interface ActivityFeedProps {
  userId: string;
  filterTypes?: ActivityType[];
  pageSize?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
  friendId?: string;
}

/**
 * ActivityFeed component displays a chronological feed of activities from user's friends
 * Features:
 * - Infinite scroll for pagination
 * - Date grouping (Today, Yesterday, This Week, Older)
 * - Loading states and empty states
 * - Click to navigate to activity content
 */
export function ActivityFeed({
  userId,
  filterTypes,
  pageSize = 20,
  dateRange,
  friendId,
}: ActivityFeedProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Load initial activities
  useEffect(() => {
    loadActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterTypes, dateRange, friendId]);

  // Load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && !isLoading) {
      loadMoreActivities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, isLoadingMore, isLoading]);

  const loadActivities = async (isInitial: boolean = false) => {
    if (isInitial) {
      setIsLoading(true);
      setOffset(0);
    } else {
      setIsLoadingMore(true);
    }

    setError(null);

    const currentOffset = isInitial ? 0 : offset;

    const { data, error: fetchError } = await getActivityFeed(userId, {
      limit: pageSize,
      offset: currentOffset,
      types: filterTypes,
      dateRange,
      friendId,
    });

    if (fetchError) {
      setError(fetchError.message);
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }

    if (data) {
      if (isInitial) {
        setActivities(data);
      } else {
        setActivities((prev) => [...prev, ...data]);
      }

      // Check if there are more activities to load
      setHasMore(data.length === pageSize);
      setOffset(currentOffset + data.length);
    }

    setIsLoading(false);
    setIsLoadingMore(false);
  };

  const loadMoreActivities = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadActivities(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore, hasMore, offset]);

  const handleActivityClick = (activity: Activity) => {
    // Navigate to the relevant content based on activity type
    switch (activity.activity_type) {
      case "post":
        // Navigate to post detail page
        // Assuming post URL structure: /forums/[subforumId]/posts/[postId]
        // We need to extract subforum ID from context or activity
        router.push(`/hives/${activity.activity_id}`);
        break;
      case "event_registration":
        // Navigate to event detail page
        router.push(`/events/${activity.activity_id}`);
        break;
      case "friendship":
        // Navigate to friend's profile
        router.push(`/profile/${activity.actor_id}`);
        break;
    }
  };

  // Group activities by date
  const groupActivitiesByDate = (activities: Activity[]) => {
    const now = new Date();
    const today = startOfToday();
    const yesterday = startOfYesterday();
    const endYesterday = endOfYesterday();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    const groups: {
      today: Activity[];
      yesterday: Activity[];
      thisWeek: Activity[];
      older: Activity[];
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    activities.forEach((activity) => {
      const activityDate = new Date(activity.created_at);

      if (isAfter(activityDate, today) || activityDate.getTime() === today.getTime()) {
        groups.today.push(activity);
      } else if (
        isAfter(activityDate, yesterday) &&
        (isBefore(activityDate, today) || activityDate.getTime() === today.getTime())
      ) {
        groups.yesterday.push(activity);
      } else if (isAfter(activityDate, weekStart) && isBefore(activityDate, yesterday)) {
        groups.thisWeek.push(activity);
      } else {
        groups.older.push(activity);
      }
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-border/70">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-border/70">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-destructive">
            Failed to load activity feed: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no friends
  if (activities.length === 0) {
    return (
      <Card className="border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                No activity yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Connect with other users to see their activities here. Start by
                searching for users and sending friend requests!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render grouped activities
  const renderActivityGroup = (
    title: string,
    activities: Activity[]
  ) => {
    if (activities.length === 0) return null;

    return (
      <div key={title} className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityItem
              key={`${activity.activity_type}-${activity.activity_id}`}
              activity={activity}
              onClick={handleActivityClick}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderActivityGroup("Today", groupedActivities.today)}
      {renderActivityGroup("Yesterday", groupedActivities.yesterday)}
      {renderActivityGroup("This Week", groupedActivities.thisWeek)}
      {renderActivityGroup("Older", groupedActivities.older)}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more activities...</span>
            </div>
          )}
        </div>
      )}

      {/* End of feed message */}
      {!hasMore && activities.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ve reached the end of your activity feed
          </p>
        </div>
      )}
    </div>
  );
}
