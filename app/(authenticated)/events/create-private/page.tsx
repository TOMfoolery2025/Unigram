/** @format */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreateEventData, EventCategory } from "@/types/event";
import { createEvent } from "@/lib/event/events";
import { useAuth } from "@/lib/auth/auth-provider";

export default function CreatePrivateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventData>({
    title: "",
    description: "",
    event_type: "tum_native",
    date: "",
    start_time: "",
    end_time: null,
    location: "",
    external_link: null,
    max_attendees: null,
    is_published: true,
    is_private: true, // Automatically set to true for private events
    category: "social", // Default to social for private events
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    // Client-side validation for time
    if (formData.end_time && formData.end_time <= formData.start_time) {
      setError("End time must be after start time");
      return;
    }

    setIsLoading(true);

    const { data, error: createError } = await createEvent(formData, user.id);

    if (createError) {
      setError(createError.message);
      setIsLoading(false);
    } else {
      // Navigate back to events list
      router.push("/events");
    }
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

  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      {/* neon background like dashboard and hives */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),transparent_60%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.08),transparent_55%)]' />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Create Private Event</h1>
        <p className="text-muted-foreground mt-2">
          Create a private event visible only to your friends
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/60 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value as EventCategory)}
            required
            className="w-full px-3 py-2 bg-background/60 border border-border/60 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
          >
            <option value="social">Social</option>
            <option value="academic">Academic</option>
            <option value="sports">Sports</option>
            <option value="cultural">Cultural</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
            className="bg-background/60 border-border/60"
            placeholder="Event title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            required
            className="bg-background/60 border-border/60 min-h-[120px]"
            placeholder="Event description"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <div className="relative">
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
              className="bg-muted/30 border-border/60 text-foreground [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity"
            />
          </div>
        </div>

        {/* Start Time and End Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_time">Start Time *</Label>
            <div className="relative">
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
                required
                className="bg-muted/30 border-border/60 text-foreground [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_time">End Time</Label>
            <div className="relative">
              <Input
                id="end_time"
                type="time"
                value={formData.end_time || ""}
                onChange={(e) =>
                  handleChange("end_time", e.target.value || null)
                }
                className="bg-muted/30 border-border/60 text-foreground [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:cursor-pointer hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleChange("location", e.target.value)}
            required
            className="bg-background/60 border-border/60"
            placeholder="Event location"
          />
        </div>

        {/* Max Attendees */}
        <div className="space-y-2">
          <Label htmlFor="max_attendees">Max Attendees (optional)</Label>
          <Input
            id="max_attendees"
            type="number"
            min="1"
            value={formData.max_attendees || ""}
            onChange={(e) =>
              handleChange(
                "max_attendees",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            className="bg-background/60 border-border/60"
            placeholder="Leave empty for unlimited"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-border/60"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Creating..." : "Create Private Event"}
          </Button>
        </div>
      </form>
      </div>
    </>
  );
}
