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
- **Observer/Voter Toggle**: Each user can switch between observer and active voter modes
- **Visual Indicators**: Clear visual and text indicators for active/observer status
- **Shareable Links**: Share link button that copies session URL for easy participant access
- **Smart Name Persistence**: Remembers previously used names for returning users
- **Participant Stats**: Display voting participation metrics and statistics
- **Mode Toggle Component**: Dedicated UI component for switching participant modes

### Voting System

- **Real-time Voting**: Live voting with instant participant visibility
- **Participant Display**: Visual representation of all session participants around poker table
- **Vote Status Indicators**: Clear visual indicators showing who has voted vs. who is still deciding
- **Observer Visibility**: Display which participants are observing vs. actively voting
- **Animated Vote Icons**: Dynamic animations indicating voting progress for each participant
- **Story Point Scales**: Configurable voting scales in settings
  - Fibonacci 0-8 (default)
  - Fibonacci 1-8
  - Fibonacci 0-13
  - T-shirt sizes (S, M, L, XL)
  - Linear 1-8
  - Custom comma-delimited values
- **Vote Collection**: Secure collection and storage of participant votes
- **Vote Reveal**: Owner-controlled simultaneous reveal of all votes
- **Average Calculation**: Automatic average calculation with manual override option
- **Round Management**: Support for multiple voting rounds within a session
- **Round Titles**: Optional descriptive titles for each voting round
- **Vote History**: Tracking and display of previous round results

### UI Layout & Navigation

- **Settings Access**: Gear icon button in top-right corner
- **Exit Function**: Exit button next to settings leading to landing page
- **Responsive Design**: Lightweight and responsive UI using Tailwind CSS v4
- **Component Library**: Built with shadcn-svelte components and custom Svelte 5 components
- **Poker Table Layout**: Participants displayed around virtual poker table shape
- **Dynamic Table Center**: Displays session title and voting results
  - Empty during voting phase
  - Shows average and individual votes after reveal
  - Owner controls for reveal, accept average, or manual override
- **Observer Notice**: Clear messaging for users in observer mode
- **Participant Mode Toggle**: Easy switching between voter and observer modes
- **Share Modal**: Dedicated modal for generating and copying shareable session links

## Enhanced Features (Current Implementation)

### Admin Dashboard
- **Session Monitoring**: Real-time dashboard at `/admin` for monitoring all sessions
- **Session Statistics**: Live counts of total, active sessions and participants  
- **Session Management**: View, terminate, and delete sessions with confirmation
- **Participant Tracking**: Detailed participant information with online/offline status
- **Search and Filter**: Search sessions by code, title, or host name
- **Session Details Modal**: Comprehensive session information and participant lists

### Database Features
- **PostgreSQL Integration**: Persistent storage with Neon cloud database
- **Real-time Synchronization**: SSE-based live updates across all participants
- **Automatic Cleanup**: Inactive participant and session cleanup
- **Database Monitoring**: Development page showing database connection and table info
- **Connection Pooling**: Optimized database connections for production scaling

## Future Enhancement Ideas

### Advanced Voting
- **Timer Function**: Optional voting timers for time-boxed estimation
- **Vote Confidence**: Confidence levels for each vote
- **Estimation Templates**: Pre-configured estimation scales for different project types

### User Experience  
- **Help System**: Context-sensitive help icons and documentation
- **Accessibility**: Enhanced ARIA labels and keyboard navigation
- **Mobile App**: Native mobile application for iOS/Android
- **Theme Customization**: User-selectable color themes and branding

### Analytics & Reporting
- **Session Analytics**: Voting patterns and team velocity metrics
- **Export Functions**: Export session results to CSV, PDF, or project management tools
- **Historical Reporting**: Long-term estimation accuracy and team performance insights

## Technical Implementation Notes

- **Framework**: SvelteKit with Svelte 5 runes (`$state`, `$effect`)
- **State Management**: Custom localStore utility for reactive localStorage + recent sessions storage
- **Data Migration**: Automatic migration from legacy localStorage format to new recent sessions
- **PostgreSQL Backend**: Server-side session storage with real-time synchronization
- **Testing**: Vitest unit tests and Playwright E2E tests
- **Build**: SvelteKit with adapter for deployment target