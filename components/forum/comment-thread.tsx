/** @format */

"use client";

import { useState } from "react";
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
import { CommentWithAuthor } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";

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
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = currentUserId === comment.author_id;
  const canDelete = currentUserId === comment.author_id;
  const canReply = depth < maxDepth && onReply;

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

  const indentClass =
    depth > 0
      ? `ml-${Math.min(depth * 4, 12)} border-l-2 border-gray-700 pl-4`
      : "";

  return (
    <div className={`space-y-3 ${indentClass}`}>
      <Card className='bg-gray-800 border-gray-700'>
        <CardContent className='p-4'>
          {/* Comment Header */}
          <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center gap-3 text-sm text-gray-400'>
              <div className='flex items-center gap-1'>
                <User className='h-4 w-4' />
                <span>
                  {comment.is_anonymous
                    ? "Anonymous"
                    : comment.author_name || "Unknown User"}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                <span>
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {comment.updated_at !== comment.created_at && (
                <span className='text-xs text-gray-500'>(edited)</span>
              )}
            </div>

            {(canEdit || canDelete) && (
              <div className='relative'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowActions(!showActions)}
                  className='text-gray-400 hover:text-white'>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>

                {showActions && (
                  <div className='absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 min-w-[120px]'>
                    {canEdit && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          onEdit?.(comment.id);
                          setShowActions(false);
                        }}
                        className='w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800'>
                        <Edit className='h-4 w-4 mr-2' />
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          onDelete?.(comment.id);
                          setShowActions(false);
                        }}
                        className='w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-800'>
                        <Trash2 className='h-4 w-4 mr-2' />
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Content */}
          <div className='text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap'>
            {comment.content}
          </div>

          {/* Comment Actions */}
          <div className='flex items-center gap-2'>
            {canReply && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowReplyForm(!showReplyForm)}
                className='text-gray-400 hover:text-white'>
                <Reply className='h-4 w-4 mr-1' />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className='mt-4 p-4 bg-gray-900 rounded-lg border border-gray-600'>
              <div className='space-y-3'>
                <textarea
                  placeholder='Write your reply...'
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className='w-full min-h-[80px] p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none'
                />

                <div className='flex items-center justify-between'>
                  <label className='flex items-center gap-2 text-sm text-gray-400'>
                    <input
                      type='checkbox'
                      checked={replyAnonymous}
                      onChange={(e) => setReplyAnonymous(e.target.checked)}
                      className='rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500'
                    />
                    Reply anonymously
                  </label>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setShowReplyForm(false)}
                      className='border-gray-600 text-gray-300 hover:bg-gray-800'>
                      Cancel
                    </Button>
                    <Button
                      size='sm'
                      onClick={handleReply}
                      disabled={!replyContent.trim() || isSubmitting}
                      className='bg-violet-600 hover:bg-violet-700'>
                      {isSubmitting ? "Replying..." : "Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className='space-y-3'>
          {comment.replies.map((reply) => (
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

  const handleAddComment = async () => {
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

  return (
    <div className='space-y-6'>
      {/* Comments Header */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-white flex items-center gap-2'>
          <MessageSquare className='h-5 w-5' />
          Comments ({comments.length})
        </h3>
        {onAddComment && (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowCommentForm(!showCommentForm)}
            className='border-gray-600 text-gray-300 hover:bg-gray-800'>
            Add Comment
          </Button>
        )}
      </div>

      {/* Add Comment Form */}
      {showCommentForm && onAddComment && (
        <Card className='bg-gray-800 border-gray-700'>
          <CardContent className='p-4'>
            <div className='space-y-3'>
              <textarea
                placeholder='Share your thoughts...'
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className='w-full min-h-[100px] p-3 bg-gray-900 border border-gray-600 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none'
              />

              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-2 text-sm text-gray-400'>
                  <input
                    type='checkbox'
                    checked={commentAnonymous}
                    onChange={(e) => setCommentAnonymous(e.target.checked)}
                    className='rounded border-gray-600 bg-gray-800 text-violet-600 focus:ring-violet-500'
                  />
                  Comment anonymously
                </label>

                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowCommentForm(false)}
                    className='border-gray-600 text-gray-300 hover:bg-gray-800'>
                    Cancel
                  </Button>
                  <Button
                    size='sm'
                    onClick={handleAddComment}
                    disabled={!commentContent.trim() || isSubmitting}
                    className='bg-violet-600 hover:bg-violet-700'>
                    {isSubmitting ? "Adding..." : "Add Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className='space-y-4'>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className='bg-gray-800 border-gray-700 animate-pulse'>
              <CardContent className='p-4'>
                <div className='space-y-3'>
                  <div className='h-4 bg-gray-700 rounded w-1/3'></div>
                  <div className='h-16 bg-gray-700 rounded w-full'></div>
                  <div className='h-6 bg-gray-700 rounded w-16'></div>
                </div>
              </CardContent>
            </Card>
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
        <Card className='bg-gray-800 border-gray-700'>
          <CardContent className='p-8 text-center'>
            <div className='space-y-3'>
              <MessageSquare className='h-8 w-8 text-gray-400 mx-auto' />
              <div>
                <h4 className='text-lg font-medium text-white'>
                  No comments yet
                </h4>
                <p className='text-gray-400 mt-1'>
                  Be the first to share your thoughts on this post
                </p>
              </div>
              {onAddComment && (
                <Button
                  onClick={() => setShowCommentForm(true)}
                  className='bg-violet-600 hover:bg-violet-700'>
                  Add First Comment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
