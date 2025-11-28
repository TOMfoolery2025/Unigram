# Getting Started with Unigram

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase (Required for Task 2+)

Before you can run the application with full functionality, you need to set up Supabase:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign in or create an account
   - Click "New Project"
   - Fill in project details and create

2. **Get Your Credentials**
   - In your Supabase dashboard, go to Settings → API
   - Copy your Project URL
   - Copy your anon/public key

3. **Configure Environment Variables**
   - Create a `.env.local` file in the project root
   - Add your Supabase credentials:
   
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Detailed Setup**
   - See `SUPABASE_SETUP.md` for complete instructions
   - Configure authentication settings
   - Set up email verification

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## What's Been Built (Task 1)

✅ Next.js 14 with TypeScript and App Router
✅ Tailwind CSS with dark theme and violet accents
✅ shadcn/ui component system
✅ Supabase client configuration
✅ Authentication validation utilities
✅ Project structure and documentation
✅ Project name: Unigram

## Current Status

The project foundation is complete. You can:
- View the home page with dark theme
- See example button components
- Explore the project structure

## What's Next (Task 2)

The next task will implement:
- Database schema (users, forums, channels, events, wiki, calendar)
- Row Level Security (RLS) policies
- Database indexes and triggers
- User permissions system

## Project Structure

```
├── app/                    # Next.js pages (App Router)
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities and configurations
│   ├── supabase/        # Supabase clients
│   └── validations/     # Zod validation schemas
├── types/               # TypeScript type definitions
└── scripts/            # Helper documentation
```

## Available Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
npx tsc --noEmit       # Check TypeScript types

# Add Components
npx shadcn-ui@latest add [component-name]
```

## Adding shadcn/ui Components

To add more UI components:

```bash
# Example: Add a card component
npx shadcn-ui@latest add card

# Example: Add a form component
npx shadcn-ui@latest add form

# Example: Add a dialog component
npx shadcn-ui@latest add dialog
```

See `scripts/add-shadcn-component.md` for more examples.

## Documentation

- **README.md** - Project overview
- **SUPABASE_SETUP.md** - Supabase configuration guide
- **PROJECT_STRUCTURE.md** - Directory structure details
- **SETUP_CHECKLIST.md** - Verification checklist
- **TASK_1_SUMMARY.md** - What was built in Task 1

## Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Tailwind styles not applying
- Ensure `globals.css` is imported in `app/layout.tsx`
- Check `tailwind.config.ts` content paths
- Restart dev server

### TypeScript errors
```bash
npx tsc --noEmit
```

### Build fails
```bash
rm -rf .next
npm run build
```

## Need Help?

1. Check the documentation files listed above
2. Review the spec documents in `.kiro/specs/tum-community-platform/`
3. Ensure all environment variables are set correctly

## Development Workflow

1. **Start with specs** - Review requirements and design documents
2. **Follow tasks** - Implement features according to `tasks.md`
3. **Test as you go** - Run the dev server to see changes
4. **Build regularly** - Ensure no build errors accumulate

## Tech Stack Reference

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Forms**: react-hook-form + Zod
- **Icons**: lucide-react
- **Date**: date-fns

---

**Ready to continue?** Proceed to Task 2 to set up the database schema!
