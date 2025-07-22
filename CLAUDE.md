# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SvelteKit-based Planning Poker/Story Point Sizing Tool** for agile development teams. It's a client-side only application with no backend dependencies, using localStorage for data persistence.

## Technology Stack

- **SvelteKit** with **Svelte 5** (using runes API: `$state`, `$effect`)
- **TypeScript** for type safety
- **shadcn-svelte** UI component library
- **Tailwind CSS v4** with extensive custom properties
- **Vite** for build tooling

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run test         # Run all tests
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # Run ESLint and Prettier checks
npm run format       # Format code with Prettier
npm run check        # Type check with svelte-check
```

## Code Architecture

### State Management
- Uses custom `localStore` utility (`src/lib/localStore.ts`) for reactive localStorage persistence
- Built on Svelte 5's `$state` runes instead of legacy stores
- All application data persists client-side with no external API calls

### Directory Structure
- `src/routes/` - SvelteKit pages and layouts
- `src/lib/components/ui/` - shadcn-svelte UI components (Button, Card, Input)
- `src/lib/hooks/` - Custom hooks
- `src/lib/localStore.ts` - localStorage reactive state management
- `e2e/` - Playwright end-to-end tests

### Key Features (To Implement)
- **Session Management**: 8-digit alphanumeric codes (excluding '0' and 'o')
- **Voting Systems**: Anonymous/named story point estimation
- **Configurable Scales**: Fibonacci sequences, T-shirt sizes, custom scales
- **Real-time Collaboration**: Multiple participants per session

## Development Notes

- **Privacy-First**: All data remains local, no external communication
- **Svelte 5**: Use runes (`$state`, `$effect`) instead of legacy reactive patterns
- **Styling**: Red, white, blue theme with gray button backgrounds
- **Components**: Leverage existing shadcn-svelte components for consistency
- **Docker**: Multi-stage Dockerfile available for containerized deployment