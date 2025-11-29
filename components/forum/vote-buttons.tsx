/** @format */

"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  voteCount: number;
  userVote?: "upvote" | "downvote" | null;
  onVote?: (voteType: "upvote" | "downvote") => Promise<void>;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
}

export function VoteButtons({
  voteCount,
  userVote,
  onVote,
  disabled = false,
  size = "sm",
  orientation = "horizontal",
}: VoteButtonsProps) {
  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (disabled || !onVote) return;
    await onVote(voteType);
  };

  const buttonSize = size === "lg" ? "default" : "sm";
  const iconSize =
    size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3 w-3";

  const containerClass = cn(
    orientation === "vertical"
      ? "flex flex-col items-center gap-1"
      : "inline-flex items-center gap-2"
  );

  const formatVoteCount = (count: number) => {
    if (Math.abs(count) >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count.toString();
  };

  return (
    <div className={containerClass} role="group" aria-label="Vote on post">
      <Button
        variant='ghost'
        size={buttonSize}
        onClick={() => handleVote("upvote")}
        disabled={disabled}
        className={cn(
          "rounded-full text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors min-h-[44px] min-w-[44px]",
          "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1",
          userVote === "upvote" &&
            "text-orange-500 bg-orange-500/15 hover:bg-orange-500/20"
        )}
        aria-label="Upvote"
        aria-pressed={userVote === "upvote"}>
        <ChevronUp className={iconSize} aria-hidden="true" />
      </Button>

      <span
        className={cn(
          "tabular-nums font-medium min-w-[2rem] text-center px-1.5 py-0.5 rounded-md border border-border/40 bg-background/70 text-foreground/80 text-xs",
          size === "md" && "text-[0.8rem]",
          size === "lg" && "text-sm px-2 py-1",
          voteCount > 0 && "border-orange-500/40",
          voteCount < 0 && "border-destructive/40"
        )}
        role="status"
        aria-live="polite"
        aria-label={`${voteCount} votes`}>
        {formatVoteCount(voteCount)}
      </span>

      <Button
        variant='ghost'
        size={buttonSize}
        onClick={() => handleVote("downvote")}
        disabled={disabled}
        className={cn(
          "rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-h-[44px] min-w-[44px]",
          "focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1",
          userVote === "downvote" &&
            "text-destructive bg-destructive/15 hover:bg-destructive/20"
        )}
        aria-label="Downvote"
        aria-pressed={userVote === "downvote"}>
        <ChevronDown className={iconSize} aria-hidden="true" />
      </Button>
    </div>
  );
}
