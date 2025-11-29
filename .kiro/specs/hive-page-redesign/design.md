# Design Document: Hive Page Redesign

## Overview

The Hive page redesign transforms the current list-based subforum interface into a comprehensive community hub featuring search, navigation, content discovery, and gamification. The new design implements a multi-panel layout with:

- **Top search bar** for content discovery across joined subhives
- **Left sidebar** displaying joined subhives for quick navigation
- **Center feed** showing posts from all joined subhives
- **Top right panel** featuring daily puzzle games with leaderboards
- **Bottom left panel** showcasing popular subhives for discovery

The design leverages the existing forum infrastructure (subforums, posts, votes, comments) while introducing new components for games and enhanced feed functionality. The layout is responsive and adapts to different screen sizes.

## Architecture

### Component Hierarchy

```
HivePage (app/(authenticated)/hives/page.tsx)
├── SearchBar
├── LayoutContainer
│   ├── LeftSidebar
│   │   ├── JoinedSubhivesList
│   │   └── TopSubhivesPanel
│   ├── CenterFeed
│   │   ├── FeedFilters
│   │   └── PostFeedList
│   └── RightPanel
│       └── DailyGameWidget
```

### Data Flow

1. **Initial Load**: Fetch user's joined subhives, recent posts from those subhives, and popular subhives
2. **Search**: Query posts across joined subhives, update center feed with results
3. **Sidebar Navigation**: Filter center feed to show posts from selected subhive
4. **Game Interaction**: Load daily game, record score, update leaderboard
5. **Real-time Updates**: Optionally poll for new posts or use Supabase real-time subscriptions

### State Management

- **Local Component State**: UI state (selected subhive, search query, game completion)
- **Server State (SWR)**: Cached data for subhives, posts, leaderboards with automatic revalidation
- **Auth Context**: Current user information from existing auth provider

## Components and Interfaces

### 1. SearchBar Component

**Location**: `components/forum/hive-search-bar.tsx`

**Props**:
```typescript
interface HiveSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}
```

**Functionality**:
- Debounced search input (300ms delay)
- Search icon with loading spinner
- Clear button when query exists
- Keyboard shortcuts (Cmd/Ctrl + K to focus)

### 2. JoinedSubhivesList Component

**Location**: `components/forum/joined-subhives-list.tsx`

**Props**:
```typescript
interface JoinedSubhivesListProps {
  subhives: SubforumWithMembership[];
  selectedSubhiveId?: string | null;
  onSelectSubhive: (subhiveId: string | null) => void;
  isLoading?: boolean;
}
```

**Functionality**:
- Scrollable list of joined subhives
- Visual indicator for selected subhive
- Unread post badges (optional enhancement)
- "All Hives" option to show all posts
- Empty state with call-to-action to join subhives

### 3. PostFeedList Component

**Location**: `components/forum/post-feed-list.tsx`

**Props**:
```typescript
interface PostFeedListProps {
  posts: PostWithAuthor[];
  isLoading?: boolean;
  onVote: (postId: string, voteType: "upvote" | "downvote") => Promise<void>;
  onViewPost: (postId: string) => void;
  currentUserId?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}
```

**Functionality**:
- Infinite scroll or pagination for posts
- Post cards showing title, excerpt, author, subhive, timestamp, votes, comments
- Vote buttons with optimistic updates
- Click to navigate to full post view
- Refresh mechanism for new posts

### 4. DailyGameWidget Component

**Location**: `components/forum/daily-game-widget.tsx`

**Props**:
```typescript
interface DailyGameWidgetProps {
  userId: string;
  onScoreSubmit?: (score: number) => void;
}
```

**Functionality**:
- Check if user has played today
- If not played: Display game interface (puzzle)
- If played: Display leaderboard with user's rank
- Game library integration (e.g., react-wordle, react-sudoku, or custom puzzle)
- Score calculation and submission
- Daily reset at midnight

### 5. TopSubhivesPanel Component

**Location**: `components/forum/top-subhives-panel.tsx`

**Props**:
```typescript
interface TopSubhivesPanelProps {
  limit?: number;
  onViewSubhive: (subhiveId: string) => void;
}
```

**Functionality**:
- Fetch top subhives by activity (last 7 days)
- Display subhive name, member count, activity indicator
- Click to navigate to subhive detail page
- Refresh mechanism

### 6. FeedFilters Component

**Location**: `components/forum/feed-filters.tsx`

**Props**:
```typescript
interface FeedFiltersProps {
  sortBy: "new" | "hot" | "top";
  onSortChange: (sort: "new" | "hot" | "top") => void;
  timeRange?: "day" | "week" | "month" | "all";
  onTimeRangeChange?: (range: "day" | "week" | "month" | "all") => void;
}
```

**Functionality**:
- Sort options: New (created_at), Hot (vote_count + recency), Top (vote_count)
- Time range filter for "top" sorting
- Dropdown or button group UI

## Data Models

### Existing Models (No Changes)

- **Subforum**: Already defined in `types/forum.ts`
- **Post**: Already defined in `types/forum.ts`
- **SubforumMembership**: Already defined in `types/forum.ts`
- **Vote**: Already defined in `types/forum.ts`

### New Models

#### GameScore

**Location**: New table `game_scores` in database

```typescript
interface GameScore {
  id: string;
  user_id: string;
  game_date: string; // YYYY-MM-DD format
  score: number;
  completed_at: string; // ISO timestamp
  created_at: string;
}
```

**Database Schema**:
```sql
CREATE TABLE game_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, game_date)
);

CREATE INDEX idx_game_scores_date ON game_scores(game_date);
CREATE INDEX idx_game_scores_user_date ON game_scores(user_id, game_date);
```

#### SubhiveActivity (Computed)

```typescript
interface SubhiveActivity {
  subforum_id: string;
  subforum_name: string;
  member_count: number;
  post_count_7d: number;
  comment_count_7d: number;
  activity_score: number; // Weighted combination
}
```

### Extended Types

#### PostWithSubhive

```typescript
interface PostWithSubhive extends PostWithAuthor {
  subforum_name: string;
  subforum_id: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search returns only posts from joined subhives

*For any* search query and authenticated user, all returned posts should belong to subhives that the user has joined.

**Validates: Requirements 1.2**

### Property 2: Sidebar displays all joined subhives

*For any* authenticated user, the sidebar should contain exactly the set of subhives where a membership record exists for that user.

**Validates: Requirements 2.1**

### Property 3: Feed filtering by subhive is consistent

*For any* selected subhive from the sidebar, the center feed should display only posts where the post's subforum_id matches the selected subhive's id.

**Validates: Requirements 2.2**

### Property 4: Feed displays posts from all joined subhives when no filter applied

*For any* authenticated user with no subhive filter selected, the feed should contain posts from all subhives the user has joined.

**Validates: Requirements 3.1**

### Property 5: Daily game can only be played once per day

*For any* user and calendar date, attempting to play the daily game should succeed if no game_score record exists for that user and date, and should fail (showing leaderboard instead) if a record already exists.

**Validates: Requirements 4.4**

### Property 6: Game score submission creates unique record

*For any* completed game, submitting a score should create exactly one game_score record with the current date and user_id, and subsequent submissions for the same date should be rejected.

**Validates: Requirements 4.3**

### Property 7: Leaderboard displays top scores for current date

*For any* calendar date, the leaderboard should display game scores ordered by score descending, filtered to only include scores from that specific date.

**Validates: Requirements 4.5**

### Property 8: Top subhives ranking reflects recent activity

*For any* time window (7 days), the top subhives list should be ordered by activity score, where activity score is calculated from post count and comment count within that window.

**Validates: Requirements 5.2, 5.5**

### Property 9: Clicking subhive in top panel navigates correctly

*For any* subhive displayed in the top subhives panel, clicking it should navigate to the subhive detail page with the correct subhive id.

**Validates: Requirements 5.4**

### Property 10: Responsive layout adapts to viewport

*For any* viewport width, the layout should display all components without horizontal overflow, adapting the arrangement based on breakpoints (mobile: stacked, tablet: collapsible, desktop: full layout).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 11: Vote actions update post vote count

*For any* post in the feed, when a user casts a vote (upvote or downvote), the displayed vote_count should reflect the change immediately (optimistic update) and persist after refresh.

**Validates: Requirements 3.2** (implicit from engagement metrics)

### Property 12: Search results include all matching posts

*For any* search query, all posts from joined subhives where the title or content contains the query string should appear in the results.

**Validates: Requirements 1.2**

## Error Handling

### Search Errors

- **Empty Results**: Display "No posts found" message with suggestions
- **Network Failure**: Show error toast, allow retry
- **Invalid Query**: Sanitize input, prevent SQL injection

### Game Errors

- **Already Played**: Gracefully show leaderboard instead of game
- **Score Submission Failure**: Retry mechanism with exponential backoff
- **Game Library Load Failure**: Show fallback message, log error

### Feed Errors

- **No Joined Subhives**: Display onboarding message with link to discover subhives
- **Failed to Load Posts**: Show error state with retry button
- **Vote Failure**: Revert optimistic update, show error toast

### Data Fetching Errors

- **Subhive Load Failure**: Show skeleton loaders, retry automatically
- **Leaderboard Load Failure**: Show cached data if available, otherwise error state

### Responsive Layout Errors

- **Overflow Issues**: Use CSS overflow properties and scrollable containers
- **Touch Target Size**: Ensure minimum 44x44px for mobile interactions

## Testing Strategy

### Unit Tests

**Framework**: Vitest + React Testing Library

**Test Coverage**:

1. **SearchBar Component**
   - Debounce functionality works correctly
   - Clear button appears and functions
   - onSearch callback receives correct query

2. **JoinedSubhivesList Component**
   - Renders all provided subhives
   - Selection state updates correctly
   - Empty state displays when no subhives

3. **PostFeedList Component**
   - Renders post cards with correct data
   - Vote buttons trigger callbacks
   - Infinite scroll loads more posts

4. **DailyGameWidget Component**
   - Shows game when not played today
   - Shows leaderboard when already played
   - Score submission creates correct payload

5. **TopSubhivesPanel Component**
   - Displays subhives in correct order
   - Click navigation works correctly

6. **FeedFilters Component**
   - Sort options update correctly
   - Time range filter applies

### Property-Based Tests

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Test Coverage**:

1. **Property 1 Test**: Search filtering
   - Generate random user with random joined subhives
   - Generate random posts across various subhives
   - Execute search, verify all results belong to joined subhives

2. **Property 2 Test**: Sidebar membership consistency
   - Generate random user with random memberships
   - Render sidebar, verify displayed subhives match membership records

3. **Property 3 Test**: Feed filtering consistency
   - Generate random subhive selection
   - Generate random posts
   - Verify filtered feed contains only posts from selected subhive

4. **Property 5 Test**: Daily game uniqueness
   - Generate random date and user
   - Attempt multiple game plays for same date
   - Verify only first attempt succeeds

5. **Property 7 Test**: Leaderboard date filtering
   - Generate random game scores across multiple dates
   - Query leaderboard for specific date
   - Verify all returned scores match that date

6. **Property 8 Test**: Activity ranking
   - Generate random subhives with random activity metrics
   - Calculate expected ranking
   - Verify top subhives list matches expected order

7. **Property 11 Test**: Vote count updates
   - Generate random post with initial vote count
   - Apply random vote action
   - Verify vote count changes by expected amount (+1 for upvote, -1 for downvote)

### Integration Tests

1. **Full Page Load Flow**
   - Mock API responses for subhives, posts, games
   - Render HivePage
   - Verify all panels load correctly

2. **Search to Results Flow**
   - Enter search query
   - Verify API called with correct parameters
   - Verify feed updates with search results

3. **Game Play to Leaderboard Flow**
   - Complete game
   - Submit score
   - Verify leaderboard displays with user's score

4. **Sidebar Navigation Flow**
   - Click subhive in sidebar
   - Verify feed filters to that subhive
   - Verify URL updates (optional)

### Responsive Design Tests

1. **Mobile Layout** (< 768px)
   - Verify stacked layout
   - Verify touch targets are adequate size
   - Verify no horizontal overflow

2. **Tablet Layout** (768px - 1024px)
   - Verify collapsible sidebars
   - Verify readable content

3. **Desktop Layout** (> 1024px)
   - Verify all panels visible
   - Verify proper spacing and alignment

## Implementation Notes

### Game Library Selection

**Recommended**: Use a simple, lightweight puzzle library or build custom puzzles

**Options**:
1. **Wordle-style game**: react-wordle or custom implementation
2. **Sudoku**: react-sudoku-component
3. **Number puzzle**: Custom sliding puzzle or 2048-style game
4. **Trivia**: Custom trivia with TUM-related questions

**Scoring**: Each game should provide a numeric score (time-based, accuracy-based, or completion-based)

### Performance Considerations

1. **Feed Pagination**: Implement infinite scroll with page size of 20 posts
2. **Image Lazy Loading**: Use Next.js Image component for avatars
3. **Debounced Search**: 300ms delay to reduce API calls
4. **SWR Caching**: Cache subhives and leaderboard data with 5-minute revalidation
5. **Optimistic Updates**: Apply vote changes immediately, revert on error

### Accessibility

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and semantic HTML
3. **Focus Management**: Visible focus indicators, logical tab order
4. **Color Contrast**: WCAG AA compliance for all text
5. **Touch Targets**: Minimum 44x44px for mobile

### Database Queries

#### Get Posts from Joined Subhives

```sql
SELECT p.*, s.name as subforum_name, up.display_name as author_name
FROM posts p
JOIN subforums s ON p.subforum_id = s.id
JOIN subforum_memberships sm ON s.id = sm.subforum_id
LEFT JOIN user_profiles up ON p.author_id = up.id
WHERE sm.user_id = $1
  AND (p.title ILIKE $2 OR p.content ILIKE $2)
ORDER BY p.created_at DESC
LIMIT 20 OFFSET $3;
```

#### Get Top Subhives by Activity

```sql
SELECT 
  s.id,
  s.name,
  s.member_count,
  COUNT(DISTINCT p.id) as post_count_7d,
  COUNT(DISTINCT c.id) as comment_count_7d,
  (COUNT(DISTINCT p.id) * 2 + COUNT(DISTINCT c.id)) as activity_score
FROM subforums s
LEFT JOIN posts p ON s.id = p.subforum_id 
  AND p.created_at > NOW() - INTERVAL '7 days'
LEFT JOIN comments c ON p.id = c.post_id 
  AND c.created_at > NOW() - INTERVAL '7 days'
GROUP BY s.id, s.name, s.member_count
ORDER BY activity_score DESC
LIMIT 5;
```

#### Get Today's Leaderboard

```sql
SELECT 
  gs.user_id,
  gs.score,
  up.display_name,
  up.avatar_url,
  RANK() OVER (ORDER BY gs.score DESC) as rank
FROM game_scores gs
JOIN user_profiles up ON gs.user_id = up.id
WHERE gs.game_date = CURRENT_DATE
ORDER BY gs.score DESC
LIMIT 10;
```

#### Check if User Played Today

```sql
SELECT EXISTS(
  SELECT 1 FROM game_scores
  WHERE user_id = $1 AND game_date = CURRENT_DATE
) as has_played;
```

### API Routes

#### POST /api/hives/game-score

**Request**:
```typescript
{
  score: number;
  game_date: string; // YYYY-MM-DD
}
```

**Response**:
```typescript
{
  success: boolean;
  rank?: number;
  error?: string;
}
```

#### GET /api/hives/leaderboard

**Query Parameters**:
- `date`: YYYY-MM-DD (defaults to today)

**Response**:
```typescript
{
  leaderboard: Array<{
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    score: number;
    rank: number;
  }>;
}
```

#### GET /api/hives/top-subhives

**Query Parameters**:
- `limit`: number (default 5)
- `days`: number (default 7)

**Response**:
```typescript
{
  subhives: Array<{
    id: string;
    name: string;
    member_count: number;
    activity_score: number;
  }>;
}
```

#### GET /api/hives/feed

**Query Parameters**:
- `subhive_id`: string (optional, filters to specific subhive)
- `search`: string (optional, search query)
- `sort`: "new" | "hot" | "top" (default "new")
- `page`: number (default 0)
- `limit`: number (default 20)

**Response**:
```typescript
{
  posts: PostWithSubhive[];
  hasMore: boolean;
  total: number;
}
```

### Styling Approach

- **Framework**: Tailwind CSS (already in use)
- **Layout**: CSS Grid for main layout, Flexbox for components
- **Theme**: Use existing design tokens from `globals.css`
- **Responsive**: Mobile-first approach with breakpoints at 768px and 1024px
- **Animations**: Subtle transitions for hover states and loading
- **Dark Mode**: Support existing dark mode theme

### Migration Strategy

1. **Phase 1**: Create new components without modifying existing page
2. **Phase 2**: Implement database migrations for game_scores table
3. **Phase 3**: Build API routes for new functionality
4. **Phase 4**: Replace existing hives page with new layout
5. **Phase 5**: Add polish, animations, and optimizations

### Future Enhancements

- Real-time post updates using Supabase subscriptions
- Notification badges for unread posts in sidebar
- Multiple daily games with different categories
- User preferences for feed algorithm
- Bookmarking/saving posts
- Trending topics widget
- Community achievements and badges
