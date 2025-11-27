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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MessageSquare, Hash, BookOpen, Calendar, Star } from "lucide-react";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";

import { getChannels, getUserChannels } from "@/lib/channel";
import { getUserSubforums } from "@/lib/forum";

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

  // ---------- STATS ----------
  const [stats, setStats] = useState({
    totalChannels: 0,
    joinedChannels: 0,
    joinedSubforums: 0,
  });

  const [myChannels, setMyChannels] = useState<SimpleChannel[]>([]);
  const [recommendedChannels, setRecommendedChannels] = useState<
    SimpleChannel[]
  >([]);
  const [subforums, setSubforums] = useState<any[]>([]);

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

    try {
      const [channelsResult, userChannelsResult, userSubforumsResult] =
        await Promise.all([
          getChannels(),
          getUserChannels(user.id),
          getUserSubforums(user.id),
        ]);

      const allChannelsRaw = channelsResult.data || [];
      const userChannelsRaw = userChannelsResult.data || [];
      const subforumsRaw = userSubforumsResult.data || [];

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
      });

      setMyChannels(derivedMyChannels);
      setRecommendedChannels(derivedRecommended);
      setSubforums(subforumsRaw);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  return (
    <>
      {/* neon background like auth & forums */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />

      {/* (authenticated)/layout controls padding; just content here */}
      <div className='max-w-6xl mx-auto space-y-8 pb-20'>
        {/* HERO CARD */}
        <Card className='card-hover-glow border-border/60 bg-gradient-to-br from-primary/25 via-background/60 to-background/80'>
          <CardHeader className='pb-4'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-2'>
                <p className='text-xs uppercase tracking-[0.25em] text-muted-foreground'>
                  {dateLabel} • Dashboard
                </p>
                <CardTitle className='text-3xl md:text-4xl font-extrabold text-primary'>
                  {greeting}, {firstName} 👋
                </CardTitle>
                <CardDescription className='max-w-xl text-sm md:text-base'>
                  Here&apos;s what&apos;s happening across your campus
                  community. Explore channels, jump into discussions, or browse
                  the wiki.
                </CardDescription>
              </div>

              {/* profile pill */}
              <div className='flex items-center gap-3 rounded-2xl border border-primary/30 bg-background/70 px-4 py-3 shadow-[0_0_30px_rgba(139,92,246,0.35)]'>
                <Avatar className='h-10 w-10'>
                  <AvatarFallback className='bg-primary text-primary-foreground'>
                    {firstName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium'>{user?.email}</p>
                  <p className='text-[11px] text-muted-foreground'>
                    {user?.is_admin ? "Admin" : "Student"} • TUM Heilbronn
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            {/* hero stats */}
            <div className='grid grid-cols-3 gap-4 w-full md:w-auto'>
              <div>
                <p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
                  Channels
                </p>
                <p className='text-xl font-semibold text-primary'>
                  {stats.joinedChannels}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  joined of {stats.totalChannels}
                </p>
              </div>
              <div>
                <p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
                  Subforums
                </p>
                <p className='text-xl font-semibold text-primary'>
                  {stats.joinedSubforums}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  active communities
                </p>
              </div>
              <div>
                <p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
                  Account
                </p>
                <p className='text-xl font-semibold text-primary'>
                  {user?.is_admin ? "Admin" : "Student"}
                </p>
                <p className='text-[11px] text-muted-foreground'>
                  {user?.can_create_events ? "Events enabled" : "Standard"}
                </p>
              </div>
            </div>

            {/* hero actions */}
            <div className='flex flex-wrap gap-2 justify-start md:justify-end'>
              <Button
                className='gap-2'
                onClick={() => router.push("/channels")}>
                <Hash className='h-4 w-4' />
                Browse Channels
              </Button>
              <Button
                variant='outline'
                className='gap-2'
                onClick={() => router.push("/forums")}>
                <MessageSquare className='h-4 w-4' />
                Open Forums
              </Button>
              <Button
                variant='outline'
                className='gap-2'
                onClick={() => router.push("/wiki")}>
                <BookOpen className='h-4 w-4' />
                Visit Wiki
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SMALL STATS ROW */}
        <section className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <Card className='card-hover-glow border-border/60 bg-card/80'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Channel Reach
              </CardTitle>
              <CardDescription className='text-xs'>
                How well you&apos;re connected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={channelProgress} className='h-1.5 mb-2' />
              <p className='text-xs text-muted-foreground'>
                {stats.joinedChannels} of {stats.totalChannels} channels joined
              </p>
            </CardContent>
          </Card>

          <Card className='card-hover-glow border-border/60 bg-card/80'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Discussion Engagement
              </CardTitle>
              <CardDescription className='text-xs'>
                Joined subforums this account is part of
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-semibold text-primary'>
                {stats.joinedSubforums}
              </p>
              <p className='text-xs text-muted-foreground'>
                active communities
              </p>
            </CardContent>
          </Card>

          <Card className='card-hover-glow border-border/60 bg-card/80'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Account Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-1'>
              <p className='text-sm font-semibold text-primary'>
                {user?.is_admin ? "Admin" : "Student"}
              </p>
              <p className='text-xs text-muted-foreground'>
                {user?.can_create_events
                  ? "Can create and manage events"
                  : "Standard access"}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* MAIN GRID: big left card + right column */}
        <section className='grid gap-6 lg:grid-cols-3'>
          {/* LEFT: Activity / announcements / events */}
          <Card className='card-hover-glow border-border/60 bg-card/80 lg:col-span-2'>
            <CardHeader className='pb-3'>
              <CardTitle>What&apos;s happening</CardTitle>
              <CardDescription>
                Recent activity, announcements, and upcoming events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue='activity'>
                <TabsList className='mb-4'>
                  <TabsTrigger value='activity'>Activity</TabsTrigger>
                  <TabsTrigger value='announcements'>Announcements</TabsTrigger>
                  <TabsTrigger value='events'>Events</TabsTrigger>
                </TabsList>

                {/* Activity tab */}
                <TabsContent value='activity' className='mt-0'>
                  {activityItems.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>
                      No recent activity yet. Join channels and forums to see
                      updates here.
                    </p>
                  ) : (
                    <ScrollArea className='h-60 pr-3'>
                      <ul className='space-y-3'>
                        {activityItems.map((item) => (
                          <li
                            key={item.id}
                            className='flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2'>
                            <div className='flex items-start gap-3'>
                              <div className='mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary'>
                                {item.type === "channel" ? (
                                  <Hash className='h-4 w-4' />
                                ) : (
                                  <MessageSquare className='h-4 w-4' />
                                )}
                              </div>
                              <div>
                                <p className='text-sm font-medium'>
                                  {item.title}
                                </p>
                                <p className='text-xs text-muted-foreground'>
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <span className='text-[11px] text-muted-foreground whitespace-nowrap'>
                              {item.time}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Announcements tab */}
                <TabsContent value='announcements' className='mt-0'>
                  <ScrollArea className='h-60 pr-3'>
                    <ul className='space-y-3'>
                      {announcements.map((a) => (
                        <li
                          key={a.id}
                          className='rounded-lg border border-border/60 bg-background/40 px-3 py-3'>
                          <div className='flex items-center justify-between mb-1.5'>
                            <p className='text-sm font-medium'>{a.title}</p>
                            <Badge variant='outline' className='text-[10px]'>
                              {a.tag}
                            </Badge>
                          </div>
                          <p className='text-xs text-muted-foreground'>
                            {a.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </TabsContent>

                {/* Events tab */}
                <TabsContent value='events' className='mt-0'>
                  <ScrollArea className='h-60 pr-3'>
                    {eventsPreview.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>
                        Events will appear here once the feature is live.
                      </p>
                    ) : (
                      <ul className='space-y-3'>
                        {eventsPreview.map((e) => (
                          <li
                            key={e.id}
                            className='flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-3'>
                            <div className='mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary'>
                              <Calendar className='h-4 w-4' />
                            </div>
                            <div>
                              <p className='text-sm font-medium'>{e.title}</p>
                              <p className='text-xs text-muted-foreground'>
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

          {/* RIGHT column: Favorites + profile + channels */}
          <div className='space-y-6'>
            {/* Favorites */}
            <Card className='card-hover-glow border-border/60 bg-card/80'>
              <CardHeader className='pb-3'>
                <CardTitle>Favorites</CardTitle>
                <CardDescription>
                  Pin your most-used spaces for quick access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
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
                        className='text-xs border-border/70'
                        onClick={() => router.push(fav.href)}>
                        {fav.label}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile card */}
            <Card className='card-hover-glow border-border/60 bg-card/80'>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Account information and personal settings
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Email</span>
                  <span className='font-medium text-right'>{user?.email}</span>
                </div>
                <Separator />
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    Admin privileges
                  </span>
                  <span className='font-medium'>
                    {user?.is_admin ? "Yes" : "No"}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>
                    Can create events
                  </span>
                  <span className='font-medium'>
                    {user?.can_create_events ? "Yes" : "No"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Your Channels */}
            <Card className='card-hover-glow border-border/60 bg-card/80'>
              <CardHeader className='pb-3'>
                <CardTitle>Your Channels</CardTitle>
                <CardDescription>
                  Spaces you&apos;ve already joined (click to open, star to
                  favorite)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {myChannels.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    You haven&apos;t joined any channels yet. Browse channels to
                    get started.
                  </p>
                ) : (
                  <ScrollArea className='h-40 pr-3'>
                    <ul className='space-y-3 text-sm'>
                      {myChannels.map((ch) => {
                        const fav = isChannelFavorite(ch.id);
                        return (
                          <li
                            key={ch.id}
                            className='flex items-center justify-between gap-3 cursor-pointer rounded-md hover:bg-background/40 px-2 py-1'
                            onClick={() => router.push(`/channels/${ch.id}`)}>
                            <div className='flex items-center gap-3 min-w-0'>
                              <Avatar className='h-8 w-8'>
                                <AvatarFallback className='text-xs'>
                                  #{ch.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className='min-w-0'>
                                <p className='font-medium truncate'>
                                  #{ch.name}
                                </p>
                                {ch.description && (
                                  <p className='text-xs text-muted-foreground truncate'>
                                    {ch.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-7 w-7'
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChannelFavorite(ch);
                              }}>
                              <Star
                                className={`h-4 w-4 ${
                                  fav
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-muted-foreground"
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
              <CardHeader className='pb-3'>
                <CardTitle>Recommended Channels</CardTitle>
                <CardDescription>
                  Based on what&apos;s available on campus
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendedChannels.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>
                    You&apos;re already in all available channels or none are
                    configured yet.
                  </p>
                ) : (
                  <ScrollArea className='h-40 pr-3'>
                    <ul className='space-y-3 text-sm'>
                      {recommendedChannels.map((ch) => (
                        <li
                          key={ch.id}
                          className='flex items-center justify-between gap-3'>
                          <div className='min-w-0'>
                            <p className='font-medium truncate'>#{ch.name}</p>
                            {ch.description && (
                              <p className='text-xs text-muted-foreground truncate'>
                                {ch.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size='sm'
                            variant='outline'
                            className='text-xs'
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

        {/* QUICK LINKS (bottom) incl. Events + Calendar */}
        <Card className='card-hover-glow border-border/60 bg-card/80'>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Jump straight into the most important areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Button
                variant='outline'
                className='h-24 flex flex-col justify-center border-border/60'
                onClick={() => router.push("/forums")}>
                <MessageSquare className='h-5 w-5 mb-1' />
                Forums
                <span className='text-xs text-muted-foreground'>
                  Ask questions, get help
                </span>
              </Button>

              <Button
                variant='outline'
                className='h-24 flex flex-col justify-center border-border/60'
                onClick={() => router.push("/channels")}>
                <Hash className='h-5 w-5 mb-1' />
                Channels
                <span className='text-xs text-muted-foreground'>
                  Topics & groups
                </span>
              </Button>

              <Button
                variant='outline'
                className='h-24 flex flex-col justify-center border-border/60'
                onClick={() => router.push("/events")}>
                <Calendar className='h-5 w-5 mb-1' />
                Events
                <span className='text-xs text-muted-foreground'>
                  Campus meetups
                </span>
              </Button>

              <Button
                variant='outline'
                className='h-24 flex flex-col justify-center border-border/60'
                onClick={() => router.push("/calendar")}>
                <Calendar className='h-5 w-5 mb-1' />
                Calendar
                <span className='text-xs text-muted-foreground'>
                  Deadlines & events
                </span>
              </Button>

              <Button
                variant='outline'
                className='h-24 flex flex-col justify-center border-border/60 lg:col-span-4 lg:max-w-xs'
                onClick={() => router.push("/wiki")}>
                <BookOpen className='h-5 w-5 mb-1' />
                Wiki
                <span className='text-xs text-muted-foreground'>
                  Guides, FAQs & resources
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
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
