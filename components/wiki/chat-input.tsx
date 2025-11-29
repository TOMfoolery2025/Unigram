'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ChatInput component
 * Text input with send button, keyboard shortcuts, and validation
 * Requirements: 1.1
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a question about TUM...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    // Validate non-empty messages - Requirement 1.1
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    onSend(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle Enter key to send (Shift+Enter for new line) - Requirement 1.1
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-3 md:p-4 shrink-0 safe-bottom chat-input-container">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        role="form" 
        aria-label="Send message form"
      >
        <div className="flex gap-2 items-end">
          <label htmlFor="chat-message-input" className="sr-only">
            Type your message
          </label>
          <Textarea
            id="chat-message-input"
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              // Mobile: Larger touch target and better font size for iOS
              'min-h-[48px] md:min-h-[52px] max-h-[140px] md:max-h-[180px]',
              'resize-none text-[16px] md:text-sm leading-relaxed',
              'touch-manipulation no-zoom',
              // Better mobile padding
              'px-3 py-3 md:px-3 md:py-2',
              // Prevent zoom on focus (iOS)
              'focus:text-[16px]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            rows={1}
            aria-label="Type your message about TUM"
            aria-describedby="chat-input-help"
            aria-required="true"
            aria-invalid={false}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck="true"
            enterKeyHint="send"
          />
          <Button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            size="icon"
            className="shrink-0 h-[48px] w-[48px] md:h-[52px] md:w-[52px] touch-manipulation active:scale-95 transition-transform bg-blue-500 hover:bg-blue-600 text-white"
            aria-label={disabled ? 'Please wait, message is being sent' : 'Send message'}
            type="submit"
          >
            <Send className="h-5 w-5 md:h-5 md:w-5" aria-hidden="true" />
          </Button>
        </div>
        <p id="chat-input-help" className="text-xs text-muted-foreground mt-2 hidden md:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
