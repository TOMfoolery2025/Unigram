/** @format */

"use client";

import { Users, Calendar, Hash } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChannelWithMembership } from "@/types/channel";
import { formatDistanceToNow } from "date-fns";

interface ChannelCardProps {
  channel: ChannelWithMembership;
  onJoin?: (channelId: string) => void;
  onLeave?: (channelId: string) => void;
  onView?: (channelId: string) => void;
  isLoading?: boolean;
}

export function ChannelCard({
  channel,
  onJoin,
  onLeave,
  onView,
  isLoading = false,
}: ChannelCardProps) {
  const handleMembershipToggle = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    if (channel.is_member) {
      onLeave?.(channel.id);
    } else {
      onJoin?.(channel.id);
    }
  };

  const createdLabel = formatDistanceToNow(new Date(channel.created_at), {
    addSuffix: true,
  });

  return (
    <Card
      className='card-hover-glow border-border/70 bg-gradient-to-br from-card/95 via-background/80 to-background/90 cursor-pointer transition-transform hover:-translate-y-0.5 h-full flex flex-col'
      onClick={() => onView?.(channel.id)}>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 space-y-1'>
            <CardTitle className='text-base md:text-lg font-semibold text-primary flex items-center gap-2'>
              <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary'>
                <Hash className='h-3.5 w-3.5' />
              </span>
              <span className='line-clamp-1'>{channel.name}</span>
            </CardTitle>

            {channel.description && (
              <CardDescription className='mt-1 text-xs md:text-sm text-muted-foreground line-clamp-2'>
                {channel.description}
              </CardDescription>
            )}
          </div>

          <div className='flex flex-col items-end gap-2'>
            {channel.is_member && (
              <Badge
                variant='outline'
                className='px-2 py-0.5 text-[10px] border-emerald-500/50 text-emerald-300'>
                Joined
              </Badge>
            )}
            <Button
              variant={channel.is_member ? "outline" : "default"}
              size='sm'
              disabled={isLoading}
              onClick={handleMembershipToggle}
              className={
                channel.is_member
                  ? "border-border/70 text-xs"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              }>
              {isLoading ? "..." : channel.is_member ? "Leave" : "Join"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-0 pb-4 flex flex-col flex-1'>
        <div className='flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground mb-3'>
          <div className='flex items-center gap-1'>
            <Users className='h-3.5 w-3.5' />
            <span>
              {channel.member_count} member
              {channel.member_count === 1 ? "" : "s"}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <Calendar className='h-3.5 w-3.5' />
            <span>Created {createdLabel}</span>
          </div>
        </div>

        <div className='mt-auto flex items-center justify-between pt-2 border-t border-border/50'>
          <div className='flex items-center gap-2 text-[11px] text-primary'>
            <span className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' />
            <span>Official channel</span>
          </div>
          {channel.creator_name && (
            <span className='text-[11px] text-muted-foreground'>
              by {channel.creator_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
