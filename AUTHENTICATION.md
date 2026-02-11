# 🔐 Authentication System

## Overview
The application now has login protection to secure admin routes while keeping public pages accessible.

## Default Login Credentials
```
Username: admin
Password: auction2024
```

## Protected Routes (Require Login)
- `/` - Auction Console
- `/admin` - Control Room
- `/registry` - Player Registry
- `/teams` - Teams Management
- `/teams/:id` - Team Details
- `/manage-teams` - Manage Teams
- `/settings` - Settings

## Public Routes (No Login Required)
- `/public/team/:teamId` - Public Team View (shareable)
- `/public/leaderboard` - Public Leaderboard (shareable)
- `/display` - Projector Display
- `/leaderboard` - Standings

## How It Works

### First Time Access
1. When someone visits your deployed URL, they'll see a login page
2. They must enter the username and password
3. After successful login, they can access all admin features
4. Login session is stored in browser (persists on refresh)

### Logout
- Click the **Logout** button in the navigation bar
- This clears the session and redirects to login page

### Sharing Public Links
- Public team views (`/public/team/1`) don't require login
- Anyone with the link can view team squads
- Perfect for sharing with team owners or participants

## Changing Login Credentials

To change the default credentials, edit `client/src/pages/Login.jsx`:

```javascript
// Line 15-16
if (username === 'admin' && password === 'auction2024') {
```

Change `'admin'` and `'auction2024'` to your desired credentials.

## Security Notes

⚠️ **Important**: This is a simple client-side authentication suitable for:
- Internal events
- Trusted environments
- Quick protection against casual access

For production use with sensitive data, consider:
- Backend authentication with JWT tokens
- Database-stored user credentials
- Password hashing
- Role-based access control

## Testing Locally

1. Start your development server:
   ```bash
   cd client
   npm run dev
   ```

2. Visit `http://localhost:5173`
3. You'll be redirected to `/login`
4. Enter credentials: `admin` / `auction2024`
5. Access granted!

## Deployment

The authentication is now deployed to Render. When users visit your live URL:
- They'll see the login page first
- Must authenticate to access admin features
- Public routes remain accessible without login

---

**Created**: 2026-02-12  
**Version**: 1.0
