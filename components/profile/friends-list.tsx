/** @format */

"use client";

import { useState, useMemo } from "react";
import { Search, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "./profile-card";
import { FriendWithProfile } from "@/types/friendship";
import { cn } from "@/lib/utils";

interface FriendsListProps {
  friends: FriendWithProfile[];
  isLoading?: boolean;
  onFriendClick?: (userId: string) => void;
  className?: string;
}

/**
 * FriendsList component displays a user's friends in a grid layout
 * 
 * Features:
 * - Grid layout with responsive columns
 * - Search functionality to filter friends by name
 * - Empty state when no friends
 * - Click to navigate to friend profiles
 * 
 * Validates: Requirements 3.1, 3.2, 3.3
 */
export function FriendsList({
  friends,
  isLoading = false,
  onFriendClick,
  className,
}: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) {
      return friends;
    }

    const query = searchQuery.toLowerCase();
    return friends.filter((friend) => {
      const displayName = friend.display_name?.toLowerCase() || "";
      const bio = friend.bio?.toLowerCase() || "";
      const interests = friend.interests?.join(" ").toLowerCase() || "";

      return (
        displayName.includes(query) ||
        bio.includes(query) ||
        interests.includes(query)
      );
    });
  }, [friends, searchQuery]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-background/60 rounded w-48 animate-pulse" />
          <div className="h-4 bg-background/60 rounded w-64 animate-pulse" />
        </div>

        {/* Search skeleton */}
        <Card className="border-border/60 bg-card/90">
          <CardContent className="p-4">
            <div className="h-10 bg-background/60 rounded animate-pulse" />
          </CardContent>
        </Card>

        {/* Grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="border-border/60 bg-card/80 animate-pulse"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-background/60 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-background/60 rounded w-3/4" />
                    <div className="h-3 bg-background/60 rounded w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-3.5 w-3.5" />
          </span>
          <span>Friends</span>
          <span className="text-muted-foreground text-base font-normal">
            ({friends.length})
          </span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your connections in the TUM community
        </p>
      </div>

      {/* Search */}
      {friends.length > 0 && (
        <Card className="card-hover-glow border-border/60 bg-card/90">
          <CardContent className="p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search friends by name, bio, or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/60 border-border/60 text-sm h-12 sm:h-10"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      {friends.length > 0 && (
        <div className="text-xs md:text-sm text-muted-foreground">
          {searchQuery.trim() ? (
            <span>
              {filteredFriends.length} friend{filteredFriends.length === 1 ? "" : "s"} found
            </span>
          ) : (
            <span>
              {friends.length} friend{friends.length === 1 ? "" : "s"} total
            </span>
          )}
        </div>
      )}

      {/* Friends Grid */}
      {friends.length === 0 ? (
        // Empty state - no friends
        <Card className="card-hover-glow border-border/60 bg-card/90">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background/70">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-medium text-foreground">
                No friends yet
              </h3>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
                Start connecting with other members of the TUM community. Search for users and send friend requests to build your network.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredFriends.length === 0 ? (
        // Empty state - no search results
        <Card className="card-hover-glow border-border/60 bg-card/90">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background/70">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-medium text-foreground">
                No friends found
              </h3>
              <p className="mt-1 text-xs md:text-sm text-muted-foreground">
                Try adjusting your search query.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Friends grid - single column on mobile, 2 on tablet, 3 on desktop
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFriends.map((friend) => (
            <ProfileCard
              key={friend.user_id}
              userId={friend.user_id}
              displayName={friend.display_name}
              avatarUrl={friend.avatar_url}
              bio={friend.bio}
              interests={friend.interests}
              friendshipStatus="friends"
              onClick={onFriendClick ? () => onFriendClick(friend.user_id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
