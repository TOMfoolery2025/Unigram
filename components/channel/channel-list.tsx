/** @format */

"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Hash, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelCard } from "./channel-card";
import { CreateChannelDialog } from "./create-channel-dialog";
import { ChannelWithMembership } from "@/types/channel";

interface ChannelListProps {
  channels: ChannelWithMembership[];
  isLoading?: boolean;
  onJoinChannel?: (channelId: string, pinCode?: string) => Promise<void>;
  onLeaveChannel?: (channelId: string) => Promise<void>;
  onViewChannel?: (channelId: string) => void;
  onCreateChannel?: (data: {
    name: string;
    description: string;
    access_type: "public" | "pin";
    pin_code?: string;
  }) => Promise<void>;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export function ChannelList({
  channels,
  isLoading = false,
  onJoinChannel,
  onLeaveChannel,
  onViewChannel,
  onCreateChannel,
  onRefresh,
  isAdmin = false,
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "member_count" | "created_at">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [membershipFilter, setMembershipFilter] = useState<
    "all" | "joined" | "not_joined"
  >("all");
  const [officialFilter, setOfficialFilter] = useState<
    "all" | "official" | "non_official"
  >("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ------- FILTER + SORT -------
  const filteredAndSortedChannels = useMemo(() => {
    let filtered = channels;

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (channel) =>
          channel.name.toLowerCase().includes(q) ||
          (channel.description || "").toLowerCase().includes(q)
      );
    }

    // membership filter
    if (membershipFilter === "joined") {
      filtered = filtered.filter((c) => c.is_member);
    } else if (membershipFilter === "not_joined") {
      filtered = filtered.filter((c) => !c.is_member);
    }

    // official/non-official filter
    if (officialFilter === "official") {
      filtered = filtered.filter((c) => (c as any).access_type !== "pin");
    } else if (officialFilter === "non_official") {
      filtered = filtered.filter((c) => (c as any).access_type === "pin");
    }

    // sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "member_count":
          aVal = a.member_count;
          bVal = b.member_count;
          break;
        case "created_at":
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });

    return filtered;
  }, [channels, searchQuery, sortBy, sortOrder, membershipFilter, officialFilter]);

  // ------- HANDLERS -------
  const handleJoin = async (channelId: string, pinCode?: string) => {
    if (!onJoinChannel) return;
    setActionLoading(channelId);
    try {
      await onJoinChannel(channelId, pinCode);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (channelId: string) => {
    if (!onLeaveChannel) return;
    setActionLoading(channelId);
    try {
      await onLeaveChannel(channelId);
    } finally {
      setActionLoading(null);
    }
  };

  const getSortButtonText = () => {
    const dir = sortOrder === "asc" ? "↑" : "↓";
    switch (sortBy) {
      case "name":
        return `Name ${dir}`;
      case "member_count":
        return `Members ${dir}`;
      case "created_at":
        return `Date ${dir}`;
      default:
        return "Sort";
    }
  };

  const cycleSorting = () => {
    if (sortBy === "created_at") {
      setSortBy("name");
      setSortOrder("asc");
    } else if (sortBy === "name") {
      setSortBy("member_count");
      setSortOrder("desc");
    } else {
      setSortBy("created_at");
      setSortOrder("desc");
    }
  };

  // ------- RENDER -------
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div>
          <h1 className='text-2xl md:text-2xl font-bold text-white flex items-center gap-2'>
            <span className='inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <Hash className='h-4 w-4' />
            </span>
            <span>Official Clusters</span>
          </h1>
          <p className='mt-1 text-sm md:text-base text-muted-foreground max-w-xl'>
            Join curated clusters for sports teams, clubs, and key campus
            activities.
          </p>
        </div>

        {isAdmin && onCreateChannel && (
          <CreateChannelDialog
            onCreateChannel={onCreateChannel}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Search + Filters */}
      <Card className='card-hover-glow border-border/60 bg-card/90'>
        <CardContent className='p-4 md:p-5'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            {/* search */}
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search clusters...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 bg-background/60 border-border/60 text-sm'
              />
            </div>

            {/* filters */}
            <div className='flex gap-2 flex-wrap md:flex-nowrap'>
              <Button
                variant='outline'
                size='sm'
                onClick={cycleSorting}
                className='border-border/60 text-xs md:text-sm text-muted-foreground hover:bg-background/80'>
                <Filter className='h-4 w-4 mr-2' />
                {getSortButtonText()}
              </Button>

              <select
                value={membershipFilter}
                onChange={(e) =>
                  setMembershipFilter(
                    e.target.value as "all" | "joined" | "not_joined"
                  )
                }
                className='px-3 py-2 text-xs md:text-sm rounded-md bg-background/70 border border-border/60 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60'>
                <option value='all'>All clusters</option>
                <option value='joined'>Joined</option>
                <option value='not_joined'>Not Joined</option>
              </select>

              <select
                value={officialFilter}
                onChange={(e) =>
                  setOfficialFilter(
                    e.target.value as "all" | "official" | "non_official"
                  )
                }
                className='px-3 py-2 text-xs md:text-sm rounded-md bg-background/70 border border-border/60 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60'>
                <option value='all'>All types</option>
                <option value='official'>Official only</option>
                <option value='non_official'>Non-official only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary + Refresh */}
      <div className='flex items-center justify-between text-xs md:text-sm text-muted-foreground'>
        <span>
          {isLoading
            ? "Loading..."
            : `${filteredAndSortedChannels.length} cluster${
                filteredAndSortedChannels.length === 1 ? "" : "s"
              }`}
        </span>
        {onRefresh && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onRefresh}
            disabled={isLoading}
            className='h-7 px-2 text-[11px] md:text-xs text-muted-foreground hover:text-foreground'>
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              "Refresh"
            )}
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2'>
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className='border-border/60 bg-card/80 animate-pulse h-full'>
              <CardContent className='p-6 space-y-3'>
                <div className='h-4 bg-background/60 rounded w-3/4' />
                <div className='h-3 bg-background/60 rounded w-full' />
                <div className='h-3 bg-background/60 rounded w-2/3' />
                <div className='flex justify-between items-center pt-3'>
                  <div className='h-3 bg-background/60 rounded w-1/4' />
                  <div className='h-8 bg-background/60 rounded w-16' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedChannels.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2'>
          {filteredAndSortedChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onJoin={handleJoin} // <-- now properly supports PIN
              onLeave={handleLeave}
              onView={onViewChannel}
              isLoading={actionLoading === channel.id}
            />
          ))}
        </div>
      ) : (
        <Card className='card-hover-glow border-border/60 bg-card/90'>
          <CardContent className='p-12 text-center space-y-4'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background/70'>
              <Hash className='h-6 w-6 text-muted-foreground' />
            </div>
            <div>
              <h3 className='text-base md:text-lg font-medium text-foreground'>
                No clusters found
              </h3>
              <p className='mt-1 text-xs md:text-sm text-muted-foreground'>
                {searchQuery.trim()
                  ? "Try adjusting your search or filters."
                  : isAdmin
                  ? "Create the first official cluster for your community."
                  : "No official clusters have been created yet."}
              </p>
            </div>

            {!searchQuery.trim() && isAdmin && onCreateChannel && (
              <CreateChannelDialog
                onCreateChannel={onCreateChannel}
                isAdmin={isAdmin}
                trigger={
                  <Button className='bg-primary hover:bg-primary/90'>
                    Create First Cluster
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
