/**
 * Game Score API Endpoint
 * Handles submission of daily puzzle game scores
 * Requirements: 4.3, 4.4
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SubmitScoreRequest, SubmitScoreResponse } from '@/types/game';

/**
 * POST /api/hives/game-score
 * Submit a score for the daily game
 */
export async function POST(request: Request) {
  try {
    // 1. Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 2. Validate request payload
    const body: SubmitScoreRequest = await request.json();
    const { score, game_date } = body;
    
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid score' },
        { status: 400 }
      );
    }
    
    if (!game_date || !/^\d{4}-\d{2}-\d{2}$/.test(game_date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game_date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    // 3. Check if user has already played today
    const { data: existingScore, error: checkError } = await supabase
      .from('game_scores')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_date', game_date)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing score:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing score' },
        { status: 500 }
      );
    }
    
    if (existingScore) {
      return NextResponse.json(
        { success: false, error: 'You have already played today' },
        { status: 409 }
      );
    }
    
    // 4. Insert the score
    const { error: insertError } = await supabase
      .from('game_scores')
      .insert({
        user_id: user.id,
        game_date,
        score,
        completed_at: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('Error inserting score:', insertError);
      
      // Check if it's a unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'You have already played today' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to submit score' },
        { status: 500 }
      );
    }
    
    // 5. Get user's rank for the day
    const { data: rankData, error: rankError } = await supabase
      .rpc('get_user_rank', {
        p_user_id: user.id,
        p_game_date: game_date,
      });
    
    let rank: number | undefined;
    if (!rankError && rankData !== null) {
      rank = rankData;
    }
    
    // 6. Return success response
    const response: SubmitScoreResponse = {
      success: true,
      rank,
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error: any) {
    console.error('Error in game score endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
