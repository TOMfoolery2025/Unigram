/** @format */

"use client";

import { useState } from "react";
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
import { Plus, Eye, EyeOff } from "lucide-react";

interface CreatePostForm {
  title: string;
  content: string;
  is_anonymous: boolean;
}

interface CreatePostDialogProps {
  onCreatePost: (data: CreatePostForm) => Promise<void>;
  subforumId: string; // kept for API compatibility (not needed inside)
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

export function CreatePostDialog({
  onCreatePost,
  subforumId, // eslint-disable-line @typescript-eslint/no-unused-vars
  isLoading = false,
  trigger,
}: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreatePostForm>({
    title: "",
    content: "",
    is_anonymous: false,
  });
  const [errors, setErrors] = useState<Partial<CreatePostForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<CreatePostForm> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    } else if (formData.content.length < 10) {
      newErrors.content = "Content must be at least 10 characters";
    } else if (formData.content.length > 10000) {
      newErrors.content = "Content must be less than 10,000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (
    field: keyof CreatePostForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onCreatePost(formData);
      setFormData({ title: "", content: "", is_anonymous: false });
      setErrors({});
      setOpen(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className='gap-2 shadow-[0_0_20px_rgba(139,92,246,0.45)]'>
      <Plus className='h-4 w-4' />
      Create Post
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-border/70 bg-card/95 backdrop-blur-md'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold text-primary'>
            Create new post
          </DialogTitle>
          <DialogDescription className='text-sm text-muted-foreground'>
            Share your thoughts, ask questions, or start a discussion with your
            subforum.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-5'>
          {/* TITLE */}
          <div className='space-y-2'>
            <Label
              htmlFor='title'
              className='text-sm font-medium text-foreground'>
              Post title
            </Label>
            <Input
              id='title'
              placeholder="What's your post about?"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              className='bg-background/80 border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/70'
            />
            {errors.title && (
              <p className='text-xs text-destructive'>{errors.title}</p>
            )}
          </div>

          {/* CONTENT */}
          <div className='space-y-2'>
            <Label
              htmlFor='content'
              className='text-sm font-medium text-foreground'>
              Content
            </Label>
            <textarea
              id='content'
              placeholder='Write the details of your question or discussion…'
              value={formData.content}
              onChange={(e) => updateField("content", e.target.value)}
              rows={6}
              className='flex min-h-[140px] w-full resize-none rounded-md border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70'
            />
            {errors.content && (
              <p className='text-xs text-destructive'>{errors.content}</p>
            )}
          </div>

          {/* ANONYMOUS TOGGLE */}
          <div className='flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/70 px-4 py-3'>
            <div className='flex items-center gap-3'>
              {formData.is_anonymous ? (
                <EyeOff className='h-5 w-5 text-muted-foreground' />
              ) : (
                <Eye className='h-5 w-5 text-muted-foreground' />
              )}
              <div>
                <p className='text-sm font-medium text-foreground'>
                  Post anonymously
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {formData.is_anonymous
                    ? "Your name will be hidden from other students."
                    : "Your name will appear next to this post."}
                </p>
              </div>
            </div>
            <Button
              type='button'
              variant={formData.is_anonymous ? "default" : "outline"}
              size='sm'
              onClick={() =>
                updateField("is_anonymous", !formData.is_anonymous)
              }
              className={
                formData.is_anonymous
                  ? "h-8 px-4 text-xs"
                  : "h-8 px-4 text-xs border-border/60 text-muted-foreground hover:bg-muted/60"
              }>
              {formData.is_anonymous ? "Anonymous" : "Public"}
            </Button>
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
              className='h-9 px-4 text-xs'>
              {isSubmitting || isLoading ? "Creating…" : "Create post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
