# Design Document: Social Profiles and Feed

## Overview

This design focuses on rapid frontend prototype development with excellent user experience for social features in the TUM Community Platform. The implementation prioritizes UI/UX quality, smooth interactions, and visual polish while keeping backend infrastructure minimal and straightforward. The feature introduces user profiles, friend connections, and an activity feed that transforms the dashboard into a social hub.

The design leverages existing patterns from the codebase (card-based layouts, neon gradients, skeleton loaders) and extends them with social interactions. We'll use DiceBear for avatar generation, optimistic UI updates for responsiveness, and infinite scroll for the activity feed.

## Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Profile    │  │    Friend    │  │   Activity   │  │
│  │  Components  │  │  Components  │  │    Feed      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Access Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Profile    │  │  Friendship  │  │   Activity   │  │
│  │   Service    │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Supabase Database                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │user_profiles │  │ friendships  │  │  activities  │  │
│  │  (extended)  │  │   (new)      │  │    (view)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Frontend-First**: Build rich UI components with optimistic updates before backend confirmation
2. **Minimal Backend**: Use simple database tables and queries; avoid complex stored procedures
3. **Progressive Enhancement**: Core features work immediately; enhancements load progressively
4. **Consistent Patterns**: Reuse existing card layouts, animations, and styling from forums/channels
5. **Performance**: Skeleton loaders, infinite scroll, and cached data for smooth UX

## Components and Interfaces

### Frontend Components

#### 1. Profile Components

**ProfilePage** (`app/(authenticated)/profile/[userId]/page.tsx`)
- Displays user profile with avatar, bio, interests
- Shows friend status and action buttons
- Lists recent activity (posts, event registrations)
- Responsive layout with card-based design

**ProfileEditDialog** (`components/profile/profile-edit-dialog.tsx`)
- Modal for editing bio and interests
- Form validation with react-hook-form
- Optimistic UI updates

**ProfileCard** (`components/profile/profile-card.tsx`)
- Compact profile display for lists
- Shows avatar (DiceBear), name, friend status
- Click to navigate to full profile

**UserAvatar** (`components/profile/user-avatar.tsx`)
- Generates DiceBear avatar based on user ID
- Fallback to initials
- Configurable size variants

#### 2. Friend Components

**FriendRequestButton** (`components/profile/friend-request-button.tsx`)
- Context-aware button (Send Request / Pending / Friends / Unfriend)
- Optimistic UI with loading states
- Confirmation dialog for unfriend action

**FriendsList** (`components/profile/friends-list.tsx`)
- Grid/list of friend profile cards
- Search and filter capabilities
- Empty state for no friends

**FriendRequestsList** (`components/profile/friend-requests-list.tsx`)
- Shows incoming friend requests
- Accept/Decline actions with optimistic UI
- Badge showing count of pending requests

**UserSearchDialog** (`components/profile/user-search-dialog.tsx`)
- Search users by name
- Displays results with friend status
- Quick actions to send friend requests

#### 3. Activity Feed Components

**ActivityFeed** (`components/activity/activity-feed.tsx`)
- Main feed component for dashboard
- Infinite scroll implementation
- Groups activities by date
- Empty state when no friends or no activity

**ActivityItem** (`components/activity/activity-item.tsx`)
- Single activity card (post created, event registered, friend added)
- Avatar, timestamp, action description
- Click to navigate to relevant content
- Smooth hover animations

**ActivityFilters** (`components/activity/activity-filters.tsx`)
- Filter by activity type (posts, events, friends)
- Date range selection
- Friend-specific filtering

### Data Access Layer

#### Profile Service (`lib/profile/profiles.ts`)

```typescript
// Get user profile by ID
export async function getUserProfile(
  userId: string,
  viewerId?: string
): Promise<ProfileResponse>

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<ProfileResponse>

// Search users by name
export async function searchUsers(
  query: string,
  viewerId?: string
): Promise<UsersResponse>

// Get user's recent activity
export async function getUserActivity(
  userId: string,
  limit?: number
): Promise<ActivityResponse>
```

#### Friendship Service (`lib/profile/friendships.ts`)

```typescript
// Send friend request
export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<FriendshipResponse>

// Accept friend request
export async function acceptFriendRequest(
  requestId: string
): Promise<FriendshipResponse>

// Decline friend request
export async function declineFriendRequest(
  requestId: string
): Promise<{ error: Error | null }>

// Unfriend user
export async function unfriendUser(
  userId: string,
  friendId: string
): Promise<{ error: Error | null }>

// Get user's friends
export async function getUserFriends(
  userId: string
): Promise<FriendsResponse>

// Get pending friend requests
export async function getPendingRequests(
  userId: string
): Promise<FriendRequestsResponse>

// Get friendship status between two users
export async function getFriendshipStatus(
  userId: string,
  otherUserId: string
): Promise<FriendshipStatusResponse>
```

#### Activity Service (`lib/activity/activities.ts`)

```typescript
// Get activity feed for user (from friends)
export async function getActivityFeed(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    types?: ActivityType[]
  }
): Promise<ActivitiesResponse>

// Get activity count for user
export async function getActivityCount(
  userId: string
): Promise<{ data: number | null; error: Error | null }>
```

## Data Models

### Database Schema Extensions

#### Extended user_profiles Table

```sql
ALTER TABLE user_profiles
ADD COLUMN bio TEXT,
ADD COLUMN interests TEXT[], -- Array of interest tags
ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'public'; -- 'public' or 'friends_only'
```

#### New friendships Table

```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted'
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate friendships
  UNIQUE(user_id, friend_id),
  
  -- Ensure user can't friend themselves
  CHECK (user_id != friend_id)
);

-- Indexes for performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

#### Activity Feed View

Instead of a separate activities table, we'll create a database view that aggregates activities from existing tables:

```sql
CREATE OR REPLACE VIEW user_activities AS
SELECT 
  'post' AS activity_type,
  p.id AS activity_id,
  p.author_id AS user_id,
  p.title AS activity_title,
  p.content AS activity_description,
  s.name AS context_name,
  p.created_at,
  p.author_id AS actor_id
FROM posts p
JOIN subforums s ON p.subforum_id = s.id
WHERE p.is_anonymous = false

UNION ALL

SELECT 
  'event_registration' AS activity_type,
  er.id AS activity_id,
  er.user_id AS user_id,
  e.title AS activity_title,
  e.description AS activity_description,
  e.location AS context_name,
  er.registered_at AS created_at,
  er.user_id AS actor_id
FROM event_registrations er
JOIN events e ON er.event_id = e.id

UNION ALL

SELECT 
  'friendship' AS activity_type,
  f.id AS activity_id,
  f.user_id AS user_id,
  'New friend connection' AS activity_title,
  NULL AS activity_description,
  NULL AS context_name,
  f.created_at,
  f.friend_id AS actor_id
FROM friendships f
WHERE f.status = 'accepted';
```

### TypeScript Types

#### Profile Types (`types/profile.ts`)

```typescript
export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  interests: string[] | null
  profile_visibility: 'public' | 'friends_only'
  is_admin: boolean
  can_create_events: boolean
  created_at: string
  updated_at: string
}

export interface ProfileUpdate {
  display_name?: string
  bio?: string
  interests?: string[]
  profile_visibility?: 'public' | 'friends_only'
}

export interface UserProfileWithFriendship extends UserProfile {
  friendship_status: FriendshipStatus
  mutual_friends_count?: number
}

export type FriendshipStatus = 
  | 'none' 
  | 'pending_sent' 
  | 'pending_received' 
  | 'friends'

export interface ProfileResponse {
  data: UserProfile | null
  error: Error | null
}

export interface UsersResponse {
  data: UserProfileWithFriendship[] | null
  error: Error | null
}
```

#### Friendship Types (`types/friendship.ts`)

```typescript
export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted'
  requester_id: string
  created_at: string
  updated_at: string
}

export interface FriendWithProfile {
  friendship_id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  interests: string[] | null
  friendship_since: string
}

export interface FriendRequest {
  id: string
  requester_id: string
  requester_name: string | null
  requester_avatar: string | null
  requester_bio: string | null
  created_at: string
}

export interface FriendshipResponse {
  data: Friendship | null
  error: Error | null
}

export interface FriendsResponse {
  data: FriendWithProfile[] | null
  error: Error | null
}

export interface FriendRequestsResponse {
  data: FriendRequest[] | null
  error: Error | null
}

export interface FriendshipStatusResponse {
  data: FriendshipStatus | null
  error: Error | null
}
```

#### Activity Types (`types/activity.ts`)

```typescript
export type ActivityType = 'post' | 'event_registration' | 'friendship'

export interface Activity {
  activity_type: ActivityType
  activity_id: string
  user_id: string
  activity_title: string
  activity_description: string | null
  context_name: string | null
  created_at: string
  actor_id: string
  actor_name: string | null
  actor_avatar: string | null
}

export interface ActivityResponse {
  data: Activity | null
  error: Error | null
}

export interface ActivitiesResponse {
  data: Activity[] | null
  error: Error | null
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to avoid redundancy:

- **UI Field Display Properties (1.2, 3.3, 6.2)**: All test that rendered components contain required fields. Combined into Property 1.
- **Friendship Status UI (2.1, 2.6)**: Both test UI state based on friendship status. Combined into Property 2.
- **Pending Requests Display (3.4, 3.5)**: Both deal with displaying pending requests. Combined into Property 3.
- **Activity Feed Updates (4.2, 4.3)**: Both test that friend activities appear in feed. Combined into Property 4.
- **Profile Update Round Trip (5.3)**: Subsumes basic update functionality through round-trip testing.

### Correctness Properties

Property 1: Profile and search results display required fields
*For any* user profile or search result displayed in the UI, the rendered output should contain all required fields (name, avatar, bio, interests, and friendship status where applicable)
**Validates: Requirements 1.2, 3.3, 6.2**

Property 2: Friendship status determines UI actions
*For any* two users, the displayed action buttons should match their friendship status (send request for non-friends, pending for sent requests, unfriend for friends)
**Validates: Requirements 2.1, 2.6**

Property 3: Pending requests display is complete and accurate
*For any* user with incoming friend requests, the displayed count should equal the number of pending requests, and all pending requests should be visible in the requests list
**Validates: Requirements 3.4, 3.5**

Property 4: Friend connection is bidirectional
*For any* accepted friend request, both users should be friends with each other (symmetric relationship), and querying from either user should show the friendship
**Validates: Requirements 2.4**

Property 5: Declining request removes it completely
*For any* pending friend request, declining it should remove the request from the database and leave no friendship connection between the users
**Validates: Requirements 2.5**

Property 6: Friends list completeness
*For any* user, the displayed friends list should contain exactly all users with whom they have an accepted friendship, with no duplicates or missing entries
**Validates: Requirements 3.1**

Property 7: Activity feed contains only friend activities
*For any* user's activity feed, all displayed activities should be from users who are confirmed friends, and no activities from non-friends should appear
**Validates: Requirements 4.1**

Property 8: Friend activities appear in feed
*For any* friend's activity (post creation or event registration), that activity should appear in the user's activity feed within the configured time window
**Validates: Requirements 4.2, 4.3**

Property 9: Activity feed chronological ordering
*For any* activity feed, activities should be ordered by timestamp in descending order (most recent first), with no out-of-order items
**Validates: Requirements 4.5**

Property 10: Profile update round trip
*For any* valid profile update (bio, interests), saving the changes and then reading the profile should return the updated values
**Validates: Requirements 5.3**

Property 11: Invalid profile data rejection
*For any* invalid profile data (e.g., bio exceeding length limit, malformed interests), the system should reject the update and preserve the original profile data unchanged
**Validates: Requirements 5.2, 5.4**

Property 12: Avatar generation consistency
*For any* user ID, generating the DiceBear avatar multiple times should produce the same avatar URL, ensuring consistent visual identity
**Validates: Requirements 5.5**

Property 13: Search results match query
*For any* search query, all returned user results should have names that match the query (case-insensitive substring match)
**Validates: Requirements 6.1**

Property 14: Optimistic UI updates before confirmation
*For any* friend request action (send, accept, decline), the UI state should update immediately before the backend operation completes, providing instant feedback
**Validates: Requirements 7.2**

Property 15: Infinite scroll loads additional data
*For any* activity feed with more items than the initial page size, scrolling to the bottom should trigger loading of additional activities
**Validates: Requirements 7.5**

## Error Handling

### Frontend Error Handling

1. **Network Errors**: Display toast notifications for failed requests with retry options
2. **Validation Errors**: Show inline error messages on form fields
3. **Not Found Errors**: Redirect to 404 page for non-existent profiles
4. **Permission Errors**: Show appropriate messages when users lack permissions
5. **Optimistic UI Rollback**: Revert optimistic updates if backend operations fail

### Backend Error Handling

1. **Database Constraint Violations**: Handle unique constraint violations gracefully (e.g., duplicate friend requests)
2. **Foreign Key Violations**: Validate user IDs exist before creating relationships
3. **Transaction Failures**: Use database transactions for multi-step operations (e.g., accepting friend request)
4. **Rate Limiting**: Implement basic rate limiting on friend request endpoints to prevent spam

### Error Response Format

All service functions return a consistent error format:

```typescript
{
  data: T | null,
  error: Error | null
}
```

Frontend components check for errors and display appropriate UI:

```typescript
const { data, error } = await sendFriendRequest(userId, friendId)
if (error) {
  toast.error(error.message)
  // Rollback optimistic update
  return
}
// Success handling
```

## Testing Strategy

### Unit Testing

Unit tests will focus on:

1. **Service Functions**: Test individual data access functions with mocked Supabase client
2. **Component Logic**: Test component state management and event handlers
3. **Utility Functions**: Test avatar generation, date formatting, activity grouping
4. **Form Validation**: Test profile edit form validation rules
5. **Error Handling**: Test error scenarios and fallback behavior

Example unit tests:
- `getUserProfile` returns correct profile data
- `sendFriendRequest` creates pending friendship
- `ActivityItem` component renders correct activity type
- `UserAvatar` generates consistent DiceBear URLs
- Profile edit form validates bio length

### Property-Based Testing

Property-based tests will verify universal properties using a PBT library. We'll use **fast-check** for TypeScript/JavaScript property-based testing.

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test must include a comment tag in this exact format:
```typescript
// Feature: social-profiles-and-feed, Property {number}: {property_text}
```

**Property Test Coverage**:

1. **Property 1**: Generate random user profiles and verify rendered output contains all required fields
2. **Property 2**: Generate random user pairs with different friendship statuses and verify UI actions match
3. **Property 3**: Generate random users with varying numbers of pending requests and verify count and list accuracy
4. **Property 4**: Generate random friend requests, accept them, and verify bidirectional friendship
5. **Property 5**: Generate random friend requests, decline them, and verify complete removal
6. **Property 6**: Generate random users with various friend connections and verify list completeness
7. **Property 7**: Generate random activity feeds and verify all activities are from friends
8. **Property 8**: Generate random friend activities and verify they appear in feeds
9. **Property 9**: Generate random activity feeds and verify chronological ordering
10. **Property 10**: Generate random profile updates, save them, and verify round-trip consistency
11. **Property 11**: Generate invalid profile data and verify rejection without changes
12. **Property 12**: Generate random user IDs and verify avatar URL consistency
13. **Property 13**: Generate random search queries and verify all results match
14. **Property 14**: Test optimistic UI updates occur before async operations complete
15. **Property 15**: Test infinite scroll triggers additional data loading

### Integration Testing

Integration tests will verify:

1. **End-to-End Flows**: Complete user journeys (view profile → send request → accept → see in friends list)
2. **Database Interactions**: Real database operations with test data
3. **Real-time Updates**: Activity feed updates when friends perform actions
4. **Navigation**: Routing between profile pages and activity items

### Testing Approach

- **Implementation First**: Build features before writing tests
- **Property Tests for Core Logic**: Use PBT for friendship operations, activity feed, and profile updates
- **Unit Tests for Edge Cases**: Test specific scenarios like empty states, error conditions
- **No Mocking for Simplicity**: Test against real Supabase client when possible for simpler, more reliable tests

## UI/UX Design Details

### Visual Design

**Color Scheme**: Extend existing neon gradient theme
- Primary actions: Purple gradient (`from-primary/25 via-background/60`)
- Friend status badges: Emerald for friends, amber for pending, gray for none
- Activity feed: Subtle card backgrounds with hover glow effect

**Typography**:
- Profile names: `text-3xl font-extrabold`
- Section headers: `text-xl font-semibold`
- Activity descriptions: `text-sm text-muted-foreground`
- Timestamps: `text-xs text-muted-foreground`

**Spacing**: Follow existing card-based layout patterns with consistent padding

### Interaction Patterns

**Optimistic Updates**:
```typescript
// Example: Send friend request with optimistic UI
const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none')

const handleSendRequest = async () => {
  // Optimistic update
  setFriendshipStatus('pending_sent')
  
  const { error } = await sendFriendRequest(userId, friendId)
  
  if (error) {
    // Rollback on error
    setFriendshipStatus('none')
    toast.error('Failed to send friend request')
  } else {
    toast.success('Friend request sent!')
  }
}
```

**Skeleton Loaders**: Match content layout
- Profile page: Avatar circle + text lines
- Friends list: Grid of profile cards with pulsing backgrounds
- Activity feed: List of activity item skeletons

**Infinite Scroll**: Use intersection observer
```typescript
const { ref, inView } = useInView()

useEffect(() => {
  if (inView && hasMore) {
    loadMoreActivities()
  }
}, [inView])
```

**Animations**:
- Card hover: `hover:-translate-y-0.5 transition-transform`
- Button clicks: Scale down slightly with `active:scale-95`
- Page transitions: Fade in with `animate-in fade-in duration-300`

### Responsive Design

**Mobile (< 768px)**:
- Single column layout
- Stacked profile info and actions
- Simplified activity cards
- Bottom navigation for quick access

**Tablet (768px - 1024px)**:
- Two column grid for friends list
- Side-by-side profile info and stats
- Compact activity feed

**Desktop (> 1024px)**:
- Three column grid for friends list
- Dashboard with activity feed (2/3 width) + sidebar (1/3 width)
- Expanded activity cards with previews

### Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **ARIA Labels**: Proper labels for buttons and links
3. **Focus Indicators**: Visible focus rings on all interactive elements
4. **Screen Reader Support**: Semantic HTML and descriptive text
5. **Color Contrast**: Ensure text meets WCAG AA standards

## Implementation Notes

### DiceBear Integration

Use DiceBear's HTTP API for avatar generation:

```typescript
export function generateAvatarUrl(userId: string, style: string = 'avataaars'): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${userId}`
}
```

Supported styles: `avataaars`, `bottts`, `identicon`, `initials`

### Performance Optimizations

1. **SWR for Data Fetching**: Cache profile and friend data with automatic revalidation
2. **Lazy Loading**: Load activity feed items progressively
3. **Image Optimization**: Use Next.js Image component for avatars (though DiceBear returns SVG)
4. **Debounced Search**: Debounce user search input to reduce API calls
5. **Memoization**: Memoize expensive computations (activity grouping, friend filtering)

### Database Indexes

Ensure these indexes exist for performance:

```sql
-- Friendships
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status ON friendships(friend_id, status);

-- Activity feed (on underlying tables)
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_event_registrations_user_created ON event_registrations(user_id, registered_at DESC);
```

### Security Considerations

1. **Row Level Security (RLS)**: Enable RLS on friendships table
2. **Profile Visibility**: Respect `profile_visibility` setting when showing profiles
3. **Input Sanitization**: Sanitize bio and interests to prevent XSS
4. **Rate Limiting**: Limit friend request frequency per user
5. **Authentication**: All endpoints require authenticated user

### Migration Strategy

1. **Phase 1**: Extend user_profiles table with bio and interests
2. **Phase 2**: Create friendships table with indexes
3. **Phase 3**: Create user_activities view
4. **Phase 4**: Deploy frontend components progressively (profiles → friends → feed)
5. **Phase 5**: Enable features via feature flags

## Future Enhancements

While keeping the current implementation minimal, these enhancements could be added later:

1. **Notifications System**: Real-time notifications for friend requests and activities
2. **Activity Reactions**: Like/comment on friend activities directly in feed
3. **Friend Suggestions**: Recommend friends based on mutual connections
4. **Profile Badges**: Achievement badges for active community members
5. **Privacy Controls**: Granular privacy settings for profile visibility
6. **Activity Filters**: Filter feed by activity type, date range, specific friends
7. **Profile Themes**: Customizable profile page themes
8. **Friend Groups**: Organize friends into custom groups
9. **Activity Analytics**: Show user engagement statistics
10. **Export Data**: Allow users to export their profile and activity data
