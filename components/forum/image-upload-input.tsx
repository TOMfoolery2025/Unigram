/** @format */

"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_IMAGES = 5;

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploadInputProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUploadInput({
  value,
  onChange,
  maxImages = MAX_IMAGES,
  className,
}: ImageUploadInputProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate a single file
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 5MB limit.`;
    }
    return null;
  };

  // Process and add files
  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const newErrors: string[] = [];
      const newImages: ImageFile[] = [];
      const filesArray = Array.from(fileList);

      // Check if adding these files would exceed the limit
      if (images.length + filesArray.length > maxImages) {
        newErrors.push(`You can only upload up to ${maxImages} images.`);
        setErrors(newErrors);
        return;
      }

      filesArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          const preview = URL.createObjectURL(file);
          newImages.push({
            file,
            preview,
            id: `${Date.now()}-${Math.random()}`,
          });
        }
      });

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onChange(updatedImages.map((img) => img.file));
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        // Clear errors after 5 seconds
        setTimeout(() => setErrors([]), 5000);
      }
    },
    [images, maxImages, onChange]
  );

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle remove image
  const handleRemove = (id: string) => {
    const updatedImages = images.filter((img) => {
      if (img.id === id) {
        URL.revokeObjectURL(img.preview);
        return false;
      }
      return true;
    });
    setImages(updatedImages);
    onChange(updatedImages.map((img) => img.file));
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    processFiles(files);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/60 bg-background/50",
          images.length >= maxImages && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          onChange={handleFileChange}
          disabled={images.length >= maxImages}
          className="sr-only"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={cn(
            "flex flex-col items-center justify-center px-6 py-8 cursor-pointer",
            images.length >= maxImages && "cursor-not-allowed"
          )}
        >
          <Upload
            className={cn(
              "h-10 w-10 mb-3",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <p className="text-sm font-medium text-foreground mb-1">
            {isDragging
              ? "Drop images here"
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, GIF, or WebP (max 5MB each, up to {maxImages} images)
          </p>
        </label>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group rounded-lg overflow-hidden border border-border/60 bg-background/80"
            >
              {/* Image Preview */}
              <div className="aspect-square relative">
                <img
                  src={image.preview}
                  alt={image.file.name}
                  className="w-full h-full object-cover"
                />
                {/* Remove Button Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(image.id)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
                </div>
              </div>
              {/* File Info */}
              <div className="p-2 space-y-0.5">
                <p className="text-xs font-medium text-foreground truncate">
                  {image.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(image.file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
