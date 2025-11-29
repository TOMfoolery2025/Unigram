/** @format */

"use client";

import { Flame, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SortOption = "new" | "hot" | "top";
export type TimeRange = "day" | "week" | "month" | "all";

interface FeedFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  className?: string;
}

export function FeedFilters({
  sortBy,
  onSortChange,
  timeRange = "week",
  onTimeRangeChange,
  className,
}: FeedFiltersProps) {
  const sortOptions: Array<{
    value: SortOption;
    label: string;
    icon: React.ReactNode;
  }> = [
    { value: "new", label: "New", icon: <Clock className="h-4 w-4" /> },
    { value: "hot", label: "Hot", icon: <Flame className="h-4 w-4" /> },
    { value: "top", label: "Top", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  const timeRangeOptions: Array<{ value: TimeRange; label: string }> = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "all", label: "All Time" },
  ];

  const getTimeRangeLabel = () => {
    const option = timeRangeOptions.find((opt) => opt.value === timeRange);
    return option?.label || "This Week";
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)} role="group" aria-label="Feed sorting and filtering options">
      {/* Sort buttons */}
      <div className="inline-flex items-center rounded-md bg-muted p-1" role="group" aria-label="Sort options">
        {sortOptions.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() => onSortChange(option.value)}
            className={cn(
              "gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 min-h-[44px]",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              sortBy === option.value
                ? "bg-background text-foreground shadow-sm scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
            aria-label={`Sort by ${option.label}`}
            aria-pressed={sortBy === option.value}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span>{option.label}</span>
          </Button>
        ))}
      </div>

      {/* Time range dropdown (only shown for "top" sort) */}
      {sortBy === "top" && onTimeRangeChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm font-medium"
            >
              <span className="text-muted-foreground">From:</span>
              {getTimeRangeLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {timeRangeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                className={cn(
                  "cursor-pointer",
                  timeRange === option.value && "bg-accent"
                )}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
