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
  subforumId: string;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

export function CreatePostDialog({
  onCreatePost,
  subforumId,
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

  const updateField = (
    field: keyof CreatePostForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const defaultTrigger = (
    <Button className='bg-violet-600 hover:bg-violet-700'>
      <Plus className='h-4 w-4 mr-2' />
      Create Post
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='sm:max-w-[600px] bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-violet-400'>Create New Post</DialogTitle>
          <DialogDescription className='text-gray-400'>
            Share your thoughts, ask questions, or start a discussion with the
            community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label
              htmlFor='title'
              className='text-sm font-medium text-gray-300'>
              Post Title
            </Label>
            <Input
              id='title'
              placeholder="What's your post about?"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              className='bg-gray-800 border-gray-600 text-white placeholder:text-gray-500'
            />
            {errors.title && (
              <p className='text-sm text-red-400'>{errors.title}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='content'
              className='text-sm font-medium text-gray-300'>
              Content
            </Label>
            <textarea
              id='content'
              placeholder='Share your thoughts, experiences, or ask questions...'
              value={formData.content}
              onChange={(e) => updateField("content", e.target.value)}
              className='flex min-h-[120px] w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50 resize-none'
              rows={6}
            />
            {errors.content && (
              <p className='text-sm text-red-400'>{errors.content}</p>
            )}
          </div>

          {/* Anonymous Toggle */}
          <div className='flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700'>
            <div className='flex items-center gap-3'>
              {formData.is_anonymous ? (
                <EyeOff className='h-5 w-5 text-gray-400' />
              ) : (
                <Eye className='h-5 w-5 text-gray-400' />
              )}
              <div>
                <Label className='text-sm font-medium text-gray-300'>
                  Post Anonymously
                </Label>
                <p className='text-xs text-gray-500 mt-1'>
                  {formData.is_anonymous
                    ? "Your identity will be hidden from other users"
                    : "Your name will be visible to other users"}
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
                  ? "bg-violet-600 hover:bg-violet-700"
                  : "border-gray-600 text-gray-300 hover:bg-gray-700"
              }>
              {formData.is_anonymous ? "Anonymous" : "Public"}
            </Button>
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
              {isSubmitting || isLoading ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
