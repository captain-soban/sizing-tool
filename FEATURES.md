# Planning Poker Features

## Description

A planning poker app that helps an Agile or Scrum team estimate on a feature or task. The team will be simulated in an a poker game where they will choose from the predefine story points or sizes to estimate the complexity and effort needed to complete the feature or task. The session owner is the person that created a planning poker session will have control to reveal the votes of each participant, accept the average of the votes, or completely change the value of the estimate. The participants or session owner can resume or join a poker session by using an 8-digit code. Each planning poker session is given a title which can be the sprint cycle name or an epic or name of the feature or a general description of the group of tasks to be done by the team.

## MVP Features (Core Functionality)

### Session Management

- **Session Creation**: Landing page provides option to start new sizing session or join existing session
- **Session Codes**: Generate 8-digit alphanumeric codes (excluding '0' and 'o' for clarity)
- **Recent Sessions**: Quick-access cards showing up to 10 recent sessions with one-click rejoin
- **Session History**: Display session titles, codes, user roles (host/participant), and last accessed timestamps
- **Session Owner**: User who creates session becomes the owner with configuration privileges
- **localStorage Persistence**: Recent sessions and preferences persist client-side with automatic migration

### User Management

- **Name Input**: Prompt for display name when entering session
- **Anonymous Mode**: Support for anonymous voting with nickname option
- **Name Flexibility**: Allow real names or nicknames based on team preferences
- **User Roles**: Distinguish between session owner and participants
  -- Each user can switch from observer or active in the planning poker page
  --- Visual and text indicator if their active or observer

### Voting System
- Real time voting
  - Participants can see each other in the poker planning session
    -- they can see if a player has voted or not
    -- participants can see who is observing or an active participant
      --- animated icon if a plarticipant is still deciding on a vote
- **Story Point Scales**: Configurable voting scales in settings
  - Fibonacci 0-8 (default)
  - Fibonacci 1-8
  - Fibonacci 0-13
  - T-shirt sizes (S, M, L, XL)
  - Linear 1-8
  - Custom comma-delimited values
- **Vote Collection**: Collect and display votes from all participants
  -- Icon for each participant
  --- Animated icon should indicate if a vote has been cast or not.
- **Vote Reveal**: Simultaneous reveal of all votes
  -- Show average
  -- Icon of each participant should display each of their votes.

### UI Layout & Navigation

- **Settings Access**: Gear icon button in top-right corner
- **Exit Function**: Exit button next to settings leading to landing page
- **Responsive Design**: Lightweight and responsive UI using Tailwind CSS v4
- **Component Library**: Built with shadcn-svelte components
- **Poker Planning**: Participants are displayed around a "Poker Table" shape
  -- The poker table will display the title or description of what is being estimated and the average of the votes
  --- during the voting phase the average will be empty
  --- during the vote reveal phase the average will be displayed
  --- the session owner has control on the vote reveal, accept the average or change the final result.

## Enhanced Features (Future Iterations)

### Advanced Voting

- **Vote History**: Track voting history for stories
- **Timer Function**: Optional voting timers
- **Moderator Controls**: Enhanced session management for owners

### User Experience

- **Recent Sessions UI**: Elegant card-based interface for quick session access
- **Smart Session Tracking**: Automatic session title updates and timestamp tracking
- **Theme Support**: Red, white, blue color scheme with customization
- **Accessibility**: ARIA labels and keyboard navigation
- **Mobile Optimization**: Touch-friendly interface for mobile devices

### Session Features

- **Story Management**: Add/edit story descriptions
- **Session Export**: Export results in various formats
- **Session Templates**: Predefined voting configurations

## Technical Implementation Notes

- **Framework**: SvelteKit with Svelte 5 runes (`$state`, `$effect`)
- **State Management**: Custom localStore utility for reactive localStorage + recent sessions storage
- **Data Migration**: Automatic migration from legacy localStorage format to new recent sessions
- **PostgreSQL Backend**: Server-side session storage with real-time synchronization
- **Testing**: Vitest unit tests and Playwright E2E tests
- **Build**: SvelteKit with adapter for deployment target
