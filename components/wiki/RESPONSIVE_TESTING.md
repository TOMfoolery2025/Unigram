# Chat Widget Responsive Design Testing Guide

## Overview

This document provides a comprehensive testing checklist for verifying the responsive design implementation of the TUM Wiki Assistant chat widget (Task 9.5).

## Testing Requirements

Per Requirement 9.1: "WHEN the chat interface is displayed THEN the Wiki System SHALL render it responsively for mobile, tablet, and desktop screens"

## Test Environments

### Mobile Devices (< 768px)
- iPhone SE (375x667)
- iPhone 12/13/14 (390x844)
- iPhone 14 Pro Max (430x932)
- Samsung Galaxy S21 (360x800)
- Small devices (320px width)

### Tablet Devices (768px - 1024px)
- iPad (768x1024)
- iPad Pro 11" (834x1194)
- Android tablets (800x1280)

### Desktop (> 1024px)
- Laptop (1366x768)
- Desktop (1920x1080)
- Large desktop (2560x1440)

## Test Cases

### 1. Floating Chat Button

#### Mobile (< 768px)
- [ ] Button size is 56x56px (meets 44x44px minimum)
- [ ] Button positioned at bottom-right with 16px margin
- [ ] Icon size is 24x24px
- [ ] Button has active scale animation (0.95) on tap
- [ ] Button has touch-manipulation CSS applied
- [ ] Button is easily tappable with thumb

#### Tablet (768px - 1024px)
- [ ] Button size is 64x64px
- [ ] Button positioned at bottom-right with 16px margin
- [ ] Icon size is 28x28px
- [ ] Smooth hover and active states

#### Desktop (> 1024px)
- [ ] Button size is 64x64px
- [ ] Button positioned at bottom-right with 24px margin
- [ ] Icon size is 28x28px
- [ ] Hover effects work smoothly

### 2. Chat Dialog Panel

#### Mobile (< 768px)
- [ ] Dialog takes full screen (100vw x 100vh)
- [ ] No rounded corners (rounded-none)
- [ ] Header height is appropriate (48px)
- [ ] Content area fills remaining space
- [ ] No overflow or scrolling issues
- [ ] Safe area insets respected on notched devices
- [ ] Works in both portrait and landscape

#### Tablet (768px - 1024px)
- [ ] Dialog is 500px wide
- [ ] Dialog is 700px tall
- [ ] Dialog has max-height: calc(100vh - 2rem)
- [ ] Dialog positioned at bottom-right with 16px margin
- [ ] Rounded corners (rounded-lg)
- [ ] Shadow visible and appropriate

#### Desktop (> 1024px)
- [ ] Dialog is 420px wide
- [ ] Dialog is 650px tall
- [ ] Dialog has max-height: calc(100vh - 3rem)
- [ ] Dialog positioned at bottom-right with 24px margin
- [ ] Rounded corners (rounded-lg)
- [ ] Shadow visible and appropriate

### 3. Dialog Header

#### Mobile (< 768px)
- [ ] Padding is 12px
- [ ] Menu button is 40x40px (touch-friendly)
- [ ] Close button is 40x40px (touch-friendly)
- [ ] Title font size is 16px (base)
- [ ] Icons are 20x20px
- [ ] Buttons have touch-manipulation CSS
- [ ] Active scale animation on tap

#### Tablet & Desktop (≥ 768px)
- [ ] Padding is 16px
- [ ] Menu button is 36x36px
- [ ] Close button is 36x36px
- [ ] Title font size is 18px (lg)
- [ ] Icons are 16x16px
- [ ] Hover states work correctly

### 4. Session List Sidebar

#### Mobile (< 768px)
- [ ] Sidebar overlays entire dialog (full width)
- [ ] Slide-in animation from left
- [ ] Close button visible and functional (40x40px)
- [ ] "Conversations" heading visible
- [ ] New conversation button is 44px tall
- [ ] Session items have adequate padding (12px)
- [ ] Delete buttons always visible (32x32px)
- [ ] Touch feedback on all interactions

#### Tablet & Desktop (≥ 768px)
- [ ] Sidebar is 256px wide
- [ ] Sidebar appears as side panel (not overlay)
- [ ] No close button shown
- [ ] No slide animation
- [ ] New conversation button is 40px tall
- [ ] Session items have standard padding (10px)
- [ ] Delete buttons show on hover (24x24px)
- [ ] Smooth hover transitions

### 5. Chat Message List

#### Mobile (< 768px)
- [ ] Padding is 12px
- [ ] Messages have 12px bottom margin
- [ ] User messages max-width 90%
- [ ] Assistant messages max-width 90%
- [ ] Message padding is 12px x 8px
- [ ] Font size is 14px
- [ ] Auto-scroll works smoothly
- [ ] No horizontal overflow

#### Tablet & Desktop (≥ 768px)
- [ ] Padding is 16px
- [ ] Messages have 16px bottom margin
- [ ] User messages max-width 85% (tablet) / 80% (desktop)
- [ ] Assistant messages max-width 85% (tablet) / 80% (desktop)
- [ ] Message padding is 16px x 12px
- [ ] Font size is 14px
- [ ] Auto-scroll works smoothly

### 6. Chat Messages

#### All Sizes
- [ ] Long text wraps properly (break-words)
- [ ] Code blocks scroll horizontally if needed
- [ ] Inline code breaks appropriately (break-all)
- [ ] Links are tappable/clickable
- [ ] Source links have touch-manipulation CSS
- [ ] Timestamps are readable
- [ ] Message bubbles don't break layout

#### Mobile Specific
- [ ] Source categories stack vertically
- [ ] Adequate spacing between source links (6px)
- [ ] Links have 4px vertical padding for touch

#### Tablet/Desktop Specific
- [ ] Source categories inline with separator
- [ ] Standard spacing between source links (4px)

### 7. Chat Input

#### Mobile (< 768px)
- [ ] Container padding is 12px
- [ ] Textarea min-height is 44px (touch target)
- [ ] Textarea max-height is 120px
- [ ] Font size is 16px (prevents iOS zoom)
- [ ] Send button is 44x44px (touch target)
- [ ] Send button icon is 20x20px
- [ ] Touch-manipulation CSS applied
- [ ] Active scale animation (0.95) on tap
- [ ] Keyboard doesn't break layout
- [ ] Help text hidden on mobile

#### Tablet (768px - 1024px)
- [ ] Container padding is 16px
- [ ] Textarea min-height is 52px
- [ ] Textarea max-height is 180px
- [ ] Font size is 14px
- [ ] Send button is 52x52px
- [ ] Send button icon is 20x20px
- [ ] Help text visible

#### Desktop (> 1024px)
- [ ] Container padding is 16px
- [ ] Textarea min-height is 52px
- [ ] Textarea max-height is 180px
- [ ] Font size is 14px
- [ ] Send button is 52x52px
- [ ] Send button icon is 20x20px
- [ ] Help text visible

### 8. Welcome Message

#### Mobile (< 768px)
- [ ] Container padding is 16px
- [ ] Icon container is 56x56px
- [ ] Icon is 28x28px
- [ ] Heading font size is 18px (lg)
- [ ] Description font size is 14px
- [ ] Suggested questions have 12px vertical padding
- [ ] Question text wraps (line-clamp-2)
- [ ] Icons are 16x16px
- [ ] Touch feedback on buttons (scale 0.98)
- [ ] Adequate spacing between questions (8px)

#### Tablet & Desktop (≥ 768px)
- [ ] Container padding is 24px
- [ ] Icon container is 64x64px
- [ ] Icon is 32x32px
- [ ] Heading font size is 24px (2xl)
- [ ] Description font size is 16px (base)
- [ ] Suggested questions have 12px vertical padding
- [ ] Question text wraps properly
- [ ] Icons are 16x16px
- [ ] Hover effects work smoothly

### 9. Touch Interactions

#### All Touch Devices
- [ ] All buttons have minimum 44x44px touch target
- [ ] Touch-manipulation CSS prevents double-tap zoom
- [ ] Active states provide visual feedback
- [ ] No accidental text selection on taps
- [ ] Tap highlight color is transparent
- [ ] Smooth scrolling with momentum
- [ ] Swipe gestures work naturally
- [ ] No touch delays or lag

### 10. Typography

#### Mobile (< 768px)
- [ ] Base font size is 16px (prevents zoom)
- [ ] Headings scale appropriately
- [ ] Line height is comfortable (1.5)
- [ ] Text is readable without zooming
- [ ] No text overflow issues

#### Tablet & Desktop (≥ 768px)
- [ ] Font sizes are appropriate for screen size
- [ ] Headings have proper hierarchy
- [ ] Line height is comfortable
- [ ] Text is crisp and readable

### 11. Layout & Spacing

#### Mobile (< 768px)
- [ ] No horizontal scrolling
- [ ] Adequate padding on all sides
- [ ] Elements don't overlap
- [ ] Spacing is consistent
- [ ] Content fits within viewport

#### Tablet & Desktop (≥ 768px)
- [ ] Proper use of whitespace
- [ ] Balanced layout
- [ ] Elements properly aligned
- [ ] Spacing scales appropriately

### 12. Performance

#### All Devices
- [ ] Smooth animations (60fps)
- [ ] No layout shifts
- [ ] Fast initial render
- [ ] Smooth scrolling
- [ ] Responsive to interactions
- [ ] No janky transitions

### 13. Edge Cases

#### All Sizes
- [ ] Very long messages wrap correctly
- [ ] Many messages scroll smoothly
- [ ] Empty states display correctly
- [ ] Error states are visible
- [ ] Loading states are clear
- [ ] Long session titles truncate
- [ ] Many sessions scroll in sidebar

#### Mobile Specific
- [ ] Landscape orientation works
- [ ] Keyboard appearance doesn't break layout
- [ ] Safe area insets work on notched devices
- [ ] Works on small screens (320px)

## Browser Testing

Test on the following browsers:

### Mobile
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)
- [ ] Samsung Internet (latest)

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

## Accessibility Testing

### Touch Accessibility
- [ ] All touch targets meet 44x44px minimum
- [ ] Touch feedback is clear
- [ ] No accidental activations
- [ ] Gestures are intuitive

### Visual Accessibility
- [ ] Text is readable at all sizes
- [ ] Contrast ratios are maintained
- [ ] Focus indicators are visible
- [ ] Spacing prevents crowding

## Testing Tools

### Browser DevTools
- Use responsive design mode
- Test various device presets
- Throttle network and CPU
- Check for layout shifts

### Physical Devices
- Test on real devices when possible
- Check touch interactions
- Verify performance
- Test in different orientations

### Automated Tools
- Lighthouse (Performance, Accessibility)
- WebPageTest (Performance)
- BrowserStack (Cross-browser)

## Success Criteria

All test cases must pass for the following to be considered complete:

1. ✅ Chat interface renders correctly on mobile devices (< 768px)
2. ✅ Chat interface renders correctly on tablets (768px - 1024px)
3. ✅ Chat interface renders correctly on desktops (> 1024px)
4. ✅ All touch targets meet minimum 44x44px size
5. ✅ Touch interactions provide appropriate feedback
6. ✅ No horizontal scrolling at any breakpoint
7. ✅ Text remains readable at all sizes
8. ✅ Layout adapts smoothly between breakpoints
9. ✅ Performance is acceptable on all devices
10. ✅ Accessibility is maintained across all sizes

## Notes

- Test with real content (long messages, many sessions)
- Test with slow network connections
- Test with reduced motion preferences
- Test with different zoom levels
- Test with different font size settings
- Document any issues found
- Verify fixes don't break other breakpoints
