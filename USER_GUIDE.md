# Cricket Auction System - User Guide

## 🎯 Quick Start Guide

### Step 1: Start the Application
1. **Server Terminal**: `cd server` → `npm start` (Port 5000)
2. **Client Terminal**: `cd client` → `npm run dev` (Port 5173)

### Step 2: Setup Data
1. Open **Admin Panel**: `http://localhost:5173/admin`
2. Click **"+ Seed"** button to add 15 sample players
3. Check the **Green "Online"** indicator in the top-left

### Step 3: Start an Auction
1. In Admin Panel, find a player in the list
2. Click the **Play (▶)** button next to their name
3. Watch for the **"LIVE"** badge to appear

### Step 4: Bidding
1. Open **Console**: `http://localhost:5173/`
2. You'll see the player card and current bid
3. **Click on any Team Box** to place a bid
4. The bid automatically increases by:
   - **5 Lakh** if current bid < 1 Crore
   - **20 Lakh** if current bid ≥ 1 Crore

### Step 5: Finalize Sale
1. On the Console page, click the big red **"SOLD / CLOSE"** button
2. Confirm the sale
3. Player status changes to "SOLD" in Admin

---

## 🔧 Troubleshooting

### Problem: "Waiting for Auctioneer..." screen won't change
**Solution:**
1. Check the **connection indicator** (top-right on Console, top-left on Admin)
2. If **Red/Offline**: Restart the server (`Ctrl+C` then `npm start`)
3. Refresh both browser tabs (Console and Admin)
4. Try clicking Play button again

### Problem: Clicking bid buttons does nothing
**Solution:**
1. Open **Browser Console** (F12 → Console tab)
2. Look for error messages
3. Check that you see logs like:
   - `🎯 Starting auction for: [Player Name]`
   - `Bid Attempt: Team [Name]...`
   - `Placing Bid: [Amount]`
4. If no logs appear, the socket connection is broken - restart server

### Problem: "Insufficient Funds" alert
**Solution:**
- Each team has a budget (default: 80 Crore)
- Check team budgets in Admin → Teams tab
- You cannot bid more than the team's remaining budget

---

## 📋 Features Implemented

### Admin Panel (`/admin`)
✅ **Connection Status Indicator** - Green dot = Online, Red = Offline  
✅ **Player Management**:
  - Add/Edit/Delete players
  - CSV Bulk Import
  - Seed 15 sample players
  - Search & Filter (by name, set, status)
  - Form validation (name required, price > 0)
  
✅ **Live Auction Tracking**:
  - "LIVE" badge on currently auctioned player
  - Auto-refresh when player sold
  
✅ **Random Pick** - "Luck Dip" button selects random unsold player

✅ **Team Management** - Add teams with logos and budgets

### Auction Console (`/`)
✅ **Connection Status** - Shows if server is online  
✅ **Idle Screen** - Clear instructions when no auction active  
✅ **Live Bidding**:
  - Player card with photo, name, category
  - Current bid display with animations
  - Team buttons for bidding
  - Visual feedback (green highlight for last bidder)
  - Increment display on each button (+5L or +20L)
  
✅ **SOLD Button** - Finalize auction and mark player as sold

### Server (`server.js`)
✅ **Socket.IO Events**:
  - `start_auction` - Initiates auction for a player
  - `place_bid` - Records team bids
  - `end_auction` - Finalizes sale
  - `auction_update` - Broadcasts state to all clients
  
✅ **Debug Logging** - Console logs for all socket events  
✅ **API Routes**:
  - `/api/players` - CRUD operations
  - `/api/players/seed` - Add 15 sample players
  - `/api/players/import` - CSV upload
  - `/api/teams` - Team management

---

## 🎨 UI Improvements
- Modern glassmorphism design
- Responsive grid layouts
- Color-coded status indicators
- Smooth animations (Framer Motion)
- Premium dark theme
- Clear visual hierarchy

---

## 🐛 Known Issues & Fixes Applied

### Issue: Bidding math errors (string concatenation)
**Fix:** Force `Number()` conversion in `handleBid` function

### Issue: Socket disconnection after server restart
**Fix:** Added connection listeners and status indicators

### Issue: No feedback when clicking Play button
**Fix:** Added console logs and connection validation

### Issue: Unclear bidding interface
**Fix:** Added "CLICK TEAM TO BID" instruction and increment labels

---

## 📝 CSV Import Format
```csv
Name,Category,BasePrice,Set,IsIcon
Virat Kohli,Batsman,20000000,Marquee,1
MS Dhoni,Wicket-keeper,15000000,Icon Player,1
Jasprit Bumrah,Bowler,12000000,Marquee,0
```

**Headers:** Name, Category, BasePrice, Set, IsIcon  
**Categories:** Batsman, Bowler, All-rounder, Wicket-keeper  
**Sets:** Marquee, Icon Player, Sponsor Player, BAT 1, BOWL 1, WK 1, AL 1, Uncapped  
**IsIcon:** 1 = Yes, 0 = No

---

## 🎯 Using Marquee Players & Auction Sets

### What are Auction Sets?
Auction sets help you organize players into different categories for a structured auction flow. The system supports these sets:
- **Marquee** - Premium star players (highest base price)
- **Icon Player** - Legendary/retired players
- **Sponsor Player** - Special category for sponsored players
- **BAT 1, BOWL 1, WK 1, AL 1** - Category-specific sets (Batsmen, Bowlers, Wicket-keepers, All-rounders)
- **Uncapped** - New/emerging players

### How to Assign Players to Sets

#### Option 1: Add/Edit Individual Players
1. Go to **Player Registry** page (`/players`)
2. Click **"+ Add Player"** or **Edit** an existing player
3. In the form, select **"Auction Set"** dropdown
4. Choose the appropriate set (e.g., "Marquee")
5. Save the player

#### Option 2: Bulk Import via CSV
Include the `Set` column in your CSV file:
```csv
Name,Category,BasePrice,Set,IsIcon
Virat Kohli,Batsman,20000000,Marquee,1
MS Dhoni,Wicket-keeper,15000000,Icon Player,1
Jasprit Bumrah,Bowler,12000000,Marquee,0
Rishabh Pant,Wicket-keeper,8000000,WK 1,0
```

### Filtering by Set in Admin Panel
1. Go to **Admin Panel** (`/admin`)
2. In the **Auction Pipeline** tab, use the **"All Sets"** dropdown
3. Select a specific set (e.g., "Marquee") to view only those players
4. This helps you auction players in organized rounds

### Recommended Auction Flow
1. **Round 1: Marquee Players** - Start with star players to build excitement
2. **Round 2: Icon Players** - Auction legendary players
3. **Round 3: Category Sets** - BAT 1, BOWL 1, WK 1, AL 1 (by position)
4. **Round 4: Uncapped** - Emerging talent at lower base prices

### Using the "Lucky Dip" with Sets
- Filter to a specific set (e.g., "Marquee")
- Click **"Lucky Dip"** button
- System will randomly pick an unsold player from the **filtered view**
- This allows random selection within a specific set!

---

## 💡 Player Combos (Future Feature)

**Note:** The combo feature is not yet implemented, but here's how it could work:

### Concept
Allow teams to bid on **multiple players as a package deal** (e.g., "Captain + Vice-Captain Combo").

### Suggested Implementation
1. Add a `combo_id` field to the players table
2. Group players with the same `combo_id`
3. In Admin, start auction for a combo (multiple players)
4. Display all combo players together in the Console
5. Teams bid on the entire package
6. All players in the combo go to the winning team

### Example Combos
- **Leadership Combo**: Captain + Vice-Captain
- **Opening Pair**: 2 opening batsmen
- **Pace Attack**: 3 fast bowlers
- **Spin Twins**: 2 spinners

**Would you like me to implement this combo feature? Let me know!**

---

## ⚙️ League Settings & Reset Options

### Managing Multiple Leagues

The **Settings** page (`/settings`) provides powerful tools to manage your auction data across multiple leagues. Access it from the navigation menu.

### Available Reset Options:

#### 1. **Reset Auction** (Safe Option)
- **What it does**: Marks all players as UNSOLD and resets team budgets to ₹80 Cr
- **What it keeps**: All players and teams remain in the database
- **Use case**: Restart the auction without losing your data
- **Confirmation**: Single confirmation dialog

**When to use:**
- Between auction rounds
- To restart bidding with the same players/teams
- Testing the auction flow

---

#### 2. **Delete All Players** (Moderate Risk)
- **What it does**: PERMANENTLY deletes all players from the database
- **What it keeps**: All teams remain intact
- **Use case**: Import a completely new player list for a different league
- **Confirmation**: Double confirmation + type "DELETE"

**When to use:**
- Switching to a different player pool (e.g., different tournament)
- Starting fresh with new players but keeping the same teams

---

#### 3. **Delete All Teams** (Moderate Risk)
- **What it does**: PERMANENTLY deletes all teams from the database
- **What it keeps**: All players remain intact
- **Use case**: Set up new teams while keeping the same player pool
- **Confirmation**: Double confirmation + type "DELETE"

**When to use:**
- Changing team structure
- Starting fresh with new teams but keeping the same players

---

#### 4. **Delete Everything** (Nuclear Option 🚨)
- **What it does**: PERMANENTLY deletes ALL PLAYERS AND ALL TEAMS
- **What it keeps**: Nothing - complete database wipe
- **Use case**: Start a completely fresh league from scratch
- **Confirmation**: Triple confirmation + type "DELETE EVERYTHING"

**When to use:**
- Switching to a completely different league (e.g., IPL → BBL)
- Starting a brand new season with different teams and players
- Complete reset for a new tournament

---

### Safety Features:

✅ **Multiple Confirmations**: Destructive actions require multiple confirmations  
✅ **Type-to-Confirm**: Critical operations require typing confirmation text  
✅ **Clear Warnings**: Each option clearly states what will be deleted  
✅ **Visual Indicators**: Color-coded cards (green = safe, orange = caution, red = danger)

### Workflow Example:

**Scenario: Running Multiple Leagues**

1. **IPL League (First League)**
   - Add 10 teams
   - Add 100 players
   - Run the auction
   - Export results

2. **Switch to BBL League**
   - Go to **Settings**
   - Click **"Delete Everything"**
   - Confirm deletion
   - Add 8 BBL teams
   - Add 80 BBL players
   - Run the new auction

3. **Reuse Same Teams, Different Players**
   - Go to **Settings**
   - Click **"Delete All Players"**
   - Import new player CSV
   - Run auction with existing teams

---

## 🚀 Next Steps (Future Enhancements)
- [ ] Display screen for audience (`/display`)
- [ ] War Room dashboard showing team budgets
- [ ] Auction timer/countdown
- [ ] Bid history log
- [ ] Export final team rosters
- [ ] Sound effects for bids
- [ ] Mobile responsive design

---

## 📞 Support
If you encounter issues:
1. Check both server and client terminals for errors
2. Verify both connection indicators are green
3. Check browser console (F12) for JavaScript errors
4. Restart both server and client
5. Clear browser cache if needed
