# Project Structure

This document outlines the structure of the Unigram project.

## Directory Overview

```
unigram/
├── .kiro/                          # Kiro specs and configuration
│   └── specs/
│       └── tum-community-platform/
│           ├── design.md           # Design document
│           ├── requirements.md     # Requirements document
│           └── tasks.md           # Implementation tasks
│
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (guest)/                  # Guest-accessible routes
│   │   └── wiki/
│   ├── (authenticated)/          # Protected routes
│   │   ├── forums/
│   │   ├── channels/
│   │   ├── events/
│   │   ├── calendar/
│   │   └── profile/
│   ├── (admin)/                  # Admin-only routes
│   │   └── dashboard/
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                    # React components
│   ├── ui/                       # shadcn/ui components
│   │   └── button.tsx
│   ├── forums/                   # Forum-specific components
│   ├── channels/                 # Channel-specific components
│   ├── events/                   # Event-specific components
│   ├── calendar/                 # Calendar-specific components
│   └── wiki/                     # Wiki-specific components
│
├── lib/                          # Utility functions and configurations
│   ├── supabase/                # Supabase client configurations
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Middleware helper
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   └── validations/             # Validation schemas (Zod)
│
├── types/                        # TypeScript type definitions
│   ├── database.types.ts        # Supabase generated types
│   └── index.ts                 # Common types
│
├── scripts/                      # Helper scripts and documentation
│   └── add-shadcn-component.md
│
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment variables (not in git)
├── .gitignore                    # Git ignore rules
├── components.json               # shadcn/ui configuration
├── middleware.ts                 # Next.js middleware
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Project documentation
├── SUPABASE_SETUP.md           # Supabase setup guide
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Key Files and Their Purpose

### Configuration Files

- **next.config.js**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS theme and plugin configuration
- **tsconfig.json**: TypeScript compiler options
- **components.json**: shadcn/ui component configuration
- **middleware.ts**: Authentication and session management

### Application Structure

- **app/**: Next.js 14 App Router directory
  - Route groups (folders with parentheses) organize routes without affecting URLs
  - Each route can have `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Component Organization

- **components/ui/**: Reusable UI components from shadcn/ui
- **components/[feature]/**: Feature-specific components organized by module

### Library Code

- **lib/supabase/**: Supabase client configurations for different contexts
- **lib/hooks/**: Custom React hooks for shared logic
- **lib/utils/**: Utility functions (e.g., `cn()` for className merging)
- **lib/validations/**: Zod schemas for form and data validation

### Type Definitions

- **types/database.types.ts**: Auto-generated from Supabase schema
- **types/index.ts**: Application-wide TypeScript types

## Naming Conventions

- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Functions**: camelCase (e.g., `getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`)

## Route Groups

Route groups in Next.js allow organizing routes without affecting the URL structure:

- **(auth)**: Authentication-related pages
- **(guest)**: Publicly accessible pages
- **(authenticated)**: Pages requiring authentication
- **(admin)**: Pages requiring admin privileges

## Next Steps

As you implement features, follow this structure:

1. Create route pages in the appropriate `app/` subdirectory
2. Build feature-specific components in `components/[feature]/`
3. Add shared utilities in `lib/`
4. Define types in `types/`
5. Use shadcn/ui components from `components/ui/`
