/** @format */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, X, Plus } from "lucide-react";
import { updateUserProfile } from "@/lib/profile/profiles";
import { UserProfile, ProfileUpdate, UserProject } from "@/types/profile";
import { toast } from "sonner";
import { AvatarPicker } from "./avatar-picker";
import { UserAvatar } from "./user-avatar";

interface ProfileEditForm {
  display_name: string;
  bio: string;
  interests: string[];
  avatar_url: string;
}

interface ProfileEditDialogProps {
  profile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  trigger?: React.ReactNode;
}

export function ProfileEditDialog({
  profile,
  onProfileUpdate,
  trigger,
}: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interestInput, setInterestInput] = useState("");
  const [localInterests, setLocalInterests] = useState<string[]>(
    profile.interests || []
  );
  const [projects, setProjects] = useState<UserProject[]>(
    profile.projects || []
  );
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(
    profile.avatar_url || ""
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProfileEditForm>({
    defaultValues: {
      display_name: profile.display_name || "",
      bio: profile.bio || "",
      interests: profile.interests || [],
      avatar_url: profile.avatar_url || "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        interests: profile.interests || [],
        avatar_url: profile.avatar_url || "",
      });
      setLocalInterests(profile.interests || []);
      setProjects(profile.projects || []);
      setSelectedAvatarUrl(profile.avatar_url || "");
      setInterestInput("");
      setNewProjectTitle("");
      setNewProjectDescription("");
      setNewProjectUrl("");
    }
  }, [open, profile, reset]);

  const handleAddInterest = () => {
    const trimmedInterest = interestInput.trim();
    
    if (!trimmedInterest) {
      return;
    }

    if (trimmedInterest.length > 50) {
      toast.error("Each interest must be 50 characters or less");
      return;
    }

    if (localInterests.length >= 10) {
      toast.error("Maximum 10 interests allowed");
      return;
    }

    if (localInterests.includes(trimmedInterest)) {
      toast.error("Interest already added");
      return;
    }

    const newInterests = [...localInterests, trimmedInterest];
    setLocalInterests(newInterests);
    setValue("interests", newInterests);
    setInterestInput("");
  };

  const handleRemoveInterest = (indexToRemove: number) => {
    const newInterests = localInterests.filter((_, index) => index !== indexToRemove);
    setLocalInterests(newInterests);
    setValue("interests", newInterests);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInterest();
    }
  };

  const handleAddProject = () => {
    const title = newProjectTitle.trim();
    const description = newProjectDescription.trim();
    const url = newProjectUrl.trim();

    if (!title) {
      toast.error("Project title is required");
      return;
    }

    if (projects.length >= 10) {
      toast.error("Maximum 10 projects allowed");
      return;
    }

    const newProject: UserProject = {
      id: crypto.randomUUID(),
      title,
      description: description || null,
      url: url || null,
    };

    const nextProjects = [...projects, newProject];
    setProjects(nextProjects);
    setNewProjectTitle("");
    setNewProjectDescription("");
    setNewProjectUrl("");
  };

  const handleRemoveProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const onSubmit = async (data: ProfileEditForm) => {
    setIsSubmitting(true);

    try {
      // Optimistic update - update UI immediately
      const optimisticProfile: UserProfile = {
        ...profile,
        display_name: data.display_name || profile.display_name,
        bio: data.bio || null,
        interests: localInterests.length > 0 ? localInterests : null,
        avatar_url: selectedAvatarUrl || null,
        projects: projects.length > 0 ? projects : null,
      };
      
      onProfileUpdate(optimisticProfile);
      setOpen(false);
      toast.success("Profile updated successfully!");

      // Actual backend update
      const updates: ProfileUpdate = {
        display_name: data.display_name || undefined,
        bio: data.bio || undefined,
        interests: localInterests.length > 0 ? localInterests : undefined,
        avatar_url: selectedAvatarUrl || undefined,
        projects: projects.length > 0 ? projects : undefined,
      };

      const { data: updatedProfile, error } = await updateUserProfile(
        profile.id,
        updates
      );

      if (error) {
        // Rollback optimistic update on error
        onProfileUpdate(profile);
        toast.error(error.message || "Failed to update profile");
        return;
      }

      if (updatedProfile) {
        // Confirm with actual data from backend
        onProfileUpdate(updatedProfile);
      }
    } catch (error) {
      // Rollback optimistic update on error
      onProfileUpdate(profile);
      toast.error("An unexpected error occurred");
      console.error("Profile update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className="gap-2">
      <Edit className="h-4 w-4" />
      Edit Profile
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto border-border/70 bg-card/95 backdrop-blur-md p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg font-semibold text-primary">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Update your profile information to let others know more about you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          {/* Tabs for Avatar and Profile Info */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="text-xs sm:text-sm">Profile Info</TabsTrigger>
              <TabsTrigger value="avatar" className="text-xs sm:text-sm">Avatar</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 md:space-y-4 mt-4">
              {/* DISPLAY NAME */}
              <div className="space-y-2 md:space-y-2">
                <Label
                  htmlFor="display_name"
                  className="text-xs sm:text-sm font-medium text-foreground"
                >
                  Display Name
                </Label>
                <Input
                  id="display_name"
                  type="text"
                  placeholder="Your display name"
                  {...register("display_name", {
                    maxLength: {
                      value: 100,
                      message: "Display name must be 100 characters or less",
                    },
                  })}
                  className="bg-background/80 border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/70"
                />
                {errors.display_name && (
                  <p className="text-[10px] sm:text-xs text-destructive">
                    {errors.display_name.message}
                  </p>
                )}
              </div>

              {/* BIO */}
              <div className="space-y-2 md:space-y-2">
                <Label htmlFor="bio" className="text-xs sm:text-sm font-medium text-foreground">
                  Bio
                </Label>
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  {...register("bio", {
                    maxLength: {
                      value: 500,
                      message: "Bio must be 500 characters or less",
                    },
                  })}
                  rows={4}
                  className="flex min-h-[100px] md:min-h-[80px] w-full resize-none rounded-md border border-border/60 bg-background/80 px-3 py-2 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                />
                {errors.bio && (
                  <p className="text-[10px] sm:text-xs text-destructive">{errors.bio.message}</p>
                )}
              </div>

              {/* INTERESTS */}
              <div className="space-y-2 md:space-y-2">
                <Label
                  htmlFor="interests"
                  className="text-xs sm:text-sm font-medium text-foreground"
                >
                  Interests
                </Label>
                <div className="flex gap-2 md:gap-2">
                  <Input
                    id="interests"
                    type="text"
                    placeholder="Add an interest (max 10)"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={localInterests.length >= 10}
                    className="bg-background/80 border-border/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/70"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInterest}
                    disabled={!interestInput.trim() || localInterests.length >= 10}
                    className="gap-1.5 flex-shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Add</span>
                  </Button>
                </div>
                
                {/* Display current interests */}
                {localInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-md border border-border/60 bg-background/40">
                    {localInterests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 gap-1 sm:gap-1.5"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(index)}
                          className="ml-0.5 sm:ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {localInterests.length}/10 interests added
                </p>
              </div>

              {/* PROJECTS */}
              <div className="space-y-1.5 sm:space-y-2">
                <Label
                  htmlFor="projects"
                  className="text-xs sm:text-sm font-medium text-foreground"
                >
                  Projects
                </Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                  Share up to 10 projects you&apos;re currently working on so friends can see them.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    id="projects-title"
                    placeholder="Project title"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="bg-background/80 border-border/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/70 h-10"
                  />
                  <Input
                    id="projects-url"
                    placeholder="Link (optional)"
                    value={newProjectUrl}
                    onChange={(e) => setNewProjectUrl(e.target.value)}
                    className="bg-background/80 border-border/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/70 h-10"
                  />
                  <div className="flex gap-2">
                    <Input
                      id="projects-description"
                      placeholder="Short description"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className="bg-background/80 border-border/60 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/70 h-10 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddProject}
                      disabled={!newProjectTitle.trim() || projects.length >= 10}
                      className="gap-1.5 flex-shrink-0 h-10"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Add</span>
                    </Button>
                  </div>
                </div>

                {projects.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-56 overflow-y-auto rounded-md border border-border/60 bg-background/40 p-2.5 sm:p-3">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-start gap-2 rounded-md border border-border/40 bg-background/60 px-2.5 py-2 text-[11px] sm:text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{project.title}</p>
                          {project.description && (
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          {project.url && (
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] sm:text-[11px] text-primary underline break-all"
                            >
                              {project.url}
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(project.id)}
                          className="ml-1 mt-0.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {projects.length}/10 projects added
                </p>
              </div>
            </TabsContent>

            <TabsContent value="avatar" className="space-y-4 mt-4">
              {/* Current Avatar */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border/60 bg-background/40">
                <UserAvatar
                  userId={profile.id}
                  displayName={profile.display_name}
                  avatarUrl={selectedAvatarUrl}
                  size="xl"
                  className="shadow-lg"
                />
                <div>
                  <p className="text-sm font-medium">Current Avatar</p>
                  <p className="text-xs text-muted-foreground">
                    Choose a new avatar from the options below
                  </p>
                </div>
              </div>

              {/* Avatar Picker */}
              <AvatarPicker
                userId={profile.id}
                currentAvatarUrl={selectedAvatarUrl}
                onSelect={(url) => {
                  setSelectedAvatarUrl(url);
                  setValue("avatar_url", url);
                }}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 md:gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="border-border/60 px-4 text-xs text-muted-foreground hover:bg-muted/60 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-4 text-xs w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
