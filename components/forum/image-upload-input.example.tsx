/** @format */

"use client";

import { useState } from "react";
import { ImageUploadInput } from "./image-upload-input";

/**
 * Example usage of ImageUploadInput component
 * 
 * This component demonstrates how to integrate the ImageUploadInput
 * into a form for uploading images to hive posts.
 */
export function ImageUploadInputExample() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Selected files:", selectedFiles);
    // Here you would upload the files to storage
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Image Upload Example</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Upload Images
          </label>
          <ImageUploadInput
            value={selectedFiles}
            onChange={setSelectedFiles}
            maxImages={5}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          disabled={selectedFiles.length === 0}
        >
          Submit ({selectedFiles.length} images)
        </button>
      </form>
    </div>
  );
}
