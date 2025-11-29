/** @format */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PostWithAuthor } from "@/types/forum";
import { PostCard } from "./post-card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostFeedListProps {
  posts: PostWithAuthor[];
  isLoading?: boolean;
  onVote: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
  onViewPost?: (postId: string) => void;
  currentUserId?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
  onAddToPlaylist?: (postId: string) => void;
}

export function PostFeedList({
  posts,
  isLoading = false,
  onVote,
  onViewPost,
  currentUserId,
  hasMore = false,
  onLoadMore,
  className,
  onAddToPlaylist,
}: PostFeedListProps) {
  const router = useRouter();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Handle post view navigation
  const handleViewPost = useCallback(
    (postId: string) => {
      if (onViewPost) {
        onViewPost(postId);
      } else {
        // Default navigation to post detail page
        const post = posts.find((p) => p.id === postId);
        if (post) {
          router.push(`/hives/${post.subforum_id}/posts/${postId}`);
        }
      }
    },
    [onViewPost, posts, router]
  );

  // Infinite scroll implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Empty state
  if (!isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No posts found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          There are no posts to display. Try joining some subhives or adjusting
          your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Loading skeleton for initial load */}
      {isLoading && posts.length === 0 && (
        <>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`rounded-lg border border-border/70 bg-card p-6 animate-pulse animate-slide-in-up stagger-${i + 1}`}
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted animate-shimmer" />
                  <div className="h-4 w-8 rounded bg-muted animate-shimmer" />
                  <div className="h-6 w-6 rounded-full bg-muted animate-shimmer" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-3/4 animate-shimmer" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-shimmer" />
                  <div className="h-16 bg-muted rounded animate-shimmer" />
                  <div className="h-4 bg-muted rounded w-1/4 animate-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Post list */}
      {posts.map((post, index) => (
        <div 
          key={post.id}
          className={`animate-slide-in-up ${index < 5 ? `stagger-${index + 1}` : ''}`}
        >
          <PostCard
            post={post}
            onVote={onVote}
            onView={handleViewPost}
            showSubforum={true}
            canEdit={currentUserId === post.author_id}
            canDelete={currentUserId === post.author_id}
            onAddToPlaylist={onAddToPlaylist}
          />
        </div>
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-4 animate-fade-in">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Loading more indicator */}
      {isLoading && posts.length > 0 && (
        <div className="flex justify-center py-4 animate-pulse-subtle">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
