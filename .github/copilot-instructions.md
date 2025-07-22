# Copilot Instructions for sizing-tool

## Project Overview
- This is a planning poker/story point sizing tool built with Svelte 5, SvelteKit and shadcn-svelte UI.
- The app is entirely client-side with no backend, using localStorage for data persistence.
- Designed for real-time story point sizing in agile teams.
- Features anonymous voting, configurable point scales, and session management.

## Key Architecture & Patterns
### Core Components
- Source code in `src/`:
  - `lib/` contains shared utilities, stores, and UI components
  - `routes/` contains SvelteKit pages for session management and sizing
  - `localStore.ts` handles persistent data with localStorage
- UI uses shadcn-svelte components with Tailwind CSS

### Data Flow
- Session data stored in localStorage using `localStore.ts`
- Each sizing session has:
  - 8-digit alphanumeric session code (excluding 0 and 'o')
  - Owner (session creator) status
  - Participant names/nicknames
  - Selected point scale (Fibonacci, T-shirt sizes, etc.)
  - Voting state and results

## Developer Workflows
- **Development:** `npm run dev` starts dev server
- **Build/Preview:** `npm run build` and `npm run preview`
- **Tests:** Unit tests with Vitest, E2E with Playwright

## Project-Specific Conventions
1. **Session Management**
   - Generate 8-digit codes excluding '0' and 'o'
   - Store session state in localStorage
   - Handle anonymous vs. named voting

2. **Point Scales**
   - Fibonacci (0-8, 1-8, 0-13)
   - T-shirt sizes (S to XL)
   - Custom (comma-delimited)

3. **UI Components**
   - Prioritize shadcn-svelte components
   - Fallback to standard Svelte 5 components if needed
   - Check for shadcn-svelte compatibility with Svelte 5
   - Use Tailwind CSS for styling
   - Standard layout: settings gear + exit button in top-right

4. **Data Privacy**
   - All data stored locally
   - No external communication
   - Support anonymous voting mode

## Key Files
- `/src/routes/+page.svelte`: Landing page with session creation/join
- `/src/lib/localStore.ts`: Local storage management
- `/src/routes/admin.svelte`: Admin interface for localStorage management
- 

## Testing Guidelines
- Test session code generation
- Validate point scale configurations
- Verify localStorage persistence
- Test anonymous vs. named modes

Remember: This is a client-only app with no external dependencies. All features must work without server communication.
