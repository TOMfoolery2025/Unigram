# Contributing Guide

## Overview

Thank you for contributing to Unigram! This guide will help you understand our development workflow, coding standards, and best practices.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Supabase account
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone the repository**:
```bash
git clone https://github.com/your-org/unigram.git
cd unigram
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. **Run development server**:
```bash
npm run dev
```

5. **Verify setup**:
   - Open http://localhost:3000
   - Check for any errors in console

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Feature branches (e.g., `feature/add-notifications`)
- **fix/**: Bug fix branches (e.g., `fix/login-redirect`)
- **docs/**: Documentation updates (e.g., `docs/update-readme`)

### Creating a Feature

1. **Create feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes**:
   - Write code following our standards
   - Add tests if applicable
   - Update documentation

3. **Commit changes**:
```bash
git add .
git commit -m "feat: add your feature description"
```

4. **Push to remote**:
```bash
git push origin feature/your-feature-name
```

5. **Create pull request**:
   - Go to GitHub
   - Create PR from your branch to `develop`
   - Fill out PR template
   - Request review

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format**:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat(auth): add password reset functionality
fix(forums): resolve vote count update issue
docs(readme): update installation instructions
refactor(database): optimize query performance
```

## Code Standards

### TypeScript

#### Type Safety

**Always use explicit types**:
```typescript
// Good
function getUserProfile(userId: string): Promise<UserProfile | null> {
  // ...
}

// Bad
function getUserProfile(userId) {
  // ...
}
```

**Avoid `any`**:
```typescript
// Good
interface ApiResponse {
  data: Post[]
  error: Error | null
}

// Bad
function handleResponse(response: any) {
  // ...
}
```

**Use type guards**:
```typescript
function isPost(item: Post | Comment): item is Post {
  return 'vote_count' in item
}
```

#### Naming Conventions

- **Variables/Functions**: camelCase
  ```typescript
  const userName = 'John'
  function getUserProfile() {}
  ```

- **Types/Interfaces**: PascalCase
  ```typescript
  interface UserProfile {}
  type PostStatus = 'draft' | 'published'
  ```

- **Constants**: UPPER_SNAKE_CASE
  ```typescript
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  const API_BASE_URL = 'https://api.example.com'
  ```

- **Files**: kebab-case
  ```
  user-profile.tsx
  create-post-dialog.tsx
  ```

- **Components**: PascalCase
  ```typescript
  export function UserProfile() {}
  export function CreatePostDialog() {}
  ```

### React Components

#### Component Structure

```typescript
'use client' // Only if needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'

// Types
interface UserProfileProps {
  userId: string
  onUpdate?: (profile: UserProfile) => void
}

// Component
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Hooks
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  // Effects
  useEffect(() => {
    fetchProfile()
  }, [userId])
  
  // Handlers
  const handleUpdate = async () => {
    // ...
  }
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

#### Server vs Client Components

**Use Server Components by default**:
```typescript
// app/forums/page.tsx - Server Component
export default async function ForumsPage() {
  const supabase = await createClient()
  const { data: subforums } = await supabase.from('subforums').select('*')
  
  return <SubforumList subforums={subforums} />
}
```

**Use Client Components only when needed**:
```typescript
// components/forum/vote-buttons.tsx
'use client'

export function VoteButtons({ postId }: { postId: string }) {
  // Needs client-side interactivity
  const handleVote = async () => {
    // ...
  }
  
  return <button onClick={handleVote}>Vote</button>
}
```

#### Component Best Practices

1. **Keep components small and focused**
2. **Extract reusable logic into hooks**
3. **Use composition over props drilling**
4. **Memoize expensive computations**
5. **Add loading and error states**

### Database Queries

#### Query Best Practices

**Select only needed columns**:
```typescript
// Good
const { data } = await supabase
  .from('posts')
  .select('id, title, vote_count, created_at')

// Bad
const { data } = await supabase
  .from('posts')
  .select('*')
```

**Use joins instead of N+1**:
```typescript
// Good
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    user_profiles!posts_author_id_fkey(display_name)
  `)

// Bad
const { data: posts } = await supabase.from('posts').select('*')
for (const post of posts) {
  const { data: author } = await supabase
    .from('user_profiles')
    .select('display_name')
    .eq('id', post.author_id)
}
```

**Use pagination**:
```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .range(0, 19) // First 20 items
  .order('created_at', { ascending: false })
```

**Handle errors properly**:
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')

if (error) {
  console.error('Error fetching posts:', error)
  return null
}

return data
```

### Error Handling

#### Client-Side Errors

```typescript
try {
  const result = await someAsyncOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  // Show user-friendly message
  toast.error('Something went wrong. Please try again.')
  return null
}
```

#### Server-Side Errors

```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('posts').select('*')
    
    if (error) throw error
    
    return Response.json(data)
  } catch (error) {
    console.error('API error:', error)
    return Response.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
```

### Styling

#### Tailwind CSS

**Use Tailwind utility classes**:
```typescript
<div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg">
  <h2 className="text-xl font-semibold text-white">Title</h2>
</div>
```

**Use cn() for conditional classes**:
```typescript
import { cn } from '@/lib/utils'

<button
  className={cn(
    "px-4 py-2 rounded-lg",
    isActive && "bg-violet-600",
    isDisabled && "opacity-50 cursor-not-allowed"
  )}
>
  Click me
</button>
```

**Extract repeated patterns into components**:
```typescript
// components/ui/card.tsx
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("p-6 bg-gray-900 rounded-lg", className)}>
      {children}
    </div>
  )
}
```

## Testing

### Unit Tests

**Test utility functions**:
```typescript
// lib/utils/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from './format'

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('Jan 15, 2024')
  })
  
  it('should handle invalid dates', () => {
    expect(formatDate(null)).toBe('Invalid date')
  })
})
```

**Run tests**:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Integration Tests

**Test complete flows**:
```typescript
// lib/forum/posts.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createPost, getPost, updatePost } from './posts'

describe('Post operations', () => {
  beforeEach(async () => {
    // Set up test data
  })
  
  it('should create and retrieve post', async () => {
    const post = await createPost({
      title: 'Test Post',
      content: 'Test content',
      subforum_id: 'test-id'
    })
    
    expect(post).toBeDefined()
    expect(post.title).toBe('Test Post')
    
    const retrieved = await getPost(post.id)
    expect(retrieved).toEqual(post)
  })
})
```

## Documentation

### Code Comments

**Add JSDoc for public functions**:
```typescript
/**
 * Fetches a user profile by ID
 * @param userId - The user's UUID
 * @returns The user profile or null if not found
 * @throws {Error} If the database query fails
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  // ...
}
```

**Comment complex logic**:
```typescript
// Calculate vote score using Reddit's hot algorithm
// Score = log10(max(|ups - downs|, 1)) + (age_in_hours / 12.5)
const score = Math.log10(Math.max(Math.abs(upvotes - downvotes), 1)) + 
              (ageInHours / 12.5)
```

### README Updates

When adding features, update relevant documentation:
- Main README.md
- Feature-specific docs in `docs/`
- API documentation
- Architecture diagrams

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Documentation updated
- [ ] Commit messages follow convention

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks**: CI runs tests and linting
2. **Code review**: At least one approval required
3. **Testing**: Reviewer tests changes locally
4. **Merge**: Squash and merge to develop

## Project Structure

### Directory Organization

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (authenticated)/   # Protected routes
│   ├── (guest)/           # Public routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── [feature]/        # Feature components
├── lib/                  # Utility functions
│   ├── supabase/        # Supabase clients
│   ├── [feature]/       # Feature logic
│   └── utils/           # Shared utilities
├── types/               # TypeScript types
├── docs/                # Documentation
└── supabase/           # Database migrations
```

### File Naming

- **Pages**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **Components**: `component-name.tsx`
- **Tests**: `component-name.test.tsx`
- **Types**: `types.ts` or `index.ts`
- **Utilities**: `utility-name.ts`

## Common Tasks

### Adding a New Feature

1. Create feature branch
2. Add route in `app/`
3. Create components in `components/[feature]/`
4. Add data functions in `lib/[feature]/`
5. Define types in `types/`
6. Add tests
7. Update documentation
8. Create PR

### Adding a Database Table

1. Create migration file in `supabase/migrations/`
2. Write SQL for table creation
3. Add RLS policies
4. Update `types/database.types.ts`
5. Create data access functions in `lib/`
6. Test locally
7. Document in `docs/DATABASE.md`

### Adding a UI Component

1. Use shadcn/ui if available:
```bash
npx shadcn-ui@latest add component-name
```

2. Or create custom component:
```typescript
// components/ui/custom-component.tsx
export function CustomComponent() {
  return <div>...</div>
}
```

3. Export from index:
```typescript
// components/ui/index.ts
export { CustomComponent } from './custom-component'
```

## Resources

### Documentation
- [Architecture Guide](./ARCHITECTURE.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Database Guide](./DATABASE.md)
- [Performance Guide](./PERFORMANCE.md)
- [API Documentation](./API.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Create an issue with reproduction steps
- **Features**: Propose in discussions first
- **Security**: Email security@example.com (do not open public issue)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow
- Follow project guidelines

Thank you for contributing to Unigram!
