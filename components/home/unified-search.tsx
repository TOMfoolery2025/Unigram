"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, MessageSquare, Hash, Users, Calendar, X } from "lucide-react"
import { getChannels } from "@/lib/channel"
import { searchSubforums } from "@/lib/forum"
import { searchUsers } from "@/lib/profile/profiles"
import { getEvents } from "@/lib/event/events"
import { generateAvatarUrl } from "@/components/profile/user-avatar"
import { cn } from "@/lib/utils"

interface UnifiedSearchProps {
  userId?: string
  className?: string
}

type SearchTab = "forums" | "channels" | "friends" | "events"

export function UnifiedSearch({ userId, className }: UnifiedSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<SearchTab>("forums")
  const [isSearching, setIsSearching] = useState(false)

  // Results
  const [forumResults, setForumResults] = useState<any[]>([])
  const [channelResults, setChannelResults] = useState<any[]>([])
  const [friendResults, setFriendResults] = useState<any[]>([])
  const [eventResults, setEventResults] = useState<any[]>([])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setForumResults([])
      setChannelResults([])
      setFriendResults([])
      setEventResults([])
      return
    }

    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    try {
      const [forums, channels, friends, events] = await Promise.all([
        searchSubforums(searchQuery),
        getChannels({ search: searchQuery }, userId),
        searchUsers(searchQuery, userId),
        getEvents({ searchQuery }, userId),
      ])

      setForumResults(forums.data || [])
      setChannelResults(channels.data || [])
      setFriendResults(friends.data || [])
      setEventResults(events.data || [])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setQuery("")
    setForumResults([])
    setChannelResults([])
    setFriendResults([])
    setEventResults([])
  }

  const getResultCount = (tab: SearchTab) => {
    switch (tab) {
      case "forums":
        return forumResults.length
      case "channels":
        return channelResults.length
      case "friends":
        return friendResults.length
      case "events":
        return eventResults.length
      default:
        return 0
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search forums, channels, friends, or events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-sm bg-background/80 border-border/60"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results */}
      {query.trim() && (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="forums" className="text-xs sm:text-sm gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Forums
                  {getResultCount("forums") > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {getResultCount("forums")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="channels" className="text-xs sm:text-sm gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Channels
                  {getResultCount("channels") > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {getResultCount("channels")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="friends" className="text-xs sm:text-sm gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Friends
                  {getResultCount("friends") > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {getResultCount("friends")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs sm:text-sm gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Events
                  {getResultCount("events") > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                      {getResultCount("events")}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Forums Tab */}
              <TabsContent value="forums" className="mt-0">
                {isSearching ? (
                  <SearchSkeleton />
                ) : forumResults.length === 0 ? (
                  <EmptyState message="No forums found" />
                ) : (
                  <div className="space-y-2">
                    {forumResults.map((forum) => (
                      <button
                        key={forum.id}
                        onClick={() => router.push(`/forums/${forum.id}`)}
                        className="w-full text-left p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-background/60 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{forum.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {forum.description}
                            </p>
                            {forum.member_count !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {forum.member_count} members
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Channels Tab */}
              <TabsContent value="channels" className="mt-0">
                {isSearching ? (
                  <SearchSkeleton />
                ) : channelResults.length === 0 ? (
                  <EmptyState message="No channels found" />
                ) : (
                  <div className="space-y-2">
                    {channelResults.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => router.push(`/channels/${channel.id}`)}
                        className="w-full text-left p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-background/60 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0">
                            <Hash className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">#{channel.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {channel.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Friends Tab */}
              <TabsContent value="friends" className="mt-0">
                {isSearching ? (
                  <SearchSkeleton />
                ) : friendResults.length === 0 ? (
                  <EmptyState message="No users found" />
                ) : (
                  <div className="space-y-2">
                    {friendResults.map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => router.push(`/profile/${friend.id}`)}
                        className="w-full text-left p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-background/60 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage
                              src={friend.avatar_url || generateAvatarUrl(friend.id)}
                              alt={friend.display_name || "User"}
                            />
                            <AvatarFallback>
                              {(friend.display_name || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {friend.display_name || "Anonymous User"}
                            </p>
                            {friend.bio && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {friend.bio}
                              </p>
                            )}
                            {friend.interests && friend.interests.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {friend.interests.slice(0, 3).map((interest: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {interest}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="mt-0">
                {isSearching ? (
                  <SearchSkeleton />
                ) : eventResults.length === 0 ? (
                  <EmptyState message="No events found" />
                ) : (
                  <div className="space-y-2">
                    {eventResults.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="w-full text-left p-3 rounded-lg border border-border/60 bg-background/40 hover:bg-background/60 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary flex-shrink-0">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                              {event.date && (
                                <span>
                                  {new Date(event.date).toLocaleDateString()}
                                </span>
                              )}
                              {event.location && (
                                <>
                                  <span>•</span>
                                  <span>{event.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-border/60 bg-background/40">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Try a different search term
      </p>
    </div>
  )
}
