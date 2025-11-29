# Requirements Document

## Introduction

This document outlines the requirements for enhancing the TUM Community Platform's event management system. The enhancements focus on improving the user experience for event creation, introducing private events with friend-only visibility, and integrating events with communication channels (forums and clusters). These changes will make the event system more flexible, social, and integrated with the platform's existing community features.

## Glossary

- **Event System**: The platform's feature for creating, managing, and registering for events
- **Public Event**: An event visible to all platform users, creatable only by admins
- **Private Event**: An event visible only to the creator's friends, creatable by any user
- **Event Creator**: The user who creates an event
- **Event Registration**: The process of signing up to attend an event
- **QR Code**: A machine-readable code used for event check-in
- **Forum**: A discussion board associated with public events
- **Cluster**: A pin-protected chat group associated with private events
- **Event Page**: A dedicated page showing full event details and registration information
- **Create Event Page**: A standalone page for creating new events (not a modal dialog)
- **Event Category**: A classification label for events (e.g., Social, Academic, Sports, Cultural)
- **Category Filter**: A UI control allowing users to filter events by category

## Requirements

### Requirement 1

**User Story:** As a user viewing event type labels, I want to see "TUM" instead of "TUM Native", so that the branding is cleaner and more concise.

#### Acceptance Criteria

1. WHEN an event card displays the event type label THEN the system SHALL show "TUM" for tum_native event types
2. WHEN an event is created with tum_native type THEN the system SHALL display "TUM" in all user-facing interfaces
3. WHEN filtering or searching events by type THEN the system SHALL use "TUM" as the display label for tum_native events

### Requirement 2

**User Story:** As an admin or authorized user, I want to create events on a dedicated page instead of a modal dialog, so that I have more space and a better experience for entering event details.

#### Acceptance Criteria

1. WHEN a user clicks the "Create Event" button THEN the system SHALL navigate to a dedicated event creation page
2. WHEN the event creation page loads THEN the system SHALL display a form with all event fields in a spacious layout
3. WHEN a user completes event creation THEN the system SHALL navigate back to the events list page
4. WHEN a user cancels event creation THEN the system SHALL navigate back to the previous page

### Requirement 3

**User Story:** As an event creator, I want to specify start and end times for events, so that attendees know the full duration of the event.

#### Acceptance Criteria

1. WHEN creating an event THEN the system SHALL provide separate input fields for start time and end time
2. WHEN an event is saved THEN the system SHALL store both start_time and end_time values
3. WHEN displaying an event THEN the system SHALL show both start and end times in a readable format
4. WHEN validating event times THEN the system SHALL ensure end_time is after start_time
5. WHEN an event has both start and end times THEN the system SHALL display them as a time range

### Requirement 4

**User Story:** As a user browsing events, I want to see simpler event cards and a better-organized event detail page, so that I can quickly understand event information without visual clutter.

#### Acceptance Criteria

1. WHEN displaying event cards in the list view THEN the system SHALL show only essential information with minimal styling
2. WHEN a user views an event detail page THEN the system SHALL organize information into clear sections
3. WHEN displaying event tickets or QR codes THEN the system SHALL present them in a visually appealing and organized layout
4. WHEN showing event metadata THEN the system SHALL use consistent spacing and typography

### Requirement 5

**User Story:** As a regular user, I want to create private events that only my friends can see, so that I can organize social gatherings within my friend group.

#### Acceptance Criteria

1. WHEN any authenticated user accesses the events page THEN the system SHALL display a "Create Private Event" button
2. WHEN a user creates a private event THEN the system SHALL set the event visibility to friends-only
3. WHEN displaying events to a user THEN the system SHALL show private events only if the user is friends with the creator
4. WHEN a user creates a private event THEN the system SHALL not require admin privileges
5. WHEN viewing a private event THEN the system SHALL indicate its private status with a visual indicator
6. WHEN a private event is created THEN the system SHALL not require registration or QR codes

### Requirement 6

**User Story:** As an event creator, I want automatic communication channels created for my events, so that attendees can discuss and coordinate without manual setup.

#### Acceptance Criteria

1. WHEN a public event is created THEN the system SHALL automatically create an associated forum
2. WHEN a private event is created THEN the system SHALL automatically create a pin-protected cluster
3. WHEN a user registers for a public event THEN the system SHALL provide a link to the event forum
4. WHEN a user registers for a private event THEN the system SHALL provide the cluster pin and access link
5. WHEN viewing an event detail page after registration THEN the system SHALL display the communication channel link prominently
6. WHEN a cluster is created for a private event THEN the system SHALL generate a unique pin code
7. WHEN a forum is created for a public event THEN the system SHALL link it to the event record

### Requirement 7

**User Story:** As a platform administrator, I want to maintain control over public event creation, so that the quality and appropriateness of campus-wide events can be ensured.

#### Acceptance Criteria

1. WHEN a non-admin user attempts to create a public event THEN the system SHALL verify admin or event creation permissions
2. WHEN an admin creates a public event THEN the system SHALL allow full access to all event creation features
3. WHEN displaying the "Create Event" button THEN the system SHALL show it only to users with appropriate permissions
4. WHEN a user without permissions attempts direct access to the create event page THEN the system SHALL redirect to an error page

### Requirement 8

**User Story:** As a user browsing events, I want to filter events by category, so that I can quickly find events that match my interests.

#### Acceptance Criteria

1. WHEN creating an event THEN the system SHALL require selection of a category from predefined options
2. WHEN displaying the events list THEN the system SHALL provide a category filter control
3. WHEN a user selects a category filter THEN the system SHALL display only events matching that category
4. WHEN displaying an event card THEN the system SHALL show the event category as a visual indicator
5. WHEN no category filter is selected THEN the system SHALL display events from all categories
6. WHEN the system initializes THEN the system SHALL support categories including Social, Academic, Sports, Cultural, and Other

### Requirement 9

**User Story:** As a user of the platform, I want the event pages to have a consistent and aesthetically pleasing design, so that the experience matches the rest of the platform.

#### Acceptance Criteria

1. WHEN viewing any event-related page THEN the system SHALL use the platform's established color scheme and design tokens
2. WHEN displaying event cards THEN the system SHALL apply consistent spacing, borders, and hover effects matching other platform cards
3. WHEN viewing the event creation page THEN the system SHALL use form styling consistent with other platform forms
4. WHEN displaying event detail pages THEN the system SHALL maintain visual hierarchy and layout patterns used elsewhere
5. WHEN showing interactive elements THEN the system SHALL use button styles and animations consistent with the platform design system

### Requirement 10

**User Story:** As a developer, I want the event schema updated to support new features, so that start/end times, event visibility, categories, and communication channels can be properly stored.

#### Acceptance Criteria

1. WHEN the database schema is updated THEN the system SHALL include start_time and end_time columns in the events table
2. WHEN the database schema is updated THEN the system SHALL include an is_private boolean column in the events table
3. WHEN the database schema is updated THEN the system SHALL include a category column in the events table
4. WHEN the database schema is updated THEN the system SHALL include a forum_id column for linking public events to forums
5. WHEN the database schema is updated THEN the system SHALL include a cluster_id column for linking private events to clusters
6. WHEN the database schema is updated THEN the system SHALL include a cluster_pin column for storing private event access codes
7. WHEN existing events are migrated THEN the system SHALL preserve all current event data
8. WHEN new columns are added THEN the system SHALL set appropriate default values for existing records
