-- Row Level Security (RLS) Policies for Chat Tables
-- This migration enables RLS and creates security policies for chat_sessions and chat_messages

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON CHAT TABLES
-- ============================================================================

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHAT SESSIONS POLICIES
-- ============================================================================

-- Users can only view their own chat sessions
CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own chat sessions
CREATE POLICY "Users can create their own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own chat sessions
CREATE POLICY "Users can update their own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHAT MESSAGES POLICIES
-- ============================================================================

-- Users can only view messages from their own chat sessions
CREATE POLICY "Users can view messages from their own sessions"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id
      AND user_id = auth.uid()
    )
  );

-- Users can create messages in their own chat sessions
CREATE POLICY "Users can create messages in their own sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id
      AND user_id = auth.uid()
    )
  );

-- Users can update messages in their own chat sessions
CREATE POLICY "Users can update messages in their own sessions"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id
      AND user_id = auth.uid()
    )
  );

-- Users can delete messages in their own chat sessions
CREATE POLICY "Users can delete messages in their own sessions"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id
      AND user_id = auth.uid()
    )
  );
