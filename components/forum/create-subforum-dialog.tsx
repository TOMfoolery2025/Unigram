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
import { Plus } from "lucide-react";

const createSubforumSchema = z.object({
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

type CreateSubforumForm = z.infer<typeof createSubforumSchema>;

interface CreateSubforumDialogProps {
  onCreateSubforum: (data: CreateSubforumForm) => Promise<void>;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

export function CreateSubforumDialog({
  onCreateSubforum,
  isLoading = false,
  trigger,
}: CreateSubforumDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateSubforumForm>({
    resolver: zodResolver(createSubforumSchema),
  });

  const onSubmit = async (data: CreateSubforumForm) => {
    try {
      await onCreateSubforum(data);
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to create subforum:", error);
    }
  };

  const defaultTrigger = (
    <Button className='gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.45)]'>
      <Plus className='h-4 w-4' />
      Create hive
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className='sm:max-w-[480px] border-border/70 bg-card/95 backdrop-blur-md'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold text-orange-500'>
            Create new hive
          </DialogTitle>
          <DialogDescription className='text-sm text-muted-foreground'>
            Create a dedicated space for a course, interest, or community topic.
            You can always edit details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
          {/* NAME */}
          <div className='space-y-2'>
            <Label
              htmlFor='name'
              className='text-sm font-medium text-foreground'>
              Hive name
            </Label>
            <Input
              id='name'
              placeholder='e.g. CNS Study Group, Events, Memes'
              className='bg-background/80 border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-orange-500/70'
              {...register("name")}
            />
            {errors.name && (
              <p className='text-xs text-destructive'>{errors.name.message}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className='space-y-2'>
            <Label
              htmlFor='description'
              className='text-sm font-medium text-foreground'>
              Description
            </Label>
            <textarea
              id='description'
              placeholder='Describe what this hive is about and what kind of posts belong here…'
              className='flex min-h-[100px] w-full resize-none rounded-md border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/70'
              {...register("description")}
            />
            {errors.description && (
              <p className='text-xs text-destructive'>
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              className='h-9 border-border/60 px-4 text-xs text-muted-foreground hover:bg-muted/60'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || isLoading}
              className='h-9 px-4 text-xs bg-orange-500 hover:bg-orange-600 text-white'>
              {isSubmitting || isLoading ? "Creating…" : "Create hive"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
