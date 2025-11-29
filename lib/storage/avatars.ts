/** @format */

// Avatar upload and management utilities for Supabase Storage

import { createClient } from "@/lib/supabase/client";
import { handleError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export interface UploadAvatarResult {
  data: { url: string } | null;
  error: Error | null;
}

/**
 * Upload a user avatar to Supabase Storage
 * 
 * @param userId - The ID of the user uploading the avatar
 * @param file - The image file to upload
 * @returns Public URL of the uploaded avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<UploadAvatarResult> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
        { fileType: file.type }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        "File size exceeds 2MB limit.",
        { fileSize: file.size }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    logger.info("Avatar uploaded successfully", {
      operation: "uploadAvatar",
      userId,
      metadata: { filePath },
    });

    return { data: { url: urlData.publicUrl }, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "uploadAvatar",
      userId,
      metadata: { fileName: file.name },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Delete a user's avatar from Supabase Storage
 * 
 * @param userId - The ID of the user
 * @param filePath - The path to the file in storage
 */
export async function deleteAvatar(
  userId: string,
  filePath: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    logger.info("Avatar deleted successfully", {
      operation: "deleteAvatar",
      userId,
      metadata: { filePath },
    });

    return { error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "deleteAvatar",
      userId,
      metadata: { filePath },
    });
    return { error: new Error(appError.userMessage) };
  }
}