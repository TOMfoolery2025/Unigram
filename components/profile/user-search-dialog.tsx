/** @format */

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, UserPlus, Eye } from "lucide-react";
import { searchUsers } from "@/lib/profile/profiles";
import { UserProfileWithFriendship } from "@/types/profile";
import { UserAvatar } from "./user-avatar";
import { FriendRequestButton } from "./friend-request-button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserSearchDialogProps {
  currentUserId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * UserSearchDialog - Modal for searching users by name
 * 
 * Features:
 * - Debounced search input (500ms delay)
 * - Display search results with friendship status
 * - Quick action buttons (send request, view profile)
 * - Empty states for no query and no results
 */
export function UserSearchDialog({
  currentUserId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: UserSearchDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [results, setResults] = React.useState<UserProfileWithFriendship[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Use controlled or uncontrolled state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Debounce search query (500ms delay)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      const { data, error } = await searchUsers(debouncedQuery, currentUserId);

      setIsSearching(false);

      if (error) {
        toast.error("Failed to search users");
        console.error("Search error:", error);
        return;
      }

      // Filter out current user from results
      const filteredResults = (data || []).filter(
        (user) => user.id !== currentUserId
      );
      setResults(filteredResults);
    };

    performSearch();
  }, [debouncedQuery, currentUserId]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setDebouncedQuery("");
      setResults([]);
      setHasSearched(false);
    }
  }, [open]);

  const handleViewProfile = (userId: string) => {
    setOpen(false);
    router.push(`/profile/${userId}`);
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    // Update the friendship status in the results
    setResults((prevResults) =>
      prevResults.map((user) =>
        user.id === userId
          ? { ...user, friendship_status: newStatus as any }
          : user
      )
    );
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Search className="h-4 w-4" />
      Search Users
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[85vh] sm:max-h-[80vh] w-[95vw] sm:w-full border-border/70 bg-card/95 backdrop-blur-md p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg font-semibold text-primary">
            Search Users
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Find and connect with other community members
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/80 border-border/60 text-sm"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Results Area */}
        <ScrollArea className="h-[350px] sm:h-[400px] pr-2 sm:pr-4">
          {/* Empty state: No query */}
          {!hasSearched && !searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Enter a name to search for users
              </p>
            </div>
          )}

          {/* Loading state */}
          {isSearching && searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          )}

          {/* Empty state: No results */}
          {!isSearching && hasSearched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-foreground mb-1">
                No users found
              </p>
              <p className="text-xs text-muted-foreground">
                Try searching with a different name
              </p>
            </div>
          )}

          {/* Results List */}
          {!isSearching && results.length > 0 && (
            <div className="space-y-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border/60 bg-background/40 hover:bg-background/60 transition-colors"
                >
                  {/* Avatar and Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                    <UserAvatar
                      userId={user.id}
                      displayName={user.display_name}
                      avatarUrl={user.avatar_url}
                      size="lg"
                      className="flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                        {user.display_name || "Anonymous User"}
                      </h3>
                      {user.bio && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                          {user.bio}
                        </p>
                      )}
                      {user.interests && user.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.interests.slice(0, 3).map((interest, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                            >
                              {interest}
                            </span>
                          ))}
                          {user.interests.length > 3 && (
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              +{user.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProfile(user.id)}
                      className="gap-2 flex-1 sm:flex-none"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sm:inline">View</span>
                    </Button>
                    <FriendRequestButton
                      currentUserId={currentUserId}
                      targetUserId={user.id}
                      initialStatus={user.friendship_status}
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onStatusChange={(newStatus) =>
                        handleStatusChange(user.id, newStatus)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
