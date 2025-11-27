/** @format */

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Hash, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelCard } from "./channel-card";
import { CreateChannelDialog } from "./create-channel-dialog";
import { ChannelWithMembership, ChannelFilters } from "@/types/channel";

interface ChannelListProps {
  channels: ChannelWithMembership[];
  isLoading?: boolean;
  onJoinChannel?: (channelId: string) => Promise<void>;
  onLeaveChannel?: (channelId: string) => Promise<void>;
  onViewChannel?: (channelId: string) => void;
  onCreateChannel?: (data: {
    name: string;
    description: string;
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and sort channels
  const filteredAndSortedChannels = useMemo(() => {
    let filtered = channels;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (channel) =>
          channel.name.toLowerCase().includes(query) ||
          channel.description.toLowerCase().includes(query)
      );
    }

    // Apply membership filter
    if (membershipFilter === "joined") {
      filtered = filtered.filter((channel) => channel.is_member);
    } else if (membershipFilter === "not_joined") {
      filtered = filtered.filter((channel) => !channel.is_member);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "member_count":
          aValue = a.member_count;
          bValue = b.member_count;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [channels, searchQuery, sortBy, sortOrder, membershipFilter]);

  const handleJoin = async (channelId: string) => {
    if (!onJoinChannel) return;

    setActionLoading(channelId);
    try {
      await onJoinChannel(channelId);
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
    const direction = sortOrder === "asc" ? "↑" : "↓";
    switch (sortBy) {
      case "name":
        return `Name ${direction}`;
      case "member_count":
        return `Members ${direction}`;
      case "created_at":
        return `Date ${direction}`;
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
            <Hash className='h-6 w-6 text-violet-400' />
            Official Channels
          </h1>
          <p className='text-gray-400 mt-1'>
            Join official channels for sports teams, clubs, and activities
          </p>
        </div>
        {isAdmin && onCreateChannel && (
          <CreateChannelDialog
            onCreateChannel={onCreateChannel}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Search and Filters */}
      <Card className='bg-gray-800 border-gray-700'>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* Search */}
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search channels...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400'
              />
            </div>

            {/* Filters */}
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={cycleSorting}
                className='border-gray-600 text-gray-300 hover:bg-gray-700'>
                <Filter className='h-4 w-4 mr-2' />
                {getSortButtonText()}
              </Button>

              <select
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value as any)}
                className='px-3 py-1 text-sm rounded-md bg-gray-700 border border-gray-600 text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500'>
                <option value='all'>All Channels</option>
                <option value='joined'>Joined</option>
                <option value='not_joined'>Not Joined</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className='flex items-center justify-between text-sm text-gray-400'>
        <span>
          {isLoading
            ? "Loading..."
            : `${filteredAndSortedChannels.length} channel${
                filteredAndSortedChannels.length !== 1 ? "s" : ""
              }`}
        </span>
        {onRefresh && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onRefresh}
            disabled={isLoading}
            className='text-gray-400 hover:text-white'>
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              "Refresh"
            )}
          </Button>
        )}
      </div>

      {/* Channel Grid */}
      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className='bg-gray-800 border-gray-700 animate-pulse'>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <div className='h-4 bg-gray-700 rounded w-3/4'></div>
                  <div className='h-3 bg-gray-700 rounded w-full'></div>
                  <div className='h-3 bg-gray-700 rounded w-2/3'></div>
                  <div className='flex justify-between items-center mt-4'>
                    <div className='h-3 bg-gray-700 rounded w-1/4'></div>
                    <div className='h-8 bg-gray-700 rounded w-16'></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedChannels.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredAndSortedChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onView={onViewChannel}
              isLoading={actionLoading === channel.id}
            />
          ))}
        </div>
      ) : (
        <Card className='bg-gray-800 border-gray-700'>
          <CardContent className='p-12 text-center'>
            <div className='space-y-4'>
              <div className='mx-auto w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center'>
                <Hash className='h-6 w-6 text-gray-400' />
              </div>
              <div>
                <h3 className='text-lg font-medium text-white'>
                  No channels found
                </h3>
                <p className='text-gray-400 mt-1'>
                  {searchQuery.trim()
                    ? "Try adjusting your search or filters"
                    : isAdmin
                    ? "Create the first official channel for your community"
                    : "No official channels have been created yet"}
                </p>
              </div>
              {!searchQuery.trim() && isAdmin && onCreateChannel && (
                <CreateChannelDialog
                  onCreateChannel={onCreateChannel}
                  isAdmin={isAdmin}
                  trigger={
                    <Button className='bg-violet-600 hover:bg-violet-700'>
                      Create First Channel
                    </Button>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
