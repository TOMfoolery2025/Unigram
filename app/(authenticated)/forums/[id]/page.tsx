/** @format */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";

import { PostList } from "@/components/forum";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { ArrowLeft, Calendar, Users } from "lucide-react";

import {
  getSubforum,
  getSubforumPosts,
  createPost,
  voteOnPost,
  joinSubforum,
  leaveSubforum,
} from "@/lib/forum";
import { SubforumWithMembership, PostWithAuthor } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";

function SubforumContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const subforumId = params.id as string;

  const [subforum, setSubforum] = useState<SubforumWithMembership | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!subforumId) return;

    setIsPostsLoading(true);
    try {
      const { data, error } = await getSubforumPosts(
        subforumId,
        undefined,
        user?.id
      );
      if (error) {
        console.error("Failed to load posts:", error);
        return;
      }
      setPosts(data || []);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setIsPostsLoading(false);
    }
  };

  useEffect(() => {
    loadSubforum();
    loadPosts();
  }, [subforumId, user?.id]);

  const handleCreatePost = async (data: {
    title: string;
    content: string;
    is_anonymous: boolean;
  }) => {
    if (!user?.id || !subforumId) return;

    try {
      const { error } = await createPost(
        { ...data, subforum_id: subforumId },
        user.id
      );
      if (error) {
        console.error("Failed to create post:", error);
        return;
      }
      await loadPosts();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleVote = async (
    postId: string,
    voteType: "upvote" | "downvote"
  ) => {
    if (!user?.id) return;

    try {
      const { error } = await voteOnPost(postId, user.id, voteType);
      if (error) {
        console.error("Failed to vote:", error);
        return;
      }
      await loadPosts();
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleViewPost = (postId: string) => {
    router.push(`/forums/${subforumId}/posts/${postId}`);
  };

  const handleJoinSubforum = async () => {
    if (!user?.id || !subforumId) return;

    try {
      const { error } = await joinSubforum(subforumId, user.id);
      if (error) {
        console.error("Failed to join subforum:", error);
        return;
      }
      await loadSubforum();
    } catch (error) {
      console.error("Failed to join subforum:", error);
    }
  };

  const handleLeaveSubforum = async () => {
    if (!user?.id || !subforumId) return;

    try {
      const { error } = await leaveSubforum(subforumId, user.id);
      if (error) {
        console.error("Failed to leave subforum:", error);
        return;
      }
      await loadSubforum();
    } catch (error) {
      console.error("Failed to leave subforum:", error);
    }
  };

  // ---------- LOADING / NOT FOUND ----------
  if (isLoading) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <main className='min-h-screen px-4 py-10 md:px-6 bg-background/80'>
          <div className='max-w-6xl mx-auto space-y-6 animate-pulse'>
            <div className='h-8 w-40 rounded bg-card' />
            <div className='h-24 rounded bg-card' />
            <div className='h-48 rounded bg-card' />
          </div>
        </main>
      </>
    );
  }

  if (!subforum) {
    return (
      <>
        <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />
        <main className='min-h-screen px-4 py-10 md:px-6 bg-background/80'>
          <div className='max-w-6xl mx-auto'>
            <Card className='card-hover-glow border-border/60 bg-card/90'>
              <CardContent className='p-10 text-center space-y-4'>
                <h2 className='text-xl font-semibold'>Subforum not found</h2>
                <p className='text-sm text-muted-foreground'>
                  The subforum you&apos;re looking for doesn&apos;t exist.
                </p>
                <Button
                  onClick={() => router.push("/forums")}
                  className='gap-2'>
                  <ArrowLeft className='h-4 w-4' />
                  Back to Forums
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const createdLabel = formatDistanceToNow(new Date(subforum.created_at), {
    addSuffix: true,
  });

  return (
    <>
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]' />

      <main className='min-h-screen px-4 py-10 md:px-6 bg-background/80'>
        <div className='max-w-6xl mx-auto space-y-8'>
          {/* back */}
          <Button
            variant='ghost'
            size='sm'
            onClick={() => router.push("/forums")}
            className='px-0 text-muted-foreground hover:text-foreground'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Forums
          </Button>

          {/* HEADER */}
          <Card className='card-hover-glow border-border/60 bg-card/90'>
            <CardHeader className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
              <div className='space-y-2'>
                <CardTitle className='text-2xl md:text-3xl font-semibold text-primary'>
                  {subforum.name}
                </CardTitle>
                {subforum.description && (
                  <CardDescription className='text-sm'>
                    {subforum.description}
                  </CardDescription>
                )}

                <div className='mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground'>
                  <div className='flex items-center gap-1'>
                    <Users className='h-3.5 w-3.5' />
                    <span>
                      {subforum.member_count} member
                      {subforum.member_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-3.5 w-3.5' />
                    <span>Created {createdLabel}</span>
                  </div>
                  {subforum.creator_name && (
                    <Badge variant='outline' className='text-[11px]'>
                      by {subforum.creator_name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className='flex flex-col items-end gap-2'>
                {subforum.is_member && (
                  <Badge
                    variant='outline'
                    className='text-[10px] border-emerald-500/60 text-emerald-300'>
                    Joined
                  </Badge>
                )}
                <Button
                  variant={subforum.is_member ? "outline" : "default"}
                  className={
                    subforum.is_member
                      ? "border-border/70"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }
                  onClick={
                    subforum.is_member
                      ? handleLeaveSubforum
                      : handleJoinSubforum
                  }>
                  {subforum.is_member ? "Leave subforum" : "Join subforum"}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* POSTS */}
          <PostList
            posts={posts}
            isLoading={isPostsLoading}
            onVote={handleVote}
            onViewPost={handleViewPost}
            onCreatePost={handleCreatePost}
            onRefresh={loadPosts}
            showCreateButton={subforum.is_member}
            subforumId={subforumId}
            currentUserId={user?.id}
          />
        </div>
      </main>
    </>
  );
}

export default function SubforumPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <SubforumContent />
    </ProtectedRoute>
  );
}
