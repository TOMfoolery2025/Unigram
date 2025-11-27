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

  const containerClass =
    orientation === "vertical"
      ? "flex flex-col items-center gap-1"
      : "flex items-center gap-2";

  const formatVoteCount = (count: number) => {
    if (Math.abs(count) >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count.toString();
  };

  return (
    <div className={containerClass}>
      <Button
        variant='ghost'
        size={buttonSize}
        onClick={() => handleVote("upvote")}
        disabled={disabled}
        className={cn(
          "text-gray-400 hover:text-green-400 transition-colors",
          userVote === "upvote" &&
            "text-green-400 bg-green-900/20 hover:bg-green-900/30"
        )}>
        <ChevronUp className={iconSize} />
      </Button>

      <span
        className={cn(
          "font-medium transition-colors min-w-[2rem] text-center",
          voteCount > 0 && "text-green-400",
          voteCount < 0 && "text-red-400",
          voteCount === 0 && "text-gray-400",
          size === "lg" && "text-base",
          size === "md" && "text-sm",
          size === "sm" && "text-xs"
        )}>
        {formatVoteCount(voteCount)}
      </span>

      <Button
        variant='ghost'
        size={buttonSize}
        onClick={() => handleVote("downvote")}
        disabled={disabled}
        className={cn(
          "text-gray-400 hover:text-red-400 transition-colors",
          userVote === "downvote" &&
            "text-red-400 bg-red-900/20 hover:bg-red-900/30"
        )}>
        <ChevronDown className={iconSize} />
      </Button>
    </div>
  );
}
