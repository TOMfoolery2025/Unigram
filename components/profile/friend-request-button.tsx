/** @format */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, UserCheck, Clock, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FriendshipStatus } from "@/types/profile";
import {
  sendFriendRequest,
  acceptFriendRequest,
  unfriendUser,
} from "@/lib/profile/friendships";

interface FriendRequestButtonProps {
  currentUserId: string;
  targetUserId: string;
  initialStatus: FriendshipStatus;
  friendshipId?: string; // Required for accepting requests
  onStatusChange?: (newStatus: FriendshipStatus) => void;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

/**
 * FriendRequestButton - Context-aware button for friendship actions
 * 
 * Displays different states based on friendship status:
 * - none: "Add Friend" button
 * - pending_sent: "Pending" button (disabled)
 * - pending_received: "Accept Request" button
 * - friends: "Friends" button with unfriend option
 * 
 * Implements optimistic UI updates for smooth UX
 */
export function FriendRequestButton({
  currentUserId,
  targetUserId,
  initialStatus,
  friendshipId,
  onStatusChange,
  size = "default",
  variant = "default",
  className,
}: FriendRequestButtonProps) {
  const [status, setStatus] = React.useState<FriendshipStatus>(initialStatus);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showUnfriendDialog, setShowUnfriendDialog] = React.useState(false);

  // Update status when initialStatus changes (e.g., from parent component)
  React.useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleSendRequest = async () => {
    // Optimistic update
    const previousStatus = status;
    setStatus("pending_sent");
    setIsLoading(true);

    const { error } = await sendFriendRequest(currentUserId, targetUserId);

    setIsLoading(false);

    if (error) {
      // Rollback on error
      setStatus(previousStatus);
      toast.error("Failed to send friend request");
      return;
    }

    toast.success("Friend request sent!");
    onStatusChange?.("pending_sent");
  };

  const handleAcceptRequest = async () => {
    if (!friendshipId) {
      toast.error("Cannot accept request: missing friendship ID");
      return;
    }

    // Optimistic update
    const previousStatus = status;
    setStatus("friends");
    setIsLoading(true);

    const { error } = await acceptFriendRequest(friendshipId);

    setIsLoading(false);

    if (error) {
      // Rollback on error
      setStatus(previousStatus);
      toast.error("Failed to accept friend request");
      return;
    }

    toast.success("Friend request accepted!");
    onStatusChange?.("friends");
  };

  const handleUnfriend = async () => {
    // Optimistic update
    const previousStatus = status;
    setStatus("none");
    setIsLoading(true);
    setShowUnfriendDialog(false);

    const { error } = await unfriendUser(currentUserId, targetUserId);

    setIsLoading(false);

    if (error) {
      // Rollback on error
      setStatus(previousStatus);
      toast.error("Failed to unfriend user");
      return;
    }

    toast.success("User unfriended");
    onStatusChange?.("none");
  };

  // Render different button states based on friendship status
  if (status === "friends") {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setShowUnfriendDialog(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Friends
            </>
          )}
        </Button>

        {/* Unfriend Confirmation Dialog */}
        <Dialog open={showUnfriendDialog} onOpenChange={setShowUnfriendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unfriend User</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this person from your friends
                list? You can always send them a friend request again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUnfriendDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleUnfriend}>
                <UserMinus className="h-4 w-4 mr-2" />
                Unfriend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        disabled
      >
        <Clock className="h-4 w-4 mr-2" />
        Pending
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleAcceptRequest}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserCheck className="h-4 w-4 mr-2" />
            Accept Request
          </>
        )}
      </Button>
    );
  }

  // Default: none status
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSendRequest}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </>
      )}
    </Button>
  );
}
