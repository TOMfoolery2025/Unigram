/**
 * Hive Feed API Endpoint
 * Fetches posts from joined subhives with search and filtering
 * Requirements: 1.2, 3.1
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { FeedResponse } from '@/types/game';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hives/feed
 * Get posts from joined subhives
 * Query params:
 *   - subhive_id: string (optional, filters to specific subhive)
 *   - search: string (optional, search query)
 *   - sort: "new" | "hot" | "top" (default "new")
 *   - page: number (default 0)
 *   - limit: number (default 20)
 */
export async function GET(request: Request) {
  try {
    // 1. Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const subhiveId = searchParams.get('subhive_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'new';
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // Validate parameters
    if (!['new', 'hot', 'top'].includes(sort)) {
      return NextResponse.json(
        { error: 'Invalid sort parameter. Must be "new", "hot", or "top"' },
        { status: 400 }
      );
    }
    
    if (page < 0) {
      return NextResponse.json(
        { error: 'Page must be non-negative' },
        { status: 400 }
      );
    }
    
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    // 3. Build the query
    let query = supabase
      .from('posts')
      .select(`
        id,
        subforum_id,
        author_id,
        title,
        content,
        is_anonymous,
        vote_count,
        created_at,
        updated_at,
        subforums!inner(
          id,
          name
        ),
        user_profiles!posts_author_id_fkey(
          display_name
        ),
        comments(count)
      `, { count: 'exact' });
    
    // 4. Filter by joined subhives
    if (subhiveId) {
      // Filter to specific subhive (must be joined)
      query = query
        .eq('subforum_id', subhiveId)
        .eq('subforums.subforum_memberships.user_id', user.id);
    } else {
      // Filter to all joined subhives
      query = query.eq('subforums.subforum_memberships.user_id', user.id);
    }
    
    // 5. Apply search filter
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`);
    }
    
    // 6. Apply sorting
    switch (sort) {
      case 'new':
        query = query.order('created_at', { ascending: false });
        break;
      case 'top':
        query = query.order('vote_count', { ascending: false });
        break;
      case 'hot':
        // Hot = combination of votes and recency
        // For now, we'll use vote_count as primary, created_at as secondary
        // A more sophisticated algorithm could be implemented later
        query = query
          .order('vote_count', { ascending: false })
          .order('created_at', { ascending: false });
        break;
    }
    
    // 7. Apply pagination
    const offset = page * limit;
    query = query.range(offset, offset + limit - 1);
    
    // 8. Execute query
    const { data: posts, error: postsError, count } = await query;
    
    if (postsError) {
      console.error('Error fetching feed:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch feed' },
        { status: 500 }
      );
    }
    
    // 9. Get user's votes for these posts
    const postIds = (posts || []).map((p: any) => p.id);
    let userVotes: Record<string, 'upvote' | 'downvote'> = {};
    
    if (postIds.length > 0) {
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('post_id, vote_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      if (!votesError && votes) {
        userVotes = votes.reduce((acc: any, vote: any) => {
          acc[vote.post_id] = vote.vote_type;
          return acc;
        }, {});
      }
    }
    
    // 10. Format response
    const formattedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      subforum_id: post.subforum_id,
      subforum_name: post.subforums?.name || 'Unknown',
      author_id: post.author_id,
      author_name: post.is_anonymous ? null : (post.user_profiles?.display_name || null),
      title: post.title,
      content: post.content,
      is_anonymous: post.is_anonymous,
      vote_count: post.vote_count,
      comment_count: post.comments?.[0]?.count || 0,
      user_vote: userVotes[post.id] || null,
      created_at: post.created_at,
      updated_at: post.updated_at,
    }));
    
    const total = count || 0;
    const hasMore = offset + limit < total;
    
    const response: FeedResponse = {
      posts: formattedPosts,
      hasMore,
      total,
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error in feed endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
