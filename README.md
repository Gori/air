# AIR

**AI-Readiness Assessment SaaS Tool**

A single-tenant SaaS platform where managers assess their organization's AI readiness through employee surveys, AI-powered analysis, and comprehensive reporting.

## Features

- **Employee Surveys**: 20 core questions across 6 modules (AI literacy, attitudes, workflows, etc.)
- **AI-Powered Follow-ups**: GPT-4.1 generates contextual follow-up questions
- **Intelligent Scoring**: Automated scoring across 13 dimensions (0-5 scale)
- **Visual Reports**: Bar charts, radar charts, and heatmaps with export options
- **Secure Sharing**: Public report links with company domain validation
- **Real-time Progress**: Dashboard tracking for managers

## Tech Stack

- **Frontend**: Next.js 15.3 + React 19.1 + TailwindCSS 4.x + ShadCN/ui
- **Backend**: Next.js Route Handlers + Vercel AI SDK
- **Database**: Supabase (Postgres + Row-Level Security)
- **Auth**: Clerk (Google OAuth + Email/Password)
- **AI**: OpenAI GPT-4.1 for question generation and report analysis
- **Email**: Resend for invitations and notifications
- **Testing**: Jest + React Testing Library + Playwright

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Run tests
npm run test:all
```

## Documentation

- [`docs/project.md`](docs/project.md) - Complete technical specification
- [`docs/roadmap.md`](docs/roadmap.md) - Development roadmap and phases

## Build Rules

1. Always build the minimal, clean, performant solution
2. Always use the latest versions of everything
3. Never build fallbacks or workarounds to anything

---

*Built with modern tools for maximum performance and developer experience.*
