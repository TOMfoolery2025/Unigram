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
  const handleMembershipToggle = () => {
    if (channel.is_member) {
      onLeave?.(channel.id);
    } else {
      onJoin?.(channel.id);
    }
  };

  return (
    <Card className='hover:shadow-md transition-shadow cursor-pointer bg-gray-800 border-gray-700 h-full flex flex-col'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1' onClick={() => onView?.(channel.id)}>
            <CardTitle className='text-lg font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2'>
              <Hash className='h-4 w-4' />
              {channel.name}
            </CardTitle>
            <CardDescription className='mt-1 text-sm text-gray-400'>
              {channel.description}
            </CardDescription>
          </div>
          <Button
            variant={channel.is_member ? "secondary" : "default"}
            size='sm'
            onClick={handleMembershipToggle}
            disabled={isLoading}
            className={
              channel.is_member
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }>
            {isLoading ? "..." : channel.is_member ? "Leave" : "Join"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='pt-0 pb-4 flex flex-col flex-grow'>
        <div className='flex flex-col gap-1 text-sm text-gray-500 mb-4'>
          <div className='flex items-center gap-1'>
            <Users className='h-4 w-4' />
            <span>{channel.member_count} members</span>
          </div>
          <div className='flex items-center gap-1'>
            <Calendar className='h-4 w-4' />
            <span>
              Created{" "}
              {formatDistanceToNow(new Date(channel.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        <div className='flex items-center justify-between mt-auto'>
          <div className='flex items-center gap-1 text-xs text-violet-400'>
            <div className='w-2 h-2 bg-violet-400 rounded-full'></div>
            <span>Official Channel</span>
          </div>
          {channel.creator_name && (
            <span className='text-xs text-gray-600'>
              by {channel.creator_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
