const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const fs = require('fs');
const csv = require('csv-parser');

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/') },
    filename: function (req, file, cb) { cb(null, 'player-' + Date.now() + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

router.post('/import', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const results = [];
    const filePath = req.file.path;

    console.log("📂 Starting Import from:", filePath);

    // Read file once to check for delimiters and headers
    fs.createReadStream(filePath)
        .pipe(csv({
            mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '') // Remove BOM and whitespace
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`📊 CSV Read complete. Found ${results.length} rows.`);

            if (results.length === 0) {
                return res.json({ message: "No data found in CSV. Check if the file is empty or formatting is correct." });
            }

            // Check if the first row has a 'Name' column. 
            // If not, maybe the delimiter is wrong (e.g. semicolon)
            const firstRow = results[0];
            const hasName = Object.keys(firstRow).some(k => k.toLowerCase().includes('name'));

            if (!hasName) {
                console.error("❌ Could not find 'Name' column. Headers found:", Object.keys(firstRow));
                return res.status(400).json({
                    error: "Could not find 'Name' column. Please ensures headers are: Name, Category, BasePrice, Set, etc.",
                    foundHeaders: Object.keys(firstRow)
                });
            }

            let inserted = 0;
            let ignored = 0;
            let errors = 0;

            // Use a transaction-like approach or sequential async for SQLite
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");

                const stmt = db.prepare(`
                    INSERT OR IGNORE INTO players 
                    (name, category, base_price, auction_set, is_icon, combo_id, combo_display_name, is_captain) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);

                results.forEach((row, index) => {
                    // Try different case variations for headers
                    const name = row.Name || row.name || row.NAME;
                    const cat = row.Category || row.category || row.CATEGORY || 'Batsman';
                    const price = row.BasePrice || row.baseprice || row.BASEPRICE || 50000;
                    const set = row.Set || row.set || row.SET || row.AuctionSet || 'Uncapped';
                    const icon = (row.IsIcon || row.isicon || row.ISICON) == '1' ? 1 : 0;
                    const comboId = row.ComboID || row.combo_id || row.COMBOID || null;
                    const comboName = row.ComboName || row.combo_display_name || row.COMBONAME || null;
                    const captain = (row.IsCaptain || row.is_captain || row.ISCAPTAIN) == '1' ? 1 : 0;

                    if (name && name.trim()) {
                        stmt.run(name.trim(), cat, price, set, icon, comboId, comboName, captain, function (err) {
                            if (err) {
                                console.error(`❌ Error at row ${index + 1} (${name}):`, err.message);
                                errors++;
                            } else if (this.changes > 0) {
                                inserted++;
                            } else {
                                ignored++;
                            }
                        });
                    } else {
                        console.warn(`⚠️ Skipping row ${index + 1}: Missing Name`);
                        ignored++;
                    }
                });

                stmt.finalize();
                db.run("COMMIT", (err) => {
                    if (err) {
                        console.error("❌ Global Transaction Error:", err.message);
                        return res.status(500).json({ error: "Database error during import" });
                    }
                    console.log(`✅ Import finished. Inserted: ${inserted}, Ignored (Duplicates/Empty): ${ignored}, Errors: ${errors}`);
                    res.json({
                        message: `Import complete: ${inserted} new players added.`,
                        details: { inserted, ignored, errors }
                    });
                });
            });

            // Cleanup temp file
            fs.unlink(filePath, (err) => { if (err) console.error("Temp file cleanup failed:", err); });
        });
});

router.put('/bulk-update', (req, res) => {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !updates) {
        return res.status(400).json({ error: "Invalid request" });
    }

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE players SET ${fields} WHERE id IN (${placeholders})`;

    db.run(sql, [...values, ...ids], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Successfully updated ${this.changes} players.` });
    });
});

router.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    db.all("SELECT * FROM players ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', upload.single('photo'), (req, res) => {
    const { name, category, auction_set, base_price, is_captain, is_icon, combo_id, combo_display_name } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const captainVal = is_captain === 'true' || is_captain === '1' ? 1 : 0;
    const iconVal = is_icon === 'true' || is_icon === '1' ? 1 : 0;

    db.get("SELECT * FROM players WHERE name = ?", [name], (err, row) => {
        if (row) return res.status(409).json({ error: "Player already exists!" });

        db.run(
            "INSERT INTO players (name, category, auction_set, base_price, image, is_captain, is_icon, combo_id, combo_display_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [name, category, auction_set, base_price, image, captainVal, iconVal, combo_id || null, combo_display_name || null],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, name, category, base_price });
            }
        );
    });
});

router.put('/:id', upload.single('photo'), (req, res) => {
    const { id } = req.params;
    const { name, category, auction_set, base_price, is_captain, is_icon, combo_id, combo_display_name } = req.body;
    const captainVal = is_captain === 'true' || is_captain === '1' ? 1 : 0;
    const iconVal = is_icon === 'true' || is_icon === '1' ? 1 : 0;

    db.get("SELECT image FROM players WHERE id = ?", [id], (err, row) => {
        const image = req.file ? `/uploads/${req.file.filename}` : row.image;
        db.run(
            "UPDATE players SET name=?, category=?, auction_set=?, base_price=?, is_captain=?, is_icon=?, combo_id=?, combo_display_name=?, image=? WHERE id=?",
            [name, category, auction_set, base_price, captainVal, iconVal, combo_id || null, combo_display_name || null, image, id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Updated" });
            }
        );
    });
});

// --- ADMINISTRATIVE ROUTES ---

// Delete ALL Players (for starting fresh league)
router.delete('/reset-all', (req, res) => {
    db.run("DELETE FROM players", (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const resetFn = req.app.get('resetAuction');
        if (resetFn) resetFn();
        req.app.get('socketio').emit('refresh_data'); // Global refresh trigger

        res.json({ message: "All players deleted successfully" });
    });
});

router.post('/reset', (req, res) => {
    // First, get the configured budget
    db.get("SELECT default_team_budget FROM auction_config WHERE id = 1", [], (err, config) => {
        if (err) return res.status(500).json({ error: err.message });

        const defaultBudget = config?.default_team_budget || 80000000;

        // Reset players
        db.run("UPDATE players SET status = 'unsold', team_id = NULL, sold_price = NULL", (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Reset team budgets to configured value
            db.run("UPDATE teams SET budget = ?", [defaultBudget], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });

                const resetFn = req.app.get('resetAuction');
                if (resetFn) resetFn();
                req.app.get('socketio').emit('refresh_data'); // Global refresh trigger

                res.json({ message: "Auction reset successfully", budgetResetTo: defaultBudget });
            });
        });
    });
});

// --- INDIVIDUAL PLAYER ROUTES ---

router.delete('/:id', (req, res) => {
    db.run("DELETE FROM players WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

router.post('/unsold/:id', (req, res) => {
    db.run("UPDATE players SET status = 'unsold', team_id = NULL, sold_price = NULL WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Player marked unsold" });
    });
});


router.post('/seed', (req, res) => {
    const players = [
        { name: 'Virat Kohli', category: 'Batsman', base_price: 20000000, auction_set: 'Marquee', is_icon: 1 },
        { name: 'Rohit Sharma', category: 'Batsman', base_price: 20000000, auction_set: 'Marquee', is_icon: 1 },
        { name: 'Jasprit Bumrah', category: 'Bowler', base_price: 20000000, auction_set: 'Marquee', is_icon: 1 },
        { name: 'Hardik Pandya', category: 'All-rounder', base_price: 15000000, auction_set: 'Marquee', is_icon: 1 },
        { name: 'MS Dhoni', category: 'Wicket-keeper', base_price: 10000000, auction_set: 'Marquee', is_icon: 1 },
        { name: 'Shubman Gill', category: 'Batsman', base_price: 10000000, auction_set: 'BAT 1', is_icon: 0 },
        { name: 'Suryakumar Yadav', category: 'Batsman', base_price: 10000000, auction_set: 'BAT 1', is_icon: 0 },
        { name: 'Rishabh Pant', category: 'Wicket-keeper', base_price: 15000000, auction_set: 'WK 1', is_icon: 1 },
        { name: 'Ravindra Jadeja', category: 'All-rounder', base_price: 15000000, auction_set: 'AL 1', is_icon: 0 },
        { name: 'Mohammed Shami', category: 'Bowler', base_price: 10000000, auction_set: 'BOWL 1', is_icon: 0 },
        { name: 'KL Rahul', category: 'Batsman', base_price: 10000000, auction_set: 'BAT 1', is_icon: 0 },
        { name: 'Shreyas Iyer', category: 'Batsman', base_price: 10000000, auction_set: 'BAT 1', is_icon: 0 },
        { name: 'Ishant Sharma', category: 'Bowler', base_price: 5000000, auction_set: 'BOWL 1', is_icon: 0 },
        { name: 'Kuldeep Yadav', category: 'Bowler', base_price: 8000000, auction_set: 'BOWL 1', is_icon: 0 },
        { name: 'Sanju Samson', category: 'Wicket-keeper', base_price: 8000000, auction_set: 'WK 1', is_icon: 0 }
    ];

    const stmt = db.prepare("INSERT OR IGNORE INTO players (name, category, base_price, auction_set, is_icon) VALUES (?, ?, ?, ?, ?)");
    players.forEach(p => {
        stmt.run(p.name, p.category, p.base_price, p.auction_set, p.is_icon);
    });
    stmt.finalize();
    res.json({ message: "Seeded 15 Players" });
});

module.exports = router;
