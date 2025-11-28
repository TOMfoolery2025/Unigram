/**
 * Chat Message Storage Service
 * Handles saving and retrieving chat messages from database
 * Requirements: 1.3, 10.4
 */

import { createClient } from '@/lib/supabase/server';
import type { 
  ChatMessage, 
  ChatMessageInsert, 
  ChatMessageRow,
  ArticleSource 
} from '@/types/chat';
import { touchSession } from './sessions';

/**
 * Error thrown when a message is not found
 */
export class MessageNotFoundError extends Error {
  constructor(messageId: string) {
    super(`Chat message not found: ${messageId}`);
    this.name = 'MessageNotFoundError';
  }
}

/**
 * Convert database row to ChatMessage type
 */
function rowToMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    sources: row.sources as ArticleSource[] | undefined,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Save a new message to the database
 * @param sessionId - The ID of the session this message belongs to
 * @param userId - The ID of the user who owns the session (for verification)
 * @param role - The role of the message sender ('user' or 'assistant')
 * @param content - The message content
 * @param sources - Optional array of article sources cited in the message
 * @returns The created chat message
 * @throws Error if database operation fails
 */
export async function saveMessage(
  sessionId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: ArticleSource[]
): Promise<ChatMessage> {
  const supabase = await createClient();

  const messageData: ChatMessageInsert = {
    session_id: sessionId,
    role,
    content,
    sources: sources || null,
  };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messageData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save chat message: ${error.message}`);
  }

  // Update the session's updated_at timestamp
  try {
    await touchSession(sessionId, userId);
  } catch (err) {
    // Log but don't fail if touch fails
    console.error('Failed to update session timestamp:', err);
  }

  return rowToMessage(data);
}

/**
 * Retrieve all messages for a specific session
 * Returns messages ordered by creation time (oldest first)
 * @param sessionId - The ID of the session whose messages to retrieve
 * @returns Array of chat messages in chronological order
 * @throws Error if database operation fails
 */
export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to retrieve chat messages: ${error.message}`);
  }

  return (data || []).map(rowToMessage);
}

/**
 * Retrieve a specific message by ID
 * @param messageId - The ID of the message to retrieve
 * @returns The chat message
 * @throws MessageNotFoundError if message doesn't exist
 */
export async function getMessage(messageId: string): Promise<ChatMessage> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (error || !data) {
    throw new MessageNotFoundError(messageId);
  }

  return rowToMessage(data);
}

/**
 * Get the count of messages in a session
 * Useful for displaying session metadata
 * @param sessionId - The ID of the session
 * @returns The number of messages in the session
 */
export async function getMessageCount(sessionId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to count messages: ${error.message}`);
  }

  return count || 0;
}

/**
 * Delete a specific message
 * @param messageId - The ID of the message to delete
 * @throws MessageNotFoundError if message doesn't exist
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

/**
 * Get the most recent message in a session
 * Useful for generating session titles or previews
 * @param sessionId - The ID of the session
 * @returns The most recent message, or null if session has no messages
 */
export async function getLatestMessage(
  sessionId: string
): Promise<ChatMessage | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToMessage(data);
}

/**
 * Save multiple messages in a batch
 * More efficient than calling saveMessage multiple times
 * @param sessionId - The ID of the session
 * @param userId - The ID of the user who owns the session
 * @param messages - Array of messages to save
 * @returns Array of created chat messages
 */
export async function saveMessages(
  sessionId: string,
  userId: string,
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    sources?: ArticleSource[];
  }>
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const messageData: ChatMessageInsert[] = messages.map(msg => ({
    session_id: sessionId,
    role: msg.role,
    content: msg.content,
    sources: msg.sources || null,
  }));

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messageData)
    .select();

  if (error) {
    throw new Error(`Failed to save chat messages: ${error.message}`);
  }

  // Update the session's updated_at timestamp
  try {
    await touchSession(sessionId, userId);
  } catch (err) {
    console.error('Failed to update session timestamp:', err);
  }

  return (data || []).map(rowToMessage);
}
