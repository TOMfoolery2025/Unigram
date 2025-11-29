# Implementation Plan

- [x] 1. Set up database schema and API routes for game functionality
  - Create migration file for game_scores table with proper indexes
  - Implement POST /api/hives/game-score endpoint for score submission
  - Implement GET /api/hives/leaderboard endpoint for fetching daily leaderboard
  - Implement GET /api/hives/top-subhives endpoint for popular subhives
  - Implement GET /api/hives/feed endpoint for unified feed with search and filtering
  - _Requirements: 4.3, 4.5, 5.2, 1.2, 3.1_

- [ ]* 1.1 Write property test for game score uniqueness
  - **Property 6: Game score submission creates unique record**
  - **Validates: Requirements 4.3**

- [x] 2. Create core feed and search components
  - [x] 2.1 Implement HiveSearchBar component with debounced search
    - Create component with search input, clear button, and loading state
    - Implement 300ms debounce for search queries
    - Add keyboard shortcut support (Cmd/Ctrl + K)
    - _Requirements: 1.1, 1.2_

- [ ]* 2.2 Write property test for search filtering
  - **Property 1: Search returns only posts from joined subhives**
  - **Validates: Requirements 1.2**

- [x] 2.3 Implement PostFeedList component for center feed
    - Create component to display posts with infinite scroll
    - Show post title, excerpt, author, subhive, timestamp, votes, comments
    - Implement vote buttons with optimistic updates
    - Add click handler for navigation to full post
    - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 2.4 Write property test for feed post display
  - **Property 12: Search results include all matching posts**
  - **Validates: Requirements 1.2**

- [x] 2.5 Implement FeedFilters component
    - Create sort options: New, Hot, Top
    - Add time range filter for Top sorting
    - Wire up filter changes to feed updates
    - _Requirements: 3.1_

- [x] 3. Create sidebar navigation components
  - [x] 3.1 Implement JoinedSubhivesList component
    - Display all joined subhives in scrollable list
    - Add "All Hives" option to show unfiltered feed
    - Highlight selected subhive
    - Show empty state when no subhives joined
    - _Requirements: 2.1, 2.2, 2.5_

- [ ]* 3.2 Write property test for sidebar membership consistency
  - **Property 2: Sidebar displays all joined subhives**
  - **Validates: Requirements 2.1**

- [ ]* 3.3 Write property test for feed filtering
  - **Property 3: Feed filtering by subhive is consistent**
  - **Validates: Requirements 2.2**

- [x] 3.4 Implement TopSubhivesPanel component
    - Fetch and display top 5 subhives by activity
    - Show subhive name, member count, activity indicator
    - Add click handler for navigation to subhive detail
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 3.5 Write property test for activity ranking
  - **Property 8: Top subhives ranking reflects recent activity**
  - **Validates: Requirements 5.2, 5.5**

- [x] 4. Create daily game widget
  - [x] 4.1 Select and integrate puzzle game library
    - Research and choose appropriate puzzle library (Wordle-style, Sudoku, or custom)
    - Install and configure game library
    - Create game wrapper component
    - _Requirements: 4.2, 4.7_

- [x] 4.2 Implement DailyGameWidget component
    - Check if user has played today on mount
    - Display game interface if not played
    - Display leaderboard if already played
    - Implement score calculation and submission
    - Handle daily reset logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 4.3 Write property test for daily game uniqueness
  - **Property 5: Daily game can only be played once per day**
  - **Validates: Requirements 4.4**

- [ ]* 4.4 Write property test for leaderboard date filtering
  - **Property 7: Leaderboard displays top scores for current date**
  - **Validates: Requirements 4.5**

- [ ]* 4.5 Write property test for daily reset
  - **Property 6: Game score submission creates unique record**
  - **Validates: Requirements 4.3**

- [x] 5. Implement main page layout and integration
  - [x] 5.1 Create responsive grid layout for HivePage
    - Implement CSS Grid layout with search bar, sidebar, feed, and panels
    - Add responsive breakpoints (mobile: stacked, tablet: collapsible, desktop: full)
    - Ensure no horizontal overflow at any viewport size
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5.2 Integrate all components into HivePage
    - Wire up search bar to feed filtering
    - Connect sidebar selection to feed filtering
    - Integrate game widget with API
    - Connect top subhives panel
    - Implement state management for filters and selections
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ]* 5.3 Write property test for feed display
  - **Property 4: Feed displays posts from all joined subhives when no filter applied**
  - **Validates: Requirements 3.1**

- [x] 5.4 Add loading states and error handling
    - Implement skeleton loaders for all components
    - Add error boundaries and error states
    - Implement retry mechanisms for failed requests
    - Add toast notifications for user actions
    - _Requirements: All_

- [x] 6. Implement data fetching and caching
  - [x] 6.1 Set up SWR hooks for data fetching
    - Create useJoinedSubhives hook
    - Create useFeedPosts hook with pagination
    - Create useTopSubhives hook
    - Create useGameLeaderboard hook
    - Configure caching and revalidation strategies
    - _Requirements: 2.1, 3.1, 5.2, 4.5_

- [x] 6.2 Implement search functionality
    - Create search API integration
    - Implement debounced search with SWR
    - Handle empty search state
    - _Requirements: 1.2, 1.3, 1.5_

- [x] 6.3 Implement vote functionality
    - Create vote mutation with optimistic updates
    - Handle vote errors and rollback
    - Update post vote counts in cache
    - _Requirements: 3.2_

- [ ]* 6.4 Write property test for vote updates
  - **Property 11: Vote actions update post vote count**
  - **Validates: Requirements 3.2**

- [x] 7. Add polish and accessibility
  - [x] 7.1 Implement keyboard navigation
    - Add keyboard shortcuts for search (Cmd/Ctrl + K)
    - Ensure all interactive elements are keyboard accessible
    - Implement logical tab order
    - Add visible focus indicators
    - _Requirements: 6.5_

- [x] 7.2 Add accessibility features
    - Add ARIA labels to all interactive elements
    - Ensure color contrast meets WCAG AA standards
    - Implement screen reader support
    - Ensure touch targets are minimum 44x44px on mobile
    - _Requirements: 6.5_

- [x] 7.3 Add animations and transitions
    - Add subtle hover effects on cards
    - Implement smooth transitions for layout changes
    - Add loading animations
    - Implement scroll animations for infinite scroll
    - _Requirements: 6.4_

- [x] 8. Testing and optimization
  - [ ]* 8.1 Write unit tests for all components
    - Test SearchBar debounce and callbacks
    - Test JoinedSubhivesList rendering and selection
    - Test PostFeedList rendering and interactions
    - Test DailyGameWidget state transitions
    - Test TopSubhivesPanel rendering and navigation
    - Test FeedFilters sort and filter changes
    - _Requirements: All_

- [ ]* 8.2 Write integration tests
    - Test full page load flow
    - Test search to results flow
    - Test game play to leaderboard flow
    - Test sidebar navigation flow
    - _Requirements: All_

- [x] 8.3 Perform responsive design testing
    - Test mobile layout (< 768px)
    - Test tablet layout (768px - 1024px)
    - Test desktop layout (> 1024px)
    - Verify no overflow issues
    - Verify touch target sizes on mobile
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8.4 Optimize performance
    - Implement code splitting for game library
    - Optimize images with Next.js Image component
    - Implement virtual scrolling for long lists if needed
    - Analyze and optimize bundle size
    - _Requirements: All_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
