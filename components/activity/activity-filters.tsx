/** @format */

/**
 * ActivityFilters Component
 * 
 * Provides filtering options for the activity feed including:
 * - Activity type filtering (posts, events, friends)
 * - Date range selection
 * - Friend-specific filtering
 * 
 * @example
 * ```tsx
 * const [filters, setFilters] = useState<ActivityFilters>({});
 * 
 * <ActivityFilters
 *   userId={currentUserId}
 *   filters={filters}
 *   onFiltersChange={setFilters}
 * />
 * 
 * <ActivityFeed
 *   userId={currentUserId}
 *   filterTypes={filters.types}
 *   dateRange={filters.dateRange}
 *   friendId={filters.friendId}
 * />
 * ```
 */

"use client";

import { useState, useEffect } from "react";
import { Filter, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivityType } from "@/types/activity";
import { getUserFriends } from "@/lib/profile/friendships";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ActivityFilters {
  types?: ActivityType[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  friendId?: string;
}

interface ActivityFiltersProps {
  userId: string;
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
}

/**
 * ActivityFilters component provides filtering options for the activity feed
 * Features:
 * - Filter by activity type (posts, events, friends)
 * - Date range selection
 * - Friend-specific filtering
 */
export function ActivityFiltersComponent({
  userId,
  filters,
  onFiltersChange,
}: ActivityFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ActivityFilters>(filters);
  const [friends, setFriends] = useState<
    Array<{ user_id: string; display_name: string | null }>
  >([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Load user's friends for friend-specific filtering
  useEffect(() => {
    loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    const { data, error } = await getUserFriends(userId);

    if (!error && data) {
      setFriends(data);
    }

    setIsLoadingFriends(false);
  };

  const handleActivityTypeToggle = (type: ActivityType) => {
    const currentTypes = localFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    const newFilters = {
      ...localFilters,
      types: newTypes.length > 0 ? newTypes : undefined,
    };

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    const newDateRange = {
      start: field === "start" ? value : localFilters.dateRange?.start || "",
      end: field === "end" ? value : localFilters.dateRange?.end || "",
    };

    // Only include dateRange if at least one field has a value
    const newFilters: ActivityFilters = {
      ...localFilters,
      ...(newDateRange.start || newDateRange.end ? { dateRange: newDateRange } : {}),
    };

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFriendFilterChange = (friendId: string | undefined) => {
    const newFilters = {
      ...localFilters,
      friendId,
    };

    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: ActivityFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters =
    (localFilters.types && localFilters.types.length > 0) ||
    localFilters.dateRange?.start ||
    localFilters.dateRange?.end ||
    localFilters.friendId;

  const isActivityTypeSelected = (type: ActivityType) => {
    return localFilters.types?.includes(type) || false;
  };

  const getSelectedFriendName = () => {
    if (!localFilters.friendId) return null;
    const friend = friends.find((f) => f.user_id === localFilters.friendId);
    return friend?.display_name || "Unknown";
  };

  return (
    <Card className="border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Filter className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
              Filters
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Filter activities by type, date, or friend
            </CardDescription>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground hover:text-foreground text-xs sm:text-sm self-start sm:self-auto">
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
        {/* Activity Type Filters */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm text-foreground">Activity Type</Label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button
              variant={isActivityTypeSelected("post") ? "default" : "outline"}
              size="sm"
              onClick={() => handleActivityTypeToggle("post")}
              className={cn(
                "text-xs h-8",
                isActivityTypeSelected("post")
                  ? "bg-primary hover:bg-primary/90"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              )}>
              Posts
            </Button>
            <Button
              variant={
                isActivityTypeSelected("event_registration")
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => handleActivityTypeToggle("event_registration")}
              className={cn(
                "text-xs h-8",
                isActivityTypeSelected("event_registration")
                  ? "bg-primary hover:bg-primary/90"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              )}>
              Events
            </Button>
            <Button
              variant={
                isActivityTypeSelected("friendship") ? "default" : "outline"
              }
              size="sm"
              onClick={() => handleActivityTypeToggle("friendship")}
              className={cn(
                "text-xs h-8",
                isActivityTypeSelected("friendship")
                  ? "bg-primary hover:bg-primary/90"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              )}>
              Friends
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm text-foreground flex items-center gap-2">
            <Calendar className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            Date Range
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label
                htmlFor="start-date"
                className="text-[10px] sm:text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="start-date"
                type="date"
                value={localFilters.dateRange?.start || ""}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                className="bg-background border-border/70 text-foreground text-xs sm:text-sm h-9"
              />
            </div>
            <div>
              <Label
                htmlFor="end-date"
                className="text-[10px] sm:text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="end-date"
                type="date"
                value={localFilters.dateRange?.end || ""}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                className="bg-background border-border/70 text-foreground text-xs sm:text-sm h-9"
              />
            </div>
          </div>
        </div>

        {/* Friend-Specific Filter */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm text-foreground">Filter by Friend</Label>
          {isLoadingFriends ? (
            <div className="text-xs sm:text-sm text-muted-foreground">
              Loading friends...
            </div>
          ) : friends.length === 0 ? (
            <div className="text-xs sm:text-sm text-muted-foreground">
              No friends to filter by
            </div>
          ) : (
            <div className="space-y-2">
              {localFilters.friendId && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 text-xs">
                    {getSelectedFriendName()}
                    <button
                      onClick={() => handleFriendFilterChange(undefined)}
                      className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
              <select
                value={localFilters.friendId || ""}
                onChange={(e) =>
                  handleFriendFilterChange(
                    e.target.value || undefined
                  )
                }
                className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 h-9">
                <option value="">All friends</option>
                {friends.map((friend) => (
                  <option key={friend.user_id} value={friend.user_id}>
                    {friend.display_name || "Unknown"}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-border/70">
            <div className="text-xs text-muted-foreground">
              {localFilters.types && localFilters.types.length > 0 && (
                <div>
                  Types: {localFilters.types.join(", ")}
                </div>
              )}
              {(localFilters.dateRange?.start ||
                localFilters.dateRange?.end) && (
                <div>
                  Date:{" "}
                  {localFilters.dateRange?.start || "Any"} to{" "}
                  {localFilters.dateRange?.end || "Any"}
                </div>
              )}
              {localFilters.friendId && (
                <div>Friend: {getSelectedFriendName()}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
