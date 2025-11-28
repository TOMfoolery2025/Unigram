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
    // V