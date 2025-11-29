/** @format */

"use client";

import { useState, useMemo } from "react";
import { Loader2, TrendingUp, Clock, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "./post-card";
import { CreatePostDialog } from "./create-post-dialog";
import { PostWithAuthor } from "@/types/forum";

interface PostListProps {
  posts: PostWithAuthor[];
  isLoading?: boolean;
  onVote?: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
  onViewPost?: (postId: string) => void;
  onEditPost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onCreatePost?: (data: {
    title: string;
    content: string;
    is_anonymous: boolean;
  }) => Promise<void>;
  onRefresh?: () => void;
  showCreateButton?: boolean;
  showSubforum?: boolean;
  subforumId?: string;
  currentUserId?: string;
}

export function PostList({
  posts,
  isLoading = false,
  onVote,
  onViewPost,
  onEditPost,
  onDeletePost,
  onCreatePost,
  onRefresh,
  showCreateButton = true,
  showSubforum = false,
  subforumId,
  currentUserId,
}: PostListProps) {
  const [sortBy, setSortBy] = useState<
    "created_at" | "vote_count" | "updated_at"
  >("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---------- SORTED POSTS ----------
  const sortedPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case "vote_count":
          aValue = a.vote_count ?? 0;
          bValue = b.vote_count ?? 0;
          break;
        case "updated_at":
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (sortOrder === "asc") {
        return aValue - bValue;
      }
      return bValue - aValue;
    });

    return sorted;
  }, [posts, sortBy, sortOrder]);

  const handleVote = async (
    postId: string,
    voteType: "upvote" | "downvote"
  ) => {
    if (!onVote) return;

    setActionLoading(postId);
    try {
      await onVote(postId, voteType);
    } finally {
      setActionLoading(null);
    }
  };

  const getSortButtonText = () => {
    const direction = sortOrder === "asc" ? "↑" : "↓";
    switch (sortBy) {
      case "vote_count":
        return `Hot ${direction}`;
      case "updated_at":
        return `Active ${direction}`;
      case "created_at":
      default:
        return `New ${direction}`;
    }
  };

  const cycleSorting = () => {
    // New → Hot → Active → New (all desc by default)
    if (sortBy === "created_at") {
      setSortBy("vote_count");
      setSortOrder("desc");
    } else if (sortBy === "vote_count") {
      setSortBy("updated_at");
      setSortOrder("desc");
    } else {
      setSortBy("created_at");
      setSortOrder("desc");
    }
  };

  const getSortIcon = () => {
    switch (sortBy) {
      case "vote_count":
        return <TrendingUp className='h-4 w-4' />;
      case "updated_at":
        return <MessageSquare className='h-4 w-4' />;
      case "created_at":
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const totalLabel =
    sortedPosts.length === 1 ? "1 post" : `${sortedPosts.length} posts`;

  // ---------- RENDER ----------
  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* HEADER */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-lg md:text-xl font-semibold text-foreground'>
            Posts
          </h2>
          <p className='text-xs md:text-sm text-muted-foreground mt-1'>
            {isLoading
              ? "Loading posts..."
              : `${posts.length} post${
                  posts.length !== 1 ? "s" : ""
                } in this hive`}
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          {showCreateButton && onCreatePost && subforumId && (
            <CreatePostDialog
              onCreatePost={onCreatePost}
              subforumId={subforumId}
            />
          )}

          {onRefresh && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              disabled={isLoading}
              className='border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 min-h-[44px] px-4'>
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                "Refresh"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* SORT BAR */}
      <Card className='card-hover-glow border-border/60 bg-card/90'>
        <CardContent className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-4'>
          <div className='flex items-center gap-2 text-xs md:text-sm'>
            <span className='text-muted-foreground'>Sort by:</span>
            <Button
              variant='outline'
              size='sm'
              onClick={cycleSorting}
              className='gap-2 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60 min-h-[44px] px-4'>
              {getSortIcon()}
              <span>{getSortButtonText()}</span>
            </Button>
          </div>
          <span className='text-xs text-muted-foreground'>{totalLabel}</span>
        </CardContent>
      </Card>

      {/* LIST / STATES */}
      {isLoading ? (
        <div className='space-y-4'>
          {[0, 1, 2].map((i) => (
            <Card key={i} className='border-border/60 bg-card/80 animate-pulse'>
              <CardContent className='p-5 space-y-3'>
                <div className='h-5 w-3/4 rounded bg-muted' />
                <div className='h-4 w-1/2 rounded bg-muted' />
                <div className='h-16 w-full rounded bg-muted' />
                <div className='flex justify-between'>
                  <div className='h-8 w-24 rounded bg-muted' />
                  <div className='h-4 w-20 rounded bg-muted' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedPosts.length > 0 ? (
        <div className='space-y-4'>
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={handleVote}
              onView={onViewPost}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              showSubforum={showSubforum}
              isLoading={actionLoading === post.id}
              canEdit={currentUserId === post.author_id}
              canDelete={currentUserId === post.author_id}
            />
          ))}
        </div>
      ) : (
        <Card className='card-hover-glow border-border/60 bg-card/90'>
          <CardContent className='py-10 text-center space-y-4'>
            <div className='mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted/70'>
              <MessageSquare className='h-5 w-5 text-muted-foreground' />
            </div>
            <div>
              <h3 className='text-base md:text-lg font-medium text-foreground'>
                No posts yet
              </h3>
              <p className='mt-1 text-xs md:text-sm text-muted-foreground'>
                Be the first to start a discussion in this hive.
              </p>
            </div>
            {showCreateButton && onCreatePost && subforumId && (
              <CreatePostDialog
                onCreatePost={onCreatePost}
                subforumId={subforumId}
                trigger={
                  <Button className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    Create first post
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
