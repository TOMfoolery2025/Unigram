/**
 * Chat Session Management Service
 * Handles CRUD operations for chat sessions
 * Requirements: 10.3, 10.4
 */

import { createClient } from '@/lib/supabase/server';
import type { ChatSession, ChatSessionInsert, ChatSessionRow } from '@/types/chat';

/**
 * Error thrown when a session is not found
 */
export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Chat session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

/**
 * Error thrown when a user doesn't have permission to access a session
 */
export class SessionPermissionError extends Error {
  constructor(sessionId: string, userId: string) {
    super(`User ${userId} does not have permission to access session ${sessionId}`);
    this.name = 'SessionPermissionError';
  }
}

/**
 * Convert database row to ChatSession type
 */
function rowToSession(row: ChatSessionRow): ChatSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Create a new chat session for a user
 * @param userId - The ID of the user creating the session
 * @param title - Optional title for the session (defaults to "New Conversation")
 * @returns The created chat session
 * @throws Error if database operation fails
 */
export async function createSession(
  userId: string,
  title: string = 'New Conversation'
): Promise<ChatSession> {
  const supabase = await createClient();

  const sessionData: ChatSessionInsert = {
    user_id: userId,
    title,
  };

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`);
  }

  return rowToSession(data);
}

/**
 * Retrieve a specific chat session by ID
 * Verifies that the session belongs to the requesting user
 * @param sessionId - The ID of the session to retrieve
 * @param userId - The ID of the user requesting the session
 * @returns The chat session if found and owned by user
 * @throws SessionNotFoundError if session doesn't exist
 * @throws SessionPermissionError if user doesn't own the session
 */
export async function getSession(
  sessionId: string,
  userId: string
): Promise<ChatSession> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    throw new SessionNotFoundError(sessionId);
  }

  // Verify ownership
  if (data.user_id !== userId) {
    throw new SessionPermissionError(sessionId, userId);
  }

  return rowToSession(data);
}

/**
 * List all chat sessions for a user
 * Returns sessions ordered by most recently updated first
 * @param userId - The ID of the user whose sessions to retrieve
 * @returns Array of chat sessions owned by the user
 * @throws Error if database operation fails
 */
export async function listSessions(userId: string): Promise<ChatSession[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list chat sessions: ${error.message}`);
  }

  return (data || []).map(rowToSession);
}

/**
 * Delete a chat session and all associated messages
 * Verifies that the session belongs to the requesting user
 * @param sessionId - The ID of the session to delete
 * @param userId - The ID of the user requesting deletion
 * @throws SessionNotFoundError if session doesn't exist
 * @throws SessionPermissionError if user doesn't own the session
 * @throws Error if database operation fails
 */
export async function deleteSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // First verify the session exists and belongs to the user
  await getSession(sessionId, userId);

  // Delete the session (messages will be cascade deleted)
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete chat session: ${error.message}`);
  }
}

/**
 * Update the updated_at timestamp for a session
 * Called when new messages are added to keep sessions sorted correctly
 * @param sessionId - The ID of the session to update
 * @param userId - The ID of the user who owns the session
 * @throws SessionNotFoundError if session doesn't exist
 * @throws SessionPermissionError if user doesn't own the session
 */
export async function touchSession(
  sessionId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  // Verify ownership first
  await getSession(sessionId, userId);

  const { error } = await supabase
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update chat session: ${error.message}`);
  }
}

/**
 * Update the title of a chat session
 * @param sessionId - The ID of the session to update
 * @param userId - The ID of the user who owns the session
 * @param title - The new title for the session
 * @throws SessionNotFoundError if session doesn't exist
 * @throws SessionPermissionError if user doesn't own the session
 */
export async function updateSessionTitle(
  sessionId: string,
  userId: string,
  title: string
): Promise<void> {
  const supabase = await createClient();

  // Verify ownership first
  await getSession(sessionId, userId);

  const { error } = await supabase
    .from('chat_sessions')
    .update({ 
      title,
      updated_at: new Date().toISOString() 
    })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to update session title: ${error.message}`);
  }
}
