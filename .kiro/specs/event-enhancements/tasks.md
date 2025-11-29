# Implementation Plan: Event System Enhancements

- [x] 1. Update database schema and types
  - [x] 1.1 Create database migration for events table
    - Add start_time, end_time, is_private, category, forum_id, cluster_id, cluster_pin columns
    - Add check constraints for time validation and category values
    - Migrate existing time data to start_time
    - Add indexes for is_private and category columns
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [x] 1.2 Update TypeScript type definitions
    - Update EventRow interface with new fields
    - Create EventCategory type
    - Update CreateEventData and UpdateEventData interfaces
    - Update EventFilters to include category
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ]* 1.3 Write property test for time persistence
    - **Property 2: Event time persistence**
    - **Validates: Requirements 3.2**

- [x] 2. Update event service layer with new business logic
  - [x] 2.1 Update createEvent function
    - Add validation for start_time and end_time
    - Add validation for category
    - Add is_private parameter handling
    - Update permission checks (allow any user for private events)
    - _Requirements: 3.4, 5.2, 5.4, 7.1, 8.1_
  
  - [x] 2.2 Implement event visibility filtering
    - Create getEventVisibility helper function
    - Query friendship table for private event access
    - Update getEvents to filter based on visibility rules
    - _Requirements: 5.3_
  
  - [x] 2.3 Add category filtering to getEvents
    - Update query to filter by category when specified
    - Ensure category filter works with existing filters
    - _Requirements: 8.3_
  
  - [ ]* 2.4 Write property test for end time validation
    - **Property 4: End time validation**
    - **Validates: Requirements 3.4**
  
  - [ ]* 2.5 Write property test for private event visibility
    - **Property 6: Private event friend visibility**
    - **Validates: Requirements 5.3**
  
  - [ ]* 2.6 Write property test for category filter accuracy
    - **Property 18: Category filter accuracy**
    - **Validates: Requirements 8.3**

- [x] 3. Implement communication channel integration
  - [x] 3.1 Create forum auto-creation for public events
    - Implement createEventForum helper function
    - Call forum creation after public event creation
    - Link forum_id to event record
    - Handle forum creation failures gracefully
    - _Requirements: 6.1, 6.7_
  
  - [x] 3.2 Create cluster auto-creation for private events
    - Implement createEventCluster helper function
    - Generate 4-digit PIN code
    - Call cluster creation after private event creation
    - Link cluster_id and store cluster_pin in event record
    - Handle cluster creation failures gracefully
    - _Requirements: 6.2, 6.6_
  
  - [x] 3.3 Update event detail retrieval to include channel info
    - Fetch forum details for public events
    - Include cluster PIN for private events (if user is registered)
    - Add channel access information to event response
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [ ]* 3.4 Write property test for public event forum creation
    - **Property 10: Public event forum creation**
    - **Validates: Requirements 6.1, 6.7**
  
  - [ ]* 3.5 Write property test for private event cluster creation
    - **Property 11: Private event cluster creation**
    - **Validates: Requirements 6.2**
  
  - [ ]* 3.6 Write property test for cluster PIN uniqueness
    - **Property 15: Cluster PIN uniqueness**
    - **Validates: Requirements 6.6**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create event creation pages
  - [x] 5.1 Create public event creation page component
    - Create /events/create route and page component
    - Build form with all event fields including start_time, end_time, category
    - Add time validation on client side
    - Add category dropdown with predefined options
    - Implement form submission and navigation
    - Style consistently with platform design system
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 8.1, 9.3_
  
  - [x] 5.2 Create private event creation page component
    - Create /events/create-private route and page component
    - Build form similar to public event creation
    - Remove admin-only fields
    - Set is_private flag automatically
    - Implement form submission and navigation
    - Style consistently with platform design system
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 5.1, 5.2, 8.1, 9.3_
  
  - [x] 5.3 Update events page to add navigation buttons
    - Replace CreateEventDialog with navigation button to /events/create
    - Add "Create Private Event" button for all authenticated users
    - Update button permissions and visibility
    - _Requirements: 2.1, 5.1, 7.3_
  
  - [ ]* 5.4 Write unit tests for event creation page navigation
    - Test "Create Event" button navigates to correct page
    - Test "Create Private Event" button navigates to correct page
    - Test form submission navigates back to events list
    - Test cancel button navigation
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 6. Update event card component
  - [x] 6.1 Simplify event card design
    - Remove excessive styling and visual clutter
    - Update layout to show essential information only
    - Apply consistent spacing and borders
    - Add subtle hover effects
    - _Requirements: 4.1, 9.2_
  
  - [x] 6.2 Update event type label display
    - Change "TUM Native" to "TUM" in all displays
    - Update badge styling for consistency
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 6.3 Add category badge to event cards
    - Display category as a visual indicator
    - Style category badges consistently
    - _Requirements: 8.4_
  
  - [x] 6.4 Add private event indicator
    - Show private badge for private events
    - Style consistently with other badges
    - _Requirements: 5.5_
  
  - [x] 6.5 Update time display to show range
    - Display start_time and end_time as a range
    - Handle events with only start_time
    - Format times in readable format
    - _Requirements: 3.3, 3.5_
  
  - [ ]* 6.6 Write property test for TUM label display
    - **Property 1: TUM label display consistency**
    - **Validates: Requirements 1.1, 1.2**
  
  - [ ]* 6.7 Write property test for time display completeness
    - **Property 3: Event time display completeness**
    - **Validates: Requirements 3.3, 3.5**
  
  - [ ]* 6.8 Write property test for category display
    - **Property 19: Event category display**
    - **Validates: Requirements 8.4**
  
  - [ ]* 6.9 Write property test for private event indicator
    - **Property 8: Private event indicator display**
    - **Validates: Requirements 5.5**

- [x] 7. Add category filtering UI
  - [x] 7.1 Create category filter component
    - Build dropdown or button group for category selection
    - Include "All Categories" option
    - Style consistently with existing filters
    - _Requirements: 8.2, 9.2_
  
  - [x] 7.2 Integrate category filter with event list
    - Connect filter to getEvents query
    - Update event list when filter changes
    - Maintain filter state in URL params
    - _Requirements: 8.3, 8.5_
  
  - [ ]* 7.3 Write unit tests for category filter UI
    - Test filter control renders correctly
    - Test filter selection updates event list
    - Test "All Categories" shows all events
    - _Requirements: 8.2, 8.5_

- [x] 8. Update event detail page
  - [x] 8.1 Reorganize event detail page layout
    - Create clear sections for event info, registration, and communication
    - Improve visual hierarchy
    - Add better spacing and organization
    - Style consistently with platform design
    - _Requirements: 4.2, 9.4_
  
  - [x] 8.2 Add communication channel access section
    - Display forum link for public events (after registration)
    - Display cluster PIN and link for private events (after registration)
    - Show prominent call-to-action for channel access
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [x] 8.3 Update QR code display
    - Improve ticket/QR code layout and styling
    - Make it more visually appealing and organized
    - _Requirements: 4.3_
  
  - [ ]* 8.4 Write property test for post-registration channel visibility
    - **Property 14: Post-registration channel visibility**
    - **Validates: Requirements 6.5**
  
  - [ ]* 8.5 Write property test for public event forum access
    - **Property 12: Public event forum access**
    - **Validates: Requirements 6.3**
  
  - [ ]* 8.6 Write property test for private event cluster access
    - **Property 13: Private event cluster access**
    - **Validates: Requirements 6.4**

- [x] 9. Update authorization and access control
  - [x] 9.1 Implement route protection for event creation pages
    - Add middleware to check permissions for /events/create
    - Allow all authenticated users for /events/create-private
    - Redirect unauthorized users to error page
    - _Requirements: 7.4_
  
  - [x] 9.2 Update event visibility in list queries
    - Filter private events based on friendship
    - Ensure creators can always see their own private events
    - _Requirements: 5.3_
  
  - [ ]* 9.3 Write property test for public event authorization
    - **Property 16: Public event creation authorization**
    - **Validates: Requirements 7.1**
  
  - [ ]* 9.4 Write property test for private event authorization
    - **Property 7: Private event creation authorization**
    - **Validates: Requirements 5.4**

- [x] 10. Handle private event registration logic
  - [x] 10.1 Update registration flow for private events
    - Skip QR code generation for private events
    - Provide cluster access instead
    - Update registration confirmation message
    - _Requirements: 5.6, 6.4_
  
  - [ ]* 10.2 Write property test for private event registration absence
    - **Property 9: Private event registration absence**
    - **Validates: Requirements 5.6**

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. UI polish and consistency
  - [x] 12.1 Review and update color scheme consistency
    - Ensure all event pages use platform design tokens
    - Update button styles to match platform
    - Verify hover effects and transitions
    - _Requirements: 9.1, 9.5_
  
  - [x] 12.2 Review and update spacing consistency
    - Apply consistent spacing across all event components
    - Match spacing patterns from other platform pages
    - _Requirements: 9.2, 9.4_
  
  - [ ]* 12.3 Perform visual regression testing
    - Compare event pages with other platform pages
    - Verify design consistency
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
