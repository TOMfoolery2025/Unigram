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
    <div className='border-t border-border/60 bg-background/95 px-4 py-3'>
      <div className='mx-auto flex max-w-4xl items-center gap-3 rounded-full border border-primary/40 bg-background/80 px-4 py-2 shadow-[0_0_0_1px_rgba(139,92,246,0.35)] transition-shadow hover:shadow-[0_0_0_2px_rgba(139,92,246,0.7)]'>
        <input
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          className='flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground'
        />

        {message.length > 0 && (
          <span className='hidden text-[11px] text-muted-foreground sm:inline'>
            {message.length}/{maxLength}
          </span>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isMessageValid || isSubmitting || disabled}
          size='icon'
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed'
          aria-label='Send message'>
          {isSubmitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Send className='h-4 w-4' />
          )}
        </Button>
      </div>
    </div>
  );
}
