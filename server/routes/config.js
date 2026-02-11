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

    // First fetch existing to keep old logos if not updated
    db.get("SELECT tournament_logo, sponsor_logo FROM auction_config WHERE id = 1", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const tournamentLogo = req.files['tournament_logo'] ? `/uploads/${req.files['tournament_logo'][0].filename}` : row?.tournament_logo;
        const sponsorLogo = req.files['sponsor_logo'] ? `/uploads/${req.files['sponsor_logo'][0].filename}` : row?.sponsor_logo;

        db.run(
            `UPDATE auction_config
             SET default_team_budget = ?, base_price = ?, squad_size = ?, has_sponsor_player = ?,
                 tier1_threshold = ?, tier1_increment = ?, tier2_threshold = ?, tier2_increment = ?, tier3_increment = ?,
                 combo_mode = ?, combo_size = ?, combo_base_price_mode = ?, has_captain_player = ?, captain_price = ?,
                 tournament_logo = ?, sponsor_logo = ?
             WHERE id = 1`,
            [
                default_team_budget, base_price, squad_size, has_sponsor_player,
                tier1_threshold, tier1_increment, tier2_threshold, tier2_increment, tier3_increment,
                combo_mode, combo_size, combo_base_price_mode, has_captain_player, captain_price,
                tournamentLogo, sponsorLogo
            ],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });

                const io = req.app.get('socketio');
                if (io) io.emit('refresh_data');

                res.json({ message: "Config updated successfully", tournament_logo: tournamentLogo, sponsor_logo: sponsorLogo });
            }
        );
    });
});

module.exports = router;
