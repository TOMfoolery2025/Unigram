# Design Document

## Overview

This design document outlines the comprehensive approach to implementing mobile responsiveness across the Unigram platform. The design follows a mobile-first methodology using Tailwind CSS responsive utilities, ensuring that all features remain fully functional on mobile devices while preserving the existing desktop experience.

### Key Design Principles

1. **Mobile-First Approach**: Start with mobile layouts and progressively enhance for larger screens
2. **Preservation of Desktop UX**: All existing desktop functionality and layouts remain unchanged
3. **Touch-Optimized**: All interactive elements meet minimum touch target sizes (44x44px)
4. **Performance-Conscious**: Minimize layout shifts and optimize for mobile network conditions
5. **Consistent Design Language**: Maintain the existing dark theme and visual identity across all viewports

### Responsive Breakpoints

Following Tailwind CSS defaults:
- **Mobile**: < 640px (sm breakpoint)
- **Tablet**: 640px - 1024px (sm to lg)
- **Desktop**: ≥ 1024px (lg and above)

The existing sidebar navigation uses 288px (w-72), so we'll use the `lg` breakpoint (1024px) as the primary desktop threshold.

## Architecture

### Component Hierarchy

```
RootLayout (viewport meta, global styles)
├── AuthenticatedLayout (responsive navigation wrapper)
│   ├── MainNav (desktop sidebar / mobile bottom bar)
│   └── Main Content Area (responsive padding and layout)
└── Page Components (responsive grid/flex layouts)
    ├── Cards (responsive stacking)
    ├── Forms (responsive inputs)
    ├── Modals (responsive sizing)
    └── Lists (responsive formatting)
```

### Responsive Strategy by Component Type

1. **Navigation**: Conditional rendering based on viewport
   - Desktop (≥1024px): Fixed sidebar (existing)
   - Mobile (<1024px): Bottom navigation bar

2. **Layouts**: CSS Grid and Flexbox with responsive columns
   - Desktop: Multi-column grids
   - Tablet: 2-column grids
   - Mobile: Single-column stacks

3. **Cards**: Flexible internal layouts
   - Desktop: Horizontal arrangements
   - Mobile: Vertical stacks with full-width elements

4. **Modals/Dialogs**: Size adaptation
   - Desktop: Centered with max-width
   - Mobile: Full-screen or near-full-screen

5. **Forms**: Input sizing and keyboard handling
   - Desktop: Standard widths
   - Mobile: Full-width with proper input types

## Components and Interfaces

### 1. Responsive Navigation System


#### Desktop Sidebar (Existing - Preserved)
- Fixed left sidebar (w-72 = 288px)
- Full navigation with icons and labels
- User profile section at bottom
- Remains unchanged for viewports ≥1024px

#### Mobile Bottom Navigation (New)
- Fixed bottom bar spanning full width
- Icon-only navigation with labels
- 5-6 primary destinations
- Safe area inset support for devices with home indicators
- Active state indication matching desktop style

**Interface:**
```typescript
interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobileVisible: boolean; // Some items may be desktop-only
}

interface MobileNavProps {
  items: NavigationItem[];
  currentPath: string;
  user: User;
}
```

### 2. Responsive Layout Container

**AuthenticatedLayout Component Updates:**
- Conditional margin-left based on viewport
- Desktop: `ml-72` (288px for sidebar)
- Mobile: `ml-0` with `pb-20` (80px for bottom nav)
- Responsive padding: `p-4 md:p-6 lg:p-8`

### 3. Responsive Card Components

#### EventCard Enhancements
- Badge wrapping on mobile
- Vertical button stacking on small screens
- Responsive text sizing
- Touch-optimized button sizing

#### SubforumCard Enhancements
- Flexible header layout
- Metadata wrapping on mobile
- Responsive avatar sizing

**Responsive Patterns:**
```typescript
// Desktop: Horizontal layout with side-by-side elements
// Mobile: Vertical stack with full-width elements

className={cn(
  "flex flex-col gap-3",           // Mobile: vertical stack
  "md:flex-row md:items-center"   // Tablet+: horizontal
)}
```

### 4. Dashboard Responsive Grid


**Grid Transformations:**
- Hero stats: `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
- Main content: `lg:grid-cols-3` → `grid-cols-1 lg:grid-cols-3`
- Card lists: Maintain single column on mobile, expand on larger screens

**Profile Pill:**
- Desktop: Visible in hero card
- Mobile: Move to bottom nav or hide, accessible via profile icon

### 5. Modal and Dialog Responsiveness

**Size Adaptations:**
```typescript
// Desktop: Centered modal with max-width
className="max-w-lg mx-auto"

// Mobile: Full-screen or near-full-screen
className={cn(
  "fixed inset-0 w-full h-full",           // Mobile: full screen
  "md:inset-auto md:max-w-lg md:h-auto"   // Desktop: centered
)}
```

**Scroll Handling:**
- Mobile: Full-height with internal scrolling
- Desktop: Auto-height with max-height constraints

### 6. Form Components

**Input Sizing:**
```typescript
// Mobile-optimized input
className={cn(
  "w-full h-12",              // Mobile: full width, larger height
  "md:h-10"                   // Desktop: standard height
)}

// Input type optimization
type="email"  // Triggers email keyboard on mobile
type="tel"    // Triggers numeric keyboard
type="search" // Triggers search keyboard with X button
```

**Button Sizing:**
- Minimum height: 44px on mobile
- Adequate spacing between buttons
- Full-width on mobile for primary actions

### 7. Chat Widget Responsiveness

**Current State Analysis:**
The ChatWidget already has some responsive classes but needs enhancement:

**Enhancements Needed:**
- Full-screen on mobile (currently implemented)
- Better session list handling on mobile
- Optimized message list scrolling
- Keyboard-aware input positioning

**Responsive Behavior:**
```typescript
// Mobile: Full screen
"inset-0 w-full h-full rounded-none"

// Tablet: Large panel
"md:bottom-4 md:right-4 md:w-[500px] md:h-[700px] md:rounded-lg"

// Desktop: Standard size
"lg:w-[420px] lg:h-[650px]"
```

## Data Models

No new data models are required. This is purely a presentation layer enhancement.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No horizontal scroll on mobile

*For any* page in the application, when rendered at mobile viewport widths (< 640px), the document width should not exceed the viewport width, ensuring no horizontal scrolling is required.
**Validates: Requirements 1.2**

### Property 2: Responsive layout adaptation

*For any* component with responsive classes, when the viewport width changes across breakpoints (mobile, tablet, desktop), the component should apply the appropriate responsive classes for that breakpoint.
**Validates: Requirements 1.3**

### Property 3: Minimum font size maintenance

*For any* text element, when rendered at mobile viewport widths, the computed font size should meet minimum readability standards (at least 14px for body text, 16px for inputs).
**Validates: Requirements 1.5**

### Property 4: Navigation visibility by viewport

*For any* viewport width, either the desktop sidebar or mobile bottom navigation should be visible, but not both simultaneously. At widths < 1024px, mobile nav is visible; at widths ≥ 1024px, desktop sidebar is visible.
**Validates: Requirements 2.1, 2.4**

### Property 5: Navigation destination parity

*For any* navigation system (mobile or desktop), the set of primary navigation destinations should be equivalent, ensuring feature parity across viewports.
**Validates: Requirements 2.3**

### Property 6: Navigation interaction feedback

*For any* navigation item, when clicked or tapped, the item should provide visual feedback (active state) and trigger navigation to the correct route.
**Validates: Requirements 2.2**

### Property 7: Responsive navigation content

*For any* navigation item, the displayed content should adapt to viewport: icons with labels on mobile, full labels with icons on desktop.
**Validates: Requirements 2.5**

### Property 8: Minimum touch target size

*For any* interactive element (button, link, input) on mobile viewport, the element should have minimum dimensions of 44x44 pixels to ensure touch accessibility.
**Validates: Requirements 3.1**

### Property 9: Interactive element spacing

*For any* pair of adjacent interactive elements on mobile viewport, there should be adequate spacing (minimum 8px) between them to prevent mis-taps.
**Validates: Requirements 3.2**

### Property 10: Mobile keyboard input types

*For any* form input field, the input type attribute should match the expected data format (email, tel, search, etc.) to trigger appropriate mobile keyboards.
**Validates: Requirements 3.4**

### Property 11: Card vertical stacking on mobile

*For any* card component with internal layout, when rendered at mobile viewport widths, the card content should stack vertically (flex-col) rather than horizontally.
**Validates: Requirements 4.1**

### Property 12: Single-column card grids on mobile

*For any* grid of cards, when rendered at mobile viewport widths, the grid should display as a single column to optimize for narrow screens.
**Validates: Requirements 4.2**

### Property 13: Responsive grid column counts

*For any* dashboard grid layout, the number of columns should decrease appropriately as viewport width decreases (e.g., 3 cols → 2 cols → 1 col).
**Validates: Requirements 4.3**

### Property 14: Text truncation for long content

*For any* card with long text content, the text should have truncation classes (line-clamp, truncate) applied to prevent layout overflow.
**Validates: Requirements 4.5**

### Property 15: Dashboard single-column on mobile

*For any* dashboard layout section, when rendered at mobile viewport widths, multi-column layouts should convert to single-column stacks.
**Validates: Requirements 5.1**

### Property 16: Full-width search on mobile

*For any* search input component, when rendered at mobile viewport widths, the input should expand to full width (w-full) for optimal usability.
**Validates: Requirements 5.3**

### Property 17: Tappable tab controls

*For any* tab component, when rendered at mobile viewport widths, each tab should meet minimum touch target size requirements.
**Validates: Requirements 5.4**

### Property 18: Mobile input sizing

*For any* text input field on mobile viewport, the input should have appropriate height (minimum 44px) and full width for touch interaction.
**Validates: Requirements 6.1**

### Property 19: Full-screen modals on mobile

*For any* modal or dialog, when opened at mobile viewport widths, the modal should occupy full-screen or near-full-screen dimensions.
**Validates: Requirements 7.1**

### Property 20: Touch-sized dialog buttons

*For any* action button in a dialog, when rendered at mobile viewport widths, the button should meet minimum touch target size requirements.
**Validates: Requirements 7.5**

### Property 21: Full-screen chat widget on mobile

*For any* chat widget state, when opened at mobile viewport widths, the widget should expand to full-screen mode.
**Validates: Requirements 8.1**

### Property 22: Responsive chat message layout

*For any* chat message component, when rendered at mobile viewport widths, the message layout should optimize for narrow screens with appropriate text wrapping.
**Validates: Requirements 8.2**

### Property 23: Mobile-optimized wiki articles

*For any* wiki article content, when rendered at mobile viewport widths, the content should have responsive formatting classes for optimal reading.
**Validates: Requirements 8.4**

### Property 24: Mobile session list overlay

*For any* chat session list, when opened at mobile viewport widths, the list should display as a full-width overlay or slide-in panel.
**Validates: Requirements 8.5**

### Property 25: Card-based event lists on mobile

*For any* event list, when rendered at mobile viewport widths, events should display as cards rather than table rows.
**Validates: Requirements 9.1**

### Property 26: Responsive avatar sizing

*For any* avatar component, when rendered at different viewport widths, the avatar should use appropriate size classes for the context.
**Validates: Requirements 9.2**

### Property 27: Mobile-friendly filter layouts

*For any* filter component, when rendered at mobile viewport widths, the filters should have responsive layouts (stacking, full-width, etc.).
**Validates: Requirements 9.4**

### Property 28: Touch-optimized sort controls

*For any* sorting control, when rendered at mobile viewport widths, the control should meet minimum touch target size requirements.
**Validates: Requirements 9.5**

### Property 29: Responsive image scaling

*For any* image element, when rendered at mobile viewport widths, the image should have max-width or responsive width classes to prevent overflow.
**Validates: Requirements 10.1**

### Property 30: Responsive avatar dimensions

*For any* avatar image, when rendered at different viewport widths, the avatar should use responsive size classes appropriate for the context.
**Validates: Requirements 10.2**

### Property 31: Consistent mobile padding

*For any* page or component container, when rendered at mobile viewport widths, the padding should use consistent spacing utilities from the design system.
**Validates: Requirements 11.1**

### Property 32: Responsive heading sizes

*For any* heading element, when rendered at different viewport widths, the heading should have responsive text size classes that scale appropriately.
**Validates: Requirements 11.2**

### Property 33: Consistent vertical spacing

*For any* vertically stacked components, the spacing between components should use consistent gap or space-y utilities.
**Validates: Requirements 11.5**

### Property 34: Mobile-optimized login layout

*For any* login page element, when rendered at mobile viewport widths, the content should have centered layout with appropriate mobile padding.
**Validates: Requirements 12.1**

### Property 35: Responsive carousel visibility

*For any* image carousel on auth pages, when rendered at mobile viewport widths, the carousel should be hidden or adapted for mobile screens.
**Validates: Requirements 12.2**

### Property 36: Full-width auth inputs

*For any* authentication form input, when rendered at mobile viewport widths, the input should have full-width classes and appropriate input type attributes.
**Validates: Requirements 12.3**

### Property 37: Desktop layout preservation

*For any* component with responsive updates, when rendered at desktop viewport widths (≥ 1024px), the layout and functionality should remain unchanged from the original implementation.
**Validates: Requirements 13.4**


## Error Handling

### Viewport Detection Errors
- **Issue**: Incorrect breakpoint detection
- **Handling**: Use standard Tailwind breakpoints; test across devices
- **Fallback**: Default to mobile-first approach

### Layout Shift Issues
- **Issue**: Content jumping during responsive transitions
- **Handling**: Use CSS containment and will-change properties
- **Fallback**: Disable animations on low-performance devices

### Touch Target Failures
- **Issue**: Interactive elements too small on mobile
- **Handling**: Enforce minimum 44x44px sizing in component library
- **Fallback**: Add padding to increase tap area without visual changes

### Keyboard Overlap
- **Issue**: Mobile keyboard covering input fields
- **Handling**: Use viewport units and scroll-into-view behavior
- **Fallback**: Add extra bottom padding on focus

### Image Loading on Mobile
- **Issue**: Large images causing performance issues
- **Handling**: Implement responsive images with srcset
- **Fallback**: Show loading skeletons and optimize image sizes

## Testing Strategy

### Unit Testing

Unit tests will verify specific responsive behaviors and component rendering:

1. **Component Rendering Tests**
   - Test that components render without errors at different viewport widths
   - Verify correct CSS classes are applied at each breakpoint
   - Check that conditional rendering works (mobile nav vs desktop sidebar)

2. **Responsive Class Tests**
   - Verify Tailwind responsive utilities are applied correctly
   - Test that mobile-first classes are present
   - Ensure desktop classes don't override mobile inappropriately

3. **Touch Target Tests**
   - Measure rendered button dimensions at mobile viewports
   - Verify minimum 44x44px sizing for interactive elements
   - Check spacing between adjacent interactive elements

4. **Layout Tests**
   - Test grid column counts at different breakpoints
   - Verify flex direction changes (row to column)
   - Check that full-width classes are applied on mobile

**Testing Framework**: Vitest with React Testing Library

**Example Unit Test**:
```typescript
describe('MainNav responsive behavior', () => {
  it('shows mobile nav on small screens', () => {
    render(<MainNav />, { viewport: { width: 375 } });
    expect(screen.getByRole('navigation', { name: /mobile/i })).toBeVisible();
    expect(screen.queryByRole('navigation', { name: /desktop/i })).not.toBeInTheDocument();
  });

  it('shows desktop sidebar on large screens', () => {
    render(<MainNav />, { viewport: { width: 1280 } });
    expect(screen.getByRole('navigation', { name: /desktop/i })).toBeVisible();
    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument();
  });
});
```

### Property-Based Testing

Property-based tests will verify universal responsive behaviors across many inputs:

**Testing Framework**: fast-check (JavaScript property-based testing library)

**Property Test Patterns**:

1. **Viewport Width Property Tests**
   - Generate random viewport widths
   - Verify appropriate responsive classes are applied
   - Ensure no horizontal scroll at any mobile width

2. **Component Rendering Property Tests**
   - Generate random component props
   - Verify responsive behavior is consistent
   - Check that layouts adapt correctly

3. **Touch Target Property Tests**
   - Generate random button configurations
   - Verify all meet minimum size requirements
   - Check spacing is adequate

**Example Property Test**:
```typescript
import fc from 'fast-check';

describe('Responsive layout properties', () => {
  it('Property 1: No horizontal scroll on mobile', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
        fc.constantFrom('dashboard', 'events', 'hives', 'calendar'), // Pages
        (viewportWidth, pageName) => {
          const { container } = render(<Page name={pageName} />, {
            viewport: { width: viewportWidth }
          });
          
          const documentWidth = container.scrollWidth;
          expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8: Minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ label: fc.string(), onClick: fc.func(fc.constant(undefined)) })),
        (buttons) => {
          const { getAllByRole } = render(<ButtonGroup buttons={buttons} />, {
            viewport: { width: 375 }
          });
          
          const buttonElements = getAllByRole('button');
          buttonElements.forEach(button => {
            const { width, height } = button.getBoundingClientRect();
            expect(width).toBeGreaterThanOrEqual(44);
            expect(height).toBeGreaterThanOrEqual(44);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Visual Regression Testing

While not part of automated testing, visual regression testing should be performed:

1. **Manual Testing Checklist**
   - Test on real devices (iOS, Android)
   - Test in browser dev tools at various viewport sizes
   - Verify touch interactions work smoothly
   - Check that animations are smooth
   - Ensure text remains readable

2. **Viewport Testing Matrix**
   - Mobile: 375px (iPhone), 360px (Android)
   - Tablet: 768px (iPad), 820px (Android tablet)
   - Desktop: 1024px, 1280px, 1920px

3. **Browser Testing**
   - Safari (iOS)
   - Chrome (Android)
   - Chrome (Desktop)
   - Firefox (Desktop)
   - Safari (macOS)

### Integration Testing

Integration tests will verify that responsive behavior works across component boundaries:

1. **Navigation Flow Tests**
   - Test navigation between pages on mobile
   - Verify bottom nav persists across routes
   - Check that active states update correctly

2. **Form Submission Tests**
   - Test form submission on mobile viewports
   - Verify keyboard doesn't break layout
   - Check that validation errors display correctly

3. **Modal Interaction Tests**
   - Test opening/closing modals on mobile
   - Verify scroll locking works
   - Check that modals are dismissible

## Implementation Notes

### Tailwind CSS Responsive Utilities

The implementation will heavily use Tailwind's responsive prefixes:

- `sm:` - 640px and above
- `md:` - 768px and above
- `lg:` - 1024px and above (primary desktop breakpoint)
- `xl:` - 1280px and above
- `2xl:` - 1536px and above

### Mobile-First Approach

All styles should be written mobile-first:

```typescript
// ✅ Correct: Mobile-first
className="flex flex-col md:flex-row lg:gap-6"

// ❌ Incorrect: Desktop-first
className="flex flex-row flex-col-mobile"
```

### Common Responsive Patterns

**Layout Stacking:**
```typescript
className="flex flex-col lg:flex-row gap-4"
```

**Grid Columns:**
```typescript
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

**Conditional Visibility:**
```typescript
className="hidden lg:block"  // Desktop only
className="block lg:hidden"  // Mobile only
```

**Responsive Spacing:**
```typescript
className="p-4 md:p-6 lg:p-8"
className="space-y-4 md:space-y-6"
```

**Responsive Text:**
```typescript
className="text-sm md:text-base lg:text-lg"
className="text-2xl md:text-3xl lg:text-4xl"
```

### Performance Considerations

1. **Avoid Layout Thrashing**: Use CSS transforms instead of layout properties for animations
2. **Minimize Reflows**: Use `contain` CSS property for isolated components
3. **Optimize Images**: Use Next.js Image component with responsive sizes
4. **Lazy Load**: Implement lazy loading for below-fold content on mobile
5. **Reduce Bundle Size**: Ensure responsive utilities don't bloat the CSS bundle

### Accessibility Considerations

1. **Touch Targets**: Minimum 44x44px for all interactive elements
2. **Focus Indicators**: Ensure visible focus states on all interactive elements
3. **Screen Reader Support**: Maintain semantic HTML and ARIA labels
4. **Keyboard Navigation**: Ensure all functionality is keyboard accessible
5. **Color Contrast**: Maintain WCAG AA contrast ratios at all viewport sizes

## Migration Strategy

### Phase 1: Foundation (Core Infrastructure)
- Add viewport meta tag
- Update root layout with responsive utilities
- Create mobile navigation component
- Update authenticated layout for responsive behavior

### Phase 2: Navigation & Layout
- Implement bottom navigation bar
- Add responsive padding to main content area
- Update navigation active states
- Test navigation flow on mobile

### Phase 3: Component Library
- Update card components (EventCard, SubforumCard)
- Update form components (inputs, buttons)
- Update modal/dialog components
- Update list components

### Phase 4: Page Layouts
- Update dashboard page
- Update events page
- Update hives/forums page
- Update calendar page
- Update profile pages

### Phase 5: Authentication & Special Pages
- Update login page
- Update register page
- Update wiki page
- Update chat widget (enhance existing responsive behavior)

### Phase 6: Polish & Testing
- Visual regression testing
- Real device testing
- Performance optimization
- Accessibility audit
- Documentation updates

## Success Criteria

The mobile responsive implementation will be considered successful when:

1. ✅ All pages render correctly on mobile devices (375px - 640px)
2. ✅ No horizontal scrolling occurs on any page at mobile widths
3. ✅ All interactive elements meet minimum 44x44px touch target size
4. ✅ Navigation works seamlessly on mobile with bottom bar
5. ✅ Desktop experience remains unchanged (≥1024px)
6. ✅ All property-based tests pass with 100+ iterations
7. ✅ Manual testing confirms smooth interactions on real devices
8. ✅ Performance metrics remain within acceptable ranges
9. ✅ Accessibility standards are maintained across all viewports
10. ✅ User feedback indicates improved mobile experience
