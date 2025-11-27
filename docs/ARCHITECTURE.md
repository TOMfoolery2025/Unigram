# Architecture Documentation

## Overview

Unigram is a community platform for TUM Heilbronn Campus students built with Next.js 14 and Supabase. The application follows a modern, serverless architecture with a focus on real-time collaboration, security, and performance.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   React UI   │  │  Client-Side │  │   Real-time  │         │
│  │  Components  │  │    State     │  │  Subscriptions│         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 14 App Router                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Middleware  │  │    Server    │  │  API Routes  │         │
│  │   (Auth)     │  │  Components  │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                           │                                     │
│                    ┌──────▼──────┐                             │
│                    │   Supabase  │                             │
│                    │   Clients   │                             │
│                    └──────┬──────┘                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │    Supabase    │
                    │  (PostgreSQL)  │
                    │  + Auth        │
                    │  + Real-time   │
                    │  + Storage     │
                    └────────────────┘
                            │
                    ┌───────▼────────┐
                    │    Hygraph     │
                    │  (CMS for Wiki)│
                    └────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Calendar**: React Big Calendar
- **Markdown**: React Markdown with remark-gfm

### Backend
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **CMS**: Hygraph (for Wiki content)
- **API**: Next.js API Routes

### Development Tools
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: npm

## Core Components

### 1. Authentication System

#### Middleware (`middleware.ts`)
The authentication middleware runs on every request to:
- Validate user sessions
- Refresh expired tokens
- Protect routes based on authentication status
- Handle email verification requirements
- Redirect users appropriately

**Route Protection:**
- **Public Routes**: `/login`, `/register`, `/wiki`, `/auth/callback`
- **Auth Routes**: `/login`, `/register` (redirect to dashboard if authenticated)
- **Protected Routes**: All other routes require authentication
- **Guest Routes**: `/wiki` accessible without authentication

#### Supabase Clients

**Browser Client** (`lib/supabase/client.ts`):
- Used in Client Components
- Handles client-side authentication
- Manages browser-side state

**Server Client** (`lib/supabase/server.ts`):
- Used in Server Components and API Routes
- Handles server-side authentication
- Uses Next.js cookies() for session management

### 2. Database Layer

#### Schema Organization

**User Management:**
- `user_profiles` - Extended user information beyond Supabase auth

**Forum System:**
- `subforums` - Discussion spaces with member counts
- `subforum_memberships` - User memberships in subforums
- `posts` - Forum posts with vote counts
- `comments` - Nested comments on posts
- `votes` - Upvote/downvote tracking

**Channels System:**
- `channels` - Official communication channels
- `channel_memberships` - Channel member tracking
- `channel_messages` - Real-time messages

**Events System:**
- `events` - Campus events with registration
- `event_registrations` - Event signups with QR codes

**Wiki System:**
- Managed by Hygraph CMS
- Accessed via GraphQL API

**Calendar System:**
- `personal_calendar_events` - User personal calendar entries

**Admin System:**
- `moderation_logs` - Audit trail for moderation actions

#### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- User authentication (TUM email required)
- Data isolation (users see only their data)
- Permission-based access (admin, event creator, etc.)
- Anonymous post protection (author hidden except to admins)

### 3. Feature Modules

#### Forums
**Location**: `app/(authenticated)/forums/`, `components/forum/`, `lib/forum/`

**Features:**
- Create and manage subforums
- Post discussions with voting
- Nested comments
- Anonymous posting option
- Search and filtering

**Key Components:**
- `SubforumList` - Display all subforums
- `SubforumCard` - Individual subforum display
- `PostList` - Display posts in a subforum
- `PostCard` - Individual post with voting
- `CommentThread` - Nested comment display
- `VoteButtons` - Upvote/downvote functionality

#### Channels
**Location**: `app/(authenticated)/channels/`, `components/channel/`, `lib/channel/`

**Features:**
- Official channels for announcements
- Real-time messaging
- Member management
- Channel creation (admin only)

**Key Components:**
- `ChannelList` - Display all channels
- `ChannelCard` - Individual channel display
- `ChannelView` - Channel detail with messages
- `MessageList` - Real-time message display
- `MessageInput` - Send messages

#### Events
**Location**: `app/(authenticated)/events/`, `components/event/`, `lib/event/`

**Features:**
- Create and manage events
- Event registration with QR codes
- Event filtering and search
- Calendar integration

**Key Components:**
- `EventList` - Display all events
- `EventCard` - Individual event display
- `CreateEventDialog` - Event creation form
- `QRCodeDisplay` - Registration QR code
- `EventFilters` - Filter events by type/date

#### Calendar
**Location**: `app/(authenticated)/calendar/`, `components/calendar/`, `lib/calendar/`

**Features:**
- View all events in calendar format
- Personal calendar events
- Export to ICS format
- Filter by event type

**Key Components:**
- `CalendarView` - React Big Calendar integration
- `EventDetailsModal` - Event detail popup
- `CalendarFilters` - Filter calendar events
- `CalendarExportButton` - Export to ICS

#### Wiki
**Location**: `app/(guest)/wiki/`, `components/wiki/`, `lib/hygraph/`

**Features:**
- Public knowledge base
- Category-based organization
- Full-text search
- Rich text content
- Version history (managed in Hygraph)

**Key Components:**
- `WikiHome` - Wiki landing page
- `WikiArticle` - Article display
- `WikiArticleList` - List articles by category
- `WikiSearch` - Search functionality
- `RichTextRenderer` - Render Hygraph rich text

## Data Flow

### Authentication Flow

```
1. User visits protected route
   ↓
2. Middleware checks session
   ↓
3. If no session → redirect to /login
   ↓
4. User submits login form
   ↓
5. Supabase Auth validates credentials
   ↓
6. Session created, cookies set
   ↓
7. Redirect to original destination
   ↓
8. Middleware validates session
   ↓
9. User accesses protected route
```

### Real-time Data Flow (Channels)

```
1. User opens channel
   ↓
2. Component subscribes to channel_messages
   ↓
3. Supabase Realtime connection established
   ↓
4. User sends message
   ↓
5. Message inserted into database
   ↓
6. Realtime broadcasts INSERT event
   ↓
7. All subscribed clients receive update
   ↓
8. UI updates with new message
```

### Query Flow

```
1. Component needs data
   ↓
2. Calls function in lib/[feature]/
   ↓
3. Function creates Supabase client
   ↓
4. Executes query with RLS applied
   ↓
5. Database returns filtered results
   ↓
6. Function returns typed data
   ↓
7. Component renders data
```

## Security Architecture

### Authentication Security
- **Session Management**: httpOnly cookies for tokens
- **Token Refresh**: Automatic refresh in middleware
- **Email Verification**: Required before full access
- **TUM Email**: Restricted to @tum.de emails

### Database Security
- **Row Level Security**: All tables have RLS policies
- **Parameterized Queries**: All queries use Supabase client (prevents SQL injection)
- **Anonymous Posts**: Author ID hidden from non-admins
- **Permission Checks**: Admin and event creator permissions enforced

### API Security
- **Authentication**: All API routes check session
- **Input Validation**: Zod schemas validate all inputs
- **Error Handling**: Sanitized error messages (no internal details exposed)
- **Rate Limiting**: (To be implemented in production)

## Performance Considerations

### Current Optimizations
- **Server Components**: Default to Server Components for better performance
- **Selective Hydration**: Only interactive components use Client Components
- **Image Optimization**: Next.js Image component for optimized images
- **Code Splitting**: Automatic code splitting by route

### Known Performance Issues (To Be Fixed)
- **N+1 Queries**: Multiple queries in loops (forums, channels, events)
- **No Caching**: No query result caching
- **Client Recreation**: New Supabase clients created frequently
- **SELECT ***: Queries fetch all columns instead of specific ones

### Planned Optimizations
- **Query Optimization**: Use joins instead of N+1 patterns
- **Connection Pooling**: Reuse Supabase client instances
- **Caching Layer**: Implement query result caching
- **Explicit Selects**: Specify only needed columns
- **Bundle Optimization**: Code splitting and lazy loading

## Deployment Architecture

### Development
- **Local Development**: `npm run dev` on localhost:3000
- **Database**: Supabase cloud instance
- **Environment**: `.env.local` for configuration

### Production (Planned)
- **Hosting**: Vercel (recommended) or similar Next.js host
- **Database**: Supabase production instance
- **CDN**: Automatic via hosting platform
- **Monitoring**: Error tracking and performance monitoring
- **Backups**: Automated database backups via Supabase

## Scalability Considerations

### Current Limitations
- Single database instance
- No caching layer
- No CDN for static assets (except via host)
- No rate limiting

### Future Scalability
- **Database**: Supabase handles connection pooling and scaling
- **Caching**: Add Redis or similar for query caching
- **CDN**: Leverage hosting platform CDN
- **Rate Limiting**: Implement API rate limiting
- **Monitoring**: Add performance monitoring and alerting

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env.local`
4. Run development server: `npm run dev`
5. Access at `http://localhost:3000`

### Adding Features
1. Review requirements in `.kiro/specs/`
2. Create route in `app/` directory
3. Build components in `components/[feature]/`
4. Add data functions in `lib/[feature]/`
5. Define types in `types/`
6. Test locally
7. Commit and deploy

### Testing
- **Unit Tests**: Vitest for utility functions
- **Component Tests**: Testing Library for components
- **Integration Tests**: Test complete user flows
- **Manual Testing**: Test in browser during development

## Monitoring and Observability

### Current Logging
- **Console Logs**: Development logging to console
- **Error Logs**: Errors logged to console

### Planned Monitoring
- **Error Tracking**: Integrate error tracking service (e.g., Sentry)
- **Performance Monitoring**: Track page load times and query performance
- **User Analytics**: Track feature usage and user behavior
- **Health Checks**: API endpoint for system health status

## Related Documentation

- [Authentication Guide](./AUTHENTICATION.md) - Detailed authentication flow
- [Database Guide](./DATABASE.md) - Database schema and queries
- [Performance Guide](./PERFORMANCE.md) - Performance optimization
- [API Documentation](./API.md) - API routes and usage
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Contributing Guide](./CONTRIBUTING.md) - Development guidelines
