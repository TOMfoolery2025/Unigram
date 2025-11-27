/** @format */

"use client";

import { Users, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubforumWithMembership } from "@/types/forum";
import { formatDistanceToNow } from "date-fns";

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
  const handleMembershipToggle = () => {
    if (subforum.is_member) {
      onLeave?.(subforum.id);
    } else {
      onJoin?.(subforum.id);
    }
  };

  return (
    <Card className='hover:shadow-md transition-shadow cursor-pointer'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1' onClick={() => onView?.(subforum.id)}>
            <CardTitle className='text-lg font-semibold text-violet-400 hover:text-violet-300 transition-colors'>
              {subforum.name}
            </CardTitle>
            <CardDescription className='mt-1 text-sm text-gray-400'>
              {subforum.description}
            </CardDescription>
          </div>
          <Button
            variant={subforum.is_member ? "secondary" : "default"}
            size='sm'
            onClick={handleMembershipToggle}
            disabled={isLoading}
            className={
              subforum.is_member
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-violet-600 hover:bg-violet-700"
            }>
            {isLoading ? "..." : subforum.is_member ? "Leave" : "Join"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='flex items-center justify-between text-sm text-gray-500'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4' />
              <span>{subforum.member_count} members</span>
            </div>
            <div className='flex items-center gap-1'>
              <Calendar className='h-4 w-4' />
              <span>
                Created{" "}
                {formatDistanceToNow(new Date(subforum.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          {subforum.creator_name && (
            <span className='text-xs text-gray-600'>
              by {subforum.creator_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
