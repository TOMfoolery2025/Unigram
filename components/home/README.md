# Home Components

This directory contains components used on the dashboard/home page.

## Components

### UnifiedSearch

A comprehensive search component that allows users to search across all platform content types from a single interface.

**Features:**
- ✅ Single search input for all content types
- ✅ Tabbed interface to filter results by type (Forums, Channels, Friends, Events)
- ✅ Real-time search with 300ms debounce
- ✅ Result counts displayed on each tab
- ✅ Click any result to navigate to its detail page
- ✅ Loading states with skeletons
- ✅ Empty states for no results
- ✅ Clear search button
- ✅ Responsive design

**Props:**
```typescript
interface UnifiedSearchProps {
  userId?: string;      // Current user ID (for friend search context)
  className?: string;   // Additional CSS classes
}
```

**Usage:**
```tsx
import { UnifiedSearch } from "@/components/home";

function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div>
      <UnifiedSearch userId={user?.id} />
      {/* Rest of dashboard content */}
    </div>
  );
}
```

**Search Capabilities:**

1. **Forums**: Searches subforum names and descriptions
2. **Channels**: Searches channel names and descriptions
3. **Friends**: Searches user display names, bios, and interests
4. **Events**: Searches event titles, descriptions, and locations

**Integration:**

The UnifiedSearch component is integrated into the dashboard page and provides a central place for users to discover content across the platform. It replaces the need for separate search interfaces in different sections.

**Technical Details:**

- Uses debounced search to avoid excessive API calls
- Performs parallel searches across all content types
- Displays result counts on tabs for quick overview
- Handles loading and error states gracefully
- Fully keyboard accessible

## Design Patterns

All home components follow these patterns:

1. **Consistent Styling**: Uses the neon gradient theme with card-based layouts
2. **Responsive Design**: Mobile-first approach with breakpoints
3. **Loading States**: Skeleton loaders that match content layout
4. **Empty States**: Helpful messages when no data is available
5. **Accessibility**: Proper ARIA labels and keyboard navigation

## Future Enhancements

Potential improvements for the UnifiedSearch component:

- Search history/recent searches
- Search suggestions/autocomplete
- Advanced filters (date ranges, categories, etc.)
- Keyboard shortcuts for quick navigation
- Save favorite searches
