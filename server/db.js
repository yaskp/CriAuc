const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'auction.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Teams Table
  db.run(`CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    logo TEXT,
    sponsor_logo TEXT,
    budget REAL DEFAULT 100000000,
    max_players INTEGER DEFAULT 25
  )`);

  // Sponsors Table
  db.run(`CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'sponsor', -- 'main', 'co', 'trophy', 'team', 'associate'
    logo TEXT NOT NULL
  )`);

  // Players Table
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    auction_set TEXT DEFAULT 'Uncategorized',
    base_price REAL,
    image TEXT,
    is_captain INTEGER DEFAULT 0,
    is_icon INTEGER DEFAULT 0,  -- New Icon Column
    status TEXT DEFAULT 'unsold', 
    team_id INTEGER,
    sold_price REAL,
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )`);

  // Migrations for existing DBs
  db.all("PRAGMA table_info(players)", (err, rows) => {
    // Check for is_captain
    if (!rows.some(r => r.name === 'is_captain')) {
      db.run("ALTER TABLE players ADD COLUMN is_captain INTEGER DEFAULT 0");
    }
    // Check for is_icon
    if (!rows.some(r => r.name === 'is_icon')) {
      db.run("ALTER TABLE players ADD COLUMN is_icon INTEGER DEFAULT 0");
    }
    // Check for auction_set
    if (!rows.some(r => r.name === 'auction_set')) {
      db.run("ALTER TABLE players ADD COLUMN auction_set TEXT DEFAULT 'Uncategorized'");
    }
  });

  db.all("PRAGMA table_info(teams)", (err, rows) => {
    if (!rows.some(r => r.name === 'sponsor_logo')) {
      db.run("ALTER TABLE teams ADD COLUMN sponsor_logo TEXT");
    }
  });

  // Enhanced Auction Config Table with Combo System
  db.run(`CREATE TABLE IF NOT EXISTS auction_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_team_budget REAL DEFAULT 300000,
    base_price REAL DEFAULT 5000,
    squad_size INTEGER DEFAULT 11,
    has_sponsor_player INTEGER DEFAULT 1,
    tier1_threshold REAL DEFAULT 10000,
    tier1_increment REAL DEFAULT 1000,
    tier2_threshold REAL DEFAULT 20000,
    tier2_increment REAL DEFAULT 2000,
    tier3_increment REAL DEFAULT 5000,
    combo_mode INTEGER DEFAULT 0,
    combo_size INTEGER DEFAULT 2,
    combo_base_price_mode TEXT DEFAULT 'per_combo',
    has_captain_player INTEGER DEFAULT 0,
    captain_price REAL DEFAULT 0
  )`);

  // Migration: Add new columns to auction_config if they don't exist
  const addConfigCols = [
    "ALTER TABLE auction_config ADD COLUMN combo_mode INTEGER DEFAULT 0",
    "ALTER TABLE auction_config ADD COLUMN combo_size INTEGER DEFAULT 2",
    "ALTER TABLE auction_config ADD COLUMN combo_base_price_mode TEXT DEFAULT 'per_combo'",
    "ALTER TABLE auction_config ADD COLUMN has_captain_player INTEGER DEFAULT 0",
    "ALTER TABLE auction_config ADD COLUMN captain_price REAL DEFAULT 0",
    "ALTER TABLE auction_config ADD COLUMN tournament_logo TEXT",
    "ALTER TABLE auction_config ADD COLUMN sponsor_logo TEXT"
  ];

  // Safe migration for auction_config
  db.serialize(() => {
    addConfigCols.forEach(query => {
      db.run(query, (err) => { /* Ignore duplicate column errors */ });
    });
  });

  // Insert default config if not exists
  db.get("SELECT COUNT(*) as count FROM auction_config", (err, row) => {
    if (row && row.count === 0) {
      db.run(`INSERT INTO auction_config (
        id, default_team_budget, base_price, squad_size, has_sponsor_player,
        tier1_threshold, tier1_increment, tier2_threshold, tier2_increment, tier3_increment,
        combo_mode, combo_size, combo_base_price_mode, has_captain_player, captain_price
      ) VALUES (1, 300000, 5000, 11, 1, 10000, 1000, 20000, 2000, 5000, 0, 2, 'per_combo', 0, 0)`);
    }
  });

  // Migration: Add Combo columns to players table
  const addPlayerCols = [
    "ALTER TABLE players ADD COLUMN combo_id TEXT DEFAULT NULL",
    "ALTER TABLE players ADD COLUMN combo_display_name TEXT DEFAULT NULL"
  ];

  db.serialize(() => {
    addPlayerCols.forEach(query => {
      db.run(query, (err) => { /* Ignore duplicate column errors */ });
    });
  });

  // Seed (Only if empty)
  db.get("SELECT COUNT(*) as count FROM teams", (err, row) => {
    if (row && row.count === 0) {
      // Get configured budget first
      db.get("SELECT default_team_budget FROM auction_config WHERE id = 1", [], (err, config) => {
        const defaultBudget = config?.default_team_budget || 80000000;

        const teams = [
          'Mumbai Masters', 'Delhi Dynamos', 'Chennai Champions', 'Kolkata Knights',
          'Bangalore Blasters', 'Rajasthan Royals', 'Punjab Kings', 'Hyderabad Heroes',
          'Gujarat Giants', 'Lucknow Lions'
        ];
        const stmt = db.prepare("INSERT INTO teams (name, budget) VALUES (?, ?)");
        teams.forEach(name => stmt.run(name, defaultBudget));
        stmt.finalize();
      });
    }
  });
});

module.exports = db;
