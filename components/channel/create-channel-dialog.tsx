/** @format */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Hash } from "lucide-react";

const createChannelSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
});

type CreateChannelForm = z.infer<typeof createChannelSchema>;

interface CreateChannelDialogProps {
  onCreateChannel: (data: CreateChannelForm) => Promise<void>;
  isLoading?: boolean;
  trigger?: React.ReactNode;
  isAdmin?: boolean;
}

export function CreateChannelDialog({
  onCreateChannel,
  isLoading = false,
  trigger,
  isAdmin = false,
}: CreateChannelDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema),
  });

  const onSubmit = async (data: CreateChannelForm) => {
    try {
      await onCreateChannel(data);
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create channel:", error);
    }
  };

  // Only admins can see the trigger & dialog
  if (!isAdmin) return null;

  const defaultTrigger = (
    <Button className='gap-2 bg-primary hover:bg-primary/90 shadow-[0_0_24px_rgba(139,92,246,0.45)]'>
      <Plus className='h-4 w-4' />
      Create Channel
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className='sm:max-w-[480px] border-border/60 bg-card/95 backdrop-blur'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-primary'>
            <span className='inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <Hash className='h-4 w-4' />
            </span>
            Create official channel
          </DialogTitle>
          <DialogDescription className='text-sm text-muted-foreground'>
            Set up a dedicated space for a team, club, or activity. Members can
            join to receive announcements and chat in real time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Name */}
          <div className='space-y-2'>
            <Label
              htmlFor='name'
              className='text-sm font-medium text-foreground'>
              Channel name
            </Label>
            <Input
              id='name'
              placeholder='e.g. Football Team, Chess Club, Study Group'
              className='bg-background/60 border-border/60 text-foreground placeholder:text-muted-foreground'
              {...register("name")}
            />
            {errors.name && (
              <p className='text-xs text-destructive'>{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label
              htmlFor='description'
              className='text-sm font-medium text-foreground'>
              Description
            </Label>
            <textarea
              id='description'
              placeholder='Describe what this channel is for, who should join, and what gets shared here…'
              className='flex min-h-[90px] w-full resize-none rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50'
              {...register("description")}
            />
            {errors.description && (
              <p className='text-xs text-destructive'>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Info pill */}
          <div className='rounded-md border border-border/60 bg-background/70 px-3 py-2'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span className='h-2 w-2 rounded-full bg-primary' />
              <span>
                This channel will appear as an official, admin-managed space.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              className='border-border/60 text-muted-foreground hover:bg-background/80'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || isLoading}
              className='bg-primary hover:bg-primary/90'>
              {isSubmitting || isLoading ? "Creating…" : "Create channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
