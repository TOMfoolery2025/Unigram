# Profile Components

This directory contains all profile-related components for the TUM Community Platform social features.

## Components

### FriendsList

A comprehensive friends list component that displays a user's friends in a responsive grid layout.

**Features:**
- ✅ Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)
- ✅ Search functionality to filter friends by name, bio, or interests
- ✅ Empty state when user has no friends
- ✅ Empty state when search returns no results
- ✅ Click to navigate to friend profiles
- ✅ Loading skeleton states
- ✅ Friend count display
- ✅ Consistent styling with existing components

**Props:**
```typescript
interface FriendsListProps {
  friends: FriendWithProfile[];      // Array of friends to display
  isLoading?: boolean;                // Show loading skeleton
  onFriendClick?: (userId: string) => void;  // Handle friend card clicks
  className?: string;                 // Additional CSS classes
}
```

**Usage:**
```tsx
import { FriendsList } from "@/components/profile";
import { getUserFriends } from "@/lib/profile/friendships";

function MyComponent({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadFriends() {
      const { data } = await getUserFriends(userId);
      if (data) setFriends(data);
      setIsLoading(false);
    }
    loadFriends();
  }, [userId]);

  return (
    <FriendsList
      friends={friends}
      isLoading={isLoading}
      onFriendClick={(friendId) => router.push(`/profile/${friendId}`)}
    />
  );
}
```

**Requirements Validated:**
- ✅ Requirement 3.1: Displays all user's friends
- ✅ Requirement 3.2: Navigates to friend profile on click
- ✅ Requirement 3.3: Shows friend's name, avatar, and additional info

### Other Components

- **UserAvatar**: Displays user avatars with DiceBear generation and fallback to initials
- **AvatarPicker**: Interactive avatar selector with 6 DiceBear styles and multiple variations
- **ProfileCard**: Compact profile display for lists and search results
- **ProfileEditDialog**: Modal for editing user profile information (includes avatar picker)
- **FriendRequestButton**: Context-aware button for friendship actions
- **FriendRequestsList**: Displays incoming friend requests with accept/decline actions

### AvatarPicker

An interactive component for selecting avatars from the DiceBear library.

**Features:**
- ✅ 6 different DiceBear styles (Avataaars, Bottts, Fun Emoji, Lorelei, Notionists, Pixel Art)
- ✅ 6 avatar variations per style
- ✅ Live preview of selected avatar
- ✅ Click to select and auto-update
- ✅ Responsive grid layout
- ✅ Visual selection indicator

**Props:**
```typescript
interface AvatarPickerProps {
  userId: string;                    // User ID used as seed for generation
  currentAvatarUrl?: string | null;  // Current avatar URL
  onSelect: (avatarUrl: string) => void;  // Callback when avatar selected
  className?: string;                // Additional CSS classes
}
```

**Usage:**
```tsx
import { AvatarPicker } from "@/components/profile";

<AvatarPicker
  userId={user.id}
  currentAvatarUrl={user.avatar_url}
  onSelect={(url) => {
    // Update user's avatar
    updateProfile({ avatar_url: url });
  }}
/>
```

**Integration:**
The AvatarPicker is integrated into the ProfileEditDialog under the "Avatar" tab, allowing users to change their avatar when editing their profile.

## Design Patterns

All profile components follow these patterns:

1. **Consistent Styling**: Uses the neon gradient theme with card-based layouts
2. **Responsive Design**: Mobile-first approach with breakpoints for tablet and desktop
3. **Loading States**: Skeleton loaders that match content layout
4. **Empty States**: Helpful messages and icons when no data is available
5. **Accessibility**: Proper ARIA labels and keyboard navigation support

## Integration

These components are designed to work together to create a complete social profile experience:

```
Profile Page
├── UserAvatar (profile header)
├── ProfileEditDialog (edit button)
├── FriendRequestButton (for other users)
├── FriendsList (friends section)
└── FriendRequestsList (pending requests)
```

## Testing

The components are built with testability in mind:
- Pure functional components with clear props
- Separation of data fetching and presentation
- Minimal side effects
- Type-safe with TypeScript

See `friends-list.example.tsx` for a complete usage example.
