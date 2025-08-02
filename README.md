# Planning Poker - SvelteKit Multi-User Collaboration Tool

A real-time Planning Poker application for agile development teams, built with SvelteKit and PostgreSQL. Teams can collaborate to estimate story points and complexity for features and tasks using various estimation scales.

![Planning Poker Interface](./docs/screenshot.png)

## Features

- **Real-time Multi-User Sessions** - Participants see each other join, vote, and update status live
- **Smart Session Management** - Create and join sessions using 8-digit codes with recent session tracking
- **Recent Sessions UI** - Elegant card-based interface for quick access to up to 10 recent sessions
- **Flexible Voting Scales** - Fibonacci, T-shirt sizes, linear, and custom scales
- **Observer & Participant Modes** - Toggle between active voting and observing
- **Session Persistence** - PostgreSQL database stores all session data with smart tracking
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Anonymous Support** - Use real names or nicknames for privacy
- **Admin Dashboard** - Comprehensive admin interface for session monitoring and management
- **Docker Support** - Full containerization with Docker and Docker Compose
- **Real-time Statistics** - Live monitoring of sessions, participants, and activity

## Technology Stack

- **Frontend**: SvelteKit 2.22 with Svelte 5 (runes API)
- **Backend**: SvelteKit server routes with TypeScript
- **Database**: PostgreSQL with connection pooling
- **Real-time**: Server-Sent Events (SSE) for live updates
- **Styling**: Tailwind CSS 4 with shadcn-svelte components
- **Testing**: Vitest + Playwright for unit and E2E tests

## Quick Start

### Option 1: Docker (Recommended)

**Prerequisites**: Docker and Docker Compose

1. **Clone and start**
   ```bash
   git clone <repository-url>
   cd sizing-tool
   npm run docker:up
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

That's it! PostgreSQL and the app are running in containers.

### Option 2: Local Development

**Prerequisites**: Node.js 18+, PostgreSQL 12+, npm or yarn

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sizing-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   npm run db:setup
   
   # Configure environment (copy and edit)
   cp .env.example .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Database Setup

### Local Development

1. **Install PostgreSQL**
   - macOS: `brew install postgresql && brew services start postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Create database**
   ```bash
   npm run db:setup
   ```

3. **Configure environment**
   ```bash
   # Copy example config
   cp .env.example .env
   
   # Edit .env with your database credentials
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/planning_poker
   ```

The application automatically creates database tables and indexes on startup.

### Production Deployment

Set the `DATABASE_URL` environment variable for your production database:

```bash
export DATABASE_URL=postgresql://username:password@host:port/database
export NODE_ENV=production
```

## Usage

### Creating a Session

1. Enter your name on the landing page
2. Click "Create New Session"
3. Share the 8-digit session code with your team
4. Configure story point scales in settings if needed

### Joining a Session

**New Session:**
1. Enter your name and the 8-digit session code
2. Click "Join Session"
3. Toggle between Observer and Participant modes as needed

**Recent Session (Quick Access):**
1. Click on any recent session card from the landing page
2. Automatically rejoin with saved name and session details
3. No need to re-enter session codes or names

### Planning Poker Process

1. **Start Voting** - Session host initiates a new voting round
2. **Cast Votes** - Participants select story points from available scales
3. **Reveal Votes** - Host reveals all votes and shows average
4. **Accept or Re-vote** - Host can accept the average or start a new round

### Admin Dashboard

1. **Access Admin Panel** - Navigate to `/admin` for session management
2. **Monitor Sessions** - View real-time statistics and session overview
3. **Manage Sessions** - Terminate active sessions or delete old ones
4. **View Participants** - See detailed participant information and online status
5. **Search Sessions** - Filter by session code, title, or host name

## Development

### Available Scripts

#### Local Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run all tests (unit + E2E)
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # Check code formatting and linting
npm run format       # Format code with Prettier
npm run check        # TypeScript type checking
npm run db:setup     # Create PostgreSQL database
npm run db:reset     # Reset database (removes all data)
```

#### Docker Commands
```bash
npm run docker:up    # Start app and PostgreSQL with docker-compose
npm run docker:down  # Stop and remove containers
npm run docker:logs  # View container logs
npm run docker:build # Build Docker image only
npm run docker:run   # Run app container only (requires external DB)
```

### Project Structure

```
src/
├── lib/
│   ├── api/              # API client for frontend
│   ├── components/ui/    # shadcn-svelte components
│   ├── server/           # Database and server utilities
│   └── stores/           # Svelte stores and types
├── routes/
│   ├── api/             # SvelteKit API routes
│   └── session/         # Planning poker pages
└── app.html             # HTML template
```

### Key Technologies

- **Svelte 5 Runes**: `$state`, `$effect` for reactive state management
- **SvelteKit**: File-based routing with server-side API routes
- **PostgreSQL**: Connection pooling, automatic schema management
- **Server-Sent Events**: Real-time updates without WebSocket complexity
- **TypeScript**: Full type safety across frontend and backend

## Architecture

### Real-time Data Flow

```
Client A ──► API Route ──► PostgreSQL ──► SSE Broadcast ──► All Clients
Client B ──► API Route ──► PostgreSQL ──► SSE Broadcast ──► All Clients
```

### Database Schema

- **sessions**: Session codes, titles, voting state, timestamps
- **participants**: Player names, votes, host/observer status, activity tracking

### API Endpoints

#### Session Management
- `POST /api/sessions` - Create new session
- `POST /api/sessions/[code]/join` - Join existing session  
- `PATCH /api/sessions/[code]/participants/[name]` - Update participant
- `PATCH /api/sessions/[code]/voting` - Update voting state
- `GET /api/sessions/[code]/events` - Server-Sent Events stream

#### Admin API
- `GET /api/admin/sessions` - Get all sessions with statistics
- `DELETE /api/admin/sessions/[code]` - Delete specific session
- `POST /api/admin/sessions/[code]/terminate` - Terminate active session

## Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planning_poker
DB_USER=postgres
DB_PASSWORD=your_password

# Database Pool Settings
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Environment
NODE_ENV=development
```

### Story Point Scales

Built-in scales include:
- Fibonacci (0-8, 1-8, 0-13)
- T-shirt sizes (XS, S, M, L, XL)
- Linear (1-8)
- Custom comma-delimited values

## Deployment

This application can be deployed to various platforms with automatic database setup. The database schema is created automatically on first startup.

### Platform-Specific Deployment

#### 🚀 Vercel (Recommended)

**Prerequisites:**
- GitHub account with your repository
- Vercel account (free tier available)

**Step 1: Prepare Your Code**
```bash
# Ensure latest changes are committed and pushed
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

**Step 2: Deploy to Vercel**

*Option A: GitHub Integration (Recommended)*
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `captain-soban/sizing-tool`
4. Vercel auto-detects SvelteKit configuration
5. Click "Deploy" (first deployment will fail without database - this is expected)

*Option B: Vercel CLI*
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your account
vercel login

# Deploy from your project directory
vercel --prod
```

**Step 3: Set Up Database**

*Option A: Vercel Postgres (Recommended)*
1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Browse** → **Postgres** → **Create**
3. Choose a database name (e.g., `planning-poker-db`)
4. Select region closest to your users
5. Copy the `POSTGRES_URL` connection string

*Option B: Neon (Free Tier)*
1. Sign up at [neon.tech](https://neon.tech)
2. Create new project: "Planning Poker"
3. Copy connection string from dashboard
4. Connection string format: `postgresql://user:password@host/dbname?sslmode=require`

*Option C: Supabase (Free Tier)*
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project: "Planning Poker"
3. Go to Settings → Database
4. Copy connection string (use "Session mode" for better compatibility)

**Step 4: Configure Environment Variables**
1. In Vercel dashboard, go to your project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```bash
# Required
DATABASE_URL=your_postgres_connection_string_here
NODE_ENV=production

# Optional (for custom database configuration)
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

**Example DATABASE_URL formats:**
```bash
# Vercel Postgres
DATABASE_URL=postgresql://user:password@host:5432/vercel-postgres-db

# Neon
DATABASE_URL=postgresql://user:password@ep-hostname.us-east-1.aws.neon.tech/neondb?sslmode=require

# Supabase
DATABASE_URL=postgresql://postgres.project-ref:password@aws-0-region.pooler.supabase.com:6543/postgres
```

**Step 5: Redeploy with Database**
1. Go to **Deployments** tab in Vercel dashboard
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger auto-deployment

**Step 6: Verify Deployment**
1. Visit your Vercel deployment URL (e.g., `https://sizing-tool.vercel.app`)
2. Create a test session to verify database connectivity
3. Check that real-time features work correctly

**Vercel Configuration Details:**

Your project includes `vercel.json` with optimized settings:
```json
{
  "functions": {
    "src/routes/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Production Features:**
- ✅ Automatic HTTPS
- ✅ CDN edge locations worldwide
- ✅ Automatic scaling
- ✅ Database cleanup cron job (every 6 hours)
- ✅ API route timeouts (30 seconds)
- ✅ Real-time updates via Server-Sent Events

**Troubleshooting Vercel Deployment:**

*Database Connection Issues:*
- Ensure `DATABASE_URL` is set correctly in Environment Variables
- Verify database allows connections from Vercel's IP ranges
- Check that SSL is properly configured (most cloud databases require it)

*Build Failures:*
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript types are correct

*Function Timeouts:*
- API routes timeout after 30 seconds (configured in `vercel.json`)
- For hobby plans, functions timeout after 10 seconds by default
- Upgrade to Pro plan for longer timeouts if needed

*Environment Variables Not Working:*
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)
- Verify values don't contain special characters that need escaping

#### 🚂 Railway

1. **Connect Repository**
   - Go to [Railway](https://railway.app) → New Project → Deploy from GitHub

2. **Add PostgreSQL**
   - Add Service → Database → PostgreSQL
   - Railway automatically provides `DATABASE_URL`

3. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   ```

4. **Deploy** - Railway handles the rest automatically

#### ☁️ Other Cloud Platforms

**Render, Fly.io, DigitalOcean App Platform:**
1. Connect your repository
2. Add managed PostgreSQL service  
3. Set `DATABASE_URL` and `NODE_ENV=production`
4. Deploy

#### 🐳 Docker Deployment

**Quick Docker deployment** (includes PostgreSQL):

1. **Clone and deploy:**
   ```bash
   git clone <repository-url>
   cd sizing-tool
   npm run docker:up
   ```

2. **Access your app at `http://localhost:3000`**

**Custom Docker deployment:**

1. **Edit docker-compose.yml for production:**
   ```yaml
   # Update environment variables in docker-compose.yml
   environment:
     - DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/planning_poker
     - NODE_ENV=production
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   npm run docker:logs
   ```

#### 🖥️ VPS/Traditional Server

1. **Prepare server with Node.js 18+ and PostgreSQL**

2. **Clone and build:**
   ```bash
   git clone <your-repo-url>
   cd sizing-tool
   npm ci --production
   npm run build
   ```

3. **Set up database:**
   ```bash
   # Create database and user
   sudo -u postgres createdb planning_poker
   sudo -u postgres createuser planningpoker
   ```

4. **Configure environment:**
   ```bash
   export DATABASE_URL=postgresql://planningpoker:password@localhost:5432/planning_poker
   export NODE_ENV=production
   ```

5. **Start with PM2:**
   ```bash
   npm install -g pm2
   pm2 start build/index.js --name planning-poker
   pm2 startup
   pm2 save
   ```

### Database Setup in Production

**🔄 Automatic Schema Creation**
- Tables and indexes are created automatically on first startup
- No manual SQL scripts needed
- Database migrations run seamlessly

**🔧 Manual Database Setup (if needed)**
```bash
# Connect to your production database
psql $DATABASE_URL

# Tables will be created automatically, but you can verify:
\dt  # List tables
\d sessions  # Describe sessions table
```

### Environment Variables

**Required for all deployments:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database_name
NODE_ENV=production
```

**Optional configuration:**
```bash
# Database connection pooling
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# For custom database parameters (if not using DATABASE_URL)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=planning_poker
DB_USER=your-username
DB_PASSWORD=your-password
```

### SSL Connections

**Production SSL is automatic:**
- Development: `ssl: false`
- Production: `ssl: { rejectUnauthorized: false }` (enabled when `NODE_ENV=production`)

### Building for Production

```bash
# Build the application
npm run build

# Preview production build locally
npm run preview
```

### Health Checks

Test your deployment:
```bash
# Check if app is running
curl https://your-app-url.com

# Test API endpoints
curl https://your-app-url.com/api/sessions

# Create a test session
curl -X POST https://your-app-url.com/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"hostName":"Test User"}'
```

### Production Monitoring

**Database Cleanup:**
- Inactive sessions removed after 24 hours
- Inactive participants removed after 30 seconds  
- Automatic cleanup runs every 5 minutes

**Performance:**
- Connection pooling (max 10 connections)
- Server-Sent Events for real-time updates
- Optimized database indexes

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run quality checks: `npm run lint && npm run check && npm run test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Testing

### Unit Tests
```bash
npm run test:unit
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Manual Testing
1. Start development server: `npm run dev`
2. Open multiple browser tabs/windows
3. Create session in one tab, join from others
4. Test real-time voting and state synchronization

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Verify database exists**:
   ```bash
   psql -h localhost -U postgres -l
   ```

3. **Reset database if needed**:
   ```bash
   npm run db:reset
   ```

### Common Issues

- **Port conflicts**: Dev server will automatically find available ports
- **Database schema**: Tables are created automatically on first run
- **Real-time updates**: Check browser console for SSE connection errors

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [SvelteKit](https://kit.svelte.dev/)
- UI components from [shadcn-svelte](https://www.shadcn-svelte.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [PostgreSQL](https://www.postgresql.org/)

---

For detailed database setup instructions, see [DATABASE.md](DATABASE.md).

For project development guidelines, see [CLAUDE.md](CLAUDE.md).