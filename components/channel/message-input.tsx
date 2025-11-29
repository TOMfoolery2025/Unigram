/** @format */

"use client";

import {
  useState,
  useRef,
  KeyboardEvent,
  ChangeEvent,
  FocusEvent,
} from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  /**
   * Optional callback for typing indicator.
   * Called with true when user starts typing, false when they stop.
   */
  onTyping?: (isTyping: boolean) => void;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Write your message…",
  maxLength = 1000,
  onTyping,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const notifyTyping = (nextTyping: boolean) => {
    if (nextTyping === isTyping) return;
    setIsTyping(nextTyping);
    onTyping?.(nextTyping);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    const hasText = value.trim().length > 0;
    notifyTyping(hasText);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    // user left the field -> not typing anymore
    if (isTyping) {
      notifyTyping(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSendMessage(trimmed);
      setMessage("");
      notifyTyping(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isMessageValid =
    message.trim().length > 0 && message.length <= maxLength;

  return (
    <div className='flex items-center gap-3'>
      <input
        ref={inputRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled || isSubmitting}
        maxLength={maxLength}
        className='flex-1 rounded-lg border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20 transition-all'
      />

      {message.length > 0 && (
        <span className='hidden text-xs text-muted-foreground sm:inline'>
          {message.length}/{maxLength}
        </span>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!isMessageValid || isSubmitting || disabled}
        size='icon'
        className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors'
        aria-label='Send message'>
        {isSubmitting ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Send className='h-4 w-4' />
        )}
      </Button>
    </div>
  );
}
