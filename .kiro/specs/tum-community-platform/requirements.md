# Requirements Document

## Introduction

The TUM Community Platform is a web application designed exclusively for TUM Heilbronn Campus students to foster community engagement and collaboration. The platform provides authenticated access restricted to TUM email domains, and offers three core features: a Reddit-style forum system with anonymous posting capabilities, official Slack-style channels for sports and clubs, and an event management system for campus and external events.

## Glossary

- **Platform**: The TUM Community Platform web application
- **Student**: A TUM Heilbronn Campus student with a valid @tum.de or @mytum.de email address
- **Forum**: A Reddit-style discussion board where students can create subforums and posts
- **Subforum**: A student-created discussion space within the Forum for specific topics
- **Channel**: An official Slack-style communication space for sports teams and clubs, created only by administrators
- **Event**: A campus or external activity that students can view and register for
- **Event Creator**: A student with special permissions to create and manage events
- **Administrator**: A user with elevated privileges to create channels and manage platform settings
- **Anonymous Post**: A forum post where the author's identity is hidden from other users
- **Supabase**: The authentication and backend service provider used for email verification
- **Guest User**: A non-authenticated visitor who can access limited public information
- **Wiki**: A public information repository containing guides for prospective and incoming TUM students
- **Calendar**: A personal scheduling tool where students can view subscribed events and create personal calendar entries
- **Personal Event**: A calendar entry created by a student for their own scheduling purposes, not visible to other users

## Requirements

### Requirement 1

**User Story:** As a TUM student, I want to register and authenticate using my TUM email address, so that I can access the platform securely and ensure only TUM students can participate.

#### Acceptance Criteria

1. WHEN a user attempts to register THEN the Platform SHALL accept only email addresses ending with @tum.de or @mytum.de
2. WHEN a user submits a valid TUM email for registration THEN the Platform SHALL send a verification email through Supabase
3. WHEN a user clicks the verification link in the email THEN the Platform SHALL activate the user account and grant access
4. WHEN a user with an unverified email attempts to access protected features THEN the Platform SHALL deny access and prompt for email verification
5. WHEN a user attempts to register with a non-TUM email address THEN the Platform SHALL reject the registration and display an error message

### Requirement 2

**User Story:** As a student, I want to create and participate in subforums on various topics, so that I can discuss course material, share memes, and engage with peers on subjects that interest me.

#### Acceptance Criteria

1. WHEN a verified student creates a subforum THEN the Platform SHALL store the subforum with a unique identifier, name, description, and creator information
2. WHEN a student views the forum section THEN the Platform SHALL display all available subforums with their names, descriptions, and member counts
3. WHEN a student joins a subforum THEN the Platform SHALL add the student to the subforum membership list
4. WHEN a student creates a post in a subforum THEN the Platform SHALL associate the post with the subforum and the author
5. WHEN a student views a subforum THEN the Platform SHALL display all posts within that subforum ordered by creation time or popularity

### Requirement 3

**User Story:** As a student, I want to post anonymously in forums when I choose, so that I can share sensitive information or opinions without revealing my identity.

#### Acceptance Criteria

1. WHEN a student creates a post THEN the Platform SHALL provide a toggle option to post anonymously
2. WHEN a student enables anonymous posting THEN the Platform SHALL hide the author's identity from all other users viewing the post
3. WHEN a student posts anonymously THEN the Platform SHALL still maintain the author's identity in the backend for moderation purposes
4. WHEN a student views an anonymous post THEN the Platform SHALL display a generic identifier instead of the author's name
5. WHEN a student disables anonymous posting THEN the Platform SHALL display the author's name and profile information with the post

### Requirement 4

**User Story:** As a student, I want to interact with forum posts through comments, upvotes, and downvotes, so that I can engage in discussions and surface quality content.

#### Acceptance Criteria

1. WHEN a student clicks upvote on a post THEN the Platform SHALL increment the post's vote count by one
2. WHEN a student clicks downvote on a post THEN the Platform SHALL decrement the post's vote count by one
3. WHEN a student votes on a post they previously voted on THEN the Platform SHALL remove the previous vote and apply the new vote
4. WHEN a student adds a comment to a post THEN the Platform SHALL associate the comment with the post and display it in the comment thread
5. WHEN a student views a subforum THEN the Platform SHALL order posts by vote count, recency, or other sorting criteria

### Requirement 5

**User Story:** As an administrator, I want to create official channels for sports teams and clubs, so that students can join organized communities and receive relevant updates.

#### Acceptance Criteria

1. WHEN an administrator creates a channel THEN the Platform SHALL store the channel with a name, description, and official status
2. WHEN a non-administrator user attempts to create a channel THEN the Platform SHALL deny the request and display an error message
3. WHEN a student views the channels section THEN the Platform SHALL display all available official channels
4. WHEN a student joins a channel THEN the Platform SHALL add the student to the channel membership list
5. WHEN a student leaves a channel THEN the Platform SHALL remove the student from the channel membership list

### Requirement 6

**User Story:** As a channel member, I want to send and receive messages in channels I've joined, so that I can communicate with other members about sports, clubs, and activities.

#### Acceptance Criteria

1. WHEN a channel member sends a message THEN the Platform SHALL store the message with timestamp, author, and channel association
2. WHEN a channel member views a channel THEN the Platform SHALL display all messages in chronological order
3. WHEN a message is sent to a channel THEN the Platform SHALL make the message visible to all channel members
4. WHEN a non-member attempts to view channel messages THEN the Platform SHALL deny access and prompt the user to join the channel
5. WHEN a channel member sends a message THEN the Platform SHALL display the message immediately without requiring a page refresh

### Requirement 7

**User Story:** As an event creator, I want to create and publish events with details and registration options, so that students can discover and participate in campus and external activities.

#### Acceptance Criteria

1. WHEN an event creator creates an event THEN the Platform SHALL store the event with title, description, date, time, location, and event type (TUM native or external)
2. WHEN an event creator specifies a TUM native event THEN the Platform SHALL enable QR code ticket generation for registered attendees
3. WHEN an event creator specifies an external event THEN the Platform SHALL allow adding an external registration link
4. WHEN a non-event-creator user attempts to create an event THEN the Platform SHALL deny the request and display an error message
5. WHEN an event creator publishes an event THEN the Platform SHALL make the event visible in the events section to all students

### Requirement 8

**User Story:** As a student, I want to browse and register for events, so that I can participate in activities that interest me and receive event access credentials.

#### Acceptance Criteria

1. WHEN a student views the events section THEN the Platform SHALL display all published events with their details
2. WHEN a student registers for a TUM native event THEN the Platform SHALL generate a unique QR code ticket for the student
3. WHEN a student registers for an external event THEN the Platform SHALL provide the external registration link
4. WHEN a student views a TUM native event they registered for THEN the Platform SHALL display their QR code ticket
5. WHEN a student unregisters from an event THEN the Platform SHALL remove the student from the event attendee list and invalidate any generated tickets

### Requirement 9

**User Story:** As a student, I want to filter and search for subforums, channels, and events, so that I can quickly find content relevant to my interests.

#### Acceptance Criteria

1. WHEN a student enters a search query in the forum section THEN the Platform SHALL return subforums matching the query by name or description
2. WHEN a student enters a search query in the channels section THEN the Platform SHALL return channels matching the query by name or description
3. WHEN a student filters events by date range THEN the Platform SHALL display only events occurring within the specified range
4. WHEN a student filters events by type THEN the Platform SHALL display only events matching the selected type (TUM native or external)
5. WHEN a student applies multiple filters THEN the Platform SHALL display results matching all applied filter criteria

### Requirement 10

**User Story:** As a prospective or incoming TUM student without a TUM email, I want to access helpful information as a guest, so that I can learn about the application process and prepare for my arrival in Germany.

#### Acceptance Criteria

1. WHEN a visitor without a TUM email accesses the Platform THEN the Platform SHALL display a "Continue as Guest" option
2. WHEN a visitor selects "Continue as Guest" THEN the Platform SHALL grant access to the Wiki section only
3. WHEN a guest user accesses the Wiki THEN the Platform SHALL display information about the TUM application process
4. WHEN a guest user accesses the Wiki THEN the Platform SHALL display guides for new students arriving in Germany
5. WHEN a guest user attempts to access forums, channels, or events THEN the Platform SHALL deny access and prompt for TUM email authentication

### Requirement 11

**User Story:** As an administrator, I want to create and edit wiki content, so that prospective and incoming students have access to accurate and up-to-date information.

#### Acceptance Criteria

1. WHEN an administrator creates a wiki article THEN the Platform SHALL store the article with title, content, category, and last updated timestamp
2. WHEN an administrator edits a wiki article THEN the Platform SHALL update the content and timestamp
3. WHEN a guest user or student views the Wiki THEN the Platform SHALL display all published wiki articles organized by category
4. WHEN an administrator deletes a wiki article THEN the Platform SHALL remove the article from public view
5. WHEN a wiki article is updated THEN the Platform SHALL maintain version history for reference

### Requirement 12

**User Story:** As a student, I want to use a personal calendar to manage my schedule, so that I can view my subscribed events and add my own personal calendar entries in one place.

#### Acceptance Criteria

1. WHEN a student views the calendar THEN the Platform SHALL display all events the student has subscribed to from the events section
2. WHEN a student creates a personal calendar event THEN the Platform SHALL store the event with title, description, date, time, and color coding
3. WHEN a student views the calendar THEN the Platform SHALL display both subscribed events and personal events in a monthly, weekly, or daily view
4. WHEN a student edits a personal calendar event THEN the Platform SHALL update the event details
5. WHEN a student deletes a personal calendar event THEN the Platform SHALL remove the event from the calendar
6. WHEN a student unsubscribes from an event THEN the Platform SHALL remove that event from the calendar view
7. WHEN a student views a calendar event THEN the Platform SHALL distinguish between subscribed events and personal events visually

### Requirement 13

**User Story:** As an administrator, I want to moderate forum content and manage user permissions, so that I can maintain a safe and respectful community environment.

#### Acceptance Criteria

1. WHEN an administrator views any post or comment THEN the Platform SHALL display the true author identity even for anonymous posts
2. WHEN an administrator deletes a post or comment THEN the Platform SHALL remove the content from public view
3. WHEN an administrator grants event creator permissions to a student THEN the Platform SHALL enable event creation capabilities for that student
4. WHEN an administrator revokes event creator permissions THEN the Platform SHALL disable event creation capabilities for that student
5. WHEN an administrator views moderation logs THEN the Platform SHALL display a history of moderation actions with timestamps and responsible administrators
