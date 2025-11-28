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

/* ------------------- VALIDATION SCHEMA ------------------- */
const createChannelSchema = z
  .object({
    name: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid characters"),
    description: z.string().min(10).max(500),
    access_type: z.enum(["public", "pin"]),
    pin_code: z.string().optional(),
  })
  .refine(
    (data) =>
      data.access_type === "public" ||
      (data.pin_code && /^\d{4}$/.test(data.pin_code)),
    {
      message: "PIN must be exactly 4 digits",
      path: ["pin_code"],
    }
  );

export type CreateChannelForm = z.infer<typeof createChannelSchema>;

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
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      access_type: "public",
      pin_code: "",
    },
  });

  const accessType = watch("access_type");

  const onSubmit = async (data: CreateChannelForm) => {
    await onCreateChannel(data);
    reset({ access_type: "public", pin_code: "" });
    setOpen(false);
  };

  if (!isAdmin) return null;

  const defaultTrigger = (
    <Button className='bg-violet-600 hover:bg-violet-700'>
      <Plus className='mr-2 h-4 w-4' />
      Create Channel
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className='sm:max-w-[460px] bg-gray-900 border-gray-700'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-violet-400'>
            <Hash className='h-5 w-5' />
            Create Official Channel
          </DialogTitle>
          <DialogDescription className='text-gray-400'>
            Choose public or PIN-locked access. PIN must be shared with members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* NAME */}
          <div className='space-y-2'>
            <Label className='text-sm text-gray-300'>Channel Name</Label>
            <Input
              placeholder='e.g., Football Team'
              className='bg-gray-800 border-gray-600 text-white'
              {...register("name")}
            />
            {errors.name && (
              <p className='text-sm text-red-400'>{errors.name.message}</p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className='space-y-2'>
            <Label className='text-sm text-gray-300'>Description</Label>
            <textarea
              placeholder='Describe what this channel is for…'
              className='min-h-[80px] w-full rounded-md bg-gray-800 border-gray-600 text-white px-3 py-2 text-sm'
              {...register("description")}
            />
            {errors.description && (
              <p className='text-sm text-red-400'>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* ACCESS TYPE */}
          <div className='space-y-2'>
            <Label className='text-sm text-gray-300'>Access type</Label>

            <div className='flex gap-2'>
              <Button
                type='button'
                variant={accessType === "public" ? "default" : "outline"}
                className={
                  accessType === "public"
                    ? "bg-violet-600 text-white"
                    : "border-gray-600 text-gray-300"
                }
                onClick={() => setValue("access_type", "public")}>
                Public
              </Button>

              <Button
                type='button'
                variant={accessType === "pin" ? "default" : "outline"}
                className={
                  accessType === "pin"
                    ? "bg-violet-600 text-white"
                    : "border-gray-600 text-gray-300"
                }
                onClick={() => setValue("access_type", "pin")}>
                PIN Protected
              </Button>
            </div>

            <p className='text-xs text-gray-500'>
              PIN channels require a shared 4-digit code.
            </p>
          </div>

          {/* PIN INPUT */}
          {accessType === "pin" && (
            <div className='space-y-2'>
              <Label className='text-sm text-gray-300'>4-Digit PIN</Label>
              <Input
                type='password'
                maxLength={4}
                inputMode='numeric'
                placeholder='••••'
                className='w-32 text-center tracking-[0.4em] bg-gray-800 border-gray-600 text-white'
                {...register("pin_code")}
              />
              {errors.pin_code && (
                <p className='text-sm text-red-400'>
                  {errors.pin_code.message}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              className='border-gray-600 text-gray-300'
              onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button
              type='submit'
              disabled={isSubmitting || isLoading}
              className='bg-violet-600 hover:bg-violet-700'>
              {isSubmitting || isLoading ? "Creating…" : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
