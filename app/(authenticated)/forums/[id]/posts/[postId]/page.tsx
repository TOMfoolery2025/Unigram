/** @format */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { CommentThread, VoteButtons } from "@/components/forum";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User, Calendar, MessageSquare } from "lucide-react";
import {
  getPost,
  getSubforum,
  getPostComments,
  createComment,
  voteOnPost,
} from "@/lib/forum";
import {
  PostWithAuthor,
  SubforumWithMembership,
  CommentWithAuthor,
} from "@/types/forum";
import { formatDistanceToNow } from "date-fns";

function PostContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subforumId = params.id as string;
  const postId = params.postId as string;

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [subforum, setSubforum] = useState<SubforumWithMembership | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);

  const loadPost = async () => {
    if (!postId) return;

    try {
      const { data, error } = await getPost(postId, user?.id);
      if (error) {
        console.error("Failed to load post:", error);
        return;
      }
      setPost(data);
    } catch (error) {
      console.error("Failed to load post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubforum = async () => {
    if (!subforumId) return;

    try {
      const { data, error } = await getSubforum(subforumId, user?.id);
      if (error) {
        console.error("Failed to load subforum:", error);
        return;
      }
      setSubforum(data);
    } catch (error) {
      console.error("Failed to load subforum:", error);
    }
  };

  const loadComments = async () => {
    if (!postId) return;

    setIsCommentsLoading(true);
    try {
      const { data, error } = await getPostComments(postId, user?.id);
      if (error) {
        console.error("Failed to load comments:", error);
        return;
      }
      setComments(data || []);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
    loadSubforum();
    loadComments();
  }, [postId, subforumId, user?.id]);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!user?.id || !postId) return;

    try {
      const { error } = await voteOnPost(postId, user.id, voteType);
      if (error) {
        console.error("Failed to vote:", error);
        return;
      }

      await loadPost(); // Refresh post to show updated vote count
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleAddComment = async (content: string, isAnonymous: boolean) => {
    if (!user?.id || !postId) return;

    try {
      const { error } = await createComment(
        {
          post_id: postId,
          content,
          is_anonymous: isAnonymous,
        },
        user.id
      );

      if (error) {
        console.error("Failed to add comment:", error);
        return;
      }

      await loadComments(); // Refresh comments
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleReply = async (
    commentId: string,
    content: string,
    isAnonymous: boolean
  ) => {
    if (!user?.id || !postId) return;

    try {
      const { error } = await createComment(
        {
          post_id: postId,
          content,
          is_anonymous: isAnonymous,
          parent_comment_id: commentId,
        },
        user.id
      );

      if (error) {
        console.error("Failed to reply:", error);
        return;
      }

      await loadComments(); // Refresh comments
    } catch (error) {
      console.error("Failed to reply:", error);
    }
  };

  if (isLoading) {
    return (
      <main className='min-h-screen p-8 bg-background'>
        <div className='max-w-4xl mx-auto'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 bg-gray-700 rounded w-1/4'></div>
            <div className='h-64 bg-gray-700 rounded'></div>
            <div className='h-32 bg-gray-700 rounded'></div>
          </div>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className='min-h-screen p-8 bg-background'>
        <div className='max-w-4xl mx-auto'>
          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-12 text-center'>
              <h2 className='text-xl font-semibold text-white mb-2'>
                Post not found
              </h2>
              <p className='text-gray-400 mb-4'>
                The post you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button
                onClick={() => router.push(`/forums/${subforumId}`)}
                className='bg-violet-600 hover:bg-violet-700'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Subforum
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen p-8 bg-background'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Navigation */}
        <div className='flex items-center gap-2 text-sm text-gray-400'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push("/forums")}
            className='text-gray-400 hover:text-white'>
            Forums
          </Button>
          <span>/</span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push(`/forums/${subforumId}`)}
            className='text-gray-400 hover:text-white'>
            {subforum?.name || "Subforum"}
          </Button>
          <span>/</span>
          <span className='text-white'>{post.title}</span>
        </div>

        {/* Post */}
        <Card className='bg-gray-800 border-gray-700'>
          <CardHeader>
            <CardTitle className='text-2xl font-bold text-violet-400 mb-4'>
              {post.title}
            </CardTitle>

            <div className='flex items-center gap-4 text-sm text-gray-400'>
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
              {post.updated_at !== post.created_at && (
                <span className='text-xs text-gray-500'>
                  (edited{" "}
                  {formatDistanceToNow(new Date(post.updated_at), {
                    addSuffix: true,
                  })}
                  )
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className='prose prose-invert max-w-none mb-6'>
              <p className='text-gray-300 leading-relaxed whitespace-pre-wrap'>
                {post.content}
              </p>
            </div>

            <div className='flex items-center justify-between pt-4 border-t border-gray-700'>
              <VoteButtons
                voteCount={post.vote_count}
                userVote={post.user_vote}
                onVote={handleVote}
                size='md'
                orientation='horizontal'
              />

              <div className='flex items-center gap-1 text-gray-400'>
                <MessageSquare className='h-4 w-4' />
                <span>
                  {comments.length} comment{comments.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <CommentThread
          comments={comments}
          onAddComment={handleAddComment}
          onReply={handleReply}
          currentUserId={user?.id}
          isLoading={isCommentsLoading}
        />
      </div>
    </main>
  );
}

export default function PostPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <PostContent />
    </ProtectedRoute>
  );
}
