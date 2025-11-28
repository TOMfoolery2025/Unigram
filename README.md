# Unigram

A community platform for TUM Heilbronn Campus students featuring forums, channels, events, and a wiki.

## Overview

Unigram is a comprehensive community platform built with Next.js 14 and Supabase, designed specifically for TUM Heilbronn Campus students. The platform provides:

- **Forums**: Discussion spaces with voting, comments, and anonymous posting
- **Channels**: Real-time messaging for official announcements and communication
- **Events**: Campus event management with registration and QR codes
- **Calendar**: Integrated calendar view with ICS export
- **Wiki**: Public knowledge base powered by Hygraph CMS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **CMS**: Hygraph (for Wiki content)
- **Testing**: Vitest, Testing Library

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git

### Installation

1. **Clone and install**:
```bash
git clone https://github.com/your-org/unigram.git
cd unigram
npm install
```

<<<<<<< Updated upstream
2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **Run development server**:
=======
2. Set up environment variables:

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then configure the following required variables:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Hygraph CMS (required for wiki)
NEXT_PUBLIC_HYGRAPH_ENDPOINT=your-hygraph-endpoint
HYGRAPH_TOKEN=your-hygraph-token

# OpenAI (required for wiki chatbot)
OPENAI_API_KEY=your-openai-api-key
```

You can find Supabase values in your project settings under API.

For detailed chatbot configuration (model selection, temperature, token limits), see `CHATBOT_CONFIGURATION.md`.

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

>>>>>>> Stashed changes
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Documentation

### Getting Started
- **[Getting Started Guide](./GETTING_STARTED.md)** - Complete setup instructions
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Supabase project configuration
- **[Database Setup](./DATABASE_SETUP.md)** - Database schema and migrations

### Core Documentation
- **[Architecture](./docs/ARCHITECTURE.md)** - System design and component interactions
- **[Authentication](./docs/AUTHENTICATION.md)** - Auth flow, middleware, and session management
- **[Database](./docs/DATABASE.md)** - Schema, query patterns, and optimization
- **[Performance](./docs/PERFORMANCE.md)** - Performance guidelines and best practices
- **[API Documentation](./docs/API.md)** - API routes and usage

### Development
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - Development guidelines and code standards
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Deployment
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment instructions

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (authenticated)/   # Protected routes
│   ├── (guest)/           # Public routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── [feature]/        # Feature-specific components
├── lib/                  # Utility functions and configurations
│   ├── supabase/        # Supabase client configurations
│   ├── [feature]/       # Feature-specific logic
│   └── utils/           # Shared utilities
├── types/               # TypeScript type definitions
├── docs/                # Comprehensive documentation
└── supabase/           # Database migrations
```

## Features

### Forums
- Create and join discussion subforums
- Post with voting (upvote/downvote)
- Nested comments
- Anonymous posting option
- Search and filtering

### Channels
- Official communication channels
- Real-time messaging
- Member management
- Admin-controlled channel creation

### Events
- Create and manage campus events
- Event registration with QR codes
- Calendar integration
- Event filtering by type and date

### Calendar
- View all events in calendar format
- Personal calendar events
- Export to ICS format
- Filter by event type

### Wiki
- Public knowledge base
- Category-based organization
- Full-text search
- Rich text content

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm start               # Start production server

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:ui         # Run tests with UI

# Code Quality
npm run lint            # Run ESLint
npx tsc --noEmit       # Check TypeScript types
```

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### Optional
- `NEXT_PUBLIC_HYGRAPH_URL` - Hygraph API endpoint (for Wiki)
- `HYGRAPH_TOKEN` - Hygraph authentication token

See [Deployment Guide](./docs/DEPLOYMENT.md) for production environment configuration.

## Contributing

We welcome contributions! Please read our [Contributing Guide](./docs/CONTRIBUTING.md) for:
- Development workflow
- Code standards
- Testing guidelines
- Pull request process

## License

This project is licensed under the MIT License.

## Support

- **Documentation**: Check the `docs/` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Questions**: Open a discussion on GitHub

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- CMS by [Hygraph](https://hygraph.com/)
