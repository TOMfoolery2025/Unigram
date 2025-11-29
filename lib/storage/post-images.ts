/** @format */

// Post image upload and management utilities for Supabase Storage

import { createClient } from "@/lib/supabase/client";
import { handleError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/monitoring";

const supabase = createClient();

import type { PostImage } from "@/types/forum";

const POST_IMAGES_BUCKET = "post-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Re-export PostImage type from forum types for convenience
export type { PostImage };

export interface UploadPostImageResult {
  data: { storagePath: string; imageId: string } | null;
  error: Error | null;
}

/**
 * Upload a post image to Supabase Storage
 * 
 * @param file - The image file to upload
 * @param userId - The ID of the user uploading the image
 * @param postId - The ID of the post this image belongs to
 * @param displayOrder - The order in which this image should be displayed (default: 0)
 * @returns Storage path and image ID of the uploaded image
 */
export async function uploadPostImage(
  file: File,
  userId: string,
  postId: string,
  displayOrder: number = 0
): Promise<UploadPostImageResult> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ValidationError(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
        { fileType: file.type }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        "File size exceeds 5MB limit.",
        { fileSize: file.size }
      );
    }

    // Generate unique filename using user_id/post_id/filename pattern
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storagePath = `${userId}/${postId}/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Insert metadata record into post_images table
    const { data: imageData, error: dbError } = await supabase
      .from("post_images")
      .insert({
        post_id: postId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        display_order: displayOrder,
      })
      .select("id")
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(POST_IMAGES_BUCKET).remove([storagePath]);
      throw dbError;
    }

    logger.info("Post image uploaded successfully", {
      operation: "uploadPostImage",
      userId,
      metadata: { postId, storagePath, imageId: imageData.id },
    });

    return { 
      data: { 
        storagePath, 
        imageId: imageData.id 
      }, 
      error: null 
    };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "uploadPostImage",
      userId,
      metadata: { postId, fileName: file.name },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Delete a post image from Supabase Storage and database
 * 
 * @param imageId - The ID of the image to delete
 * @param storagePath - The path to the file in storage
 * @returns Error if deletion fails, null otherwise
 */
export async function deletePostImage(
  imageId: string,
  storagePath: string
): Promise<{ error: Error | null }> {
  try {
    // Delete file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from(POST_IMAGES_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      throw storageError;
    }

    // Remove metadata record from database
    const { error: dbError } = await supabase
      .from("post_images")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      throw dbError;
    }

    logger.info("Post image deleted successfully", {
      operation: "deletePostImage",
      metadata: { imageId, storagePath },
    });

    return { error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "deletePostImage",
      metadata: { imageId, storagePath },
    });
    return { error: new Error(appError.userMessage) };
  }
}

/**
 * Get all images for a specific post
 * 
 * @param postId - The ID of the post
 * @returns Array of post images with public URLs
 */
export async function getPostImages(
  postId: string
): Promise<{ data: PostImage[] | null; error: Error | null }> {
  try {
    // Query post_images table by post_id, ordered by display_order
    const { data: images, error: dbError } = await supabase
      .from("post_images")
      .select("*")
      .eq("post_id", postId)
      .order("display_order", { ascending: true });

    if (dbError) {
      throw dbError;
    }

    // Generate public URLs for each image
    const imagesWithUrls: PostImage[] = (images || []).map((image) => ({
      ...image,
      url: getImageUrl(image.storage_path),
    }));

    return { data: imagesWithUrls, error: null };
  } catch (error) {
    const appError = handleError(error);
    logger.logError(appError, {
      operation: "getPostImages",
      metadata: { postId },
    });
    return { data: null, error: new Error(appError.userMessage) };
  }
}

/**
 * Generate public URL from storage path
 * 
 * @param storagePath - The storage path of the image
 * @returns Public URL for the image
 */
export function getImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(POST_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}
