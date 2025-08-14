# Project Notes

Use this file to keep track of business details, ideas, or anything else related to your app.

- **Target audience**: Agile development teams, Scrum masters, Product owners
- **Business goals**: Streamline sprint planning and story estimation process
- **Integration notes**: Vercel deployment with Neon PostgreSQL, real-time collaboration via SSE
- **Open questions**: Performance optimization for large teams, mobile app considerations

Add more notes as your project evolves.

## Technical and Design Notes

1. Must be lightweight and responsive UI
2. Use localStorage for recent sessions and user preferences  
3. Color theme: red, white and blue. White for work area. Buttons are gray background and black text
4. Real-time updates via Server-Sent Events (SSE)
5. PostgreSQL database with connection pooling
6. Winston logging with daily rotation and production optimization

## Completed Features

✅ **Session Management**: 8-digit codes, recent sessions, quick rejoin  
✅ **Observer Mode**: Toggle between active voting and observer status  
✅ **Participant Stats**: Voting statistics and participation metrics  
✅ **Shareable Links**: Easy session sharing with link generation  
✅ **Round Management**: Multiple voting rounds with optional titles  
✅ **Admin Dashboard**: Session monitoring and management interface  
✅ **Database Monitoring**: Development debug page for database info  
✅ **Host Verification System**: Secure host identification and restoration  
✅ **Participant Removal**: Host can remove disruptive participants  
✅ **Real-time Connection Status**: Live participant connection indicators  
✅ **API Performance Optimization**: Batching and debouncing for smooth updates  
✅ **Speed Insights Integration**: Performance monitoring for production

## Current TODO
1. ✅ Username required - COMPLETED
2. Help icon and text for each page  
3. ✅ Redesign recent sessions - COMPLETED (separate card layout)
4. ✅ New round implementation - COMPLETED (with optional titles)
5. ✅ Host verification system - COMPLETED (secure host identification)
6. ✅ Participant removal feature - COMPLETED (host can remove participants)
7. ✅ Real-time connection status - COMPLETED (live participant indicators)
8. ✅ API performance optimization - COMPLETED (batching and debouncing)

### TODO: Implement isConnected Field Usage

**Current Status:** The `isConnected` field is defined but not actively used in the codebase.

#### Analysis
- **Defined but Not Set:** Declared in `Participant` interface (`src/lib/stores/session.ts:8`) and `AdminSessionData` interface (`src/lib/api/adminClient.ts:16`) but never populated
- **Not Used in Logic:** No code reads or checks the `isConnected` value, no UI displays connection status
- **Current Connection Detection:** Uses `lastSeen` timestamps instead (active within last 30 seconds for cleanup, 5 minutes for admin "active" status)

#### Current Implementation
```typescript
// Admin determines activity this way:
const now = Date.now();
const activeParticipants = session.participants.filter(
  (p) => p.lastSeen && now - p.lastSeen < 5 * 60 * 1000 // 5 minutes
);
```

#### TODO Items to Implement isConnected

1. **Set Connection Status on SSE Events**
   - Set `isConnected: true` when SSE connection established in `/api/sessions/[sessionCode]/events`
   - Set `isConnected: false` when SSE connection drops or heartbeat fails

2. **Update Participant Records**
   - Modify `broadcastSessionUpdate()` to include connection status updates
   - Update `PostgresSessionStore.updateParticipant()` to handle `isConnected` field

3. **UI Updates**
   - Display real-time connection indicators in participant list
   - Show online/offline status in admin interface
   - Add visual indicators (green dot for online, gray for offline)

4. **Admin Interface Enhancement**
   - Use `isConnected` for accurate online/offline indicators instead of `lastSeen` approximation
   - Show real-time connection counts

5. **SSE Connection Tracking Integration**
   - Sync `sessionConnections` Map with `isConnected` field
   - Handle connection cleanup to update participant status

#### Files to Modify
- `src/lib/server/sseUtils.ts` - Update broadcast logic
- `src/routes/api/sessions/[sessionCode]/events/+server.ts` - Handle connection/disconnection
- `src/lib/server/postgresSessionStore.ts` - Store connection status
- `src/routes/session/[sessionCode]/+page.svelte` - Display connection status
- `src/lib/components/admin/SessionDetailsModal.svelte` - Show connection indicators

#### Priority
Medium - Would improve user experience and admin visibility, but current `lastSeen` approach works adequately.

## 🛡️ Security Best Practices - Preventing Credential Leaks

### 1. **Git Hooks & Pre-commit Checks**

Install tools that scan for secrets before commits:

```bash
# Install pre-commit
npm install --save-dev @commitlint/config-conventional @commitlint/cli
pip install pre-commit detect-secrets

# Add to package.json scripts:
"secrets-check": "detect-secrets scan --all-files",
"pre-commit": "npm run secrets-check && npm run lint"
```

### 2. **Environment Variable Patterns**

**✅ DO:**
```bash
# .env (gitignored)
DATABASE_URL=postgres://real_user:real_pass@real_host/db

# .env.example (committed)
DATABASE_URL=postgresql://user:password@host:5432/database
```

**❌ DON'T:**
```javascript
// Never hardcode in source files
const dbUrl = "postgres://user:pass@host/db"
```

### 3. **IDE/Editor Protection**

Configure your editor to highlight potential secrets:

```json
// VS Code settings.json
{
  "files.watcherExclude": {
    "**/.env": true
  },
  "search.exclude": {
    "**/.env": true
  }
}
```

### 4. **Enhanced .gitignore**

```gitignore
# Environment files
.env
.env.*
!.env.example
!.env.test

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/settings.json
.idea/

# Logs with potential secrets
*.log
logs/
```

### 5. **Repository Security Tools**

**GitHub Security Features:**
- Enable "Secret scanning" in repository settings
- Enable "Dependency scanning" 
- Use GitHub's "Security" tab to monitor alerts

**Third-party Tools:**
```bash
# GitLeaks - scan for secrets
brew install gitleaks
gitleaks detect --source .

# TruffleHog - find secrets in git history  
pip install truffleHog
truffleHog --regex --entropy=False .
```

### 6. **Development Workflow**

**Safe Environment Setup:**
```bash
# 1. Copy example file
cp .env.example .env

# 2. Edit with real values (file is gitignored)
# 3. Never commit .env files
# 4. Always use environment variables in code:
const dbUrl = process.env.DATABASE_URL
```

### 7. **Code Review Checklist**

Before any commit/PR:
- [ ] No hardcoded passwords/URLs
- [ ] All sensitive data uses environment variables
- [ ] `.env` files are gitignored
- [ ] Example files contain only placeholders
- [ ] Run secrets scanning tools

### 8. **Production Security**

**Environment Variables in Production:**
```bash
# Vercel/Netlify - use dashboard
# Docker - use secrets or env files outside repo
# Local - use .env files (gitignored)
```

### 9. **Team Education**

**Onboarding Checklist:**
- [ ] Never commit real credentials
- [ ] Always use `.env` files for local development
- [ ] Understand `.gitignore` patterns
- [ ] Know how to use environment variables
- [ ] Install and use pre-commit hooks

### 10. **Automated Protection**

**GitHub Actions Workflow:**
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run secret scan
        run: |
          pip install detect-secrets
          detect-secrets scan --all-files
```

### 🎯 **Quick Setup for Your Project**

1. **Install pre-commit hooks:**
```bash
npm install --save-dev husky lint-staged
npx husky add .husky/pre-commit "npm run lint && npm run secrets-check"
```

2. **Add to package.json:**
```json
{
  "scripts": {
    "secrets-check": "echo 'Checking for secrets...' && git diff --cached --name-only | xargs grep -l 'postgres://.*@.*' && exit 1 || echo 'No secrets found'"
  }
}
```

3. **Enable GitHub secret scanning** in your repository settings.

The key is **layered security** - multiple tools and practices working together to catch secrets before they reach your repository.
