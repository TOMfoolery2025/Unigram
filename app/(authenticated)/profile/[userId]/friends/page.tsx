/** @format */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile/profiles";
import { getUserFriends } from "@/lib/profile/friendships";
import { UserProfile } from "@/types/profile";
import { FriendWithProfile } from "@/types/friendship";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Users } from "lucide-react";

export default function FriendsPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    async function loadData() {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load profile (also logs a profile view if current user is different)
        const { data: profileData, error: profileError } = await getUserProfile(
          userId,
          currentUser?.id
        );
        
        if (profileError || !profileData) {
          setError("Profile not found");
          setIsLoading(false);
          return;
        }

        setProfile(profileData);

        // Load friends
        const { data: friendsData } = await getUserFriends(userId);
        if (friendsData) {
          setFriends(friendsData);
          setFilteredFriends(friendsData);
        }
      } catch (err) {
        console.error("Error loading friends:", err);
        setError("Failed to load friends");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [userId]);

  // Filter friends based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = friends.filter(friend => {
      const nameMatch = friend.display_name?.toLowerCase().includes(query);
      const interestMatch = friend.interests?.some(interest => 
        interest.toLowerCase().includes(query)
      );
      return nameMatch || interestMatch;
    });

    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  const handleFriendClick = (friendId: string) => {
    router.push(`/profile/${friendId}`);
  };

  if (isLoading) {
    return <FriendsPageSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error || "Profile not found"}</p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.15),transparent_50%)]" />

      <main className="min-h-screen px-4 py-6 sm:py-10 bg-background/80">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {isOwnProfile ? "Your Friends" : `${profile.display_name}'s Friends`}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {friends.length} {friends.length === 1 ? 'connection' : 'connections'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <Card className="card-hover-glow border-border/60 bg-card/80">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or interest..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Friends List */}
          <Card className="card-hover-glow border-border/60 bg-card/80">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {searchQuery ? `${filteredFriends.length} Results` : 'All Friends'}
                </CardTitle>
              </div>
              {searchQuery && (
                <CardDescription className="text-xs sm:text-sm">
                  Showing friends matching &quot;{searchQuery}&quot;
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? "No friends found matching your search" 
                      : isOwnProfile 
                        ? "You haven't made any connections yet" 
                        : "No connections to display"
                    }
                  </p>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFriends.map((friend) => (
                    <Card
                      key={friend.user_id}
                      className="card-hover-glow border-border/60 bg-card/40 hover:bg-card/80 transition-all cursor-pointer hover:-translate-y-1"
                      onClick={() => handleFriendClick(friend.user_id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <UserAvatar
                            userId={friend.user_id}
                            displayName={friend.display_name}
                            avatarUrl={friend.avatar_url}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              {friend.display_name || 'Anonymous'}
                            </h3>
                            {friend.bio && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {friend.bio}
                              </p>
                            )}
                            {friend.interests && friend.interests.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {friend.interests.slice(0, 3).map((interest, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                                {friend.interests.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    +{friend.interests.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Friends since {new Date(friend.friendship_since).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

// Loading skeleton
function FriendsPageSkeleton() {
  return (
    <main className="min-h-screen px-4 py-6 sm:py-10 bg-background/80">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>

        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
