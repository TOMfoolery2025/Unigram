# Implementation Plan

- [x] 1. Set up project foundation and Supabase integration
  - Initialize Next.js 14 project with TypeScript and App Router
  - Configure Tailwind CSS with dark theme and violet color scheme
  - Install and configure shadcn/ui components
  - Set up Supabase client and environment variables
  - Create Supabase project and configure authentication settings
  - _Requirements: All_

- [x] 2. Implement database schema and RLS policies
  - Create all database tables in Supabase (users, subforums, posts, comments, votes, channels, messages, events, wiki, calendar)
  - Set up Row Level Security (RLS) policies for each table
  - Create database indexes for performance optimization
  - Set up database triggers for member_count updates
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 7.1, 11.1, 12.2_

- [x] 3. Build authentication system
- [x] 3.1 Create authentication utilities and validation
  - Implement TUM email validation function
  - Create Supabase auth helper functions (signUp, signIn, signOut)
  - Set up AuthProvider context with user state management
  - Create TypeScript types for user and auth responses
  - _Requirements: 1.1, 1.2_

- [ ]* 3.2 Write property test for TUM email validation
  - **Property 1: TUM email validation**
  - **Validates: Requirements 1.1, 1.5**

- [x] 3.3 Implement authentication UI components
  - Create LoginForm component with email/password inputs
  - Create RegisterForm component with TUM email validation
  - Implement GuestAccessButton component
  - Create email verification page
  - Add error handling and loading states
  - _Requirements: 1.1, 1.2, 1.3, 10.1_

- [x] 3.4 Implement route protection and authorization
  - Create ProtectedRoute HOC for authenticated routes
  - Implement middleware for route-level authentication checks
  - Create guest-only routes for wiki access
  - Add redirect logic for unverified users
  - _Requirements: 1.4, 10.2, 10.5_

- [ ]* 3.5 Write property test for access restrictions
  - **Property 2: Unverified user access restriction**
  - **Property 3: Guest access restriction**
  - **Validates: Requirements 1.4, 10.5**

- [ ] 4. Build forum system
- [ ] 4.1 Implement subforum data layer
  - Create subforum CRUD functions with Supabase
  - Implement subforum membership operations
  - Create search functionality for subforums
  - Add TypeScript types for subforum entities
  - _Requirements: 2.1, 2.3, 9.1_

- [ ]* 4.2 Write property tests for subforum operations
  - **Property 4: Subforum creation completeness**
  - **Property 6: Subforum membership addition**
  - **Validates: Requirements 2.1, 2.3**

- [ ] 4.3 Create subforum UI components
  - Implement SubforumList with search and filtering
  - Create SubforumCard component
  - Build CreateSubforumDialog with form validation
  - Add empty states and loading skeletons
  - _Requirements: 2.1, 2.2, 9.1_

- [ ]* 4.4 Write property test for subforum display
  - **Property 5: Subforum display completeness**
  - **Validates: Requirements 2.2**

- [ ] 4.5 Implement post system
  - Create post CRUD functions with Supabase
  - Implement anonymous posting logic
  - Add post sorting by time and vote count
  - Create TypeScript types for posts
  - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.3_

- [ ]* 4.6 Write property tests for post operations
  - **Property 7: Post association integrity**
  - **Property 8: Post ordering consistency**
  - **Property 9: Anonymous post author hiding**
  - **Property 10: Anonymous post backend integrity**
  - **Property 11: Author display based on anonymity**
  - **Validates: Requirements 2.4, 2.5, 3.2, 3.3, 3.4, 3.5**

- [ ] 4.7 Create post UI components
  - Implement PostList with sorting options
  - Create PostCard with vote buttons
  - Build CreatePostForm with anonymous toggle
  - Add rich text editor for post content
  - _Requirements: 2.4, 2.5, 3.1, 3.4, 3.5_

- [ ] 4.8 Implement voting system
  - Create vote CRUD functions with optimistic updates
  - Implement vote change logic (remove previous, apply new)
  - Add vote count aggregation
  - Create VoteButtons component
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 4.9 Write property tests for voting
  - **Property 12: Upvote increments count**
  - **Property 13: Downvote decrements count**
  - **Property 14: Vote change replaces previous vote**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 4.10 Implement comment system
  - Create comment CRUD functions
  - Implement nested comment threading
  - Add anonymous comment support
  - Create CommentThread component
  - _Requirements: 4.4_

- [ ]* 4.11 Write property test for comments
  - **Property 15: Comment association**
  - **Validates: Requirements 4.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Build channels system
- [ ] 6.1 Implement channel data layer
  - Create channel CRUD functions with admin authorization
  - Implement channel membership operations
  - Add channel search functionality
  - Create TypeScript types for channels
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 9.2_

- [ ]* 6.2 Write property tests for channel operations
  - **Property 16: Channel creation completeness**
  - **Property 17: Channel creation authorization**
  - **Property 19: Channel membership addition**
  - **Property 20: Channel membership removal**
  - **Validates: Requirements 5.1, 5.2, 5.4, 5.5**

- [ ] 6.3 Create channel UI components
  - Implement ChannelList with search
  - Create ChannelCard component
  - Build CreateChannelDialog (admin-only)
  - Add join/leave channel buttons
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 6.4 Write property test for channel display
  - **Property 18: Channel list completeness**
  - **Validates: Requirements 5.3**

- [ ] 6.5 Implement real-time messaging
  - Create message CRUD functions
  - Set up Supabase real-time subscriptions for channels
  - Implement message ordering by timestamp
  - Add message access control for members only
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 6.6 Write property tests for messaging
  - **Property 21: Message creation completeness**
  - **Property 22: Message chronological ordering**
  - **Property 23: Message visibility to members**
  - **Property 24: Message access restriction**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 6.7 Create messaging UI components
  - Implement ChannelView with real-time updates
  - Create MessageList with auto-scroll
  - Build MessageInput component
  - Add typing indicators and online status
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 7. Build events system
- [ ] 7.1 Implement event data layer
  - Create event CRUD functions with permission checks
  - Implement event registration/unregistration
  - Add event filtering by date range and type
  - Create TypeScript types for events
  - _Requirements: 7.1, 7.4, 8.1, 8.5, 9.3, 9.4_

- [ ]* 7.2 Write property tests for event operations
  - **Property 25: Event creation completeness**
  - **Property 28: Event creation authorization**
  - **Property 29: Published event visibility**
  - **Property 32: Event unregistration cleanup**
  - **Validates: Requirements 7.1, 7.4, 7.5, 8.1, 8.5**

- [ ] 7.3 Implement QR code generation
  - Create QR code generation function for TUM native events
  - Implement unique QR code per user per event
  - Add QR code storage in event registrations
  - Create QR code invalidation on unregistration
  - _Requirements: 7.2, 8.2, 8.4_

- [ ]* 7.4 Write property tests for QR codes
  - **Property 26: TUM native event QR generation**
  - **Property 30: QR code display for registered events**
  - **Validates: Requirements 7.2, 8.2, 8.4**

- [ ] 7.5 Create event UI components
  - Implement EventList with filters
  - Create EventCard component
  - Build CreateEventDialog (permission-gated)
  - Implement EventDetails page
  - Create QRCodeDisplay component
  - Add EventFilters for date and type
  - _Requirements: 7.1, 7.3, 7.5, 8.1, 8.3, 8.4, 9.3, 9.4_

- [ ]* 7.6 Write property tests for event features
  - **Property 27: External event link storage**
  - **Property 31: External event link provision**
  - **Validates: Requirements 7.3, 8.3**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Build calendar system
- [ ] 9.1 Implement calendar data layer
  - Create personal calendar event CRUD functions
  - Implement function to fetch combined calendar data (subscribed + personal)
  - Add calendar event filtering by type
  - Create TypeScript types for calendar events
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ]* 9.2 Write property tests for calendar operations
  - **Property 44: Subscribed events in calendar**
  - **Property 45: Personal event creation completeness**
  - **Property 46: Calendar displays both event types**
  - **Property 47: Personal event update**
  - **Property 48: Personal event deletion**
  - **Property 49: Unsubscribed event removal from calendar**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**

- [ ] 9.3 Create calendar UI components
  - Integrate react-big-calendar or @fullcalendar/react
  - Implement CalendarView with month/week/day views
  - Create CalendarEventCard component
  - Build CreatePersonalEventDialog with color picker
  - Build EditPersonalEventDialog
  - Add CalendarFilters for event type toggling
  - Implement EventTypeIndicator for visual distinction
  - _Requirements: 12.1, 12.3, 12.7_

- [ ]* 9.4 Write property test for event type distinction
  - **Property 50: Event type visual distinction**
  - **Validates: Requirements 12.7**

- [ ] 10. Build wiki system
- [ ] 10.1 Implement wiki data layer
  - Create wiki article CRUD functions (admin-only for write)
  - Implement version history tracking
  - Add wiki search and category filtering
  - Create TypeScript types for wiki articles
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 10.2 Write property tests for wiki operations
  - **Property 39: Wiki article creation completeness**
  - **Property 40: Wiki article update tracking**
  - **Property 41: Wiki article category organization**
  - **Property 42: Wiki article deletion**
  - **Property 43: Wiki version history maintenance**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 10.3 Create wiki UI components
  - Implement WikiHome with category navigation
  - Create WikiArticleList organized by category
  - Build WikiArticle display with rich text rendering
  - Create WikiEditor for admins with rich text editor
  - Add WikiSearch component
  - Implement VersionHistory viewer
  - _Requirements: 10.3, 10.4, 11.1, 11.2, 11.3, 11.5_

- [ ]* 10.4 Write property test for guest wiki access
  - **Property 38: Guest wiki access**
  - **Validates: Requirements 10.2**

- [ ] 11. Implement search and filtering
- [ ] 11.1 Create unified search functionality
  - Implement full-text search for subforums
  - Implement full-text search for channels
  - Add search UI components with debouncing
  - Create search results display
  - _Requirements: 9.1, 9.2_

- [ ]* 11.2 Write property tests for search
  - **Property 33: Subforum search accuracy**
  - **Property 34: Channel search accuracy**
  - **Validates: Requirements 9.1, 9.2**

- [ ] 11.3 Implement advanced filtering
  - Create filter combination logic (AND operations)
  - Implement event date range filtering
  - Add event type filtering
  - Create filter UI components
  - _Requirements: 9.3, 9.4, 9.5_

- [ ]* 11.4 Write property tests for filtering
  - **Property 35: Event date range filtering**
  - **Property 36: Event type filtering**
  - **Property 37: Multiple filter conjunction**
  - **Validates: Requirements 9.3, 9.4, 9.5**

- [ ] 12. Build admin and moderation system
- [ ] 12.1 Implement admin data layer
  - Create permission management functions
  - Implement moderation log CRUD operations
  - Add content deletion functions with logging
  - Create admin-specific data access functions
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 12.2 Write property tests for admin operations
  - **Property 51: Admin anonymous post visibility**
  - **Property 52: Admin content deletion**
  - **Property 53: Event permission granting**
  - **Property 54: Event permission revocation**
  - **Property 55: Moderation log completeness**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

- [ ] 12.3 Create admin UI components
  - Implement AdminDashboard with statistics
  - Create ModerationPanel for content management
  - Build PermissionManager for user permissions
  - Create ModerationLogs viewer
  - Add admin navigation and access controls
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 13. Implement global UI and navigation
  - Create main navigation bar with dark theme
  - Implement responsive sidebar navigation
  - Add user profile dropdown menu
  - Create notification system for real-time updates
  - Implement breadcrumb navigation
  - Add loading states and error boundaries
  - _Requirements: All_

- [ ] 14. Optimize performance and accessibility
  - Implement code splitting and lazy loading
  - Add image optimization with Next.js Image
  - Optimize database queries with proper indexes
  - Implement caching strategies
  - Add ARIA labels and keyboard navigation
  - Test with screen readers
  - Ensure WCAG 2.1 AA compliance
  - _Requirements: All_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
