# Design Document: Event System Enhancements

## Overview

This design document outlines the architecture and implementation approach for enhancing the TUM Community Platform's event management system. The enhancements include:

1. Rebranding "TUM Native" to "TUM"
2. Converting event creation from a modal to a dedicated page
3. Adding start and end time fields for events
4. Simplifying event card design and improving event detail page layout
5. Introducing private events visible only to friends
6. Automatic creation of communication channels (forums for public events, clusters for private events)
7. Adding event categories with filtering capabilities
8. Ensuring consistent, aesthetically pleasing UI design

These changes will make the event system more flexible, social, and integrated with the platform's existing community features while maintaining a cohesive user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Event System Layer                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Events     │  │   Forums     │  │   Clusters   │      │
│  │   Service    │──│   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   Friendship   │                        │
│                    │    Service     │                        │
│                    └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │    Database    │
                    │   (Supabase)   │
                    └────────────────┘
```

### Component Interaction Flow

**Public Event Creation:**
```
User (Admin) → Create Event Page → Event Service → Database
                                         ↓
                                   Forum Service → Create Forum
                                         ↓
                                   Link Forum to Event
```

**Private Event Creation:**
```
User → Create Private Event Page → Event Service → Database
                                         ↓
                                   Cluster Service → Create PIN-Protected Cluster
                                         ↓
                                   Link Cluster to Event
```

**Event Visibility:**
```
User → Events List → Event Service → Check Visibility:
                                     - Public events: Show all
                                     - Private events: Check friendship → Show if friends
```

## Components and Interfaces

### 1. Database Schema Updates

#### Events Table Modifications

```sql
ALTER TABLE events
  ADD COLUMN start_time TIME NOT NULL DEFAULT '00:00',
  ADD COLUMN end_time TIME,
  ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN forum_id UUID REFERENCES subforums(id) ON DELETE SET NULL,
  ADD COLUMN cluster_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  ADD COLUMN cluster_pin TEXT;

-- Add check constraint for end_time > start_time
ALTER TABLE events
  ADD CONSTRAINT check_end_time_after_start
  CHECK (end_time IS NULL OR end_time > start_time);

-- Add check constraint for valid categories
ALTER TABLE events
  ADD CONSTRAINT check_valid_category
  CHECK (category IN ('social', 'academic', 'sports', 'cultural', 'other'));

-- Migrate existing time data
UPDATE events
  SET start_time = time::TIME
  WHERE time IS NOT NULL;

-- Drop old time column after migration
ALTER TABLE events DROP COLUMN time;
```

### 2. TypeScript Type Definitions

```typescript
// Event categories
export type EventCategory = 'social' | 'academic' | 'sports' | 'cultural' | 'other';

// Updated EventRow type
export interface EventRow {
  id: string;
  title: string;
  description: string;
  event_type: 'tum_native' | 'external';
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  external_link: string | null;
  max_attendees: number | null;
  is_published: boolean;
  is_private: boolean;
  category: EventCategory;
  forum_id: string | null;
  cluster_id: string | null;
  cluster_pin: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

// Updated CreateEventData
export interface CreateEventData {
  title: string;
  description: string;
  event_type: 'tum_native' | 'external';
  date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  external_link: string | null;
  max_attendees: number | null;
  is_published: boolean;
  is_private: boolean;
  category: EventCategory;
}

// Event filters with category
export interface EventFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  eventType?: 'tum_native' | 'external';
  category?: EventCategory;
  searchQuery?: string;
}
```

### 3. Event Service Layer

#### Core Functions

**createEvent (Enhanced)**
- Validates user permissions (admin for public, any user for private)
- Creates event record
- Automatically creates forum (public) or cluster (private)
- Links communication channel to event
- Returns event with channel information

**getEvents (Enhanced)**
- Filters events based on visibility:
  - Public events: visible to all
  - Private events: visible only to creator's friends
- Applies category filter
- Returns events with registration and channel info

**getEventVisibility**
- Checks if user can see a private event
- Queries friendship table
- Returns boolean

### 4. UI Components

#### Event Creation Page (`/events/create`)

**Route:** `/events/create` and `/events/create-private`

**Layout:**
```
┌─────────────────────────────────────────┐
│  ← Back to Events                       │
│                                         │
│  Create [Public/Private] Event          │
│  ────────────────────────────────────   │
│                                         │
│  [Event Type: TUM / External]           │
│  [Category Dropdown]                    │
│  [Title Input]                          │
│  [Description Textarea]                 │
│  [Date Picker]                          │
│  [Start Time] [End Time]                │
│  [Location Input]                       │
│  [Max Attendees (optional)]             │
│  [External Link (if external)]          │
│  [Publish Immediately Checkbox]         │
│                                         │
│  [Cancel] [Create Event]                │
└─────────────────────────────────────────┘
```

#### Simplified Event Card

**Design Principles:**
- Minimal visual clutter
- Clear hierarchy
- Consistent spacing
- Subtle hover effects

**Layout:**
```
┌─────────────────────────────────────────┐
│ [TUM] [Category] [Private?] [Status]    │
│                                         │
│ Event Title                             │
│ Brief description...                    │
│                                         │
│ 📅 Date  🕐 Time Range                  │
│ 📍 Location                             │
│ 👥 X registered                         │
│                                         │
│                        [Register Button]│
└─────────────────────────────────────────┘
```

#### Event Detail Page (Enhanced)

**Sections:**
1. Header with title, badges, and registration button
2. Event details (date, time, location, description)
3. Registration information (QR code if registered)
4. Communication channel access (forum link or cluster PIN)
5. Attendee list (if creator/admin)

### 5. Communication Channel Integration

#### Forum Creation for Public Events

```typescript
async function createEventForum(eventId: string, eventTitle: string, creatorId: string) {
  const forumData = {
    name: `${eventTitle} - Discussion`,
    description: `Forum for discussing ${eventTitle}`,
  };
  
  const { data: forum } = await createSubforum(forumData, creatorId);
  
  // Link forum to event
  await updateEvent(eventId, { forum_id: forum.id }, creatorId);
  
  return forum;
}
```

#### Cluster Creation for Private Events

```typescript
async function createEventCluster(eventId: string, eventTitle: string, creatorId: string) {
  // Generate 4-digit PIN
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  
  const clusterData = {
    name: `${eventTitle} - Chat`,
    description: `Private chat for ${eventTitle}`,
    access_type: 'pin' as const,
    pin_code: pin,
  };
  
  const { data: cluster } = await createChannel(clusterData, creatorId);
  
  // Store PIN and link cluster to event
  await updateEvent(eventId, { 
    cluster_id: cluster.id,
    cluster_pin: pin 
  }, creatorId);
  
  return { cluster, pin };
}
```

## Data Models

### Event Model (Updated)

```typescript
interface Event {
  // Identification
  id: string;
  creator_id: string;
  
  // Basic Info
  title: string;
  description: string;
  event_type: 'tum_native' | 'external';
  category: EventCategory;
  
  // Timing
  date: string;
  start_time: string;
  end_time: string | null;
  
  // Location
  location: string;
  external_link: string | null;
  
  // Capacity
  max_attendees: number | null;
  
  // Visibility & Status
  is_published: boolean;
  is_private: boolean;
  
  // Communication Channels
  forum_id: string | null;
  cluster_id: string | null;
  cluster_pin: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

### Event Visibility Rules

```typescript
function canUserSeeEvent(event: Event, userId: string, friendIds: string[]): boolean {
  // Public events are visible to all
  if (!event.is_private) {
    return true;
  }
  
  // Private events visible to creator
  if (event.creator_id === userId) {
    return true;
  }
  
  // Private events visible to creator's friends
  return friendIds.includes(event.creator_id);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: TUM label display consistency
*For any* event with event_type 'tum_native', the rendered display label should show "TUM" instead of "TUM Native"
**Validates: Requirements 1.1, 1.2**

### Property 2: Event time persistence
*For any* event created with start_time and end_time values, retrieving that event should return the same time values
**Validates: Requirements 3.2**

### Property 3: Event time display completeness
*For any* event with both start_time and end_time, the display should include both times in a readable format
**Validates: Requirements 3.3, 3.5**

### Property 4: End time validation
*For any* event where end_time is specified, the system should reject the event if end_time is not after start_time
**Validates: Requirements 3.4**

### Property 5: Private event visibility flag
*For any* event created through the private event creation flow, the is_private field should be set to true
**Validates: Requirements 5.2**

### Property 6: Private event friend visibility
*For any* private event and any user, the event should be visible to the user if and only if the user is the creator or is friends with the creator
**Validates: Requirements 5.3**

### Property 7: Private event creation authorization
*For any* authenticated user (regardless of admin status), creating a private event should succeed without permission errors
**Validates: Requirements 5.4**

### Property 8: Private event indicator display
*For any* private event displayed to a user, the UI should include a visual indicator showing its private status
**Validates: Requirements 5.5**

### Property 9: Private event registration absence
*For any* private event, the system should not create event registrations or QR codes
**Validates: Requirements 5.6**

### Property 10: Public event forum creation
*For any* public event created, the system should automatically create a forum and link it via the forum_id field
**Validates: Requirements 6.1, 6.7**

### Property 11: Private event cluster creation
*For any* private event created, the system should automatically create a pin-protected cluster and link it via the cluster_id field
**Validates: Requirements 6.2**

### Property 12: Public event forum access
*For any* user registered for a public event, the event details should include a link to the associated forum
**Validates: Requirements 6.3**

### Property 13: Private event cluster access
*For any* user registered for a private event, the event details should include the cluster PIN and access link
**Validates: Requirements 6.4**

### Property 14: Post-registration channel visibility
*For any* event where a user is registered, viewing the event detail page should display the communication channel link
**Validates: Requirements 6.5**

### Property 15: Cluster PIN uniqueness
*For any* two private events, their generated cluster PINs should be different
**Validates: Requirements 6.6**

### Property 16: Public event creation authorization
*For any* non-admin user without event creation permissions, attempting to create a public event should be rejected with an authorization error
**Validates: Requirements 7.1**

### Property 17: Event category requirement
*For any* event creation attempt without a category, the system should reject it with a validation error
**Validates: Requirements 8.1**

### Property 18: Category filter accuracy
*For any* category filter selection, all returned events should have a category matching the selected filter
**Validates: Requirements 8.3**

### Property 19: Event category display
*For any* event card rendered, the display should include the event's category as a visual indicator
**Validates: Requirements 8.4**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid time ranges (end before start)
   - Missing required fields (category, times)
   - Invalid category values
   - Invalid PIN format (must be 4 digits)

2. **Authorization Errors**
   - Non-admin creating public event without permissions
   - Accessing private events without friendship
   - Unauthorized route access

3. **Database Errors**
   - Event creation failures
   - Forum/cluster creation failures
   - Foreign key constraint violations

4. **Integration Errors**
   - Forum service unavailable
   - Cluster service unavailable
   - Friendship service unavailable

### Error Handling Strategy

```typescript
// Validation error example
if (end_time && start_time && end_time <= start_time) {
  throw new ValidationError(
    'End time must be after start time',
    { start_time, end_time }
  );
}

// Authorization error example
if (!is_private && !user.is_admin && !user.can_create_events) {
  throw new AuthenticationError(
    'You do not have permission to create public events',
    'Unauthorized'
  );
}

// Rollback on integration failure
try {
  const event = await createEvent(data);
  const forum = await createEventForum(event.id, event.title, userId);
  await linkForumToEvent(event.id, forum.id);
} catch (error) {
  // Rollback event creation if forum creation fails
  await deleteEvent(event.id);
  throw error;
}
```

### User-Facing Error Messages

- **Time Validation:** "Event end time must be after start time"
- **Category Missing:** "Please select an event category"
- **Authorization:** "Only administrators can create public events"
- **Private Event Access:** "This event is only visible to the creator's friends"
- **Channel Creation Failed:** "Event created but communication channel setup failed. Please contact support."

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Display Logic Tests**
   - Test that "TUM Native" renders as "TUM"
   - Test category badge rendering
   - Test private event indicator display

2. **Validation Tests**
   - Test end_time validation with various time combinations
   - Test category validation with valid and invalid values
   - Test PIN format validation (4 digits)

3. **Authorization Tests**
   - Test admin can create public events
   - Test non-admin can create private events
   - Test non-admin cannot create public events without permission

4. **Integration Tests**
   - Test forum creation for public events
   - Test cluster creation for private events
   - Test event-channel linking

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using a PBT library (fast-check for TypeScript):

**Testing Framework:** fast-check (TypeScript/JavaScript property-based testing library)

**Configuration:** Each property test should run a minimum of 100 iterations

**Test Tagging:** Each property-based test must include a comment with the format:
`// Feature: event-enhancements, Property {number}: {property_text}`

**Key Properties to Test:**

1. **Time Validation Property**
   - Generate random start and end times
   - Verify validation correctly accepts valid ranges and rejects invalid ones

2. **Visibility Property**
   - Generate random users, friendships, and private events
   - Verify visibility rules are correctly applied

3. **Category Filter Property**
   - Generate random events with categories
   - Apply category filters
   - Verify all returned events match the filter

4. **Display Consistency Property**
   - Generate random events
   - Verify all tum_native events display as "TUM"

5. **Channel Creation Property**
   - Generate random public and private events
   - Verify forums are created for public events
   - Verify clusters are created for private events

6. **PIN Uniqueness Property**
   - Generate multiple private events
   - Verify all cluster PINs are unique

### Test Data Generators

```typescript
// Example generators for property-based testing
const eventGenerator = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  event_type: fc.constantFrom('tum_native', 'external'),
  category: fc.constantFrom('social', 'academic', 'sports', 'cultural', 'other'),
  date: fc.date(),
  start_time: fc.string({ minLength: 5, maxLength: 5 }), // HH:MM format
  end_time: fc.option(fc.string({ minLength: 5, maxLength: 5 })),
  is_private: fc.boolean(),
});

const friendshipGenerator = fc.record({
  user1_id: fc.uuid(),
  user2_id: fc.uuid(),
  status: fc.constant('accepted'),
});
```

## Implementation Phases

### Phase 1: Database Schema Updates
1. Create migration for new columns
2. Add constraints and indexes
3. Migrate existing data
4. Update TypeScript types

### Phase 2: Core Event Service Updates
1. Update createEvent to handle new fields
2. Implement visibility filtering logic
3. Update getEvents with category filtering
4. Add time validation logic

### Phase 3: Communication Channel Integration
1. Implement forum creation for public events
2. Implement cluster creation for private events
3. Add PIN generation logic
4. Implement channel linking

### Phase 4: UI Components
1. Create event creation page (replace modal)
2. Update event cards with simplified design
3. Add category filter UI
4. Update event detail page with channel access
5. Add private event indicator

### Phase 5: Testing & Polish
1. Write unit tests
2. Write property-based tests
3. UI/UX refinements
4. Performance optimization

## Performance Considerations

1. **Event Visibility Queries**
   - Index on is_private column
   - Optimize friendship lookup queries
   - Consider caching friend lists

2. **Category Filtering**
   - Index on category column
   - Combine with existing filters efficiently

3. **Channel Creation**
   - Make forum/cluster creation asynchronous if needed
   - Handle failures gracefully without blocking event creation

4. **PIN Generation**
   - Use cryptographically secure random number generation
   - Ensure uniqueness checks are efficient

## Security Considerations

1. **Private Event Access**
   - Verify friendship status on every access
   - Don't expose private events in public APIs
   - Validate user permissions server-side

2. **Cluster PINs**
   - Store PINs securely (consider hashing)
   - Only reveal PIN to registered users
   - Implement rate limiting on PIN attempts

3. **Authorization**
   - Verify admin status server-side
   - Don't trust client-side permission checks
   - Audit event creation actions

4. **Data Validation**
   - Sanitize all user inputs
   - Validate time formats
   - Validate category values against whitelist

## Migration Strategy

### Backward Compatibility

1. **Existing Events**
   - Set default start_time from existing time field
   - Set end_time to null
   - Set is_private to false
   - Set category to 'other'
   - Set forum_id, cluster_id, cluster_pin to null

2. **API Compatibility**
   - Support both old and new time formats temporarily
   - Deprecate old endpoints gracefully
   - Provide migration guide for API consumers

### Rollback Plan

1. Keep old time column temporarily
2. Maintain backward-compatible queries
3. Test rollback procedure in staging
4. Document rollback steps

## Future Enhancements

1. **Event Series**
   - Support recurring events
   - Link related events

2. **Advanced Visibility**
   - Share private events with specific users
   - Create invite-only events

3. **Enhanced Categories**
   - User-defined categories
   - Category hierarchies
   - Multiple categories per event

4. **Communication Features**
   - In-app event notifications
   - Event reminders
   - RSVP with notes

5. **Analytics**
   - Event popularity metrics
   - Category trends
   - Attendance patterns
