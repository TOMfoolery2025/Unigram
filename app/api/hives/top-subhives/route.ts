/**
 * Top Subhives API Endpoint
 * Fetches popular subhives based on recent activity
 * Requirements: 5.2, 5.5
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TopSubhivesResponse } from '@/types/game';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hives/top-subhives
 * Get the most popular subhives by activity
 * Query params:
 *   - limit: number (default 5)
 *   - days: number (default 7)
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
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    // Validate parameters
    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 20' },
        { status: 400 }
      );
    }
    
    if (days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 30' },
        { status: 400 }
      );
    }
    
    // 3. Calculate the date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateThresholdISO = dateThreshold.toISOString();
    
    // 4. Fetch subhives with activity metrics
    // We'll use a raw query to calculate activity scores
    const { data: subhives, error: subhivesError } = await supabase.rpc(
      'get_top_subhives',
      {
        p_limit: limit,
        p_date_threshold: dateThresholdISO,
      }
    );
    
    if (subhivesError) {
      console.error('Error fetching top subhives:', subhivesError);
      
      // Fallback: fetch subhives by member count if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('subforums')
        .select('id, name, description, member_count')
        .order('member_count', { ascending: false })
        .limit(limit);
      
      if (fallbackError) {
        console.error('Error in fallback query:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to fetch top subhives' },
          { status: 500 }
        );
      }
      
      // Format fallback response
      const response: TopSubhivesResponse = {
        subhives: (fallbackData || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          member_count: s.member_count,
          post_count_7d: 0,
          comment_count_7d: 0,
          activity_score: s.member_count,
        })),
      };
      
      return NextResponse.json(response);
    }
    
    // 5. Format response
    const response: TopSubhivesResponse = {
      subhives: subhives || [],
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Error in top subhives endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
