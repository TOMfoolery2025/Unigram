# Developer Guide - Database Operations

Quick reference for common database operations in the TUM Community Platform.

## Table of Contents
- [Authentication](#authentication)
- [Forum Operations](#forum-operations)
- [Channel Operations](#channel-operations)
- [Event Operations](#event-operations)
- [Wiki Operations](#wiki-operations)
- [Calendar Operations](#calendar-operations)
- [Search Operations](#search-operations)
- [Admin Operations](#admin-operations)

## Authentication

### Create User Profile
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .insert({
    id: user.id, // from auth.users
    email: user.email,
    display_name: 'John Doe',
  });
```

### Get User Profile
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### Check Admin Status
```typescript
const { data, error } = await supabase
  .rpc('is_admin', { user_id: userId });
```

### Check Event Creation Permission
```typescript
const { data, error } = await supabase
  .rpc('can_create_events', { user_id: userId });
```

## Forum Operations

### Create Subforum
```typescript
const { data, error } = await supabase
  .from('subforums')
  .insert({
    name: 'Computer Science',
    description: 'Discuss CS courses and projects',
    creator_id: userId,
  })
  .select()
  .single();

// Creator is automatically added to subforum_memberships via trigger
```

### Join Subforum
```typescript
const { data, error } = await supabase
  .from('subforum_memberships')
  .insert({
    subforum_id: subforumId,
    user_id: userId,
  });

// member_count is automatically incremented via trigger
```

### Leave Subforum
```typescript
const { data, error } = await supabase
  .from('subforum_memberships')
  .delete()
  .eq('subforum_id', subforumId)
  .eq('user_id', userId);

// member_count is automatically decremented via trigger
```

### Create Post
```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    subforum_id: subforumId,
    author_id: userId,
    title: 'My Post Title',
    content: 'Post content here...',
    is_anonymous: false, // or true for anonymous
  })
  .select()
  .single();
```

### Get Posts with Author Info (Respecting Anonymity)
```typescript
const { data, error } = await supabase
  .rpc('get_post_with_author', {
    post_id: postId,
    requesting_user_id: currentUserId,
  });

// Returns author info only if:
// - Post is not anonymous, OR
// - Requesting user is admin
```

### Vote on Post
```typescript
// First vote
const { data, error } = await supabase
  .from('votes')
  .insert({
    post_id: postId,
    user_id: userId,
    vote_type: 'upvote', // or 'downvote'
  });

// Change vote
const { data, error } = await supabase
  .from('votes')
  .update({ vote_type: 'downvote' })
  .eq('post_id', postId)
  .eq('user_id', userId);

// Remove vote
const { data, error } = await supabase
  .from('votes')
  .delete()
  .eq('post_id', postId)
  .eq('user_id', userId);

// vote_count is automatically updated via trigger
```

### Create Comment
```typescript
const { data, error } = await supabase
  .from('comments')
  .insert({
    post_id: postId,
    author_id: userId,
    content: 'My comment...',
    is_anonymous: false,
    parent_comment_id: null, // or parentId for nested comment
  })
  .select()
  .single();
```

### Get Comments for Post
```typescript
const { data, error } = await supabase
  .from('comments')
  .select(`
    *,
    author:user_profiles(display_name, avatar_url)
  `)
  .eq('post_id', postId)
  .order('created_at', { ascending: true });

// Note: For anonymous comments, use get_comment_with_author RPC
```

## Channel Operations

### Create Channel (Admin Only)
```typescript
const { data, error } = await supabase
  .from('channels')
  .insert({
    name: 'Basketball Team',
    description: 'Official basketball team channel',
    created_by: adminUserId,
  })
  .select()
  .single();
```

### Join Channel
```typescript
const { data, error } = await supabase
  .from('channel_memberships')
  .insert({
    channel_id: channelId,
    user_id: userId,
  });

// member_count is automatically incremented via trigger
```

### Send Message
```typescript
const { data, error } = await supabase
  .from('channel_messages')
  .insert({
    channel_id: channelId,
    author_id: userId,
    content: 'Hello everyone!',
  })
  .select()
  .single();
```

### Subscribe to Real-Time Messages
```typescript
const channel = supabase
  .channel(`channel:${channelId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'channel_messages',
      filter: `channel_id=eq.${channelId}`,
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();

// Don't forget to unsubscribe when done
// channel.unsubscribe();
```

### Get Channel Messages
```typescript
const { data, error } = await supabase
  .from('channel_messages')
  .select(`
    *,
    author:user_profiles(display_name, avatar_url)
  `)
  .eq('channel_id', channelId)
  .order('created_at', { ascending: true })
  .limit(50);
```

## Event Operations

### Create Event
```typescript
const { data, error } = await supabase
  .from('events')
  .insert({
    title: 'Campus Hackathon',
    description: 'Annual coding competition',
    event_type: 'tum_native', // or 'external'
    date: '2024-03-15',
    time: '09:00:00',
    location: 'Main Building',
    external_link: null, // or URL for external events
    creator_id: userId,
    max_attendees: 100,
    is_published: true,
  })
  .select()
  .single();
```

### Register for Event
```typescript
const { data, error } = await supabase
  .from('event_registrations')
  .insert({
    event_id: eventId,
    user_id: userId,
    qr_code: qrCodeData, // Generate QR code for TUM native events
  })
  .select()
  .single();
```

### Unregister from Event
```typescript
const { data, error } = await supabase
  .from('event_registrations')
  .delete()
  .eq('event_id', eventId)
  .eq('user_id', userId);
```

### Get User's Registered Events
```typescript
const { data, error } = await supabase
  .from('event_registrations')
  .select(`
    *,
    event:events(*)
  `)
  .eq('user_id', userId);
```

### Filter Events by Date Range
```typescript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .gte('date', startDate)
  .lte('date', endDate)
  .eq('is_published', true)
  .order('date', { ascending: true });
```

### Filter Events by Type
```typescript
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('event_type', 'tum_native')
  .eq('is_published', true)
  .order('date', { ascending: true });
```

## Wiki Operations

### Create Wiki Article (Admin Only)
```typescript
const { data, error } = await supabase
  .from('wiki_articles')
  .insert({
    title: 'How to Apply to TUM',
    content: 'Step-by-step guide...',
    category: 'Application Process',
    created_by: adminUserId,
    is_published: true,
  })
  .select()
  .single();

// Version history is automatically created via trigger
```

### Update Wiki Article (Admin Only)
```typescript
const { data, error } = await supabase
  .from('wiki_articles')
  .update({
    content: 'Updated content...',
    created_by: adminUserId, // Required for version tracking
  })
  .eq('id', articleId);

// New version is automatically created via trigger
```

### Get Wiki Articles by Category
```typescript
const { data, error } = await supabase
  .from('wiki_articles')
  .select('*')
  .eq('category', 'Application Process')
  .eq('is_published', true)
  .order('updated_at', { ascending: false });
```

### Get Wiki Article Version History
```typescript
const { data, error } = await supabase
  .from('wiki_versions')
  .select(`
    *,
    author:user_profiles(display_name)
  `)
  .eq('article_id', articleId)
  .order('version_number', { ascending: false });
```

## Calendar Operations

### Create Personal Calendar Event
```typescript
const { data, error } = await supabase
  .from('personal_calendar_events')
  .insert({
    user_id: userId,
    title: 'Study Session',
    description: 'Prepare for exam',
    date: '2024-03-20',
    time: '14:00:00',
    color: '#8b5cf6', // Violet
  })
  .select()
  .single();
```

### Get Combined Calendar (Subscribed + Personal Events)
```typescript
// Get subscribed events
const { data: subscribedEvents } = await supabase
  .from('event_registrations')
  .select(`
    *,
    event:events(*)
  `)
  .eq('user_id', userId);

// Get personal events
const { data: personalEvents } = await supabase
  .from('personal_calendar_events')
  .select('*')
  .eq('user_id', userId);

// Combine and format for calendar display
const allEvents = [
  ...subscribedEvents.map(reg => ({
    ...reg.event,
    type: 'subscribed',
    qr_code: reg.qr_code,
  })),
  ...personalEvents.map(event => ({
    ...event,
    type: 'personal',
  })),
];
```

### Update Personal Calendar Event
```typescript
const { data, error } = await supabase
  .from('personal_calendar_events')
  .update({
    title: 'Updated Title',
    date: '2024-03-21',
  })
  .eq('id', eventId)
  .eq('user_id', userId); // Ensure user owns the event
```

### Delete Personal Calendar Event
```typescript
const { data, error } = await supabase
  .from('personal_calendar_events')
  .delete()
  .eq('id', eventId)
  .eq('user_id', userId);
```

## Search Operations

### Search Subforums
```typescript
const { data, error } = await supabase
  .rpc('search_subforums', {
    search_query: 'computer science',
  });

// Returns results with similarity score
```

### Search Channels
```typescript
const { data, error } = await supabase
  .rpc('search_channels', {
    search_query: 'basketball',
  });
```

### Search Wiki Articles
```typescript
const { data, error } = await supabase
  .rpc('search_wiki_articles', {
    search_query: 'visa application',
  });
```

## Admin Operations

### Grant Event Creation Permission
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .update({ can_create_events: true })
  .eq('id', targetUserId);

// Log the action
await supabase
  .from('moderation_logs')
  .insert({
    admin_id: adminUserId,
    action_type: 'grant_permission',
    target_id: targetUserId,
    target_type: 'user_profile',
    reason: 'Approved event creator application',
  });
```

### Delete Post (Admin)
```typescript
const { data, error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);

// Log the action
await supabase
  .from('moderation_logs')
  .insert({
    admin_id: adminUserId,
    action_type: 'delete_post',
    target_id: postId,
    target_type: 'post',
    reason: 'Violated community guidelines',
  });
```

### View Moderation Logs
```typescript
const { data, error } = await supabase
  .from('moderation_logs')
  .select(`
    *,
    admin:user_profiles(display_name)
  `)
  .order('created_at', { ascending: false })
  .limit(50);
```

## Common Patterns

### Pagination
```typescript
const pageSize = 20;
const page = 1;

const { data, error, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1)
  .order('created_at', { ascending: false });
```

### Checking Membership
```typescript
const { data, error } = await supabase
  .from('subforum_memberships')
  .select('*')
  .eq('subforum_id', subforumId)
  .eq('user_id', userId)
  .single();

const isMember = !!data && !error;
```

### Getting Related Data
```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    subforum:subforums(name),
    author:user_profiles(display_name, avatar_url),
    comments(count)
  `)
  .eq('subforum_id', subforumId);
```

## Error Handling

Always check for errors and handle them appropriately:

```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({ /* ... */ });

if (error) {
  console.error('Database error:', error);
  
  // Handle specific error codes
  if (error.code === '23505') {
    // Unique constraint violation
  } else if (error.code === '23503') {
    // Foreign key violation
  } else if (error.code === '42501') {
    // RLS policy violation
  }
  
  return;
}

// Use data
console.log('Created:', data);
```

## Best Practices

1. **Always use RLS**: Never disable RLS in production
2. **Use transactions**: For operations that modify multiple tables
3. **Validate input**: Check data before inserting
4. **Handle errors**: Always check for and handle errors
5. **Use indexes**: Query indexed columns for better performance
6. **Limit results**: Use pagination for large datasets
7. **Subscribe wisely**: Unsubscribe from real-time channels when done
8. **Use helper functions**: Leverage RPC functions for complex logic
9. **Respect anonymity**: Use helper functions for anonymous posts
10. **Log admin actions**: Always log moderation actions

## Performance Tips

1. **Select only needed columns**: Don't use `select('*')` unnecessarily
2. **Use composite indexes**: Query on indexed column combinations
3. **Batch operations**: Use `insert([...])` for multiple records
4. **Cache frequently accessed data**: Use React Query or similar
5. **Use real-time subscriptions**: For live updates instead of polling
6. **Optimize joins**: Limit depth of nested selects
7. **Use count efficiently**: Only when needed, it's expensive
8. **Filter early**: Apply filters before ordering/limiting
