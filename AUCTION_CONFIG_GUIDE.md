# ⚙️ Auction Configuration Feature - Complete Guide

## ✅ What Was Implemented

### Dynamic Auction Configuration System
A comprehensive configuration system that allows you to customize auction parameters for different leagues.

**Access**: Settings page → Auction Configuration section

---

## 🎯 Configurable Parameters

### 1. **Default Team Budget** 💰
- **What it controls**: Starting budget for all teams
- **Default value**: ₹80 Crore (80,000,000)
- **Use case**: Different leagues have different budgets
  - IPL: ₹100 Cr
  - Local leagues: ₹50 Cr
  - International leagues: ₹150 Cr

### 2. **Small Increment** 📈
- **What it controls**: Bid increase amount for lower-value players
- **Default value**: ₹5 Lakh (500,000)
- **When it applies**: When current bid is BELOW the threshold
- **Use case**: Adjust for league scale
  - Small leagues: ₹1 L
  - Medium leagues: ₹5 L
  - Large leagues: ₹10 L

### 3. **Large Increment** 📊
- **What it controls**: Bid increase amount for high-value players
- **Default value**: ₹20 Lakh (2,000,000)
- **When it applies**: When current bid is AT OR ABOVE the threshold
- **Use case**: Control bidding speed for expensive players
  - Fast auctions: ₹50 L
  - Normal auctions: ₹20 L
  - Slow auctions: ₹10 L

### 4. **Increment Threshold** 🎯
- **What it controls**: The bid amount where increment switches from small to large
- **Default value**: ₹1 Crore (10,000,000)
- **Use case**: Define when bidding gets more aggressive
  - Low threshold: ₹50 L (faster escalation)
  - Medium threshold: ₹1 Cr (balanced)
  - High threshold: ₹5 Cr (slow escalation)

---

## 🔧 Technical Implementation

### Backend

#### Database Schema (`auction_config` table)
```sql
CREATE TABLE auction_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_team_budget REAL DEFAULT 80000000,
    small_increment REAL DEFAULT 500000,
    large_increment REAL DEFAULT 2000000,
    increment_threshold REAL DEFAULT 10000000
)
```

#### API Endpoints
- **GET `/api/config`** - Fetch current configuration
- **PUT `/api/config`** - Update configuration

### Frontend

#### Settings Page
- Configuration form with 4 input fields
- Real-time preview of formatted values
- Explanation section showing how settings work
- Save button with confirmation dialog

#### Auction Page
- Fetches config on mount
- Uses config values for bid increment calculation
- Displays dynamic increment amounts on team buttons

---

## 📋 How It Works

### Bidding Logic Flow

```
1. First Bid:
   - Amount = Base Price (no increment)

2. Subsequent Bids:
   IF current_bid < increment_threshold:
      next_bid = current_bid + small_increment
   ELSE:
      next_bid = current_bid + large_increment
```

### Example with Default Config

```
Base Price: ₹50 L
Threshold: ₹1 Cr
Small Increment: ₹5 L
Large Increment: ₹20 L

Bid 1: ₹50 L  (base price)
Bid 2: ₹55 L  (+5L, below threshold)
Bid 3: ₹60 L  (+5L, below threshold)
...
Bid 11: ₹1.0 Cr  (+5L, reaches threshold)
Bid 12: ₹1.2 Cr  (+20L, above threshold)
Bid 13: ₹1.4 Cr  (+20L, above threshold)
```

---

## 🎮 Usage Examples

### Example 1: IPL-Style League
```
Default Team Budget: ₹100 Cr (100,000,000)
Small Increment: ₹10 L (1,000,000)
Large Increment: ₹25 L (2,500,000)
Increment Threshold: ₹2 Cr (20,000,000)
```

**Result**: Higher budgets, bigger increments, aggressive bidding

### Example 2: Local League
```
Default Team Budget: ₹20 Cr (20,000,000)
Small Increment: ₹1 L (100,000)
Large Increment: ₹5 L (500,000)
Increment Threshold: ₹5 Cr (5,000,000)
```

**Result**: Smaller budgets, smaller increments, controlled bidding

### Example 3: International League
```
Default Team Budget: ₹150 Cr (150,000,000)
Small Increment: ₹20 L (2,000,000)
Large Increment: ₹50 L (5,000,000)
Increment Threshold: ₹5 Cr (50,000,000)
```

**Result**: Very high budgets, large increments, fast-paced bidding

---

## 🚀 How to Use

### Step 1: Access Settings
1. Navigate to `http://localhost:5173/settings`
2. Or click "Settings" in the navigation menu

### Step 2: Configure Parameters
1. Scroll to "Auction Configuration" section (blue card)
2. Modify the values:
   - **Default Team Budget**: Enter amount in rupees (e.g., 100000000 for ₹10 Cr)
   - **Small Increment**: Enter amount in rupees (e.g., 500000 for ₹5 L)
   - **Large Increment**: Enter amount in rupees (e.g., 2000000 for ₹20 L)
   - **Increment Threshold**: Enter amount in rupees (e.g., 10000000 for ₹1 Cr)

### Step 3: Preview Changes
- Below each input, see the formatted value (e.g., "Current: ₹8.0 Cr")
- Check the explanation box to see how the settings will work

### Step 4: Save Configuration
1. Click "Save Configuration" button
2. Confirm in the dialog
3. ✅ Settings saved!

### Step 5: Test in Auction
1. Go to Auction Console
2. Start an auction
3. Notice the increment amounts on team buttons match your config
4. Bid and see the increments change at your threshold

---

## 📁 Files Modified/Created

### Backend
- ✅ `server/db.js` - Added auction_config table
- ✅ `server/routes/config.js` - New config API routes (created)
- ✅ `server/server.js` - Registered config routes

### Frontend
- ✅ `client/src/pages/Settings.jsx` - Added configuration UI
- ✅ `client/src/pages/Auction.jsx` - Uses dynamic config for bidding

---

## 💡 Pro Tips

### Tip 1: Test Before Live Auction
Always test your configuration with sample data before running a live auction.

### Tip 2: Match League Scale
Set budgets and increments that match your league's scale:
- Small local leagues: Lower budgets, smaller increments
- Professional leagues: Higher budgets, larger increments

### Tip 3: Control Auction Speed
- **Fast auctions**: Large increments, low threshold
- **Slow auctions**: Small increments, high threshold

### Tip 4: Save Presets
Document your favorite configurations for different league types:
```
IPL Config: 100Cr, 10L, 25L, 2Cr
BBL Config: 80Cr, 8L, 20L, 1.5Cr
Local Config: 20Cr, 1L, 5L, 5Cr
```

---

## ⚠️ Important Notes

### Budget Reset
When you click "Reset Auction" in Settings, teams are reset to the **current configured budget**, not the old budget.

### Existing Teams
Changing the default budget does NOT affect existing teams. It only applies to:
- New teams created after the change
- Teams reset via "Reset Auction"

### Live Auctions
Configuration changes take effect immediately. If you change settings during a live auction:
- Current auction continues with old settings
- Next auction uses new settings

---

## 🎉 Benefits

✅ **Flexibility**: Adapt to any league format  
✅ **No Code Changes**: Configure without touching code  
✅ **Real-time Updates**: Changes apply immediately  
✅ **User-Friendly**: Simple interface with previews  
✅ **Professional**: Matches real auction dynamics  
✅ **Scalable**: Works for small to large leagues  

---

## 🔮 Future Enhancements

Potential improvements:

- [ ] Configuration presets (IPL, BBL, etc.)
- [ ] Multiple configuration profiles
- [ ] Per-set custom increments (Marquee vs Uncapped)
- [ ] Dynamic threshold (multiple tiers)
- [ ] Import/export configurations
- [ ] Auction speed analytics

---

**The configuration system is now live and ready to use!** 🚀

Navigate to Settings → Auction Configuration to customize your league parameters.
