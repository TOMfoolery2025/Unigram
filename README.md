# Unigram

A community platform for TUM Heilbronn Campus students featuring forums, channels, events, and a wiki.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Theme**: Dark mode with violet accent colors
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under API.

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
   - **Project Name**: unigram
   - Choose your database password and region
2. Configure authentication settings:
   - Enable Email authentication
   - Set up email templates for verification
   - Configure redirect URLs for your application
3. Copy your project URL and anon key to `.env.local`

For detailed setup instructions, see `SUPABASE_SETUP.md`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/                    # Next.js App Router pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and configurations
│   ├── supabase/        # Supabase client configurations
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

1. Set up your Supabase database schema
2. Configure Row Level Security (RLS) policies
3. Implement authentication flows
4. Build out feature modules (forums, channels, events, wiki)
