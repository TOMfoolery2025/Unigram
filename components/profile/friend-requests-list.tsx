/** @format */

"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./user-avatar";
import { Badge } from "@/components/ui/badge";
import { UserCheck, X, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { FriendRequest } from "@/types/friendship";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getPendingRequests,
} from "@/lib/profile/friendships";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FriendRequestsListProps {
  userId: string;
  className?: string;
  onRequestsChange?: (count: number) => void;
}

/**
 * FriendRequestsList - Display incoming friend requests with accept/decline actions
 * 
 * Features:
 * - Shows list of pending friend requests
 * - Accept/decline actions with optimistic UI updates
 * - Loading states and error handling
 * - Empty state when no requests
 * - Badge showing count of pending requests
 */
export function FriendRequestsList({
  userId,
  className,
  onRequestsChange,
}: FriendRequestsListProps) {
  const router = useRouter();
  const [requests, setRequests] = React.useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(
    new Set()
  );

  // Load pending requests on mount and set up polling
  React.useEffect(() => {
    loadRequests();
    
    // Poll for new requests every 10 seconds
    const pollInterval = setInterval(() => {
      loadRequests();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadRequests = async () => {
    setIsLoading(true);
    const { data, error } = await getPendingRequests(userId);

    if (error) {
      toast.error("Failed to load friend requests");
      setIsLoading(false);
      return;
    }

    const newRequests = data || [];
    setRequests(newRequests);
    setIsLoading(false);
    
    // Notify parent of count change
    onRequestsChange?.(newRequests.length);
  };

  const handleAccept = async (requestId: string) => {
    // Optimistic update
    setProcessingIds((prev) => new Set(prev).add(requestId));

    const { error } = await acceptFriendRequest(requestId);

    if (error) {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      toast.error("Failed to accept friend request");
      return;
    }

    // Remove from list on success
    setRequests((prev) => {
      const updated = prev.filter((req) => req.id !== requestId);
      onRequestsChange?.(updated.length);
      return updated;
    });
    toast.success("Friend request accepted!");
  };

  const handleDecline = async (requestId: string) => {
    // Optimistic update
    setProcessingIds((prev) => new Set(prev).add(requestId));

    const { error } = await declineFriendRequest(requestId);

    if (error) {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      toast.error("Failed to decline friend request");
      return;
    }

    // Remove from list on success
    setRequests((prev) => {
      const updated = prev.filter((req) => req.id !== requestId);
      onRequestsChange?.(updated.length);
      return updated;
    });
    toast.success("Friend request declined");
  };

  const handleViewProfile = (requesterId: string) => {
    router.push(`/profile/${requesterId}`);
  };

  if (isLoading) {
    return (
      <Card className={cn("border-border/60 bg-card/80", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friend Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/60 bg-card/80", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friend Requests
          {requests.length > 0 && (
            <Badge variant="default" className="ml-auto">
              {requests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No pending friend requests
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <FriendRequestItem
                key={request.id}
                request={request}
                isProcessing={processingIds.has(request.id)}
                onAccept={() => handleAccept(request.id)}
                onDecline={() => handleDecline(request.id)}
                onViewProfile={() => handleViewProfile(request.requester_id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FriendRequestItemProps {
  request: FriendRequest;
  isProcessing: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onViewProfile: () => void;
}

function FriendRequestItem({
  request,
  isProcessing,
  onAccept,
  onDecline,
  onViewProfile,
}: FriendRequestItemProps) {
  const timeAgo = React.useMemo(() => {
    const date = new Date(request.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  }, [request.created_at]);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border border-border/60 bg-background/50 transition-opacity",
        isProcessing && "opacity-50"
      )}
    >
      {/* Avatar and Info */}
      <div className="flex items-start gap-3 flex-1 min-w-0 w-full sm:w-auto">
        {/* Avatar */}
        <button
          onClick={onViewProfile}
          className="flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95"
        >
          <UserAvatar
            userId={request.requester_id}
            displayName={request.requester_name}
            avatarUrl={request.requester_avatar}
            size="md"
          />
        </button>

        {/* Request Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={onViewProfile}
            className="font-semibold text-sm hover:underline text-left"
          >
            {request.requester_name || "Anonymous User"}
          </button>
          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
          {request.requester_bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {request.requester_bio}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0">
        <Button
          size="sm"
          onClick={onAccept}
          disabled={isProcessing}
          className="h-8 px-3 flex-1 sm:flex-none gap-1.5"
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <UserCheck className="h-3 w-3" />
              <span className="sm:hidden">Accept</span>
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDecline}
          disabled={isProcessing}
          className="h-8 px-3 flex-1 sm:flex-none gap-1.5"
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <X className="h-3 w-3" />
              <span className="sm:hidden">Decline</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
