# Implementation Plan: Hive Post Image Uploads

- [x] 1. Create database migration for post_images table
  - Create migration file with post_images table schema
  - Add indexes for post_id and display_order
  - Add RLS policies for image access control
  - _Requirements: 4.1, 4.4_

- [x] 2. Set up Supabase Storage bucket
  - Create post-images bucket configuration
  - Set bucket to public access
  - Configure file size limits (5MB)
  - Add storage policies for upload/delete permissions
  - _Requirements: 4.1, 4.2_

- [x] 3. Create storage service for post images
  - [x] 3.1 Implement uploadPostImage function
    - Generate unique storage paths using user_id/post_id/filename pattern
    - Upload file to Supabase Storage
    - Insert metadata record into post_images table
    - Return storage path or error
    - _Requirements: 1.4, 4.2_
  
  - [x] 3.2 Implement deletePostImage function
    - Delete file from Supabase Storage
    - Remove metadata record from database
    - _Requirements: 3.2, 4.3_
  
  - [x] 3.3 Implement getPostImages function
    - Query post_images table by post_id
    - Order by display_order
    - Generate public URLs for each image
    - _Requirements: 2.1_
  
  - [x] 3.4 Implement getImageUrl helper
    - Generate public URL from storage path
    - _Requirements: 2.1_

- [x] 4. Update TypeScript types
  - Add PostImage interface to types/forum.ts
  - Add PostWithImages interface extending PostWithAuthor
  - Update PostInsert type if needed
  - _Requirements: 1.4, 2.1_

- [x] 5. Create ImageUploadInput component
  - [x] 5.1 Implement file input with validation
    - Accept only image/jpeg, image/png, image/gif, image/webp
    - Validate file size (max 5MB)
    - Display error messages for invalid files
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [x] 5.2 Implement image preview grid
    - Show thumbnails of selected images
    - Display file names and sizes
    - Add remove button for each image
    - _Requirements: 3.1, 3.2_
  
  - [x] 5.3 Add drag-and-drop support
    - Enable drag-and-drop file selection
    - Visual feedback during drag
    - _Requirements: 1.1_

- [x] 6. Create PostImages display component
  - [x] 6.1 Implement responsive image grid
    - Display images in grid layout
    - Responsive sizing for mobile/desktop
    - Lazy loading for performance
    - _Requirements: 2.1, 2.2_
  
  - [x] 6.2 Add image click handler for lightbox
    - Open larger view on click
    - Navigation between images
    - Close button
    - _Requirements: 2.3_
  
  - [x] 6.3 Implement error states
    - Show placeholder for failed image loads
    - Retry button for failed loads
    - _Requirements: 2.4_

- [x] 7. Update CreatePostDialog component
  - [x] 7.1 Integrate ImageUploadInput component
    - Add image upload section to form
    - Manage uploaded files state
    - _Requirements: 1.1_
  
  - [x] 7.2 Update form submission logic
    - Upload images to storage after post creation
    - Create post_images records
    - Handle upload errors
    - Clean up images if post creation fails
    - _Requirements: 1.4, 3.3_

- [x] 8. Update post display components
  - [x] 8.1 Update PostCard component
    - Fetch and display post images
    - Integrate PostImages component
    - _Requirements: 2.1_
  
  - [x] 8.2 Update post detail view
    - Display full-size images in detail view
    - _Requirements: 2.1, 2.2_

- [x] 9. Update posts service layer
  - [x] 9.1 Update getPost function
    - Include images in post query
    - Join with post_images table
    - _Requirements: 2.1_
  
  - [x] 9.2 Update getSubforumPosts function
    - Include images for all posts
    - Optimize query to prevent N+1 problem
    - _Requirements: 2.1_
  
  - [x] 9.3 Update deletePost function
    - Delete associated images from storage
    - Cascade delete handled by database
    - _Requirements: 4.3_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
