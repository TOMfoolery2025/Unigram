/** @format */

"use client";

import { useRouter } from "next/navigation";
import { UserAvatar } from "./user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FriendshipStatus } from "@/types/profile";

interface ProfileCardProps {
  userId: string;
  displayName: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  friendshipStatus?: FriendshipStatus;
  className?: string;
  showFriendshipButton?: boolean;
  onClick?: () => void;
}

/**
 * ProfileCard - Compact profile display component
 * 
 * Used in lists like friends list, search results, etc.
 * Shows avatar, name, bio preview, and optional friendship status
 */
export function ProfileCard({
  userId,
  displayName,
  avatarUrl,
  bio,
  interests,
  friendshipStatus = "none",
  className,
  showFriendshipButton = false,
  onClick,
}: ProfileCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement friendship actions in task 9
  };

  return (
    <Card
      className={cn(
        "card-hover-glow border-border/60 bg-card/80 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]",
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Avatar */}
          <UserAvatar
            userId={userId}
            displayName={displayName}
            avatarUrl={avatarUrl}
            size="md"
            className="flex-shrink-0"
          />

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {displayName || "Anonymous User"}
            </h3>
            
            {bio && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1">
                {bio}
              </p>
            )}

            {interests && interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                {interests.slice(0, 3).map((interest, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-[10px] sm:text-xs px-1.5 py-0"
                  >
                    {interest}
                  </Badge>
                ))}
                {interests.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] sm:text-xs px-1.5 py-0"
                  >
                    +{interests.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Friendship Button */}
          {showFriendshipButton && (
            <div className="flex-shrink-0 hidden sm:block">
              <FriendshipStatusButton
                status={friendshipStatus}
                onClick={handleButtonClick}
              />
            </div>
          )}
        </div>
        
        {/* Mobile Friendship Button */}
        {showFriendshipButton && (
          <div className="mt-3 sm:hidden">
            <FriendshipStatusButton
              status={friendshipStatus}
              onClick={handleButtonClick}
              fullWidth
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Friendship Status Button Component
function FriendshipStatusButton({
  status,
  onClick,
  fullWidth = false,
}: {
  status: FriendshipStatus;
  onClick: (e: React.MouseEvent) => void;
  fullWidth?: boolean;
}) {
  const buttonClass = cn(
    "gap-1.5 text-xs h-8",
    fullWidth && "w-full"
  );

  if (status === "friends") {
    return (
      <Button
        variant="outline"
        size="sm"
        className={buttonClass}
        onClick={onClick}
      >
        <UserCheck className="h-3 w-3" />
        <span className="hidden sm:inline">Friends</span>
        <span className="sm:hidden">Friends</span>
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button
        variant="outline"
        size="sm"
        className={buttonClass}
        disabled
      >
        <Clock className="h-3 w-3" />
        <span className="hidden sm:inline">Pending</span>
        <span className="sm:hidden">Pending</span>
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <Button
        size="sm"
        className={buttonClass}
        onClick={onClick}
      >
        <UserCheck className="h-3 w-3" />
        <span className="hidden sm:inline">Accept</span>
        <span className="sm:hidden">Accept Request</span>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className={buttonClass}
      onClick={onClick}
    >
      <UserPlus className="h-3 w-3" />
      <span className="hidden sm:inline">Add</span>
      <span className="sm:hidden">Add Friend</span>
    </Button>
  );
}
