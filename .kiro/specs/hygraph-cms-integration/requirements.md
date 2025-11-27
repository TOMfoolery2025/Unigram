# Requirements Document

## Introduction

This document outlines the requirements for integrating Hygraph CMS (formerly GraphCMS) to replace the current database-backed wiki implementation in the TUM Community Platform. The integration will enable content managers to create, edit, and manage wiki articles through Hygraph's content management interface while maintaining the existing user-facing wiki experience. This migration will separate content management from the application database, provide a better authoring experience with rich text editing, and enable content versioning through Hygraph's built-in features.

## Glossary

- **Hygraph**: A headless CMS platform (formerly GraphCMS) that provides GraphQL APIs for content management
- **Wiki System**: The knowledge base feature of the TUM Community Platform that provides information for prospective and incoming TUM students
- **Content Model**: The schema definition in Hygraph that defines the structure of wiki articles
- **GraphQL Client**: A library that communicates with Hygraph's GraphQL API to fetch and manage content
- **Rich Text Field**: A Hygraph field type that stores formatted content with support for headings, lists, links, images, and other rich content
- **Content Stage**: Hygraph's content lifecycle stage (DRAFT or PUBLISHED) that controls article visibility
- **Asset**: Media files (images, documents) stored and managed in Hygraph
- **TUM Community Platform**: The Next.js application that hosts the wiki and other community features

## Requirements

### Requirement 1

**User Story:** As a content manager, I want to create and edit wiki articles in Hygraph CMS, so that I can manage content with a dedicated content management interface and rich text editing capabilities.

#### Acceptance Criteria

1. WHEN a content manager accesses Hygraph CMS THEN the system SHALL provide a content model for wiki articles with fields for title, slug, category, content, and publication status
2. WHEN a content manager creates a new article THEN the system SHALL validate that the title is non-empty and the slug is unique
3. WHEN a content manager edits article content THEN the system SHALL provide a rich text editor with support for headings, paragraphs, lists, links, images, and code blocks
4. WHEN a content manager saves an article THEN Hygraph SHALL store the article with automatic versioning
5. WHEN a content manager uploads images THEN Hygraph SHALL store them as assets and allow embedding in article content

### Requirement 2

**User Story:** As a platform user, I want to view wiki articles fetched from Hygraph, so that I can access up-to-date information managed by content administrators.

#### Acceptance Criteria

1. WHEN a user visits the wiki home page THEN the TUM Community Platform SHALL fetch and display article categories from Hygraph
2. WHEN a user selects a category THEN the TUM Community Platform SHALL fetch and display all published articles in that category from Hygraph
3. WHEN a user views an article THEN the TUM Community Platform SHALL fetch and render the article content from Hygraph with proper formatting
4. WHEN Hygraph content includes images THEN the TUM Community Platform SHALL display images using Hygraph's asset delivery URLs
5. WHEN an article is not found in Hygraph THEN the TUM Community Platform SHALL display an appropriate error message

### Requirement 3

**User Story:** As a developer, I want to configure the Hygraph GraphQL client, so that the application can securely communicate with the Hygraph API.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL load Hygraph API endpoint and authentication token from environment variables
2. WHEN the GraphQL client makes a request THEN the system SHALL include the authentication token in request headers
3. WHEN the API endpoint is not configured THEN the system SHALL throw a configuration error with a clear message
4. WHEN the authentication token is invalid THEN the system SHALL handle the error gracefully and log the authentication failure
5. WHEN network errors occur THEN the system SHALL retry failed requests up to three times with exponential backoff

### Requirement 4

**User Story:** As a platform user, I want to search for wiki articles, so that I can quickly find relevant information.

#### Acceptance Criteria

1. WHEN a user enters a search query THEN the TUM Community Platform SHALL query Hygraph for articles matching the title or content
2. WHEN search results are returned THEN the TUM Community Platform SHALL display article titles, categories, and content excerpts
3. WHEN a user clicks a search result THEN the TUM Community Platform SHALL navigate to the full article view
4. WHEN no results match the query THEN the TUM Community Platform SHALL display a message indicating no articles were found
5. WHEN the search query is empty THEN the TUM Community Platform SHALL not execute a search request

### Requirement 5

**User Story:** As a content manager, I want to control article publication status, so that I can work on drafts before making them publicly visible.

#### Acceptance Criteria

1. WHEN a content manager creates an article THEN Hygraph SHALL default the article stage to DRAFT
2. WHEN a content manager publishes an article THEN Hygraph SHALL change the article stage to PUBLISHED
3. WHEN the TUM Community Platform fetches articles THEN the system SHALL only retrieve articles with PUBLISHED stage
4. WHEN a content manager unpublishes an article THEN the system SHALL immediately exclude it from public queries
5. WHEN an admin views the wiki THEN the system SHALL optionally include DRAFT articles for preview purposes

### Requirement 6

**User Story:** As a platform user, I want wiki articles to load quickly, so that I have a responsive browsing experience.

#### Acceptance Criteria

1. WHEN the application fetches articles THEN the system SHALL implement caching with a time-to-live of 5 minutes
2. WHEN cached content is available THEN the system SHALL serve it without making a Hygraph API request
3. WHEN the cache expires THEN the system SHALL fetch fresh content from Hygraph and update the cache
4. WHEN multiple requests for the same article occur simultaneously THEN the system SHALL deduplicate requests to prevent redundant API calls
5. WHEN Hygraph responds slowly THEN the system SHALL display a loading state without blocking the user interface

### Requirement 7

**User Story:** As a developer, I want to remove the old wiki database tables and code, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN the Hygraph integration is complete THEN the system SHALL remove wiki-related database tables from Supabase
2. WHEN removing old code THEN the system SHALL delete the lib/wiki directory and its contents
3. WHEN removing old code THEN the system SHALL delete wiki-related types that reference database tables
4. WHEN removing old code THEN the system SHALL update components to use the new Hygraph data layer
5. WHEN cleanup is complete THEN the system SHALL verify that no references to old wiki code remain in the codebase
