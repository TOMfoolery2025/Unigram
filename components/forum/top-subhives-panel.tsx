/** @format */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubhiveActivity } from "@/types/game";
import { cn } from "@/lib/utils";

interface TopSubhivesPanelProps {
  limit?: number;
  onViewSubhive?: (subhiveId: string) => void;
}

export function TopSubhivesPanel({
  limit = 5,
  onViewSubhive,
}: TopSubhivesPanelProps) {
  const router = useRouter();
  const [subhives, setSubhives] = useState<SubhiveActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopSubhives();
  }, [limit]);

  const fetchTopSubhives = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/hives/top-subhives?limit=${limit}&days=7`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch top subhives");
      }

      const data = await response.json();
      setSubhives(data.subhives || []);
    } catch (err) {
      console.error("Error fetching top subhives:", err);
      setError("Failed to load top subhives");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubhiveClick = (subhiveId: string) => {
    if (onViewSubhive) {
      onViewSubhive(subhiveId);
    } else {
      router.push(`/hives/${subhiveId}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Subhives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Subhives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTopSubhives}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subhives.length === 0) {
    return (
      <Card className="border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Subhives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No active subhives found
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 animate-slide-in-right h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Top Subhives
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Most active in the last 7 days
        </p>
      </CardHeader>
      <CardContent className="space-y-2 flex-1 overflow-y-auto pr-1">
        {subhives.map((subhive, index) => (
          <button
            key={subhive.id}
            onClick={() => handleSubhiveClick(subhive.id)}
            className={cn(
              "w-full p-3 rounded-lg border border-border/50 bg-card/50 min-h-[44px]",
              "hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
              "text-left animate-slide-in-up",
              `stagger-${Math.min(index + 1, 5)}`
            )}
            aria-label={`View ${subhive.name} subhive, ranked #${index + 1} with ${subhive.member_count} members`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {subhive.name}
                  </h4>
                </div>
                
                {subhive.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {subhive.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" aria-label={`${subhive.member_count} members`}>
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {subhive.member_count}
                  </span>
                  
                  {(subhive.post_count_7d > 0 || subhive.comment_count_7d > 0) && (
                    <span className="flex items-center gap-1" aria-label={`${subhive.post_count_7d + subhive.comment_count_7d} posts and comments`}>
                      <MessageSquare className="h-3 w-3" aria-hidden="true" />
                      {subhive.post_count_7d + subhive.comment_count_7d}
                    </span>
                  )}
                </div>
              </div>

              {/* Activity indicator */}
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    subhive.activity_score > 50
                      ? "bg-green-500"
                      : subhive.activity_score > 20
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  )}
                  role="img"
                  aria-label={`Activity level: ${subhive.activity_score > 50 ? 'high' : subhive.activity_score > 20 ? 'medium' : 'low'}`}
                />
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
