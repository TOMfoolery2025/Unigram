/** @format */

"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubforumWithMembership } from "@/types/forum";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface JoinedSubhivesListProps {
  subhives: SubforumWithMembership[];
  selectedSubhiveId?: string | null;
  onSelectSubhive: (subhiveId: string | null) => void;
  isLoading?: boolean;
}

export function JoinedSubhivesList({
  subhives,
  selectedSubhiveId,
  onSelectSubhive,
  isLoading = false,
}: JoinedSubhivesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!subhives || subhives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="rounded-full bg-muted p-4">
          <Home className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">No Subhives Joined</h3>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Discover and join subhives to see posts in your feed
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => onSelectSubhive(null)}
          className="mt-2"
        >
          Discover Subhives
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full [&>div>div]:!overflow-y-auto [&>div>div]:scrollbar-none [&_[data-radix-scroll-area-scrollbar]]:hidden">
      <nav className="space-y-1 p-2" aria-label="Joined subhives navigation">
        {/* All Hives option */}
        <button
          onClick={() => onSelectSubhive(null)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-h-[44px]",
            "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background",
            selectedSubhiveId === null
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "text-foreground"
          )}
          aria-label="View all hives"
          aria-current={selectedSubhiveId === null ? "page" : undefined}
        >
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>All Hives</span>
          </div>
          {selectedSubhiveId === null && (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* Joined subhives */}
        {subhives.map((subhive) => (
          <button
            key={subhive.id}
            onClick={() => onSelectSubhive(subhive.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 min-h-[44px]",
              "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background",
              selectedSubhiveId === subhive.id
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "text-foreground"
            )}
            aria-label={`View ${subhive.name} subhive with ${subhive.member_count} members`}
            aria-current={selectedSubhiveId === subhive.id ? "page" : undefined}
          >
            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
              <span className="truncate w-full text-left">{subhive.name}</span>
              {subhive.member_count !== undefined && (
                <span className="text-xs text-muted-foreground" aria-hidden="true">
                  {subhive.member_count} member{subhive.member_count === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {selectedSubhiveId === subhive.id && (
              <ChevronRight className="h-4 w-4 flex-shrink-0 ml-2" aria-hidden="true" />
            )}
          </button>
        ))}
      </nav>
    </ScrollArea>
  );
}
