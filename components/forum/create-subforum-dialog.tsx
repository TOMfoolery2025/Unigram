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
      // Error handling is done in the parent component
      console.error("Failed to create subforum:", error);
    }
  };

  const defaultTrigger = (
    <Button className='bg-violet-600 hover:bg-violet-700'>
      <Plus className='h-4 w-4 mr-2' />
      Create Subforum
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[425px] bg-gray-900 border-gray-700'>
        <DialogHeader>
          <DialogTitle className='text-violet-400'>
            Create New Subforum
          </DialogTitle>
          <DialogDescription className='text-gray-400'>
            Create a new discussion space for your community. Choose a
            descriptive name and provide details about what this subforum is
            for.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-sm font-medium text-gray-300'>
              Subforum Name
            </Label>
            <Input
              id='name'
              placeholder='e.g., Course Discussions, Memes, Study Groups'
              className='bg-gray-800 border-gray-600 text-white placeholder:text-gray-500'
              {...register("name")}
            />
            {errors.name && (
              <p className='text-sm text-red-400'>{errors.name.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='description'
              className='text-sm font-medium text-gray-300'>
              Description
            </Label>
            <textarea
              id='description'
              placeholder='Describe what this subforum is about and what kind of discussions are welcome...'
              className='flex min-h-[80px] w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
              {...register("description")}
            />
            {errors.description && (
              <p className='text-sm text-red-400'>
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              className='border-gray-600 text-gray-300 hover:bg-gray-800'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || isLoading}
              className='bg-violet-600 hover:bg-violet-700'>
              {isSubmitting || isLoading ? "Creating..." : "Create Subforum"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
