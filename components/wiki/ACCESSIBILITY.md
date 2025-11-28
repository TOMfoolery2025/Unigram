# Chat Widget Accessibility Features

## Overview

The TUM Wiki Assistant chat widget has been designed with comprehensive accessibility features to ensure all users can interact with the chatbot effectively.

## Keyboard Navigation

All features of the TUM Wiki Assistant chat widget are fully accessible via keyboard. No mouse is required for any functionality.

### Global Shortcuts

- **Escape**: Close the chat dialog when it's open (works from anywhere within the dialog)
- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward through interactive elements

### Opening the Chat

- **Tab**: Navigate to the floating chat button
- **Enter** or **Space**: Open the chat dialog

### Chat Input

- **Enter**: Send the current message
- **Shift + Enter**: Insert a new line in the message (multi-line support)
- **Tab**: Move focus to the send button
- **Shift + Tab**: Move focus back from send button to input field

### Session Management

- **Tab**: Navigate to the session menu button
- **Enter** or **Space**: Toggle the session list sidebar
- **Tab**: Navigate through sessions in the list
- **Enter** or **Space**: Select a session
- **Tab**: Navigate to delete button for each session
- **Enter** or **Space**: Delete a session (with confirmation)
- **Tab**: Navigate to "New Conversation" button
- **Enter** or **Space**: Create a new conversation

### Suggested Questions (Welcome Screen)

- **Tab**: Navigate through suggested question buttons
- **Enter** or **Space**: Select a suggested question to send

### Article Source Links

- **Tab**: Navigate through article source links in assistant messages
- **Enter**: Open the linked article in the wiki

### Focus Management

When the chat dialog opens:
- Focus automatically moves to the close button for immediate access to close functionality
- Focus is trapped within the dialog (Tab cycles through elements within the dialog only)
- Tabbing forward from the last element returns focus to the first element
- Shift+Tab from the first element moves focus to the last element
- When the dialog closes, focus returns to the element that opened it (the floating button)

### Focus Order

The focus order within the chat dialog follows a logical sequence:

1. Close button (initial focus)
2. Session menu toggle button
3. Session list (when open):
   - New Conversation button
   - Session items (in chronological order)
   - Delete buttons for each session
4. Chat message area (scrollable, but not focusable)
5. Message input field
6. Send button

### Keyboard Navigation Best Practices

- All interactive elements have visible focus indicators (ring outline)
- Focus indicators meet WCAG 2.1 contrast requirements
- No keyboard traps (except intentional focus trap within dialog)
- Logical tab order follows visual layout
- All functionality available via keyboard matches mouse functionality

## Screen Reader Support

### ARIA Labels and Roles

All interactive elements have appropriate ARIA labels:

- **Chat button**: "Open TUM Wiki Assistant chat" with `aria-haspopup="dialog"` and `aria-expanded`
- **Close button**: "Close chat dialog (Press Escape)"
- **Session toggle**: "Show/Hide conversation list" with `aria-expanded` and `aria-controls`
- **Message input**: "Type your message about TUM" with `aria-required` and `aria-describedby`
- **Send button**: "Send message" (changes to "Please wait, message is being sent" when disabled)
- **Session buttons**: "Select conversation: [title]" or "Current conversation: [title]" with `aria-current` for active session
- **Delete buttons**: "Delete conversation: [title]"
- **Suggested questions**: "Ask about [category]: [question text]"
- **Article source links**: "View source article: [title] in [category] category"
- **New conversation button**: "Start new conversation"

### Live Regions

The chat interface uses ARIA live regions to announce updates:

- **Message announcements**: Hidden live region with `aria-live="polite"` announces "You sent a message" or "Assistant replied" when new messages arrive
- **Message list**: `role="log"` with `aria-live="off"` (announcements handled by dedicated region)
- **Typing indicator**: `role="status"` with `aria-live="polite"` announces "Assistant is typing"
- **Error messages**: `role="alert"` with `aria-live="assertive"` for immediate attention
- **Loading states**: `role="status"` with `aria-live="polite"`
- **Empty states**: `role="status"` for session list and message list

### Semantic HTML

The chat widget uses semantic HTML elements:

- `<article>` for individual messages with `role="article"`
- `<header>` for dialog header and section headers
- `<section>` for welcome message area
- `<nav>` for navigation elements (sources, suggested questions, session list)
- `<time>` for timestamps with `datetime` attribute and descriptive `aria-label`
- `<ul>` and `<li>` with `role="list"` for all lists
- `<aside>` for the session sidebar with `role="complementary"`
- `<main>` for the chat conversation area with `role="main"`
- `<form>` for the message input area
- `<label>` elements (including `.sr-only` labels) for all inputs
- `role="dialog"` with `aria-modal="true"` for the chat panel
- `role="region"` for major sections with descriptive `aria-label`

### Screen Reader Announcements

Messages are announced to screen readers in the following ways:

1. **New message arrival**: A hidden live region announces "You sent a message" or "Assistant replied"
2. **Message content**: Each message has a screen-reader-only prefix "You said:" or "Assistant said:"
3. **Message metadata**: Timestamps are announced as "Sent at [time]"
4. **Article sources**: Source links are announced with full context including title and category
5. **Streaming status**: Typing indicator announces "Assistant is typing"

## Responsive Design

### Mobile (< 768px)

- **Chat dialog**: Full screen with safe area support for devices with notches
- **Session list**: Full-width overlay with slide-in animation
- **Floating button**: 56x56px (meets 44x44px minimum touch target)
- **Touch targets**: All interactive elements minimum 44x44px
- **Touch feedback**: Active scale animations (0.95-0.98) for visual feedback
- **Typography**: Base font size (16px) to prevent zoom on iOS
- **Spacing**: Reduced padding (12px) for better space utilization
- **Input field**: 44px minimum height with larger touch area
- **Delete buttons**: Always visible (not hover-only) for touch accessibility
- **Message bubbles**: 90% max-width for better readability
- **Source links**: Stacked layout with adequate spacing

### Tablet (768px - 1024px)

- **Chat dialog**: 500px wide, 700px tall, max-height respects viewport
- **Session list**: 256px sidebar (not overlay)
- **Floating button**: 64x64px with smooth transitions
- **Touch targets**: Comfortable 48x48px minimum
- **Typography**: Balanced font sizes for readability
- **Spacing**: Standard padding (16px)
- **Input field**: 52px height
- **Delete buttons**: Hover-reveal with focus fallback
- **Message bubbles**: 85% max-width

### Desktop (> 1024px)

- **Chat dialog**: 420px wide, 650px tall, max-height respects viewport
- **Session list**: 256px sidebar
- **Floating button**: 64x64px
- **Interactive elements**: Standard sizes optimized for mouse
- **Typography**: Optimal font sizes for desktop viewing
- **Spacing**: Comfortable padding (16px)
- **Input field**: 52px height
- **Delete buttons**: Hover-reveal with smooth transitions
- **Message bubbles**: 80% max-width

### Touch Optimizations

- **Touch manipulation**: All interactive elements use `touch-action: manipulation` to prevent double-tap zoom
- **Tap highlight**: Disabled default tap highlight color for custom feedback
- **Active states**: Scale animations provide immediate visual feedback
- **Smooth scrolling**: Native smooth scrolling with `-webkit-overflow-scrolling: touch`
- **Text selection**: Prevented on interactive elements to avoid accidental selection
- **Gesture support**: Swipe gestures work naturally with overlay animations

### Responsive Features

- **Viewport adaptation**: Dialog respects viewport height with max-height constraints
- **Orientation support**: Works in both portrait and landscape orientations
- **Text wrapping**: Long text breaks properly with `break-words` utility
- **Overflow handling**: Horizontal overflow prevented, vertical scrolling enabled
- **Safe areas**: Support for device safe area insets (notches, home indicators)
- **Dynamic sizing**: Components adapt smoothly across breakpoints
- **Flexible layouts**: Flexbox and min-width/min-height prevent layout collapse

## Testing Recommendations

### Keyboard Testing

1. Open the chat using only keyboard (Tab to button, Enter to activate)
2. Navigate through all interactive elements using Tab
3. Close the chat using Escape key
4. Verify focus returns to the open button after closing
5. Test message sending with Enter key
6. Test multi-line input with Shift+Enter

### Screen Reader Testing

Test with popular screen readers:
- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS/iOS)
- **TalkBack** (Android)

Verify:
1. All buttons and inputs are announced correctly
2. New messages are announced as they arrive
3. Typing indicator is announced
4. Error messages are announced immediately
5. Navigation structure is clear

### Responsive Testing

Test on various devices and screen sizes:
- **Small mobile phones** (320px - 374px): iPhone SE, small Android devices
- **Standard mobile phones** (375px - 767px): iPhone 12/13/14, standard Android devices
- **Tablets** (768px - 1023px): iPad, Android tablets
- **Desktops** (1024px+): Laptops, desktop monitors

Verify:
1. All content is readable and accessible at all sizes
2. Touch targets are at least 44x44px on mobile/tablet
3. No horizontal scrolling required at any breakpoint
4. Text remains legible at all sizes (minimum 14px)
5. Interactive elements provide visual feedback on touch
6. Session list transitions smoothly between overlay and sidebar modes
7. Chat dialog respects viewport boundaries
8. Input field doesn't cause zoom on iOS (16px minimum font size)
9. Delete buttons are accessible on touch devices
10. Long text wraps properly without breaking layout
11. Landscape orientation works correctly on mobile devices
12. Safe area insets are respected on devices with notches

## Compliance

This implementation follows:
- **WCAG 2.1 Level AA** guidelines
- **ARIA 1.2** specifications
- **WAI-ARIA Authoring Practices** for dialog patterns

## Known Limitations

- Markdown content in assistant messages may contain complex formatting that could be challenging for screen readers
- Very long conversations may impact performance on older devices
- Some visual indicators (like the typing animation) are decorative and hidden from screen readers

## Keyboard Shortcuts Quick Reference

### Essential Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Esc` | Close chat dialog | When dialog is open |
| `Enter` | Send message | When input field is focused |
| `Shift + Enter` | New line in message | When input field is focused |
| `Tab` | Navigate forward | Anywhere in dialog |
| `Shift + Tab` | Navigate backward | Anywhere in dialog |

### Navigation Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Tab` → `Enter` | Open chat | From floating button |
| `Tab` → `Enter` | Toggle session list | From session menu button |
| `Tab` → `Enter` | Select session | From session list |
| `Tab` → `Enter` | Create new conversation | From "New Conversation" button |
| `Tab` → `Enter` | Send suggested question | From suggested question buttons |
| `Tab` → `Enter` | Open article | From source links |

### Tips for Keyboard Users

1. **Quick Close**: Press `Esc` from anywhere in the dialog to close it instantly
2. **Fast Sending**: Keep focus in the input field and press `Enter` to send messages quickly
3. **Multi-line Messages**: Use `Shift + Enter` to add line breaks without sending
4. **Session Switching**: Use `Tab` to navigate to the menu button, then `Enter` to open sessions
5. **Focus Trap**: The dialog traps focus for accessibility - use `Esc` to exit, not by clicking outside

## Future Improvements

- Add voice input support
- Implement high contrast mode
- Add option to increase font sizes
- Support for reduced motion preferences
- Keyboard shortcuts customization
- Add customizable keyboard shortcuts
- Implement keyboard shortcut help overlay (press `?` to view)
