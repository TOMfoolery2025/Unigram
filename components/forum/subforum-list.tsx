/** @format */

"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Users, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubforumCard } from "./subforum-card";
import { CreateSubforumDialog } from "./create-subforum-dialog";
import { SubforumWithMembership } from "@/types/forum";

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

  // -------- FILTER + SORT --------
  const filteredAndSortedSubforums = useMemo(() => {
    let filtered = [...subforums];

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sf) =>
          sf.name.toLowerCase().includes(q) ||
          (sf.description || "").toLowerCase().includes(q)
      );
    }

    // membership filter
    if (membershipFilter === "joined") {
      filtered = filtered.filter((sf) => sf.is_member);
    } else if (membershipFilter === "not_joined") {
      filtered = filtered.filter((sf) => !sf.is_member);
    }

    // sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
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
    const arrow = sortOrder === "asc" ? "↑" : "↓";
    switch (sortBy) {
      case "name":
        return `Name ${arrow}`;
      case "member_count":
        return `Members ${arrow}`;
      case "created_at":
      default:
        return `Date ${arrow}`;
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

  // -------- UI --------
  return (
    <div className='space-y-6'>
      {/* HEADER */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-primary'>Hives</h1>
          <p className='mt-1 text-sm md:text-base text-muted-foreground max-w-xl'>
            Join discussions on topics that interest you. Hives you join will
            show up more prominently in your dashboard and activity feed.
          </p>
        </div>

        {showCreateButton && onCreateSubforum && (
          <CreateSubforumDialog
            onCreateSubforum={onCreateSubforum}
            trigger={
              <Button className='gap-2 shadow-[0_0_30px_rgba(139,92,246,0.6)]'>
                <Users className='h-4 w-4' />
                Create Hive
              </Button>
            }
          />
        )}
      </div>

      {/* SEARCH + FILTERS */}
      <Card className='card-hover-glow border-border/60 bg-card/90'>
        <CardContent className='pt-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            {/* Search */}
            <div className='relative w-full md:max-w-xl'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search hives...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 bg-background/60 border-border/60 text-foreground placeholder:text-muted-foreground'
              />
            </div>

            {/* sort + membership filter */}
            <div className='flex flex-wrap items-center gap-2 justify-end'>
              <Button
                variant='outline'
                size='sm'
                onClick={cycleSorting}
                className='gap-2 border-border/60 text-sm text-foreground/90 hover:bg-background/70'>
                <Filter className='h-4 w-4' />
                {getSortButtonText()}
              </Button>

              <select
                value={membershipFilter}
                onChange={(e) =>
                  setMembershipFilter(
                    e.target.value as "all" | "joined" | "not_joined"
                  )
                }
                className='h-9 rounded-md border border-border/60 bg-background/70 px-3 text-xs md:text-sm text-foreground/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/60'>
                <option value='all'>All hives</option>
                <option value='joined'>Joined</option>
                <option value='not_joined'>Not Joined</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY + REFRESH */}
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>
          {isLoading
            ? "Loading hives…"
            : `${filteredAndSortedSubforums.length} hive${
                filteredAndSortedSubforums.length === 1 ? "" : "s"
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

      {/* GRID */}
      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className='border-border/60 bg-card/80 animate-pulse'>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <div className='h-4 bg-muted rounded w-3/4' />
                  <div className='h-3 bg-muted rounded w-full' />
                  <div className='h-3 bg-muted rounded w-2/3' />
                  <div className='mt-4 flex items-center justify-between'>
                    <div className='h-3 bg-muted rounded w-1/4' />
                    <div className='h-8 bg-muted rounded w-16' />
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
        <Card className='card-hover-glow border-border/60 bg-card/90'>
          <CardContent className='p-12 text-center space-y-4'>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/40'>
              <Users className='h-6 w-6 text-muted-foreground' />
            </div>
            <div>
              <h3 className='text-base md:text-lg font-medium text-foreground'>
                No hives found
              </h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                {searchQuery.trim()
                  ? "Try adjusting your search or filters."
                  : "Be the first to create a space for your community."}
              </p>
            </div>

            {!searchQuery.trim() && showCreateButton && onCreateSubforum && (
              <CreateSubforumDialog
                onCreateSubforum={onCreateSubforum}
                trigger={
                  <Button className='gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_25px_rgba(139,92,246,0.7)]'>
                    <Users className='h-4 w-4' />
                    Create First Hive
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
