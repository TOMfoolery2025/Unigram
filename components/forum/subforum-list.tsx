/** @format */

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Users, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubforumCard } from "./subforum-card";
import { CreateSubforumDialog } from "./create-subforum-dialog";
import { SubforumWithMembership, SubforumFilters } from "@/types/forum";

interface SubforumListProps {
  subforums: SubforumWithMembership[];
  isLoading?: boolean;
  onJoinSubforum?: (subforumId: string) => Promise<void>;
  onLeaveSubforum?: (subforumId: string) => Promise<void>;
  onViewSubforum?: (subforumId: string) => void;
  onCreateSubforum?: (data: {
    name: string;
    description: string;
  }) => Promise<void>;
  onRefresh?: () => void;
  showCreateButton?: boolean;
}

export function SubforumList({
  subforums,
  isLoading = false,
  onJoinSubforum,
  onLeaveSubforum,
  onViewSubforum,
  onCreateSubforum,
  onRefresh,
  showCreateButton = true,
}: SubforumListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "member_count" | "created_at">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [membershipFilter, setMembershipFilter] = useState<
    "all" | "joined" | "not_joined"
  >("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and sort subforums
  const filteredAndSortedSubforums = useMemo(() => {
    let filtered = subforums;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (subforum) =>
          subforum.name.toLowerCase().includes(query) ||
          subforum.description.toLowerCase().includes(query)
      );
    }

    // Apply membership filter
    if (membershipFilter === "joined") {
      filtered = filtered.filter((subforum) => subforum.is_member);
    } else if (membershipFilter === "not_joined") {
      filtered = filtered.filter((subforum) => !subforum.is_member);
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
  }, [subforums, searchQuery, sortBy, sortOrder, membershipFilter]);

  const handleJoin = async (subforumId: string) => {
    if (!onJoinSubforum) return;

    setActionLoading(subforumId);
    try {
      await onJoinSubforum(subforumId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (subforumId: string) => {
    if (!onLeaveSubforum) return;

    setActionLoading(subforumId);
    try {
      await onLeaveSubforum(subforumId);
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
          <h1 className='text-2xl font-bold text-white'>Subforums</h1>
          <p className='text-gray-400 mt-1'>
            Join discussions on topics that interest you
          </p>
        </div>
        {showCreateButton && onCreateSubforum && (
          <CreateSubforumDialog onCreateSubforum={onCreateSubforum} />
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
                placeholder='Search subforums...'
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
                <option value='all'>All Subforums</option>
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
            : `${filteredAndSortedSubforums.length} subforum${
                filteredAndSortedSubforums.length !== 1 ? "s" : ""
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

      {/* Subforum Grid */}
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
      ) : filteredAndSortedSubforums.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredAndSortedSubforums.map((subforum) => (
            <SubforumCard
              key={subforum.id}
              subforum={subforum}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onView={onViewSubforum}
              isLoading={actionLoading === subforum.id}
            />
          ))}
        </div>
      ) : (
        <Card className='bg-gray-800 border-gray-700'>
          <CardContent className='p-12 text-center'>
            <div className='space-y-4'>
              <div className='mx-auto w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center'>
                <Users className='h-6 w-6 text-gray-400' />
              </div>
              <div>
                <h3 className='text-lg font-medium text-white'>
                  No subforums found
                </h3>
                <p className='text-gray-400 mt-1'>
                  {searchQuery.trim()
                    ? "Try adjusting your search or filters"
                    : "Be the first to create a subforum for your community"}
                </p>
              </div>
              {!searchQuery.trim() && showCreateButton && onCreateSubforum && (
                <CreateSubforumDialog
                  onCreateSubforum={onCreateSubforum}
                  trigger={
                    <Button className='bg-violet-600 hover:bg-violet-700'>
                      Create First Subforum
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
