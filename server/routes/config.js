const express = require('express');
const router = express.Router();
const db = require('../db');

// Get Config
router.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    db.get("SELECT * FROM auction_config WHERE id = 1", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        // Ensure defaults if row exists but columns are null (common after migrations)
        const defaults = {
            default_team_budget: 300000,
            base_price: 10000, // Fixed default for base price
            squad_size: 11,
            has_sponsor_player: 1,
            tier1_threshold: 10000,
            tier1_increment: 2000,
            tier2_threshold: 20000,
            tier2_increment: 5000,
            tier3_increment: 10000,
            combo_mode: 0,
            combo_size: 2,
            combo_base_price_mode: 'per_combo',
            has_captain_player: 0,
            captain_price: 0
        };

        if (!row) return res.json(defaults);

        // Merge row with defaults to handle NULL columns
        const merged = { ...defaults };
        Object.keys(defaults).forEach(key => {
            if (row[key] !== null && row[key] !== undefined) {
                merged[key] = row[key];
            }
        });

        // Add logo paths if they exist
        merged.tournament_logo = row.tournament_logo;
        merged.sponsor_logo = row.sponsor_logo;

        res.json(merged);
    });
});

// Update Config
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/') },
    filename: function (req, file, cb) { cb(null, 'config-' + file.fieldname + '-' + Date.now() + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

// Update Config with logos
router.put('/', upload.fields([{ name: 'tournament_logo', maxCount: 1 }, { name: 'sponsor_logo', maxCount: 1 }]), (req, res) => {
    // If request is multipart/form-data, req.body fields are strings. Parsing might be needed if they were JSON.
    // However, for simple fields, it's fine.

    const {
        default_team_budget, base_price, squad_size, has_sponsor_player,
        tier1_threshold, tier1_increment, tier2_threshold, tier2_increment, tier3_increment,
        combo_mode, combo_size, combo_base_price_mode, has_captain_player, captain_price
    } = req.body;

    const parseNum = (val, def) => {
        const n = Number(val);
        return isNaN(n) ? def : n;
    };

    // First fetch existing to keep old logos if not updated
    db.get("SELECT * FROM auction_config WHERE id = 1", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const tournamentLogo = req.files['tournament_logo'] ? `/uploads/${req.files['tournament_logo'][0].filename}` : row?.tournament_logo;
        const sponsorLogo = req.files['sponsor_logo'] ? `/uploads/${req.files['sponsor_logo'][0].filename}` : row?.sponsor_logo;

        console.log("🛠️ UPDATING CONFIG:", { tournamentLogo, sponsorLogo, fields: req.body });

        const params = [
            parseNum(default_team_budget, 300000),
            parseNum(base_price, 10000),
            parseNum(squad_size, 11),
            parseNum(has_sponsor_player, 1),
            parseNum(tier1_threshold, 10000),
            parseNum(tier1_increment, 2000),
            parseNum(tier2_threshold, 20000),
            parseNum(tier2_increment, 5000),
            parseNum(tier3_increment, 10000),
            parseNum(combo_mode, 0),
            parseNum(combo_size, 2),
            combo_base_price_mode || 'per_combo',
            parseNum(has_captain_player, 0),
            parseNum(captain_price, 0),
            tournamentLogo,
            sponsorLogo
        ];

        db.run(
            `UPDATE auction_config
             SET default_team_budget = ?, base_price = ?, squad_size = ?, has_sponsor_player = ?,
                 tier1_threshold = ?, tier1_increment = ?, tier2_threshold = ?, tier2_increment = ?, tier3_increment = ?,
                 combo_mode = ?, combo_size = ?, combo_base_price_mode = ?, has_captain_player = ?, captain_price = ?,
                 tournament_logo = ?, sponsor_logo = ?
             WHERE id = 1`,
            params,
            (err) => {
                if (err) {
                    console.error("❌ DB UPDATE ERROR:", err.message);
                    return res.status(500).json({ error: err.message });
                }

                const io = req.app.get('socketio');
                if (io) io.emit('refresh_data');

                // Return full config so frontend state is fully updated
                res.json({
                    default_team_budget: params[0],
                    base_price: params[1],
                    squad_size: params[2],
                    has_sponsor_player: params[3],
                    tier1_threshold: params[4],
                    tier1_increment: params[5],
                    tier2_threshold: params[6],
                    tier2_increment: params[7],
                    tier3_increment: params[8],
                    combo_mode: params[9],
                    combo_size: params[10],
                    combo_base_price_mode: params[11],
                    has_captain_player: params[12],
                    captain_price: params[13],
                    tournament_logo: tournamentLogo,
                    sponsor_logo: sponsorLogo,
                    message: "Config updated successfully"
                });
            }
        );
    });
});

module.exports = router;
