/**
 * Chat Session by ID API Endpoint
 * Handles retrieving and deleting specific chat sessions
 * Requirements: 4.6, 5.1, 10.3
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession, deleteSession } from '@/lib/chat/sessions';
import { getMessages } from '@/lib/chat/messages';

/**
 * GET /api/chat/sessions/[id]
 * Retrieve a specific session with all messages
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const sessionId = params.id;
    
    // Retrieve session (verifies ownership)
    let session;
    try {
      session = await getSession(sessionId, user.id);
    } catch (error: any) {
      if (error.name === 'SessionNotFoundError') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      if (error.name === 'SessionPermissionError') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      throw error;
    }
    
    // Retrieve all messages for the session
    const messages = await getMessages(sessionId);
    
    // Return session with messages
    return NextResponse.json({
      ...session,
      messages,
    });
    
  } catch (error: any) {
    console.error('Error retrieving chat session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/sessions/[id]
 * Delete a specific session and all associated messages
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const sessionId = params.id;
    
    // Delete session (verifies ownership)
    try {
      await deleteSession(sessionId, user.id);
    } catch (error: any) {
      if (error.name === 'SessionNotFoundError') {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      if (error.name === 'SessionPermissionError') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
      throw error;
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}
