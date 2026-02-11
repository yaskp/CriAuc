# Player Combo System - Implementation Guide

## Overview
This document outlines the complete implementation of the Player Combo System for the Cricket Auction application.

## Database Schema Changes

### 1. Update `auction_config` table
```sql
ALTER TABLE auction_config ADD COLUMN combo_mode INTEGER DEFAULT 0;
ALTER TABLE auction_config ADD COLUMN combo_size INTEGER DEFAULT 2;
ALTER TABLE auction_config ADD COLUMN combo_base_price_mode TEXT DEFAULT 'per_combo';
ALTER TABLE auction_config ADD COLUMN has_captain_player INTEGER DEFAULT 0;
ALTER TABLE auction_config ADD COLUMN captain_price REAL DEFAULT 0;
```

### 2. Update `players` table
```sql
ALTER TABLE players ADD COLUMN combo_id TEXT DEFAULT NULL;
ALTER TABLE players ADD COLUMN is_captain INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN combo_display_name TEXT DEFAULT NULL;
```

## Configuration Fields

### Auction Config Structure
```javascript
{
  // Existing fields
  default_team_budget: 300000,
  base_price: 5000,
  squad_size: 11,
  has_sponsor_player: 1,
  
  // New combo fields
  combo_mode: 1,              // 0 = individual, 1 = combo
  combo_size: 2,              // players per combo
  combo_base_price_mode: 'per_combo', // 'per_combo' or 'per_player'
  has_captain_player: 1,      // 0 = no, 1 = yes
  captain_price: 10000,       // fixed price for captain
}
```

## Squad Calculation Logic

### Individual Mode (combo_mode = 0)
```
Squad Size: 11 players
+ Captain: 1 (if enabled)
+ Sponsor: 1 (if enabled)
= Total: 13 players
```

### Combo Mode (combo_mode = 1)
```
Squad Size: 6 combos × 2 players = 12 players
+ Captain: 1 (if enabled)
+ Sponsor: 1 (if enabled)
= Total: 14 players
```

## Reserved Budget Calculation

### Individual Mode
```javascript
reserved = squad_size × base_price
// Example: 11 × ₹5,000 = ₹55,000
```

### Combo Mode - Per Combo Pricing
```javascript
reserved = (squad_size / combo_size) × base_price
// Example: (12 / 2) × ₹5,000 = 6 × ₹5,000 = ₹30,000
```

### Combo Mode - Per Player Pricing
```javascript
reserved = squad_size × base_price
// Example: 12 × ₹5,000 = ₹60,000
```

### Add Captain & Sponsor
```javascript
if (has_captain_player) reserved += captain_price
if (has_sponsor_player) reserved += 0 // sponsor is free
```

## Player Management

### Adding Players

**Individual Mode:**
- Add players one by one
- No combo_id required

**Combo Mode:**
- Add players with combo_id (e.g., "COMBO_1", "COMBO_2")
- Optional combo_display_name (e.g., "Opening Pair", "Spin Duo")
- Must add exactly `combo_size` players per combo

**Captain:**
- Mark one player as `is_captain = 1`
- Pre-assign to a team before auction
- Deduct captain_price from team budget

**Sponsor:**
- Already handled by existing `has_sponsor_player`

### Excel Import Format

**Combo Mode CSV:**
```csv
name,category,base_price,combo_id,combo_display_name,is_captain
Player A,Batsman,5000,COMBO_1,Opening Pair,0
Player B,Batsman,5000,COMBO_1,Opening Pair,0
Player C,Bowler,5000,COMBO_2,Pace Attack,0
Player D,Bowler,5000,COMBO_2,Pace Attack,0
Captain X,All-rounder,10000,,Captain,1
```

## Auction Logic

### Bidding Flow

**Individual Mode:**
1. Show one player at a time
2. Bid on individual player
3. Assign to winning team

**Combo Mode:**
1. Show combo (all players in combo_id together)
2. Display: "Combo 1: Player A + Player B"
3. Base price: ₹5,000 (for entire combo)
4. Bid on entire combo
5. Assign ALL players in combo to winning team
6. Deduct bid amount from team budget

### Display Format

**Auction Screen - Combo:**
```
┌─────────────────────────────────┐
│  COMBO 1: Opening Pair          │
│                                 │
│  👤 Player A (Batsman)          │
│  👤 Player B (Batsman)          │
│                                 │
│  Base Price: ₹5,000             │
│  Current Bid: ₹8,000            │
└─────────────────────────────────┘
```

**Auction Screen - Individual:**
```
┌─────────────────────────────────┐
│  Player A                       │
│  Batsman                        │
│                                 │
│  Base Price: ₹5,000             │
│  Current Bid: ₹8,000            │
└─────────────────────────────────┘
```

## Settings UI

### New Configuration Section

```
┌─────────────────────────────────────────┐
│  Auction Mode Configuration             │
├─────────────────────────────────────────┤
│                                         │
│  Auction Mode:                          │
│  ○ Individual Players                   │
│  ● Combo Bidding                        │
│                                         │
│  Combo Size: [2] players per combo     │
│                                         │
│  Base Price Mode:                       │
│  ● Per Combo (₹5K for entire combo)    │
│  ○ Per Player (₹5K × 2 = ₹10K total)   │
│                                         │
├─────────────────────────────────────────┤
│  Squad Composition                      │
├─────────────────────────────────────────┤
│                                         │
│  Squad Size: [12] players               │
│  (6 combos × 2 players)                 │
│                                         │
│  ☑ Has Captain Player                  │
│    Captain Price: [₹10,000]            │
│                                         │
│  ☑ Has Sponsor Player                  │
│    (Free, no auction)                   │
│                                         │
│  Total Team Size: 14 players            │
│                                         │
└─────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Database & Config (Priority 1)
- [ ] Update database schema
- [ ] Add new config fields to API
- [ ] Update Settings UI with new options

### Phase 2: Player Management (Priority 2)
- [ ] Update Admin panel to support combo_id
- [ ] Add combo grouping in player list
- [ ] Update Excel import to handle combos
- [ ] Add captain marking functionality

### Phase 3: Auction Logic (Priority 3)
- [ ] Update auction to detect combo mode
- [ ] Group players by combo_id for display
- [ ] Update bidding to handle combo pricing
- [ ] Assign all combo players to winner

### Phase 4: Display & UX (Priority 4)
- [ ] Update Auction screen for combo display
- [ ] Update Display screen for combo view
- [ ] Update Teams/Leaderboard for combo grouping
- [ ] Add visual indicators for captain/sponsor

## Testing Scenarios

### Test Case 1: Individual Mode
- Config: combo_mode = 0, squad_size = 11
- Add 11 individual players
- Auction each player separately
- Verify team has 11 players

### Test Case 2: Combo Mode
- Config: combo_mode = 1, combo_size = 2, squad_size = 12
- Add 6 combos (12 players total)
- Auction each combo (6 auctions)
- Verify team has 12 players (6 combos)

### Test Case 3: Full Configuration
- Config: combo_mode = 1, squad_size = 12, has_captain = 1, has_sponsor = 1
- Add 6 combos + 1 captain
- Pre-assign captain to teams
- Auction 6 combos
- Verify team has 14 players total

## Benefits

✅ **Flexibility**: Support both individual and combo auctions
✅ **Configurability**: All parameters adjustable without code changes
✅ **Scalability**: Easy to add 3-player combos or other variations
✅ **Clarity**: Clear display of combo vs individual
✅ **Accuracy**: Proper budget calculations for all modes

---

**Status**: Ready for implementation
**Estimated Time**: 4-6 hours for complete implementation
**Priority**: High
