/** @format */

"use client";

import { useState, useMemo } from "react";
import {
  Filter,
  Loader2,
  TrendingUp,
  Clock,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostCard } from "./post-card";
import { CreatePostDialog } from "./create-post-dialog";
import { PostWithAuthor, PostFilters } from "@/types/forum";

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

  // Sort posts based on current sorting criteria
  const sortedPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "vote_count":
          aValue = a.vote_count;
          bValue = b.vote_count;
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
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
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
        return `New ${direction}`;
      default:
        return "Sort";
    }
  };

  const cycleSorting = () => {
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-white'>Posts</h2>
          <p className='text-gray-400 mt-1'>
            {isLoading
              ? "Loading posts..."
              : `${posts.length} post${posts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className='flex gap-2'>
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
              className='border-gray-600 text-gray-300 hover:bg-gray-800'>
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                "Refresh"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Sorting Controls */}
      <Card className='bg-gray-800 border-gray-700'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-400'>Sort by:</span>
              <Button
                variant='outline'
                size='sm'
                onClick={cycleSorting}
                className='border-gray-600 text-gray-300 hover:bg-gray-700'>
                {getSortIcon()}
                <span className='ml-2'>{getSortButtonText()}</span>
              </Button>
            </div>

            <div className='text-sm text-gray-400'>
              {sortedPosts.length} post{sortedPosts.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {isLoading ? (
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className='bg-gray-800 border-gray-700 animate-pulse'>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <div className='h-5 bg-gray-700 rounded w-3/4'></div>
                  <div className='h-4 bg-gray-700 rounded w-1/2'></div>
                  <div className='h-16 bg-gray-700 rounded w-full'></div>
                  <div className='flex justify-between items-center'>
                    <div className='flex gap-4'>
                      <div className='h-8 bg-gray-700 rounded w-16'></div>
                      <div className='h-8 bg-gray-700 rounded w-20'></div>
                    </div>
                    <div className='h-4 bg-gray-700 rounded w-24'></div>
                  </div>
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
        <Card className='bg-gray-800 border-gray-700'>
          <CardContent className='p-12 text-center'>
            <div className='space-y-4'>
              <div className='mx-auto w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center'>
                <MessageSquare className='h-6 w-6 text-gray-400' />
              </div>
              <div>
                <h3 className='text-lg font-medium text-white'>No posts yet</h3>
                <p className='text-gray-400 mt-1'>
                  Be the first to start a discussion in this subforum
                </p>
              </div>
              {showCreateButton && onCreatePost && subforumId && (
                <CreatePostDialog
                  onCreatePost={onCreatePost}
                  subforumId={subforumId}
                  trigger={
                    <Button className='bg-violet-600 hover:bg-violet-700'>
                      Create First Post
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
