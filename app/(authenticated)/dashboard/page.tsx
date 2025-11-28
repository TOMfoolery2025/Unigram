/** @format */

"use client";

import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSkeleton } from "@/components/ui/loading-states";

import { MessageSquare, Hash, BookOpen, Calendar, Star, User } from "lucide-react";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

// Import activity feed components
import { ActivityFeed } from "@/components/activity";
import { FriendRequestsList } from "@/components/profile/friend-requests-list";
import { getPendingRequests } from "@/lib/profile/friendships";
import { UnifiedSearch } from "@/components/home";

import { getChannels, getUserChannels } from "@/lib/channel";
import { getUserSubforums } from "@/lib/forum";
import { getUserRegisteredEvents } from "@/lib/event";

// ------- local types -------

type SimpleChannel = {
  id: string | number;
  name: string;
  description?: string;
};

type FavoriteItem = {
  id: string; // e.g. "channel-123"
  label: string;
  href: string;
};

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  // ---------- LOADING STATE ----------
  const [isLoading, setIsLoading] = useState(true);

  // ---------- STATS ----------
  const [stats, setStats] = useState({
    totalChannels: 0,
    joinedChannels: 0,
    joinedSubforums: 0,
    upcomingEvents: 0,
  });

  const [myChannels, setMyChannels] = useState<SimpleChannel[]>([]);
  const [recommendedChannels, setRecommendedChannels] = useState<
    SimpleChannel[]
  >([]);
  const [subforums, setSubforums] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);

  // ---------- FRIEND REQUESTS ----------
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // ---------- FAVORITES ----------
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // load favorites from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("unigram-favorites");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  }, []);

  // persist favorites
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "unigram-favorites",
        JSON.stringify(favorites)
      );
    } catch (err) {
      console.error("Failed to save favorites:", err);
    }
  }, [favorites]);

  const toggleChannelFavorite = (ch: SimpleChannel) => {
    const favId = `channel-${ch.id}`;
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === favId);
      if (exists) {
        return prev.filter((f) => f.id !== favId);
      }
      return [
        ...prev,
        { id: favId, label: `#${ch.name}`, href: `/channels/${ch.id}` },
      ];
    });
  };

  const isChannelFavorite = (id: string | number) =>
    favorites.some((f) => f.id === `channel-${id}`);

  // ---------- GREETING ----------
  const { greeting, firstName, dateLabel } = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();

    const greeting =
      hour < 12
        ? "Good morning"
        : hour < 18
        ? "Good afternoon"
        : "Good evening";

    const rawName =
      (user as any)?.full_name ||
      (user as any)?.name ||
      user?.email?.split("@")[0] ||
      "there";

    const firstChunk = rawName.split(/[._\s]/)[0];
    const firstName =
      firstChunk.charAt(0).toUpperCase() + firstChunk.slice(1).toLowerCase();

    const dateLabel = new Intl.DateTimeFormat("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(now);

    return { greeting, firstName, dateLabel };
  }, [user]);

  const channelProgress =
    stats.totalChannels > 0
      ? (stats.joinedChannels / stats.totalChannels) * 100
      : 0;

  // ---------- LOAD DATA ----------
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [channelsResult, userChannelsResult, userSubforumsResult, registeredEventsResult] =
        await Promise.all([
          getChannels(),
          getUserChannels(user.id),
          getUserSubforums(user.id),
          getUserRegisteredEvents(user.id),
        ]);

      const allChannelsRaw = channelsResult.data || [];
      const userChannelsRaw = userChannelsResult.data || [];
      const subforumsRaw = userSubforumsResult.data || [];
      const registeredEventsRaw = registeredEventsResult.data || [];

      // Filter for upcoming events only
      const now = new Date();
      const upcomingEvents = registeredEventsRaw.filter((event: any) => {
        const eventDate = new Date(event.date);
        return eventDate >= now;
      }).sort((a: any, b: any) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      const derivedMyChannels: SimpleChannel[] = userChannelsRaw.map(
        (uc: any) => {
          const ch = uc.channel || uc.channels || uc;
          return {
            id: ch.id ?? uc.id,
            name: ch.name ?? ch.title ?? "Unnamed channel",
            description: ch.description ?? "",
          };
        }
      );

      const joinedIds = new Set(derivedMyChannels.map((c) => c.id));

      const derivedRecommended: SimpleChannel[] = (allChannelsRaw || [])
        .filter((ch: any) => ch && ch.id && !joinedIds.has(ch.id))
        .slice(0, 5)
        .map((ch: any) => ({
          id: ch.id,
          name: ch.name ?? ch.title ?? "Unnamed channel",
          description: ch.description ?? "",
        }));

      setStats({
        totalChannels: allChannelsRaw.length || 0,
        joinedChannels: derivedMyChannels.length || 0,
        joinedSubforums: subforumsRaw.length || 0,
        upcomingEvents: upcomingEvents.length || 0,
      });

      setNextEvent(upcomingEvents[0] || null);
      setMyChannels(derivedMyChannels);
      setRecommendedChannels(derivedRecommended);
      setSubforums(subforumsRaw);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ---------- LOAD FRIEND REQUESTS COUNT ----------
  const loadPendingRequestsCount = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await getPendingRequests(user.id);
    setPendingRequestsCount(data?.length || 0);
  }, [user?.id]);

  useEffect(() => {
    loadPendingRequestsCount();
  }, [loadPendingRequestsCount]);

  // ---------- ACTIVITY ----------
  const activityItems = useMemo(() => {
    const items: {
      id: string;
      type: "channel" | "forum";
      title: string;
      description: string;
      time: string;
    }[] = [];

    myChannels.slice(0, 4).forEach((ch, idx) => {
      items.push({
        id: `channel-${ch.id ?? idx}`,
        type: "channel",
        title: `Joined #${ch.name}`,
        description:
          ch.description ||
          "You joined a new channel. Stay tuned for upcoming discussions.",
        time: "Recently",
      });
    });

    subforums.slice(0, 4).forEach((sf: any, idx) => {
      const f = sf.subforum || sf.forum || sf;
      const name = f?.name ?? f?.title ?? "Forum";
      items.push({
        id: `forum-${f?.id ?? idx}`,
        type: "forum",
        title: `Active in ${name}`,
        description:
          f?.description ||
          "You viewed or participated in this forum recently.",
        time: "This week",
      });
    });

    return items;
  }, [myChannels, subforums]);

  // ---------- STATIC ANNOUNCEMENTS / EVENTS ----------
  const announcements = [
    {
      id: "welcome",
      title: "Welcome to Unigram 🎉",
      body: "Thanks for joining the TUM Heilbronn community platform. Explore channels, forums, and the wiki to get started.",
      tag: "General",
    },
    {
      id: "wiki",
      title: "New Wiki articles added",
      body: "Check out the latest guides on exam preparation, housing tips, and project collaboration.",
      tag: "Wiki",
    },
    {
      id: "events",
      title: "Events feature in beta",
      body: "Soon you’ll be able to RSVP to campus events directly from Unigram.",
      tag: "Product",
    },
  ];

  const eventsPreview = [
    {
      id: "study-group",
      title: "Study Group: Data Structures",
      time: "Thu • 18:00",
      location: "Library, 2nd Floor",
    },
    {
      id: "startup-night",
      title: "Startup Night @ TUM Heilbronn",
      time: "Next week",
      location: "Campus Auditorium",
    },
  ];

  if (isLoading) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <>
      {/* neon background like auth & forums */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />

      {/* (authenticated)/layout controls padding; just content here */}
      <div className='max-w-7xl mx-auto space-y-6 pb-20'>
        {/* UNIFIED SEARCH */}
        <div className='mb-8'>
          <UnifiedSearch userId={user?.id} />
        </div>

        {/* HERO CARD */}
        <Card className='card-hover-glow border-border/60 bg-gradient-to-br from-primary/25 via-background/60 to-background/80'>
          <CardHeader className='pb-6'>
            <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
              <div className='space-y-3 flex-1'>
                <p className='text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium'>
                  {dateLabel} • Dashboard
                </p>
                <CardTitle className='text-3xl md:text-4xl font-extrabold text-primary leading-tight'>
                  {greeting}, {firstName} 👋
                </CardTitle>
                <CardDescription className='max-w-2xl text-sm md:text-base leading-relaxed'>
                  Here&apos;s what&apos;s happening across your campus
                  community. Explore channels, jump into discussions, or browse
                  the wiki.
                </CardDescription>
              </div>

              {/* profile pill */}
              <div className='flex items-center gap-3 rounded-2xl border border-primary/30 bg-background/70 px-5 py-4 shadow-[0_0_30px_rgba(139,92,246,0.35)] shrink-0'>
                <Avatar className='h-12 w-12'>
                  {(user as any)?.avatar_url && (
                    <AvatarImage 
                      src={(user as any).avatar_url} 
                      alt={user?.email || 'User avatar'} 
                    />
                  )}
                  <AvatarFallback className='bg-primary text-primary-foreground text-lg'>
                    {firstName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-semibold'>{user?.email}</p>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {user?.is_admin ? "Admin" : "Student"} • TUM Heilbronn
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* hero stats */}
            <div className='grid grid-cols-3 gap-6 py-4 px-2'>
              <div className='space-y-1.5'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground font-medium'>
                  Channels
                </p>
                <p className='text-2xl font-bold text-primary'>
                  {stats.joinedChannels}
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  joined of {stats.totalChannels}
                </p>
              </div>
              <div className='space-y-1.5'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground font-medium'>
                  Subforums
                </p>
                <p className='text-2xl font-bold text-primary'>
                  {stats.joinedSubforums}
                </p>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  active communities
                </p>
              </div>
              <div className='space-y-1.5'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground font-medium'>
                  Next Event
                </p>
                {nextEvent ? (
                  <>
                    <p className='text-base font-bold text-primary truncate'>
                      {nextEvent.title}
                    </p>
                    <p className='text-xs text-muted-foreground leading-relaxed'>
                      {new Date(nextEvent.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className='text-base font-semibold text-muted-foreground'>
                      None
                    </p>
                    <p className='text-xs text-muted-foreground leading-relaxed'>
                      No upcoming events
                    </p>
                  </>
                )}
              </div>
            </div>


          </CardContent>
        </Card>



        {/* MAIN GRID: big left card + right column */}
        <section className='grid gap-6 lg:grid-cols-3'>
          {/* LEFT: Activity / announcements / events */}
          <Card className='card-hover-glow border-border/60 bg-card/80 lg:col-span-2'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-xl font-bold'>What&apos;s happening</CardTitle>
              <CardDescription className='text-sm leading-relaxed'>
                Recent activity from your friends, announcements, and upcoming events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='activity'>
                <TabsList className='mb-5 w-full grid grid-cols-3'>
                  <TabsTrigger value='activity' className='text-sm'>
                    Friend Activity
                  </TabsTrigger>
                  <TabsTrigger value='announcements' className='text-sm'>Announcements</TabsTrigger>
                  <TabsTrigger value='events' className='text-sm'>Events</TabsTrigger>
                </TabsList>

                {/* Activity tab - Now using ActivityFeed component */}
                <TabsContent value='activity' className='mt-0'>
                  <ScrollArea className='h-[500px] pr-4'>
                    {user?.id && <ActivityFeed userId={user.id} pageSize={10} />}
                  </ScrollArea>
                </TabsContent>

                {/* Announcements tab */}
                <TabsContent value='announcements' className='mt-0'>
                  <ScrollArea className='h-[500px] pr-4'>
                    <ul className='space-y-4'>
                      {announcements.map((a) => (
                        <li
                          key={a.id}
                          className='rounded-lg border border-border/60 bg-background/40 px-4 py-4 hover:bg-background/60 transition-colors'>
                          <div className='flex items-start justify-between mb-2 gap-3'>
                            <p className='text-sm font-semibold leading-relaxed'>{a.title}</p>
                            <Badge variant='outline' className='text-xs shrink-0'>
                              {a.tag}
                            </Badge>
                          </div>
                          <p className='text-sm text-muted-foreground leading-relaxed'>
                            {a.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </TabsContent>

                {/* Events tab */}
                <TabsContent value='events' className='mt-0'>
                  <ScrollArea className='h-[500px] pr-4'>
                    {eventsPreview.length === 0 ? (
                      <p className='text-sm text-muted-foreground leading-relaxed'>
                        Events will appear here once the feature is live.
                      </p>
                    ) : (
                      <ul className='space-y-4'>
                        {eventsPreview.map((e) => (
                          <li
                            key={e.id}
                            className='flex items-start gap-4 rounded-lg border border-border/60 bg-background/40 px-4 py-4 hover:bg-background/60 transition-colors'>
                            <div className='mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0'>
                              <Calendar className='h-5 w-5' />
                            </div>
                            <div className='space-y-1'>
                              <p className='text-sm font-semibold leading-relaxed'>{e.title}</p>
                              <p className='text-xs text-muted-foreground leading-relaxed'>
                                {e.time} • {e.location}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* RIGHT column: Friend requests + Favorites + profile + channels */}
          <div className='space-y-5'>
            {/* Friend Requests */}
            {user?.id && pendingRequestsCount > 0 && (
              <FriendRequestsList userId={user.id} />
            )}

            {/* Favorites */}
            <Card className='card-hover-glow border-border/60 bg-card/80'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-bold'>Favorites</CardTitle>
                <CardDescription className='text-sm leading-relaxed'>
                  Pin your most-used spaces for quick access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    You haven&apos;t pinned anything yet. Use the{" "}
                    <Star className='inline h-3 w-3 text-yellow-400' /> icon in
                    &quot;Your Channels&quot; to add favorites.
                  </p>
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    {favorites.map((fav) => (
                      <Button
                        key={fav.id}
                        variant='outline'
                        size='sm'
                        className='text-xs border-border/70 h-8'
                        onClick={() => router.push(fav.href)}>
                        {fav.label}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Your Channels */}
            <Card className='card-hover-glow border-border/60 bg-card/80'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-bold'>Your Channels</CardTitle>
                <CardDescription className='text-sm leading-relaxed'>
                  Spaces you&apos;ve already joined (click to open, star to
                  favorite)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myChannels.length === 0 ? (
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    You haven&apos;t joined any channels yet. Browse channels to
                    get started.
                  </p>
                ) : (
                  <ScrollArea className='h-48 pr-4'>
                    <ul className='space-y-2'>
                      {myChannels.map((ch) => {
                        const fav = isChannelFavorite(ch.id);
                        return (
                          <li
                            key={ch.id}
                            className='flex items-center justify-between gap-3 cursor-pointer rounded-lg hover:bg-background/60 px-3 py-2.5 transition-colors border border-transparent hover:border-border/40'
                            onClick={() => router.push(`/channels/${ch.id}`)}>
                            <div className='flex items-center gap-3 min-w-0'>
                              <Avatar className='h-9 w-9 shrink-0'>
                                <AvatarFallback className='text-xs font-semibold'>
                                  #{ch.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className='min-w-0'>
                                <p className='font-semibold text-sm truncate'>
                                  #{ch.name}
                                </p>
                                {ch.description && (
                                  <p className='text-xs text-muted-foreground truncate leading-relaxed'>
                                    {ch.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 shrink-0'
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChannelFavorite(ch);
                              }}>
                              <Star
                                className={`h-4 w-4 transition-colors ${
                                  fav
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-muted-foreground hover:text-yellow-400"
                                }`}
                              />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Recommended Channels */}
            <Card className='card-hover-glow border-border/60 bg-card/80'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-bold'>Recommended Channels</CardTitle>
                <CardDescription className='text-sm leading-relaxed'>
                  Based on what&apos;s available on campus
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendedChannels.length === 0 ? (
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    You&apos;re already in all available channels or none are
                    configured yet.
                  </p>
                ) : (
                  <ScrollArea className='h-48 pr-4'>
                    <ul className='space-y-3'>
                      {recommendedChannels.map((ch) => (
                        <li
                          key={ch.id}
                          className='flex items-center justify-between gap-3 p-3 rounded-lg border border-border/40 bg-background/30 hover:bg-background/60 transition-colors'>
                          <div className='min-w-0 space-y-1'>
                            <p className='font-semibold text-sm truncate'>#{ch.name}</p>
                            {ch.description && (
                              <p className='text-xs text-muted-foreground truncate leading-relaxed'>
                                {ch.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size='sm'
                            variant='outline'
                            className='text-xs h-8 shrink-0'
                            onClick={() => router.push("/channels")}>
                            View
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </section>


      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
