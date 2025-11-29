/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Calendar,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  BookmarkPlus,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostWithAuthor } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";
import { VoteButtons } from "./vote-buttons";
import { UserAvatar } from "@/components/profile/user-avatar";

interface PostCardProps {
  post: PostWithAuthor;
  onVote?: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
  onView?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  showSubforum?: boolean;
  isLoading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onAddToPlaylist?: (postId: string) => void;
}

export function PostCard({
  post,
  onVote,
  onView,
  onEdit,
  onDelete,
  showSubforum = false,
  isLoading = false,
  canEdit = false,
  canDelete = false,
  onAddToPlaylist,
}: PostCardProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [postImages, setPostImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  // Load post images
  useEffect(() => {
    const loadImages = async () => {
      try {
        const { getPostImages } = await import('@/lib/storage/post-images');
        const { data } = await getPostImages(post.id);
        if (data) {
          setPostImages(data);
        }
      } catch (error) {
        console.error('Failed to load post images:', error);
      } finally {
        setImagesLoading(false);
      }
    };
    loadImages();
  }, [post.id]);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (onVote) {
      await onVote(post.id, voteType);
    }
  };

  const truncateContent = (content: string, maxLength = 220) =>
    content.length <= maxLength
      ? content
      : content.slice(0, maxLength).trimEnd() + "…";

  const authorName = post.is_anonymous
    ? "Anonymous"
    : post.author_name || "Unknown user";

  const createdLabel = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  const editedLabel =
    post.updated_at && post.updated_at !== post.created_at
      ? formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })
      : null;

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.is_anonymous && post.author_id) {
      router.push(`/profile/${post.author_id}`);
    }
  };

  return (
    <Card className='card-hover-glow border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 animate-slide-in-up'>
      <CardHeader className='pb-3'>
        <div className='flex items-start gap-3'>
          {/* Vote column */}
          <div className='pt-1'>
            <VoteButtons
              voteCount={post.vote_count}
              userVote={post.user_vote}
              onVote={handleVote}
              disabled={isLoading}
              size='sm'
              orientation='vertical'
            />
          </div>

          {/* Main content */}
          <div className='flex-1 space-y-2'>
            <div
              className='cursor-pointer space-y-1'
              onClick={() => onView?.(post.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onView?.(post.id);
                }
              }}
              aria-label={`View post: ${post.title}`}>
              <h3 className='text-base md:text-lg font-semibold text-foreground hover:text-orange-500 transition-colors duration-200 line-clamp-2'>
                {post.title}
              </h3>

              <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                <span 
                  className={`inline-flex items-center gap-1.5 ${!post.is_anonymous && post.author_id ? 'cursor-pointer hover:text-orange-500 transition-colors' : ''}`}
                  onClick={handleAuthorClick}
                >
                  {!post.is_anonymous && post.author_id ? (
                    <UserAvatar
                      userId={post.author_id}
                      displayName={post.author_name}
                      size="sm"
                      className="h-5 w-5"
                    />
                  ) : (
                    <User className='h-3.5 w-3.5' />
                  )}
                  <span className='font-medium'>{authorName}</span>
                </span>

                <span className='inline-flex items-center gap-1.5'>
                  <Calendar className='h-3.5 w-3.5' />
                  <span>{createdLabel}</span>
                </span>

                {showSubforum && post.subforum_name && (
                  <span className='rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-500'>
                    {post.subforum_name}
                  </span>
                )}

                {editedLabel && (
                  <span className='text-[11px] text-muted-foreground/70'>
                    • edited {editedLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions dropdown */}
          {(canEdit || canDelete || onAddToPlaylist) && (
            <div className='relative ml-2'>
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500'
                onClick={() => setShowActions((v) => !v)}
                aria-label="Post actions"
                aria-expanded={showActions}>
                <MoreHorizontal className='h-4 w-4' />
              </Button>

              {showActions && (
                <div className='absolute right-0 top-8 z-10 min-w-[160px] rounded-md border border-border/70 bg-popover shadow-lg'>
                  {onAddToPlaylist && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full justify-start px-3 text-xs text-foreground hover:bg-muted/60'
                      onClick={() => {
                        onAddToPlaylist(post.id);
                        setShowActions(false);
                      }}>
                      <BookmarkPlus className='mr-2 h-4 w-4' />
                      Save to playlist
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full justify-start px-3 text-xs text-foreground hover:bg-muted/60'
                      onClick={() => {
                        onEdit?.(post.id);
                        setShowActions(false);
                      }}>
                      <Edit className='mr-2 h-4 w-4' />
                      Edit post
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full justify-start px-3 text-xs text-destructive hover:bg-destructive/10'
                      onClick={() => {
                        onDelete?.(post.id);
                        setShowActions(false);
                      }}>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div
          className='cursor-pointer text-sm leading-relaxed text-muted-foreground hover:text-foreground transition-colors duration-200 mb-3'
          onClick={() => onView?.(post.id)}>
          {truncateContent(post.content)}
        </div>

        {/* Post Images */}
        {!imagesLoading && postImages.length > 0 && (
          <div className={`grid gap-2 mb-3 ${
            postImages.length === 1 ? 'grid-cols-1' :
            postImages.length === 2 ? 'grid-cols-2' :
            postImages.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {postImages.slice(0, 4).map((image, index) => (
              <div
                key={image.id}
                className='relative cursor-pointer overflow-hidden rounded-md border border-border/60 hover:border-orange-500/50 transition-colors'
                onClick={() => onView?.(post.id)}
              >
                <img
                  src={image.url}
                  alt={`Post image ${index + 1}`}
                  className='w-full h-32 object-cover'
                />
                {postImages.length > 4 && index === 3 && (
                  <div className='absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold'>
                    +{postImages.length - 4} more
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 min-h-[44px]'
            onClick={() => onView?.(post.id)}
            aria-label={`View ${post.comment_count || 0} comments`}>
            <MessageSquare className='mr-1.5 h-3.5 w-3.5' aria-hidden="true" />
            {post.comment_count || 0}{" "}
            {post.comment_count === 1 ? "comment" : "comments"}
          </Button>

          {editedLabel && (
            <span className='hidden text-[11px] text-muted-foreground/70 md:inline'>
              Last updated {editedLabel}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
