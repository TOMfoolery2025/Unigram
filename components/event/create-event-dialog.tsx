/** @format */

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateEventData, EventType } from "@/types/event";
import { createEvent } from "@/lib/event/events";
import { useAuth } from "@/lib/auth/auth-provider";

interface CreateEventDialogProps {
  onEventCreated?: () => void;
}

export function CreateEventDialog({ onEventCreated }: CreateEventDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    description: "",
    event_type: "tum_native",
    date: "",
    time: "",
    location: "",
    external_link: null,
    max_attendees: null,
    is_published: true,
  });

  const canCreateEvents = user?.can_create_events || user?.is_admin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const { data, error } = await createEvent(formData, user.id);

    if (error) {
      alert(error.message);
    } else {
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        event_type: "tum_native",
        date: "",
        time: "",
        location: "",
        external_link: null,
        max_attendees: null,
        is_published: true,
      });
      onEventCreated?.();
    }

    setIsLoading(false);
  };

  const handleChange = (
    field: keyof CreateEventData,
    value: string | number | null | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!canCreateEvents) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='bg-violet-600 hover:bg-violet-700'>
          <Plus className='h-4 w-4 mr-2' />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription className='text-gray-400'>
            Create a new event for the TUM community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Title */}
          <div className='space-y-2'>
            <Label htmlFor='title'>Title *</Label>
            <Input
              id='title'
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              className='bg-gray-900 border-gray-700'
              placeholder='Event title'
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description *</Label>
            <textarea
              id='description'
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
              className='w-full min-h-[100px] px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white'
              placeholder='Event description'
            />
          </div>

          {/* Event Type */}
          <div className='space-y-2'>
            <Label>Event Type *</Label>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant={
                  formData.event_type === "tum_native" ? "default" : "outline"
                }
                onClick={() => handleChange("event_type", "tum_native")}
                className={
                  formData.event_type === "tum_native"
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "border-gray-700"
                }>
                TUM Native
              </Button>
              <Button
                type='button'
                variant={
                  formData.event_type === "external" ? "default" : "outline"
                }
                onClick={() => handleChange("event_type", "external")}
                className={
                  formData.event_type === "external"
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "border-gray-700"
                }>
                External
              </Button>
            </div>
          </div>

          {/* Date and Time */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='date'>Date *</Label>
              <Input
                id='date'
                type='date'
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
                className='bg-gray-900 border-gray-700'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='time'>Time *</Label>
              <Input
                id='time'
                type='time'
                value={formData.time}
                onChange={(e) => handleChange("time", e.target.value)}
                required
                className='bg-gray-900 border-gray-700'
              />
            </div>
          </div>

          {/* Location */}
          <div className='space-y-2'>
            <Label htmlFor='location'>Location *</Label>
            <Input
              id='location'
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              required
              className='bg-gray-900 border-gray-700'
              placeholder='Event location'
            />
          </div>

          {/* External Link (only for external events) */}
          {formData.event_type === "external" && (
            <div className='space-y-2'>
              <Label htmlFor='external_link'>External Registration Link</Label>
              <Input
                id='external_link'
                type='url'
                value={formData.external_link || ""}
                onChange={(e) =>
                  handleChange("external_link", e.target.value || null)
                }
                className='bg-gray-900 border-gray-700'
                placeholder='https://...'
              />
            </div>
          )}

          {/* Max Attendees */}
          <div className='space-y-2'>
            <Label htmlFor='max_attendees'>
              Max Attendees (optional)
            </Label>
            <Input
              id='max_attendees'
              type='number'
              min='1'
              value={formData.max_attendees || ""}
              onChange={(e) =>
                handleChange(
                  "max_attendees",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className='bg-gray-900 border-gray-700'
              placeholder='Leave empty for unlimited'
            />
          </div>

          {/* Publish Status */}
          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='is_published'
              checked={formData.is_published}
              onChange={(e) => handleChange("is_published", e.target.checked)}
              className='w-4 h-4 text-violet-600 bg-gray-900 border-gray-700 rounded focus:ring-violet-500'
            />
            <Label htmlFor='is_published' className='cursor-pointer'>
              Publish immediately
            </Label>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              className='border-gray-700'>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isLoading}
              className='bg-violet-600 hover:bg-violet-700'>
              {isLoading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
