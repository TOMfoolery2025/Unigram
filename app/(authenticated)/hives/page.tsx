/** @format */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth";
import { useAuth } from "@/lib/auth";
import { HiveSearchBar } from "@/components/forum/hive-search-bar";
import { JoinedSubhivesList } from "@/components/forum/joined-subhives-list";
import { PostFeedList } from "@/components/forum/post-feed-list";
import { DailyGameWidget } from "@/components/forum/daily-game-widget";
import { TopSubhivesPanel } from "@/components/forum/top-subhives-panel";
import { FeedFilters, SortOption, TimeRange } from "@/components/forum/feed-filters";
import { getUserSubforums } from "@/lib/forum/subforums";
import { getSubforumPosts, searchPosts } from "@/lib/forum/posts";
import { SubforumWithMembership, PostWithAuthor } from "@/types/forum";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

function HivePageContentInner() {
  const { user } = useAuth();
  const { addToast } = useToast();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubhiveId, setSelectedSubhiveId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("new");
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  // Data state
  const [joinedSubhives, setJoinedSubhives] = useState<SubforumWithMembership[]>([]);
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([]);
  const [isLoadingSubhives, setIsLoadingSubhives] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // Error state
  const [subhivesError, setSubhivesError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Retry counters
  const [subhivesRetryCount, setSubhivesRetryCount] = useState(0);
  const [postsRetryCount, setPostsRetryCount] = useState(0);

  // Load joined subhives with error handling and retry
  const loadSubhives = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingSubhives(true);
    setSubhivesError(null);

    try {
      const { data, error } = await getUserSubforums(user.id);
      if (error) {
        throw error;
      }
      setJoinedSubhives((data || []) as SubforumWithMembership[]);
      setSubhivesRetryCount(0);
    } catch (error) {
      console.error("Failed to load joined subhives:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load your hives";
      setSubhivesError(errorMessage);
      
      // Auto-retry with exponential backoff (max 3 attempts)
      if (subhivesRetryCount < 2) {
        const retryDelay = Math.pow(2, subhivesRetryCount) * 1000;
        setTimeout(() => {
          setSubhivesRetryCount(prev => prev + 1);
        }, retryDelay);
      } else {
        addToast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingSubhives(false);
    }
  }, [user?.id, subhivesRetryCount, addToast]);

  useEffect(() => {
    loadSubhives();
  }, [user?.id, subhivesRetryCount]);

  // Load posts based on selected subhive and search query with error handling
  const loadPosts = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingPosts(true);
    setPostsError(null);

    try {
      let posts: PostWithAuthor[] = [];

      if (searchQuery.trim()) {
        // Search across all joined subhives
        const { data, error } = await searchPosts(searchQuery, user.id);
        if (error) {
          throw error;
        }
        
        // Filter to only posts from joined subhives
        const joinedSubhiveIds = new Set(joinedSubhives.map(s => s.id));
        posts = (data || []).filter(post => joinedSubhiveIds.has(post.subforum_id));
      } else if (selectedSubhiveId) {
        // Load posts from selected subhive
        const { data, error } = await getSubforumPosts(selectedSubhiveId, undefined, user.id);
        if (error) {
          throw error;
        }
        posts = data || [];
      } else {
        // Load posts from all joined subhives
        if (joinedSubhives.length > 0) {
          const postsPromises = joinedSubhives.map(subhive =>
            getSubforumPosts(subhive.id, undefined, user.id)
          );
          const results = await Promise.all(postsPromises);
          posts = results.flatMap(result => result.data || []);
        }
      }

      setAllPosts(posts);
      setPostsRetryCount(0);
    } catch (error) {
      console.error("Failed to load posts:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load posts";
      setPostsError(errorMessage);
      
      // Auto-retry with exponential backoff (max 3 attempts)
      if (postsRetryCount < 2) {
        const retryDelay = Math.pow(2, postsRetryCount) * 1000;
        setTimeout(() => {
          setPostsRetryCount(prev => prev + 1);
        }, retryDelay);
      } else {
        addToast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingPosts(false);
    }
  }, [user?.id, selectedSubhiveId, searchQuery, joinedSubhives, postsRetryCount, addToast]);

  useEffect(() => {
    loadPosts();
  }, [user?.id, selectedSubhiveId, searchQuery, joinedSubhives, postsRetryCount]);

  // Sort and filter posts
  const sortedPosts = useMemo(() => {
    let posts = [...allPosts];

    // Apply sorting
    if (sortBy === "new") {
      posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "hot") {
      // Hot = combination of votes and recency
      posts.sort((a, b) => {
        const aScore = a.vote_count + (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const bScore = b.vote_count + (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return bScore - aScore;
      });
    } else if (sortBy === "top") {
      // Filter by time range first
      const now = Date.now();
      const timeRangeMs = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        all: Infinity,
      }[timeRange];

      posts = posts.filter(post => {
        const postTime = new Date(post.created_at).getTime();
        return now - postTime <= timeRangeMs;
      });

      // Sort by vote count
      posts.sort((a, b) => b.vote_count - a.vote_count);
    }

    return posts;
  }, [allPosts, sortBy, timeRange]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSelectSubhive = useCallback((subhiveId: string | null) => {
    setSelectedSubhiveId(subhiveId);
  }, []);

  const handleVote = async (postId: string, voteType: "upvote" | "downvote") => {
    // Will be implemented in task 6.3
    console.log("Vote:", postId, voteType);
    addToast({
      title: "Vote recorded",
      description: `You ${voteType}d this post`,
      variant: "success",
      duration: 2000,
    });
  };

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  return (
    <>
      {/* Skip to main content link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Background gradient */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' aria-hidden="true" />

      <div className='min-h-screen bg-background/80'>
        {/* Search bar - full width at top */}
        <div className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 transition-all duration-300'>
          <div className='container mx-auto page-container py-3 md:py-4 px-4 md:px-6 animate-fade-in'>
            <HiveSearchBar
              onSearch={handleSearch}
              placeholder="Search posts in your hives..."
              isLoading={isLoadingPosts}
            />
          </div>
        </div>

        {/* Main content grid */}
        <div className='container mx-auto page-container py-4 md:py-6 px-4 md:px-6'>
          {/* Desktop: 3-column grid, Tablet: 2-column, Mobile: stacked */}
          <div className='grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4 md:gap-6'>
            {/* Left sidebar - joined subhives and top subhives */}
            <aside className='space-y-4 md:space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden animate-slide-in-left' aria-label="Sidebar navigation">
              {/* Joined subhives list */}
              <section className='rounded-lg border border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 overflow-hidden transition-all duration-300 hover:shadow-lg' aria-labelledby="my-hives-heading">
                <div className='p-3 md:p-4 border-b border-border/50'>
                  <h2 id="my-hives-heading" className='text-xs md:text-sm font-semibold text-foreground'>My Hives</h2>
                </div>
                <div className='max-h-[300px] md:max-h-[400px] lg:max-h-[calc(50vh-8rem)] overflow-y-auto'>
                  {subhivesError ? (
                    <div className='p-6 text-center space-y-3'>
                      <AlertCircle className='h-8 w-8 text-destructive mx-auto' />
                      <p className='text-sm text-muted-foreground'>{subhivesError}</p>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setSubhivesRetryCount(0)}
                        className='gap-2'
                      >
                        <RefreshCw className='h-4 w-4' />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <JoinedSubhivesList
                      subhives={joinedSubhives}
                      selectedSubhiveId={selectedSubhiveId}
                      onSelectSubhive={handleSelectSubhive}
                      isLoading={isLoadingSubhives}
                    />
                  )}
                </div>
              </section>

              {/* Top subhives panel - hidden on mobile, shown on tablet+ */}
              <div className='hidden md:block'>
                <TopSubhivesPanel limit={5} />
              </div>
            </aside>

            {/* Center feed */}
            <main id="main-content" className='space-y-3 md:space-y-4 min-w-0 animate-fade-in-up' role="main" aria-label="Post feed">
              {/* Feed filters */}
              <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4'>
                <h1 id="feed-heading" className='text-xl md:text-2xl font-bold text-foreground transition-opacity duration-300'>
                  {searchQuery ? "Search Results" : selectedSubhiveId ? "Filtered Feed" : "All Posts"}
                </h1>
                <FeedFilters
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  timeRange={timeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                />
              </div>

              {/* Error state for posts */}
              {postsError && !isLoadingPosts && (
                <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center space-y-3'>
                  <AlertCircle className='h-8 w-8 text-destructive mx-auto' />
                  <div>
                    <p className='text-sm font-medium text-foreground mb-1'>Failed to load posts</p>
                    <p className='text-sm text-muted-foreground'>{postsError}</p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPostsRetryCount(0)}
                    className='gap-2'
                  >
                    <RefreshCw className='h-4 w-4' />
                    Retry
                  </Button>
                </div>
              )}

              {/* Post feed */}
              {!postsError && (
                <div role="feed" aria-labelledby="feed-heading" aria-busy={isLoadingPosts}>
                  <PostFeedList
                    posts={sortedPosts}
                    isLoading={isLoadingPosts}
                    onVote={handleVote}
                    currentUserId={user?.id}
                    hasMore={false}
                  />
                </div>
              )}
            </main>

            {/* Right panel - daily game widget */}
            <aside className='lg:sticky lg:top-24 lg:self-start' aria-label="Daily game">
              {user?.id && <DailyGameWidget userId={user.id} />}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

function HivePageContent() {
  return (
    <ToastProvider>
      <HivePageContentInner />
    </ToastProvider>
  );
}

export default function HivePage() {
  return (
    <ProtectedRoute requireVerified={false}>
      <HivePageContent />
    </ProtectedRoute>
  );
}
