/** @format */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getUserProfile, getUserActivity } from "@/lib/profile/profiles";
import { getFriendshipStatus, getPendingRequests, getUserFriends } from "@/lib/profile/friendships";
import { UserProfile, FriendshipStatus } from "@/types/profile";
import { Activity } from "@/types/activity";
import { FriendWithProfile } from "@/types/friendship";
import { UserAvatar } from "@/components/profile/user-avatar";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";
import { FriendRequestButton } from "@/components/profile/friend-request-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Calendar, 
  Users, 
  ArrowLeft
} from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    async function loadProfileData() {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load profile
        const { data: profileData, error: profileError } = await getUserProfile(userId);
        
        if (profileError || !profileData) {
          setError("Profile not found");
          setIsLoading(false);
          return;
        }

        setProfile(profileData);

        // Load friendship status if viewing another user's profile
        if (currentUser && !isOwnProfile) {
          const { data: statusData } = await getFriendshipStatus(currentUser.id, userId);
          if (statusData) {
            setFriendshipStatus(statusData);
            
            // If this user sent us a friend request, get the friendship ID
            if (statusData === "pending_received") {
              const { data: pendingRequests } = await getPendingRequests(currentUser.id);
              const request = pendingRequests?.find(req => req.requester_id === userId);
              if (request) {
                setFriendshipId(request.id);
              }
            }
          }
        }

        // Load recent activity
        const { data: activityData } = await getUserActivity(userId, 5);
        if (activityData) {
          setActivities(activityData);
        }

        // Load friends list
        const { data: friendsData } = await getUserFriends(userId);
        if (friendsData) {
          setFriends(friendsData);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
    
    // Poll for friendship status updates every 5 seconds when viewing another user's profile
    if (!isOwnProfile && currentUser) {
      const pollInterval = setInterval(async () => {
        const { data: statusData } = await getFriendshipStatus(currentUser.id, userId);
        if (statusData && statusData !== friendshipStatus) {
          setFriendshipStatus(statusData);
          
          // If status changed to pending_received, get the friendship ID
          if (statusData === "pending_received") {
            const { data: pendingRequests } = await getPendingRequests(currentUser.id);
            const request = pendingRequests?.find(req => req.requester_id === userId);
            if (request) {
              setFriendshipId(request.id);
            }
          }
        }
      }, 5000);

      // Cleanup interval on unmount
      return () => clearInterval(pollInterval);
    }
  }, [userId, currentUser, isOwnProfile, friendshipStatus]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error || "Profile not found"}</p>
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
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
      {/* Neon background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]" />

      <div className="max-w-4xl mx-auto section-spacing pb-20 page-container px-4 md:px-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 -ml-2 min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Profile Header Card */}
        <Card className="card-hover-glow border-border/60 bg-gradient-to-br from-primary/25 via-background/60 to-background/80">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Avatar and Name - Mobile Layout */}
              <div className="flex items-start gap-3 sm:hidden">
                <UserAvatar
                  userId={profile.id}
                  displayName={profile.display_name}
                  avatarUrl={profile.avatar_url}
                  size="lg"
                  className="shadow-[0_0_20px_rgba(139,92,246,0.35)] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-extrabold text-primary truncate">
                    {profile.display_name || "Anonymous User"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5 truncate">
                    {profile.email}
                  </CardDescription>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex sm:flex-row gap-6 items-start md:items-center">
                {/* Avatar */}
                <UserAvatar
                  userId={profile.id}
                  displayName={profile.display_name}
                  avatarUrl={profile.avatar_url}
                  size="xl"
                  className="shadow-[0_0_30px_rgba(139,92,246,0.35)] flex-shrink-0"
                />

                {/* Profile Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-extrabold text-primary">
                      {profile.display_name || "Anonymous User"}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {profile.email}
                    </CardDescription>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* Interests */}
                  {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons - Desktop */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {isOwnProfile ? (
                    <ProfileEditDialog
                      profile={profile}
                      onProfileUpdate={setProfile}
                    />
                  ) : currentUser ? (
                    <FriendRequestButton
                      currentUserId={currentUser.id}
                      targetUserId={userId}
                      initialStatus={friendshipStatus}
                      friendshipId={friendshipId}
                      onStatusChange={setFriendshipStatus}
                    />
                  ) : null}
                </div>
              </div>

              {/* Bio and Interests - Mobile */}
              <div className="sm:hidden space-y-3">
                {profile.bio && (
                  <p className="text-sm text-muted-foreground">
                    {profile.bio}
                  </p>
                )}

                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons - Mobile */}
              <div className="sm:hidden">
                {isOwnProfile ? (
                  <ProfileEditDialog
                    profile={profile}
                    onProfileUpdate={setProfile}
                  />
                ) : currentUser ? (
                  <FriendRequestButton
                    currentUserId={currentUser.id}
                    targetUserId={userId}
                    initialStatus={friendshipStatus}
                    friendshipId={friendshipId}
                    onStatusChange={setFriendshipStatus}
                    className="w-full"
                  />
                ) : null}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="card-hover-glow border-border/60 bg-card/80">
            <CardContent className="p-3 sm:p-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-semibold text-primary">
                    {activities.filter(a => a.activity_type === 'post').length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Hive Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-glow border-border/60 bg-card/80">
            <CardContent className="p-3 sm:p-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-semibold text-primary">
                    {activities.filter(a => a.activity_type === 'event_registration').length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Events Joined</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-glow border-border/60 bg-card/80">
            <CardContent className="p-3 sm:p-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-2xl font-semibold text-primary">
                    {friends.length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout: Activity on left, Friends on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Recent Activity - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="card-hover-glow border-border/60 bg-card/80">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Latest actions and contributions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {activities.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                    No recent activity to display
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {activities.map((activity) => (
                      <ActivityItem key={activity.activity_id} activity={activity} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Friends List - Takes 1 column on large screens */}
          <div className="lg:col-span-1">
            <Card className="card-hover-glow border-border/60 bg-card/80">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Friends</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {friends.length} {friends.length === 1 ? 'connection' : 'connections'}
                    </CardDescription>
                  </div>
                  {friends.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/profile/${userId}/friends`)}
                      className="text-xs"
                    >
                      View All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {friends.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                    {isOwnProfile ? "You haven't made any connections yet" : "No connections to display"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {friends.slice(0, 8).map((friend) => (
                      <div
                        key={friend.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-border/60 bg-card/40 hover:bg-card/80 transition-colors cursor-pointer"
                        onClick={() => router.push(`/profile/${friend.user_id}`)}
                      >
                        <UserAvatar
                          userId={friend.user_id}
                          displayName={friend.display_name}
                          avatarUrl={friend.avatar_url}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {friend.display_name || 'Anonymous'}
                          </p>
                          {friend.interests && friend.interests.length > 0 && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {friend.interests[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}



// Activity Item Component
function ActivityItem({ activity }: { activity: Activity }) {
  const router = useRouter();
  
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case "post":
        return <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "event_registration":
        return <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      case "friendship":
        return <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
      default:
        return null;
    }
  };

  const getActivityText = () => {
    switch (activity.activity_type) {
      case "post":
        return `Posted in ${activity.context_name || "hive"}`;
      case "event_registration":
        return `Registered for event`;
      case "friendship":
        return "Made a new friend";
      default:
        return "Activity";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 sm:py-3 hover:bg-background/60 transition-colors active:scale-[0.99]">
      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
        <div className="mt-0.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0">
          {getActivityIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium line-clamp-1">{activity.activity_title}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{getActivityText()}</p>
        </div>
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap self-end sm:self-auto ml-9 sm:ml-0">
        {formatDate(activity.created_at)}
      </span>
    </div>
  );
}

// Profile Skeleton Loader
function ProfileSkeleton() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]" />
      
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <Skeleton className="h-10 w-24" />
        
        {/* Profile Header Skeleton */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3 w-full">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-16 w-full max-w-2xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
        </Card>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border/60 bg-card/80">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Skeleton */}
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
