/**
 * Has Played API Endpoint
 * Checks if user has played the daily game
 * Requirements: 4.4
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { HasPlayedResponse } from '@/types/game';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hives/has-played
 * Check if user has played the game for a specific date
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
    
    // 3. Check if user has played
    const { data: score, error: scoreError } = await supabase
      .from('game_scores')
      .select('score')
      .eq('user_id', user.id)
      .eq('game_date', date)
      .single();
    
    if (scoreError && scoreError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking if user has played:', scoreError);
      return NextResponse.json(
        { error: 'Failed to check play status' },
        { status: 500 }
      );
    }
    
    // 4. If user has played, get their rank
    let rank: number | undefined;
    if (score) {
      const { data: rankData, error: rankError } = await supabase
        .rpc('get_user_rank', {
          p_user_id: user.id,
          p_game_date: date,
        });
      
      if (!rankError && rankData !== null) {
        rank = rankData;
      }
    }
    
    // 5. Format response
    const response: HasPlayedResponse = {
      has_played: !!score,
      score: score?.score,
      rank,
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error in has-played endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
