# 🚀 Render Deployment Guide

## Quick Deploy Steps

### 1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account (free)

### 2. **Deploy Backend (API)**
   1. Click **"New +"** → **"Web Service"**
   2. Connect your GitHub repository: `yaskp/CriAuc`
   3. Configure:
      - **Name**: `cricauction-api`
      - **Region**: Singapore (or closest to you)
      - **Branch**: `master`
      - **Root Directory**: `server`
      - **Build Command**: `npm install`
      - **Start Command**: `node server.js`
      - **Plan**: Free
   4. Add Environment Variables:
      - `NODE_ENV` = `production`
      - `DATABASE_URL` = (will be auto-created with database)
   5. Click **"Create Web Service"**

### 3. **Deploy Frontend (React App)**
   1. Click **"New +"** → **"Static Site"**
   2. Connect the same repository: `yaskp/CriAuc`
   3. Configure:
      - **Name**: `cricauction-app`
      - **Region**: Singapore
      - **Branch**: `master`
      - **Root Directory**: `client`
      - **Build Command**: `npm install && npm run build`
      - **Publish Directory**: `dist`
   4. Add Environment Variable:
      - `VITE_API_URL` = `https://cricauction-api.onrender.com`
        (Replace with your actual backend URL from step 2)
   5. Click **"Create Static Site"**

### 4. **Update API URL in Frontend**
   After deployment, update the API URL in your frontend code:
   - File: `client/src/socket.js` and all API calls
   - Replace `http://localhost:5000` with your Render backend URL

### 5. **Database Setup (SQLite)**
   Your SQLite database will persist on Render's free tier. The `auction.db` file will be stored in the server directory.

   **Note**: For production, consider upgrading to Render's PostgreSQL (free for 90 days) for better reliability.

## 📱 Public URLs After Deployment

- **Admin Panel**: `https://cricauction-app.onrender.com`
- **Public Leaderboard**: `https://cricauction-app.onrender.com/public/leaderboard`
- **Projector Display**: `https://cricauction-app.onrender.com/display`
- **Team View**: `https://cricauction-app.onrender.com/public/team/:teamId`

## 🔧 Important Notes

1. **Free Tier Limitations**:
   - Services spin down after 15 minutes of inactivity
   - First request after inactivity may take 30-60 seconds
   - 750 hours/month free (enough for continuous running)

2. **Custom Domain** (Optional):
   - Go to Settings → Custom Domain
   - Add your domain (e.g., `cricauction.com`)
   - Update DNS records as instructed

3. **Auto-Deploy**:
   - Every push to `master` branch automatically deploys
   - Check deployment logs in Render dashboard

## 🎯 Next Steps

After deployment:
1. Test all features on the live URL
2. Share public leaderboard link with teams
3. Generate QR codes for team-specific pages
4. Use projector display URL for live auction

## 🆘 Troubleshooting

**Backend not connecting?**
- Check Environment Variables in Render dashboard
- Verify `VITE_API_URL` in frontend matches backend URL
- Check backend logs in Render dashboard

**Database issues?**
- Ensure `auction.db` is in `.gitignore` (don't commit it)
- Database will be created automatically on first run
- For persistent data, use Render Disk (paid) or PostgreSQL

**Build failing?**
- Check build logs in Render dashboard
- Ensure `package.json` has all dependencies
- Verify Node version compatibility (use Node 18+)
