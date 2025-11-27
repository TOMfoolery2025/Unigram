/** @format */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { PostList } from "@/components/forum";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Calendar } from "lucide-react";
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
        {
          ...data,
          subforum_id: subforumId,
        },
        user.id
      );

      if (error) {
        console.error("Failed to create post:", error);
        return;
      }

      await loadPosts(); // Refresh posts
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

      await loadPosts(); // Refresh posts to show updated vote counts
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

      await loadSubforum(); // Refresh subforum data
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

      await loadSubforum(); // Refresh subforum data
    } catch (error) {
      console.error("Failed to leave subforum:", error);
    }
  };

  if (isLoading) {
    return (
      <main className='min-h-screen p-8 bg-background'>
        <div className='max-w-6xl mx-auto'>
          <div className='animate-pulse space-y-6'>
            <div className='h-8 bg-gray-700 rounded w-1/4'></div>
            <div className='h-32 bg-gray-700 rounded'></div>
            <div className='h-64 bg-gray-700 rounded'></div>
          </div>
        </div>
      </main>
    );
  }

  if (!subforum) {
    return (
      <main className='min-h-screen p-8 bg-background'>
        <div className='max-w-6xl mx-auto'>
          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-12 text-center'>
              <h2 className='text-xl font-semibold text-white mb-2'>
                Subforum not found
              </h2>
              <p className='text-gray-400 mb-4'>
                The subforum you&apos;re looking for doesn&apos;t exist.
              </p>
              <Button
                onClick={() => router.push("/forums")}
                className='bg-violet-600 hover:bg-violet-700'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Forums
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen p-8 bg-background'>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Back Button */}
        <Button
          variant='ghost'
          onClick={() => router.push("/forums")}
          className='text-gray-400 hover:text-white'>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Forums
        </Button>

        {/* Subforum Header */}
        <Card className='bg-gray-800 border-gray-700'>
          <CardHeader>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <CardTitle className='text-2xl font-bold text-violet-400 mb-2'>
                  {subforum.name}
                </CardTitle>
                <p className='text-gray-300 mb-4'>{subforum.description}</p>

                <div className='flex items-center gap-6 text-sm text-gray-400'>
                  <div className='flex items-center gap-1'>
                    <Users className='h-4 w-4' />
                    <span>{subforum.member_count} members</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-4 w-4' />
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(subforum.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {subforum.creator_name && (
                    <span>by {subforum.creator_name}</span>
                  )}
                </div>
              </div>

              <Button
                variant={subforum.is_member ? "secondary" : "default"}
                onClick={
                  subforum.is_member ? handleLeaveSubforum : handleJoinSubforum
                }
                className={
                  subforum.is_member
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-violet-600 hover:bg-violet-700"
                }>
                {subforum.is_member ? "Leave" : "Join"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Posts */}
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
  );
}

export default function SubforumPage() {
  return (
    <ProtectedRoute requireVerified={true}>
      <SubforumContent />
    </ProtectedRoute>
  );
}
