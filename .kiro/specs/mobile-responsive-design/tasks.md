# Implementation Plan

- [x] 1. Set up foundation and core infrastructure
  - Add viewport meta tag to root layout
  - Update global CSS with mobile-specific utilities
  - Configure Tailwind for mobile-first development
  - Add safe area inset support for devices with notches
  - _Requirements: 1.1, 1.4_

- [ ]* 1.1 Write property test for viewport configuration
  - **Property 1: No horizontal scroll on mobile**
  - **Validates: Requirements 1.2**

- [x] 2. Create mobile navigation system
  - Design and implement MobileBottomNav component with icon navigation
  - Add responsive logic to show/hide navigation based on viewport
  - Implement navigation active states for mobile
  - Add safe area padding for bottom navigation
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 2.1 Write property test for navigation visibility
  - **Property 4: Navigation visibility by viewport**
  - **Validates: Requirements 2.1, 2.4**

- [ ]* 2.2 Write property test for navigation parity
  - **Property 5: Navigation destination parity**
  - **Validates: Requirements 2.3**

- [ ]* 2.3 Write property test for navigation interaction
  - **Property 6: Navigation interaction feedback**
  - **Validates: Requirements 2.2**

- [x] 3. Update authenticated layout for responsive behavior
  - Add conditional margin-left based on viewport (ml-0 on mobile, ml-72 on desktop)
  - Add bottom padding for mobile navigation clearance
  - Update main content area with responsive padding (p-4 md:p-6 lg:p-8)
  - Test layout transitions across breakpoints
  - _Requirements: 1.2, 1.3, 2.1, 2.4_

- [ ]* 3.1 Write property test for layout adaptation
  - **Property 2: Responsive layout adaptation**
  - **Validates: Requirements 1.3**

- [ ]* 3.2 Write property test for desktop preservation
  - **Property 37: Desktop layout preservation**
  - **Validates: Requirements 13.4**

- [x] 4. Update card components for mobile responsiveness
  - Update EventCard with vertical stacking on mobile
  - Update SubforumCard with responsive layout
  - Ensure all card buttons meet 44px minimum touch target
  - Add responsive badge wrapping
  - Implement text truncation for long content
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.5_

- [ ]* 4.1 Write property test for card stacking
  - **Property 11: Card vertical stacking on mobile**
  - **Validates: Requirements 4.1**

- [x] 4.2 Write property test for touch targets
  - **Property 8: Minimum touch target size**
  - **Validates: Requirements 3.1**

- [ ]* 4.3 Write property test for text truncation
  - **Property 14: Text truncation for long content**
  - **Validates: Requirements 4.5**

- [x] 5. Make dashboard mobile responsive
  - Convert hero stats grid to single column on mobile (grid-cols-1 sm:grid-cols-3)
  - Update main content grid to stack on mobile (grid-cols-1 lg:grid-cols-3)
  - Make profile pill responsive or move to navigation
  - Update unified search to full width on mobile
  - Ensure tabs are touch-friendly with adequate sizing
  - Update scroll areas for touch scrolling
  - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [ ]* 5.1 Write property test for dashboard layout
  - **Property 15: Dashboard single-column on mobile**
  - **Validates: Requirements 5.1**

- [ ]* 5.2 Write property test for search width
  - **Property 16: Full-width search on mobile**
  - **Validates: Requirements 5.3**

- [ ]* 5.3 Write property test for tab sizing
  - **Property 17: Tappable tab controls**
  - **Validates: Requirements 5.4**

- [x] 6. Update form components for mobile
  - Update input components with mobile sizing (h-12 on mobile, h-10 on desktop)
  - Add full-width classes for mobile inputs
  - Ensure proper input types for mobile keyboards (email, tel, search)
  - Update button components with minimum 44px height on mobile
  - Add adequate spacing between form elements
  - _Requirements: 3.1, 3.2, 3.4, 6.1_

- [ ]* 6.1 Write property test for input sizing
  - **Property 18: Mobile input sizing**
  - **Validates: Requirements 6.1**

- [ ]* 6.2 Write property test for keyboard types
  - **Property 10: Mobile keyboard input types**
  - **Validates: Requirements 3.4**

- [ ]* 6.3 Write property test for button spacing
  - **Property 9: Interactive element spacing**
  - **Validates: Requirements 3.2**

- [x] 7. Update modal and dialog components
  - Make modals full-screen on mobile (inset-0 on mobile, centered on desktop)
  - Ensure dialog content scrolls when exceeding viewport height
  - Add scroll locking for mobile modals
  - Ensure close buttons are easily tappable (44px minimum)
  - Update confirmation dialog buttons for touch interaction
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ]* 7.1 Write property test for modal sizing
  - **Property 19: Full-screen modals on mobile**
  - **Validates: Requirements 7.1**

- [ ]* 7.2 Write property test for dialog buttons
  - **Property 20: Touch-sized dialog buttons**
  - **Validates: Requirements 7.5**

- [x] 8. Enhance chat widget mobile responsiveness
  - Verify full-screen behavior on mobile (already implemented)
  - Optimize chat message layout for narrow screens
  - Ensure session list displays as full overlay on mobile
  - Update chat input for mobile keyboard handling
  - Test touch scrolling in message list
  - _Requirements: 8.1, 8.2, 8.5_

- [ ]* 8.1 Write property test for chat widget sizing
  - **Property 21: Full-screen chat widget on mobile**
  - **Validates: Requirements 8.1**

- [ ]* 8.2 Write property test for message layout
  - **Property 22: Responsive chat message layout**
  - **Validates: Requirements 8.2**

- [ ]* 8.3 Write property test for session list
  - **Property 24: Mobile session list overlay**
  - **Validates: Requirements 8.5**

- [x] 9. Update wiki pages for mobile
  - Make wiki article content responsive with proper formatting
  - Ensure wiki search is full-width on mobile
  - Update wiki article list for mobile card layout
  - Optimize rich text renderer for mobile reading
  - _Requirements: 8.4_

- [ ]* 9.1 Write property test for wiki formatting
  - **Property 23: Mobile-optimized wiki articles**
  - **Validates: Requirements 8.4**

- [x] 10. Update list and table components
  - Ensure event lists use card layouts on mobile (already card-based)
  - Optimize user lists with responsive avatar sizing
  - Update filter components for mobile-friendly layouts
  - Ensure sort controls meet touch target requirements
  - Add responsive spacing to list items
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ]* 10.1 Write property test for event list layout
  - **Property 25: Card-based event lists on mobile**
  - **Validates: Requirements 9.1**

- [ ]* 10.2 Write property test for avatar sizing
  - **Property 26: Responsive avatar sizing**
  - **Validates: Requirements 9.2**

- [ ]* 10.3 Write property test for filter layouts
  - **Property 27: Mobile-friendly filter layouts**
  - **Validates: Requirements 9.4**

- [x] 11. Optimize images and media for mobile
  - Add responsive image scaling classes (max-w-full)
  - Update avatar components with responsive sizes
  - Ensure image carousel on login page is hidden or adapted for mobile
  - Add loading states for images on mobile
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]* 11.1 Write property test for image scaling
  - **Property 29: Responsive image scaling**
  - **Validates: Requirements 10.1**

- [ ]* 11.2 Write property test for avatar dimensions
  - **Property 30: Responsive avatar dimensions**
  - **Validates: Requirements 10.2**

- [x] 12. Ensure consistent typography and spacing
  - Apply consistent mobile padding across all pages
  - Update heading components with responsive text sizes
  - Ensure consistent gap spacing in stacked layouts
  - Verify minimum font sizes for readability
  - _Requirements: 11.1, 11.2, 11.5, 1.5_

- [ ]* 12.1 Write property test for padding consistency
  - **Property 31: Consistent mobile padding**
  - **Validates: Requirements 11.1**

- [ ]* 12.2 Write property test for heading sizes
  - **Property 32: Responsive heading sizes**
  - **Validates: Requirements 11.2**

- [ ]* 12.3 Write property test for vertical spacing
  - **Property 33: Consistent vertical spacing**
  - **Validates: Requirements 11.5**

- [ ]* 12.4 Write property test for font sizes
  - **Property 3: Minimum font size maintenance**
  - **Validates: Requirements 1.5**

- [x] 13. Update authentication pages for mobile
  - Update login page with mobile-centered layout and padding
  - Hide or adapt image carousel for mobile screens
  - Make auth form inputs full-width with proper keyboard types
  - Update register page for mobile optimization
  - Ensure validation errors display clearly on mobile
  - _Requirements: 12.1, 12.2, 12.3_

- [ ]* 13.1 Write property test for login layout
  - **Property 34: Mobile-optimized login layout**
  - **Validates: Requirements 12.1**

- [ ]* 13.2 Write property test for carousel visibility
  - **Property 35: Responsive carousel visibility**
  - **Validates: Requirements 12.2**

- [ ]* 13.3 Write property test for auth inputs
  - **Property 36: Full-width auth inputs**
  - **Validates: Requirements 12.3**

- [x] 14. Update remaining pages for mobile responsiveness
  - Update events page and event detail pages
  - Update hives/forums pages and post detail pages
  - Update calendar page with mobile-friendly calendar view
  - Update profile pages with responsive layouts
  - Update clusters pages
  - _Requirements: 1.2, 1.3, 4.2, 4.3_

- [ ]* 14.1 Write property test for grid responsiveness
  - **Property 12: Single-column card grids on mobile**
  - **Property 13: Responsive grid column counts**
  - **Validates: Requirements 4.2, 4.3**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Run all property-based tests with 100+ iterations
  - Run all unit tests
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise

- [ ] 16. Manual testing and polish
  - Test on real iOS devices (iPhone)
  - Test on real Android devices
  - Test in browser dev tools at various viewport sizes (375px, 768px, 1024px, 1280px)
  - Verify touch interactions are smooth
  - Check that animations perform well
  - Ensure text remains readable at all sizes
  - Test navigation flow across all pages
  - Verify modals and dialogs work correctly
  - Test form submissions on mobile
  - _Requirements: All_

- [ ] 17. Performance optimization
  - Audit bundle size impact of responsive utilities
  - Optimize images for mobile with Next.js Image component
  - Add lazy loading for below-fold content on mobile
  - Minimize layout shifts with CSS containment
  - Test performance on slower mobile devices
  - _Requirements: 1.3_

- [ ] 18. Accessibility audit
  - Verify all touch targets meet 44x44px minimum
  - Ensure visible focus indicators on all interactive elements
  - Test keyboard navigation on all pages
  - Verify screen reader compatibility
  - Check color contrast at all viewport sizes
  - _Requirements: 3.1, 3.2_

- [ ] 19. Final checkpoint - Comprehensive testing
  - Verify no horizontal scrolling on any page at mobile widths
  - Confirm desktop experience is unchanged
  - Ensure all property tests pass
  - Validate manual testing checklist is complete
  - Get user approval for mobile experience
  - Ensure all tests pass, ask the user if questions arise
