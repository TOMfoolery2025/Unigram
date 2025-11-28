# Implementation Plan

- [x] 1. Database schema setup and migrations
  - Create migration to extend user_profiles table with bio, interests, and profile_visibility columns
  - Create friendships table with proper constraints and indexes
  - Create user_activities database view aggregating posts, event registrations, and friendships
  - Add RLS policies for friendships table
  - _Requirements: 8.1, 8.4_

- [x] 2. Create TypeScript types for social features
  - Define profile types in types/profile.ts (UserProfile, ProfileUpdate, UserProfileWithFriendship, FriendshipStatus)
  - Define friendship types in types/friendship.ts (Friendship, FriendWithProfile, FriendRequest)
  - Define activity types in types/activity.ts (Activity, ActivityType)
  - Export all types from types/index.ts
  - _Requirements: All requirements (type foundation)_

- [x] 3. Implement profile service layer
  - Create lib/profile/profiles.ts with getUserProfile function
  - Implement updateUserProfile function with validation
  - Implement searchUsers function with name matching
  - Implement getUserActivity function
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3, 6.1_

- [ ]* 3.1 Write property test for profile service
  - **Property 10: Profile update round trip**
  - **Validates: Requirements 5.3**

- [ ]* 3.2 Write property test for profile validation
  - **Property 11: Invalid profile data rejection**
  - **Validates: Requirements 5.2, 5.4**

- [ ]* 3.3 Write property test for search functionality
  - **Property 13: Search results match query**
  - **Validates: Requirements 6.1**

- [x] 4. Implement friendship service layer
  - Create lib/profile/friendships.ts with sendFriendRequest function
  - Implement acceptFriendRequest and declineFriendRequest functions
  - Implement unfriendUser function
  - Implement getUserFriends and getPendingRequests functions
  - Implement getFriendshipStatus function
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.4, 3.5_

- [ ]* 4.1 Write property test for bidirectional friendship
  - **Property 4: Friend connection is bidirectional**
  - **Validates: Requirements 2.4**

- [ ]* 4.2 Write property test for declining requests
  - **Property 5: Declining request removes it completely**
  - **Validates: Requirements 2.5**

- [ ]* 4.3 Write property test for friends list completeness
  - **Property 6: Friends list completeness**
  - **Validates: Requirements 3.1**

- [ ]* 4.4 Write property test for pending requests accuracy
  - **Property 3: Pending requests display is complete and accurate**
  - **Validates: Requirements 3.4, 3.5**

- [x] 5. Implement activity service layer
  - Create lib/activity/activities.ts with getActivityFeed function
  - Implement pagination support (limit, offset)
  - Implement activity type filtering
  - Implement getActivityCount function
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ]* 5.1 Write property test for activity feed filtering
  - **Property 7: Activity feed contains only friend activities**
  - **Validates: Requirements 4.1**

- [ ]* 5.2 Write property test for friend activities in feed
  - **Property 8: Friend activities appear in feed**
  - **Validates: Requirements 4.2, 4.3**

- [ ]* 5.3 Write property test for activity ordering
  - **Property 9: Activity feed chronological ordering**
  - **Validates: Requirements 4.5**

- [x] 6. Create avatar utility component
  - Create components/profile/user-avatar.tsx component
  - Implement DiceBear avatar generation with generateAvatarUrl utility
  - Add size variants (sm, md, lg, xl)
  - Add fallback to initials
  - _Requirements: 5.5_

- [ ]* 6.1 Write property test for avatar consistency
  - **Property 12: Avatar generation consistency**
  - **Validates: Requirements 5.5**

- [x] 7. Build profile page components
  - Create app/(authenticated)/profile/[userId]/page.tsx route
  - Create components/profile/profile-card.tsx for compact profile display
  - Implement profile header with avatar, name, bio, interests
  - Display friendship status and action buttons
  - Show recent activity section
  - Add loading states with skeleton loaders
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 7.1 Write property test for profile field display
  - **Property 1: Profile and search results display required fields**
  - **Validates: Requirements 1.2, 3.3, 6.2**

- [x] 8. Build profile edit functionality
  - Create components/profile/profile-edit-dialog.tsx modal component
  - Implement form with react-hook-form for bio and interests
  - Add form validation (bio length, interests format)
  - Implement optimistic UI updates
  - Add error handling and toast notifications
  - _Requirements: 1.4, 5.1, 5.2, 5.3, 5.4_

- [x] 9. Build friend request components
  - Create components/profile/friend-request-button.tsx with context-aware states
  - Implement optimistic UI updates for all friendship actions
  - Add confirmation dialog for unfriend action
  - Create components/profile/friend-requests-list.tsx for incoming requests
  - Add accept/decline actions with optimistic updates
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 9.1 Write property test for friendship status UI
  - **Property 2: Friendship status determines UI actions**
  - **Validates: Requirements 2.1, 2.6**

- [ ]* 9.2 Write property test for optimistic updates
  - **Property 14: Optimistic UI updates before confirmation**
  - **Validates: Requirements 7.2**

- [x] 10. Build friends list components
  - Create components/profile/friends-list.tsx with grid layout
  - Display friend profile cards with avatars and names
  - Add search and filter functionality
  - Implement empty state for no friends
  - Add navigation to friend profiles on click
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 11. Build user search functionality
  - Create components/profile/user-search-dialog.tsx modal
  - Implement debounced search input
  - Display search results with friendship status
  - Add quick action buttons (send request, view profile)
  - Implement empty states for no query and no results
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12. Build activity feed components
  - Create components/activity/activity-feed.tsx main feed component
  - Create components/activity/activity-item.tsx for individual activities
  - Implement activity type rendering (post, event, friendship)
  - Add date grouping (Today, Yesterday, This Week)
  - Implement infinite scroll with intersection observer
  - Add loading states and empty state
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.5_

- [ ]* 12.1 Write property test for infinite scroll
  - **Property 15: Infinite scroll loads additional data**
  - **Validates: Requirements 7.5**

- [x] 13. Create activity filters component
  - Create components/activity/activity-filters.tsx
  - Add filter by activity type (posts, events, friends)
  - Add date range selection
  - Add friend-specific filtering
  - Implement filter state management
  - _Requirements: 4.1_

- [x] 14. Integrate activity feed into dashboard
  - Update app/(authenticated)/dashboard/page.tsx to include activity feed
  - Replace or enhance existing activity tab with new feed component
  - Add friend request notifications badge
  - Add quick link to user profile
  - Maintain existing dashboard functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [x] 15. Add profile navigation throughout app
  - Update forum post author names to link to profiles
  - Update channel message author names to link to profiles
  - Update event creator names to link to profiles
  - Add user avatar displays where names appear
  - Ensure consistent navigation pattern
  - _Requirements: 1.1_

- [x] 16. Implement responsive design and mobile optimization
  - Add responsive breakpoints for all profile components
  - Optimize friends list grid for mobile (single column)
  - Optimize activity feed for mobile (compact cards)
  - Test and adjust touch interactions
  - Ensure all components work on mobile, tablet, and desktop
  - _Requirements: 7.1, 7.3_

- [ ] 17. Add loading states and skeleton loaders
  - Create skeleton loaders for profile page
  - Create skeleton loaders for friends list
  - Create skeleton loaders for activity feed
  - Ensure skeletons match content layout
  - Add smooth transitions between loading and loaded states
  - _Requirements: 7.1, 7.3_

- [ ] 18. Implement error handling and edge cases
  - Add error boundaries for profile components
  - Handle 404 for non-existent profiles
  - Handle network errors with retry options
  - Add validation error messages on forms
  - Implement rollback for failed optimistic updates
  - Test all error scenarios
  - _Requirements: 5.2, 5.4_

- [ ] 19. Add accessibility features
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works throughout
  - Add visible focus indicators
  - Test with screen reader
  - Ensure color contrast meets WCAG AA
  - _Requirements: 7.1_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
