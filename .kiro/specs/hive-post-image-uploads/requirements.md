# Requirements Document

## Introduction

This feature enables users to upload and attach images to their hive posts, enhancing visual communication within the TUM Community Platform. Users will be able to upload multiple images when creating posts, and these images will be displayed within the post content.

## Glossary

- **Hive Post**: A discussion post created within a subforum (also called "hive") on the platform
- **Image Upload System**: The Supabase Storage bucket and associated logic for handling image files
- **Post Images**: Image files attached to and displayed within hive posts

## Requirements

### Requirement 1

**User Story:** As a user, I want to upload images when creating a post, so that I can share visual content with my subforum community.

#### Acceptance Criteria

1. WHEN a user creates a post THEN the system SHALL provide an interface to upload one or more image files
2. WHEN a user selects an image file THEN the system SHALL validate the file type is an accepted image format (JPEG, PNG, GIF, WebP)
3. WHEN a user selects an image file THEN the system SHALL validate the file size does not exceed 5MB
4. WHEN a user uploads an image THEN the system SHALL store the image in Supabase Storage and associate it with the post
5. WHEN invalid files are selected THEN the system SHALL display clear error messages to the user

### Requirement 2

**User Story:** As a user, I want to see images in posts, so that I can view visual content shared by others.

#### Acceptance Criteria

1. WHEN a post contains images THEN the system SHALL display all images within the post content area
2. WHEN images are displayed THEN the system SHALL show them in a responsive grid layout
3. WHEN a user clicks an image THEN the system SHALL display the image in a larger view
4. WHEN images fail to load THEN the system SHALL display a placeholder or error state

### Requirement 3

**User Story:** As a user, I want to remove images before posting, so that I can correct mistakes or change my mind about what to share.

#### Acceptance Criteria

1. WHEN a user has uploaded images THEN the system SHALL display a remove button for each image
2. WHEN a user clicks the remove button THEN the system SHALL remove the image from the upload queue
3. WHEN a post is cancelled THEN the system SHALL clean up any uploaded images that were not associated with a post

### Requirement 4

**User Story:** As the system, I want to store images securely, so that user content is protected and properly managed.

#### Acceptance Criteria

1. WHEN an image is uploaded THEN the system SHALL store it in a dedicated Supabase Storage bucket
2. WHEN storing images THEN the system SHALL generate unique filenames to prevent collisions
3. WHEN a post is deleted THEN the system SHALL remove associated images from storage
4. WHEN accessing images THEN the system SHALL enforce proper access control through RLS policies
