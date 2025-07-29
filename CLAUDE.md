# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SvelteKit-based Planning Poker/Story Point Sizing Tool** for agile development teams. The application enables real-time multi-user collaboration where team members choose from predefined story points to estimate complexity and effort for features or tasks.

## Technology Stack

- **SvelteKit 2.22.0** with **Svelte 5.0.0** (using runes API: `$state`, `$effect`)
- **TypeScript** for type safety
- **shadcn-svelte 1.0.6** UI component library with slate base color
- **Tailwind CSS v4.1.11** with custom properties and utilities
- **Vite 7.0.4** for build tooling
- **Vitest + Playwright** for testing (browser and Node environments)

## Development Commands

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run all tests (unit + E2E)
npm run test:unit    # Run Vitest unit tests only
npm run test:e2e     # Run Playwright E2E tests only
npm run lint         # Run ESLint and Prettier checks
npm run format       # Format code with Prettier
npm run check        # Type check with svelte-check
npm run check:watch  # Type check in watch mode
npm run db:setup     # Create PostgreSQL database
npm run db:reset     # Reset database (removes all data)
```

### Docker Commands
```bash
npm run docker:up    # Start app and PostgreSQL with docker-compose
npm run docker:down  # Stop and remove containers
npm run docker:logs  # View container logs
npm run docker:build # Build Docker image only
npm run docker:run   # Run app container only (requires external DB)
```

## Code Architecture

### Application Flow

The app follows this user journey:

1. **Landing Page**: User chooses to create new session or join existing one
2. **Name Input**: Prompt for display name (real name or nickname for anonymous mode)
3. **Session Page**: Main poker table interface with voting and reveal mechanics
4. **Settings**: Configure story point scales and session options

### State Management

- **Frontend State**: Built on Svelte 5's `$state` runes for reactive UI updates
- **Session Persistence**: Real-time multi-user sessions with backend API
- **Real-time Updates**: WebSocket or polling for live participant synchronization
- **Local Storage**: Used only for user preferences and session reconnection

### Component Architecture

- **shadcn-svelte Components**: Button, Card, Input families in `$lib/components/ui/`
- **Utility Functions**: `cn()` function in `$lib/utils.ts` for className merging
- **Component Styling**: Uses tailwind-variants for component variants
- **Type Safety**: Components use `WithElementRef` pattern for proper TypeScript support

### Testing Strategy

- **Unit Tests**: Vitest with browser environment using Playwright for Svelte component testing
- **E2E Tests**: Playwright tests in `e2e/` directory running against production build on port 4173
- **Dual Environment**: Client tests for browser-dependent code, Node tests for utilities
- **Test Files**: Located alongside components (`*.test.ts`, `*.spec.ts`)

### Build & Deployment

- **Frontend**: SvelteKit with adapter for deployment target
- **Backend**: SvelteKit server routes for session management
- **Real-time**: Server-Sent Events (SSE) for live updates
- **Database**: PostgreSQL for persistent session storage
- **Containerization**: Multi-stage Docker build with Node.js 18 Alpine
- **Container Orchestration**: Docker Compose with app + PostgreSQL services
- **Production**: Optimized Docker image with non-root user and health checks

### Session Management

- **Session Creation**: Generates 8-digit alphanumeric codes (excluding '0' and 'o')
- **Recent Sessions**: Elegant card-based UI tracking up to 10 recent sessions on landing page
- **Quick Session Access**: One-click rejoin with automatic data pre-population (name, session code)
- **Session History**: Displays session titles, codes, user roles (host/participant), and timestamps
- **Smart Session Tracking**: Automatic session title updates and last accessed time tracking
- **localStorage Migration**: Automatic migration from legacy format to new recent sessions structure
- **Data Storage**: Server-side session storage with real-time synchronization
- **User Roles**: Distinguishes between session owner (host) and participants
- **Session Titles**: Each session has a descriptive title (sprint cycle, epic, or feature name)
- **Multi-user Support**: Real-time participant visibility and voting

## Key Features & Business Logic

### Voting Mechanics

- **Story Point Scales**: Configurable scales including Fibonacci (0-8, 1-8, 0-13), T-shirt sizes (S-XL), linear (1-8), and custom comma-delimited values
- **Vote States**: Participants can be active voters or observers with visual indicators
- **Vote Collection**: Animated icons show voting progress for each participant
- **Vote Reveal**: Session owner controls simultaneous reveal showing individual votes and average
- **Result Control**: Owner can accept average or change final estimate

### Admin Dashboard

- **Session Management**: Admin interface at `/admin` for monitoring and managing sessions
- **Real-time Statistics**: Total sessions, active sessions, and participant counts
- **Session Operations**: View, terminate, and delete sessions with confirmation dialogs
- **Participant Tracking**: Detailed participant information with online/offline status
- **Search and Filter**: Search sessions by code, title, or host name
- **Session Details Modal**: Comprehensive session information including participant list

### UI Layout Requirements

- **Poker Table**: Participants displayed around a virtual poker table shape
- **Table Center**: Shows session title/description and vote average (empty during voting, populated after reveal)
- **Top-Right Controls**: Settings gear icon and exit button leading to landing page
- **Color Scheme**: Red, white, and blue theme with white work areas and gray buttons with black text
- **Responsive Design**: Lightweight and mobile-friendly interface

### Data Persistence Pattern

- **PostgreSQL Database**: Persistent session storage with connection pooling
- **Session State**: Codes, participant names, votes, scales, session titles, and activity tracking
- **Session Resumption**: Support for resuming sessions using 8-digit codes
- **Recent Sessions Storage**: localStorage-based recent sessions with automatic migration from legacy format
- **Session Preferences**: Per-session user preferences (observer mode, story point scales) stored locally
- **Anonymous Mode**: Support for nicknames instead of real names
- **Real-time Updates**: Server-Sent Events (SSE) for live collaboration
- **Automatic Cleanup**: Inactive participants and old sessions removed automatically
- **Admin API**: RESTful endpoints for session management and statistics
- **Participant Tracking**: Last seen timestamps and online/offline status

## Development Notes

- **Svelte 5 Modern Patterns**: Always use `$state` and `$effect` runes, never legacy reactive statements
- **Component Priority**: Use shadcn-svelte components first, fallback to custom Svelte 5 components
- **Type Safety**: Maintain strict TypeScript configuration throughout
- **Session Code Generation**: Must exclude '0' and 'o' characters for visual clarity
- **Privacy-First**: Support anonymous voting modes with minimal data collection
- **Real-time Architecture**: Backend API with WebSocket support for live collaboration