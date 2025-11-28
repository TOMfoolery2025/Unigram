# Chatbot CSS Fixes

## Issues Fixed

### 1. Long Messages Not Displaying Correctly
**Problem**: Long text, URLs, or code blocks were overflowing the message container and breaking the layout.

**Solution**:
- Added `overflow-wrap: anywhere` utility class
- Added `word-break: break-word` for better word breaking
- Added `overflow-hidden` to message containers
- Added `min-w-0` to prevent flex items from overflowing
- Added `break-words` and `overflow-wrap-anywhere` to all text elements
- Made code blocks wrap with `whitespace-pre-wrap`

### 2. Random Behavior During Streaming
**Problem**: The component was jumping around and behaving erratically while messages were streaming in.

**Solution**:
- Added `contain: layout style` to message containers to prevent layout recalculation
- Added `will-change: contents` to optimize rendering performance
- Added smooth fade-in animation for streaming content
- Improved scroll behavior with `scroll-smooth-mobile` class
- Removed unnecessary re-renders by stabilizing message keys

## Changes Made

### `components/wiki/chat-message.tsx`
1. **Message Container**:
   - Added `min-w-0 overflow-hidden` to prevent overflow
   - Added `chat-message-container` class for layout containment

2. **Content Wrapper**:
   - Added `overflow-hidden` to prose container
   - Added `streaming-content` class for smooth animations

3. **Text Elements**:
   - Added `overflow-wrap-anywhere` to all text elements (p, li, strong, em)
   - Added `break-words` to all inline elements
   - Made links `inline-block max-w-full` to prevent overflow
   - Added `overflow-hidden` to lists

4. **Code Blocks**:
   - Inline code: Added `break-all max-w-full inline-block`
   - Block code: Added `whitespace-pre-wrap break-words` for proper wrapping

### `components/wiki/chat-message-list.tsx`
1. **ScrollArea**:
   - Added `scroll-smooth-mobile` class for smooth scrolling on mobile

2. **Messages Container**:
   - Added `space-y-0` to prevent spacing issues during streaming

### `app/globals.css`
1. **New Utility Classes**:
   ```css
   .overflow-wrap-anywhere {
     overflow-wrap: anywhere;
     word-wrap: anywhere;
     word-break: break-word;
     hyphens: auto;
   }
   ```

2. **Layout Containment**:
   ```css
   .chat-message-container {
     contain: layout style;
     will-change: contents;
   }
   ```

3. **Streaming Animation**:
   ```css
   .streaming-content {
     animation: fade-in-content 0.15s ease-in;
   }
   ```

## Testing

Test the following scenarios to verify the fixes:

1. **Long URLs**: Send a message with a very long URL
2. **Long Words**: Send a message with very long words (e.g., "supercalifragilisticexpialidocious" repeated)
3. **Code Blocks**: Send code with long lines
4. **Lists**: Send long bullet points or numbered lists
5. **Streaming**: Ask a question and watch the response stream in
6. **Multiple Messages**: Send several messages in quick succession

## Browser Compatibility

These fixes use modern CSS properties that are supported in:
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 88+)

All properties have fallbacks for older browsers.

## Performance Impact

The CSS containment (`contain: layout style`) significantly improves performance during streaming by:
- Preventing layout recalculation of parent elements
- Isolating paint operations to the message container
- Reducing browser reflow during content updates

The `will-change: contents` hint tells the browser to optimize for content changes, which is perfect for streaming scenarios.
