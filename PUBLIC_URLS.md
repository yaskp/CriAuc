# 🔗 Quick Reference: Public URLs

## Local Development URLs

### Main Public Pages
| Page | URL | Purpose |
|------|-----|---------|
| **Public Leaderboard** | `http://localhost:5173/public/leaderboard` | View all teams and standings |
| **Team 1 Squad** | `http://localhost:5173/public/team/1` | Team 1's complete squad |
| **Team 2 Squad** | `http://localhost:5173/public/team/2` | Team 2's complete squad |
| **Team 3 Squad** | `http://localhost:5173/public/team/3` | Team 3's complete squad |
| **Team N Squad** | `http://localhost:5173/public/team/N` | Replace N with team ID |

### Admin Pages (Private)
| Page | URL | Purpose |
|------|-----|---------|
| **Auction Console** | `http://localhost:5173/` | Run the auction |
| **Control Room** | `http://localhost:5173/admin` | Manage auction flow |
| **Projector Display** | `http://localhost:5173/display` | Full-screen broadcast |
| **Standings** | `http://localhost:5173/leaderboard` | Internal leaderboard |
| **War Room** | `http://localhost:5173/teams` | Team analytics |
| **Settings** | `http://localhost:5173/settings` | Configure auction |

---

## After Deployment (Example: Render)

Replace `cricauction-app.onrender.com` with your actual Render URL:

### Public URLs (Share These!)
```
https://cricauction-app.onrender.com/public/leaderboard
https://cricauction-app.onrender.com/public/team/1
https://cricauction-app.onrender.com/public/team/2
```

### Admin URLs (Keep Private!)
```
https://cricauction-app.onrender.com/
https://cricauction-app.onrender.com/admin
https://cricauction-app.onrender.com/display
```

---

## 📲 QR Code Access

1. Open any team page: `/public/team/:teamId`
2. Click **"Show QR Code"** button
3. Share or print the QR code
4. Anyone can scan to view the squad!

---

## 💾 Download Options

On each team page, you can:
- **Download Image** - High-res PNG of the squad
- **Download PDF** - Print-ready PDF document
- **Show QR Code** - Generate shareable QR code

---

## 🎯 Quick Actions

### Share Leaderboard with Everyone:
```
Copy: http://localhost:5173/public/leaderboard
Send via WhatsApp, Email, or SMS
```

### Share Specific Team Page:
```
Copy: http://localhost:5173/public/team/1
Replace '1' with actual team ID
Share with team owner
```

### Display on Projector:
```
Open: http://localhost:5173/display
Go fullscreen (F11)
Connect to projector
```

---

## 🔍 Finding Team IDs

Team IDs are assigned automatically when you create teams:
- First team created = ID 1
- Second team created = ID 2
- Third team created = ID 3
- And so on...

To find a team's ID:
1. Go to `/teams` (War Room)
2. Click on a team
3. Check the URL: `/teams/:teamId`
4. The number is the team ID!

---

## ✅ Checklist Before Sharing

- [ ] Test public leaderboard link
- [ ] Verify all team pages load correctly
- [ ] Generate QR codes for each team
- [ ] Download squad PDFs for backup
- [ ] Share links with team owners
- [ ] Post public leaderboard on social media
- [ ] Display QR codes on projector during event

---

**Pro Tip:** Bookmark the public leaderboard URL and share it widely. It's your main public-facing page! 🎉
