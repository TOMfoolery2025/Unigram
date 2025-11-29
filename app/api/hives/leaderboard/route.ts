/**
 * Leaderboard API Endpoint
 * Fetches daily game leaderboard
 * Requirements: 4.5
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeaderboardResponse } from '@/types/game';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hives/leaderboard
 * Get the leaderboard for a specific date
 * Query params:
 *   - date: YYYY-MM-DD (defaults to today)
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    // 3. Fetch leaderboard data
    const { data: scores, error: scoresError } = await supabase
      .from('game_scores')
      .select(`
        user_id,
        score,
        user_profiles!inner(
          display_name,
          avatar_url
        )
      `)
      .eq('game_date', date)
      .order('score', { ascending: false })
      .limit(10);
    
    if (scoresError) {
      console.error('Error fetching leaderboard:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }
    
    // 4. Format response with ranks
    const leaderboard = (scores || []).map((entry: any, index: number) => ({
      user_id: entry.user_id,
      display_name: entry.user_profiles?.display_name || 'Anonymous',
      avatar_url: entry.user_profiles?.avatar_url || null,
      score: entry.score,
      rank: index + 1,
    }));
    
    const response: LeaderboardResponse = {
      leaderboard,
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error in leaderboard endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
