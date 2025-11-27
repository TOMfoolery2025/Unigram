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
  placeholder = "Type a message...",
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
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isMessageValid =
    message.trim().length > 0 && message.length <= maxLength;

  return (
    <div className='flex gap-2 p-4 bg-gray-800 border-t border-gray-700'>
      <div className='flex-1 relative'>
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          className='bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 pr-12'
        />
        {message.length > 0 && (
          <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500'>
            {message.length}/{maxLength}
          </div>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!isMessageValid || isSubmitting || disabled}
        size='sm'
        className='bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed'>
        {isSubmitting ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Send className='h-4 w-4' />
        )}
      </Button>
    </div>
  );
}
