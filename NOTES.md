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

## Current TODO
1. ✅ Username required - COMPLETED
2. Help icon and text for each page  
3. ✅ Redesign recent sessions - COMPLETED (separate card layout)
4. ✅ New round implementation - COMPLETED (with optional titles)

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
