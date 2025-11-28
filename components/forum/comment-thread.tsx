/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Calendar,
  User,
  Reply,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommentWithAuthor } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/profile/user-avatar";

interface CommentItemProps {
  comment: CommentWithAuthor;
  onReply?: (
    commentId: string,
    content: string,
    isAnonymous: boolean
  ) => Promise<void>;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
  depth?: number;
  maxDepth?: number;
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  currentUserId,
  depth = 0,
  maxDepth = 3,
}: CommentItemProps) {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const canEdit = currentUserId === comment.author_id;
  const canDelete = currentUserId === comment.author_id;
  const canReply = depth < maxDepth && !!onReply;

  const hasReplies = !!comment.replies && comment.replies.length > 0;
  const replyCount = comment.replies?.length ?? 0;
  const isNested = depth > 0;

  const displayName = comment.is_anonymous
    ? "Anonymous"
    : comment.author_name || "Unknown User";

  const initial =
    displayName && displayName.length > 0
      ? displayName.charAt(0).toUpperCase()
      : "?";

  const createdLabel = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  });

  const edited =
    comment.updated_at !== comment.created_at
      ? formatDistanceToNow(new Date(comment.updated_at), { addSuffix: true })
      : null;

  const handleAuthorClick = () => {
    if (!comment.is_anonymous && comment.author_id) {
      router.push(`/profile/${comment.author_id}`);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim(), replyAnonymous);
      setReplyContent("");
      setReplyAnonymous(false);
      setShowReplyForm(false);
    } catch (error) {
      console.error("Failed to reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`flex gap-3 ${
        isNested ? "pl-4 border-l border-border/40" : ""
      }`}>
      {/* Avatar */}
      <div 
        className={`mt-1 shrink-0 ${!comment.is_anonymous && comment.author_id ? 'cursor-pointer' : ''}`}
        onClick={handleAuthorClick}
      >
        {!comment.is_anonymous && comment.author_id ? (
          <UserAvatar
            userId={comment.author_id}
            displayName={comment.author_name}
            size="sm"
          />
        ) : (
          <Avatar className='h-8 w-8'>
            <AvatarFallback className='bg-muted text-xs font-medium'>
              {initial}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Content */}
      <div className='flex-1 space-y-2'>
        {/* Header: name + time + menu */}
        <div className='flex items-start justify-between gap-2'>
          <div className='space-y-0.5'>
            <div className='flex flex-wrap items-baseline gap-2 text-sm'>
              <span 
                className={`font-semibold text-foreground ${!comment.is_anonymous && comment.author_id ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                onClick={handleAuthorClick}
              >
                {displayName}
              </span>
              <span className='text-[11px] text-muted-foreground flex items-center gap-1'>
                <Calendar className='h-3 w-3' />
                {createdLabel}
                {edited && (
                  <>
                    <span>•</span>
                    <span>edited {edited}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {(canEdit || canDelete) && (
            <div className='relative'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setShowActions((v) => !v)}
                className='h-7 w-7 text-muted-foreground hover:text-foreground'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>

              {showActions && (
                <div className='absolute right-0 top-7 z-10 min-w-[140px] rounded-md border border-border/60 bg-background/95 shadow-lg'>
                  {canEdit && (
                    <button
                      className='flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      onClick={() => {
                        onEdit?.(comment.id);
                        setShowActions(false);
                      }}>
                      <Edit className='h-3.5 w-3.5' />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className='flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-muted/60 hover:text-red-300'
                      onClick={() => {
                        onDelete?.(comment.id);
                        setShowActions(false);
                      }}>
                      <Trash2 className='h-3.5 w-3.5' />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message text */}
        <p className='text-sm leading-relaxed text-foreground whitespace-pre-wrap'>
          {comment.content}
        </p>

        {/* Actions row */}
        <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
          <div className='flex items-center gap-2'>
            {canReply && (
              <button
                type='button'
                onClick={() => setShowReplyForm((v) => !v)}
                className='inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary'>
                <Reply className='h-3.5 w-3.5' />
                Reply
              </button>
            )}
          </div>

          {hasReplies && (
            <button
              type='button'
              onClick={() => setShowReplies((v) => !v)}
              className='text-[11px] font-medium text-primary hover:text-primary/80'>
              {showReplies
                ? `Hide ${replyCount} repl${replyCount === 1 ? "y" : "ies"}`
                : `View ${replyCount} repl${replyCount === 1 ? "y" : "ies"}`}
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className='mt-2 space-y-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2'>
            <textarea
              placeholder='Write your reply…'
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className='w-full min-h-[70px] resize-none rounded-md border border-border/60 bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
            />
            <div className='flex items-center justify-between gap-3'>
              <label className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                <input
                  type='checkbox'
                  checked={replyAnonymous}
                  onChange={(e) => setReplyAnonymous(e.target.checked)}
                  className='h-3 w-3 rounded border-border/60 bg-background text-primary focus:ring-primary'
                />
                Reply anonymously
              </label>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 border-border/60 px-3 text-[11px] text-muted-foreground hover:bg-muted/60'
                  onClick={() => setShowReplyForm(false)}>
                  Cancel
                </Button>
                <Button
                  size='sm'
                  className='h-7 px-3 text-[11px]'
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}>
                  {isSubmitting ? "Replying…" : "Reply"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {hasReplies && showReplies && (
          <div className='mt-2 space-y-4'>
            {comment.replies!.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                currentUserId={currentUserId}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  onAddComment?: (
    content: string,
    isAnonymous: boolean,
    parentId?: string
  ) => Promise<void>;
  onReply?: (
    commentId: string,
    content: string,
    isAnonymous: boolean
  ) => Promise<void>;
  onEditComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUserId?: string;
  isLoading?: boolean;
  maxDepth?: number;
}

export function CommentThread({
  comments,
  onAddComment,
  onReply,
  onEditComment,
  onDeleteComment,
  currentUserId,
  isLoading = false,
  maxDepth = 3,
}: CommentThreadProps) {
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCommentClick = async () => {
    if (!commentContent.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(commentContent.trim(), commentAnonymous);
      setCommentContent("");
      setCommentAnonymous(false);
      setShowCommentForm(false);
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (
    commentId: string,
    content: string,
    isAnonymous: boolean
  ) => {
    if (onReply) {
      await onReply(commentId, content, isAnonymous);
    }
  };

  const getTotalCommentCount = (items: CommentWithAuthor[]): number =>
    items.reduce((total, c) => {
      const repliesCount = c.replies ? getTotalCommentCount(c.replies) : 0;
      return total + 1 + repliesCount;
    }, 0);

  const totalCommentCount = getTotalCommentCount(comments);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3'>
        <h3 className='flex items-center gap-2 text-base md:text-lg font-semibold text-foreground'>
          <MessageSquare className='h-5 w-5 text-primary' />
          Comments ({totalCommentCount})
        </h3>
        {onAddComment && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowCommentForm((v) => !v)}
            className='h-8 border-border/60 px-3 text-xs text-muted-foreground hover:bg-muted/60'>
            {showCommentForm ? "Hide form" : "Add Comment"}
          </Button>
        )}
      </div>

      {/* Add comment form */}
      {showCommentForm && onAddComment && (
        <Card className='border-border/60 bg-card/90'>
          <CardContent className='p-4 space-y-3'>
            <textarea
              placeholder='Share your thoughts…'
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className='w-full min-h-[90px] resize-none rounded-md border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
            />

            <div className='flex items-center justify-between gap-3'>
              <label className='flex items-center gap-2 text-[11px] text-muted-foreground'>
                <input
                  type='checkbox'
                  checked={commentAnonymous}
                  onChange={(e) => setCommentAnonymous(e.target.checked)}
                  className='h-3 w-3 rounded border-border/60 bg-background text-primary focus:ring-primary'
                />
                Comment anonymously
              </label>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 border-border/60 px-3 text-xs text-muted-foreground hover:bg-muted/60'
                  onClick={() => setShowCommentForm(false)}>
                  Cancel
                </Button>
                <Button
                  size='sm'
                  className='h-8 px-3 text-xs'
                  onClick={handleAddCommentClick}
                  disabled={!commentContent.trim() || isSubmitting}>
                  {isSubmitting ? "Adding…" : "Add Comment"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className='space-y-4'>
          {[0, 1, 2].map((i) => (
            <div key={i} className='flex gap-3 animate-pulse'>
              <div className='mt-1 h-8 w-8 rounded-full bg-muted' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-1/3 rounded bg-muted' />
                <div className='h-10 w-full rounded bg-muted' />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className='space-y-4'>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              currentUserId={currentUserId}
              depth={0}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      ) : (
        <Card className='border-border/60 bg-card/90'>
          <CardContent className='space-y-3 p-8 text-center'>
            <MessageSquare className='mx-auto h-8 w-8 text-muted-foreground' />
            <div>
              <h4 className='text-sm md:text-base font-medium text-foreground'>
                No comments yet
              </h4>
              <p className='mt-1 text-xs md:text-sm text-muted-foreground'>
                Be the first to share your thoughts on this post.
              </p>
            </div>
            {onAddComment && (
              <Button
                size='sm'
                className='mt-1 px-4 text-xs'
                onClick={() => setShowCommentForm(true)}>
                Add First Comment
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
