# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SvelteKit-based Planning Poker/Story Point Sizing Tool** for agile development teams. It's a client-side only application with no backend dependencies, using localStorage for data persistence. The application simulates a poker game where team members choose from predefined story points to estimate complexity and effort for features or tasks.

## Technology Stack

- **SvelteKit 2.22.0** with **Svelte 5.0.0** (using runes API: `$state`, `$effect`)
- **TypeScript** for type safety
- **shadcn-svelte 1.0.6** UI component library with slate base color
- **Tailwind CSS v4.1.11** with custom properties and utilities
- **Vite 7.0.4** for build tooling
- **Vitest + Playwright** for testing (browser and Node environments)

## Development Commands

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
```

## Code Architecture

### Application Flow
The app follows this user journey:
1. **Landing Page**: User chooses to create new session or join existing one
2. **Name Input**: Prompt for display name (real name or nickname for anonymous mode)
3. **Session Page**: Main poker table interface with voting and reveal mechanics
4. **Settings**: Configure story point scales and session options

### State Management
- **Current Implementation**: Direct localStorage usage in components (`+page.svelte`)
- **Planned Architecture**: Custom `localStore` utility for reactive localStorage persistence
- Built on Svelte 5's `$state` runes instead of legacy Svelte stores
- All application data persists client-side with no external API calls

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
- Uses `@sveltejs/adapter-static` for client-side only deployment
- Static site generation with no fallback pages
- Build output goes to `build/` directory
- No server-side rendering required

### Session Management (Current Implementation)
- **Session Creation**: Generates 8-digit alphanumeric codes (excluding '0' and 'o')
- **Data Storage**: Uses localStorage with keys: `sessionCode`, `playerName`, `isHost`
- **User Roles**: Distinguishes between session owner (host) and participants
- **Session Title**: Each session has a title (sprint cycle, epic, or feature name)

## Key Features & Business Logic

### Voting Mechanics
- **Story Point Scales**: Configurable scales including Fibonacci (0-8, 1-8, 0-13), T-shirt sizes (S-XL), linear (1-8), and custom comma-delimited values
- **Vote States**: Participants can be active voters or observers with visual indicators
- **Vote Collection**: Animated icons show voting progress for each participant
- **Vote Reveal**: Session owner controls simultaneous reveal showing individual votes and average
- **Result Control**: Owner can accept average or change final estimate

### UI Layout Requirements
- **Poker Table**: Participants displayed around a virtual poker table shape
- **Table Center**: Shows session title/description and vote average (empty during voting, populated after reveal)
- **Top-Right Controls**: Settings gear icon and exit button leading to landing page
- **Color Scheme**: Red, white, and blue theme with white work areas and gray buttons with black text
- **Responsive Design**: Lightweight and mobile-friendly interface

### Data Persistence Pattern
- All session data stored in localStorage (no external APIs)
- Session state includes: codes, participant names, votes, scales, session titles
- Support for resuming sessions using 8-digit codes
- Anonymous mode support (nicknames instead of real names)

## Development Notes

- **Svelte 5 Modern Patterns**: Always use `$state` and `$effect` runes, never legacy reactive statements
- **Component Priority**: Use shadcn-svelte components first, fallback to custom Svelte 5 components
- **Type Safety**: Maintain strict TypeScript configuration throughout
- **No Backend Dependencies**: Everything must work offline with localStorage only
- **Session Code Generation**: Must exclude '0' and 'o' characters for visual clarity
- **Privacy-First**: Support anonymous voting modes, no data leaves the client