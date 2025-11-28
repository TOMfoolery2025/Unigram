/**
 * Chat Sessions API Endpoint
 * Handles listing and creating chat sessions
 * Requirements: 5.1, 5.4, 10.3
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listSessions, createSession } from '@/lib/chat/sessions';
import { getMessageCount } from '@/lib/chat/messages';

/**
 * GET /api/chat/sessions
 * Retrieve all sessions for authenticated user with message counts
 */
export async function GET() {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Retrieve all sessions for user
    const sessions = await listSessions(user.id);
    
    // Get message counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const messageCount = await getMessageCount(session.id);
        return {
          ...session,
          messageCount,
        };
      })
    );
    
    return NextResponse.json(sessionsWithCounts);
    
  } catch (error: any) {
    console.error('Error listing chat sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/sessions
 * Create a new chat session for authenticated user
 */
export async function POST(request: Request) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse optional title from request body
    let title = 'New Conversation';
    try {
      const body = await request.json();
      if (body.title && typeof body.title === 'string') {
        title = body.title.trim();
      }
    } catch {
      // If no body or invalid JSON, use default title
    }
    
    // Create new session
    const session = await createSession(user.id, title);
    
    return NextResponse.json(session, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}
