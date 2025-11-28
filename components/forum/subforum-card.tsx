/** @format */

"use client";

import { useRouter } from "next/navigation";
import { Users, Calendar } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubforumWithMembership } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/profile/user-avatar";

interface SubforumCardProps {
  subforum: SubforumWithMembership;
  onJoin?: (subforumId: string) => void;
  onLeave?: (subforumId: string) => void;
  onView?: (subforumId: string) => void;
  isLoading?: boolean;
}

export function SubforumCard({
  subforum,
  onJoin,
  onLeave,
  onView,
  isLoading = false,
}: SubforumCardProps) {
  const router = useRouter();
  
  const handleMembershipToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subforum.is_member) {
      onLeave?.(subforum.id);
    } else {
      onJoin?.(subforum.id);
    }
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subforum.creator_id) {
      router.push(`/profile/${subforum.creator_id}`);
    }
  };

  const createdLabel = formatDistanceToNow(new Date(subforum.created_at), {
    addSuffix: true,
  });

  return (
    <Card
      className='card-hover-glow border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 cursor-pointer transition-transform hover:-translate-y-0.5'
      onClick={() => onView?.(subforum.id)}>
      <CardHeader className='flex flex-row items-start justify-between gap-3 pb-3'>
        <div className='space-y-1'>
          <CardTitle className='text-base md:text-lg font-semibold text-foreground hover:text-primary transition-colors'>
            {subforum.name}
          </CardTitle>

          {subforum.description && (
            <CardDescription className='text-xs md:text-sm text-muted-foreground line-clamp-2'>
              {subforum.description}
            </CardDescription>
          )}

          <div className='mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground'>
            <span className='inline-flex items-center gap-1.5'>
              <Users className='h-3.5 w-3.5' />
              <span>
                {subforum.member_count} member
                {subforum.member_count === 1 ? "" : "s"}
              </span>
            </span>

            <span className='inline-flex items-center gap-1.5'>
              <Calendar className='h-3.5 w-3.5' />
              <span>Created {createdLabel}</span>
            </span>

            {subforum.creator_id && subforum.creator_name && (
              <span 
                className='inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80 cursor-pointer hover:text-primary transition-colors'
                onClick={handleCreatorClick}
              >
                <UserAvatar
                  userId={subforum.creator_id}
                  displayName={subforum.creator_name}
                  size="sm"
                  className="h-4 w-4"
                />
                <span>by {subforum.creator_name}</span>
              </span>
            )}
          </div>
        </div>

        <div className='flex flex-col items-end gap-2'>
          {subforum.is_member && (
            <Badge
              variant='outline'
              className='border-emerald-500/50 bg-emerald-500/5 text-[11px] text-emerald-300'>
              Joined
            </Badge>
          )}
          <Button
            variant={subforum.is_member ? "outline" : "default"}
            size='sm'
            onClick={handleMembershipToggle}
            disabled={isLoading}
            className={
              subforum.is_member
                ? "border-border/70 text-foreground hover:bg-muted/60"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }>
            {isLoading ? "…" : subforum.is_member ? "Leave" : "Join"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='pt-0' />
    </Card>
  );
}
