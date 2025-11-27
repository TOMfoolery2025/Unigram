/** @format */

"use client";

import { useState } from "react";
import {
  MessageSquare,
  Calendar,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostWithAuthor } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";
import { VoteButtons } from "./vote-buttons";

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
}: PostCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (onVote) {
      await onVote(post.id, voteType);
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <Card className='hover:shadow-md transition-shadow bg-gray-800 border-gray-700'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div
            className='flex-1 cursor-pointer'
            onClick={() => onView?.(post.id)}>
            <h3 className='text-lg font-semibold text-violet-400 hover:text-violet-300 transition-colors line-clamp-2'>
              {post.title}
            </h3>
            <div className='flex items-center gap-4 mt-2 text-sm text-gray-400'>
              <div className='flex items-center gap-1'>
                <User className='h-4 w-4' />
                <span>
                  {post.is_anonymous
                    ? "Anonymous"
                    : post.author_name || "Unknown User"}
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <Calendar className='h-4 w-4' />
                <span>
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {showSubforum && post.subforum_name && (
                <span className='text-violet-400 text-xs bg-violet-900/30 px-2 py-1 rounded'>
                  {post.subforum_name}
                </span>
              )}
            </div>
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
                        onEdit?.(post.id);
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
                        onDelete?.(post.id);
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
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='cursor-pointer' onClick={() => onView?.(post.id)}>
          <p className='text-gray-300 text-sm leading-relaxed mb-4'>
            {truncateContent(post.content)}
          </p>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <VoteButtons
              voteCount={post.vote_count}
              userVote={post.user_vote}
              onVote={handleVote}
              disabled={isLoading}
            />

            <Button
              variant='ghost'
              size='sm'
              onClick={() => onView?.(post.id)}
              className='text-gray-400 hover:text-white'>
              <MessageSquare className='h-4 w-4 mr-2' />
              {post.comment_count || 0} comments
            </Button>
          </div>

          {post.updated_at !== post.created_at && (
            <span className='text-xs text-gray-500'>
              edited{" "}
              {formatDistanceToNow(new Date(post.updated_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
