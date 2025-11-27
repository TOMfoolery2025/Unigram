/** @format */

"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message…",
  maxLength = 1000,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSubmitting || disabled) return;

    setIsSubmitting(true);
    try {
      await onSendMessage(trimmedMessage);
      setMessage("");
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
    <div className='flex items-center gap-2 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur'>
      <div className='relative flex-1'>
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          className='pr-14 bg-background border-border/60 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary'
        />
        {message.length > 0 && (
          <div className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground'>
            {message.length}/{maxLength}
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isMessageValid || isSubmitting || disabled}
        size='sm'
        className='shrink-0 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed'
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
