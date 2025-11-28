/** @format */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { CommentThread, VoteButtons } from "@/components/forum";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Calendar, MessageSquare, Hash } from "lucide-react";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, subforumId, user?.id]);

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!user?.id || !postId) return;

    try {
      const { error } = await voteOnPost(postId, user.id, voteType);
      if (error) {
        console.error("Failed to vote:", error);
        return;
      }
      await loadPost();
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

      await loadComments();
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

      await loadComments();
    } catch (error) {
      console.error("Failed to reply:", error);
    }
  };

  // ---------- LOADING & NOT FOUND ----------
  if (isLoading) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <main className='min-h-screen px-4 py-10 md:px-6 bg-background/80'>
          <div className='max-w-4xl mx-auto'>
            <div className='space-y-6 animate-pulse'>
              <div className='h-6 w-1/3 rounded bg-card' />
              <div className='h-10 w-3/4 rounded bg-card' />
              <div className='h-48 rounded bg-card' />
              <div className='h-32 rounded bg-card' />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <main className='min-h-screen px-4 py-10 md:px-6 bg-background/80'>
          <div className='max-w-4xl mx-auto'>
            <Card className='card-hover-glow border-border/60 bg-card/90'>
              <CardContent className='p-10 text-center space-y-4'>
                <h2 className='text-xl font-semibold text-foreground'>
                  Post not found
                </h2>
                <p className='text-sm text-muted-foreground'>
                  The post you&apos;re looking for doesn&apos;t exist or is no
                  longer available.
                </p>
                <Button
                  onClick={() => router.push(`/hives/${subforumId}`)}
                  className='gap-2'>
                  <ArrowLeft className='h-4 w-4' />
                  Back to Subforum
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const authorName = post.is_anonymous
    ? "Anonymous"
    : post.author_name || "Unknown User";

  const authorInitial =
    authorName && authorName.length > 0
      ? authorName.charAt(0).toUpperCase()
      : "?";

  const createdLabel = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  const edited =
    post.updated_at && post.updated_at !== post.created_at
      ? formatDistanceToNow(new Date(post.updated_at), { addSuffix: true })
      : null;

  return (
    <>
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />

      <main className='min-h-screen px-4 py-10 md:px-6 bg-background/80'>
        <div className='max-w-4xl mx-auto space-y-8'>
          {/* Breadcrumb */}
          <div className='flex items-center justify-between gap-3'>
            <div className='flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => router.push("/hives")}
                className='px-0 text-muted-foreground hover:text-foreground'>
                Forums
              </Button>
              <span className='text-muted-foreground/60'>/</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => router.push(`/hives/${subforumId}`)}
                className='px-0 text-muted-foreground hover:text-foreground'>
                {subforum?.name || "Hive"}
              </Button>
              <span className='text-muted-foreground/60'>/</span>
              <span className='text-foreground line-clamp-1'>{post.title}</span>
            </div>

            <Button
              variant='outline'
              size='icon'
              className='hidden md:inline-flex'
              onClick={() => router.push(`/hives/${subforumId}`)}>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </div>

          {/* Post card */}
          <Card className='card-hover-glow border-border/60 bg-card/90'>
            <CardHeader className='space-y-4'>
              <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                <div className='space-y-2'>
                  <CardTitle className='text-2xl md:text-3xl font-semibold text-primary'>
                    {post.title}
                  </CardTitle>
                  <div className='flex flex-wrap items-center gap-2'>
                    {subforum?.name && (
                      <Badge
                        variant='outline'
                        className='flex items-center gap-1'>
                        <Hash className='h-3 w-3' />
                        <span className='text-[11px] uppercase tracking-wide'>
                          {subforum.name}
                        </span>
                      </Badge>
                    )}
                    <Badge variant='outline' className='text-[11px]'>
                      {post.is_anonymous ? "Anonymous post" : "Named post"}
                    </Badge>
                  </div>
                </div>

                {/* Author pill */}
                <div className='flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-3 py-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback className='bg-primary/70 text-primary-foreground text-sm'>
                      {authorInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className='space-y-0.5'>
                    <p className='text-xs font-medium text-foreground'>
                      {authorName}
                    </p>
                    <p className='text-[11px] text-muted-foreground flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      <span>{createdLabel}</span>
                      {edited && (
                        <>
                          <span>•</span>
                          <span>edited {edited}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              <div className='prose prose-invert max-w-none'>
                <p className='text-sm md:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap'>
                  {post.content}
                </p>
              </div>

              <Separator />

              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <VoteButtons
                  voteCount={post.vote_count}
                  userVote={post.user_vote}
                  onVote={handleVote}
                  size='md'
                  orientation='horizontal'
                />

                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <MessageSquare className='h-4 w-4' />
                  <span>
                    {comments.length} comment
                    {comments.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discussion */}
          <Card className='card-hover-glow border-border/60 bg-card/90'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Discussion</CardTitle>
              <CardDescription className='text-sm'>
                Join the conversation or help other students with your
                perspective.
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <CommentThread
                comments={comments}
                onAddComment={handleAddComment}
                onReply={handleReply}
                currentUserId={user?.id}
                isLoading={isCommentsLoading}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

export default function PostPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <PostContent />
    </ProtectedRoute>
  );
}
