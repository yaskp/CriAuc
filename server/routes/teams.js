const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/') },
    filename: function (req, file, cb) { cb(null, 'team-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

// Get Teams
router.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    // We count players in DB + 1 if captain_name exists + 1 if sponsor_logo exists (if configured)
    db.get("SELECT * FROM auction_config WHERE id = 1", [], (err, config) => {
        const hasCap = config?.has_captain_player || 0;
        const hasSpo = config?.has_sponsor_player || 0;
        const comboMode = config?.combo_mode || 0;
        const comboSize = config?.combo_size || 2;
        const squadSizeItems = config?.squad_size || 11;
        const targetTotalPlayers = comboMode === 1 ? (squadSizeItems * comboSize) : squadSizeItems;

        db.all(`
            SELECT t.*, 
            (
                (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) + 
                (CASE WHEN t.captain_name IS NOT NULL AND t.captain_name != '' THEN 1 ELSE 0 END) + 
                (CASE WHEN t.sponsor_logo IS NOT NULL AND t.sponsor_logo != '' AND ${hasSpo} = 1 THEN 1 ELSE 0 END)
            ) as player_count 
            FROM teams t
        `, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows.map(r => ({ ...r, target_size: targetTotalPlayers })));
        });
    });
});

// Get Squad
router.get('/:id/squad', (req, res) => {
    db.all("SELECT * FROM players WHERE team_id = ?", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add Team (Multiple files)
router.post('/', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'sponsor_logo', maxCount: 1 }]), (req, res) => {
    const { name, budget, captain_name, owner_name } = req.body;
    const logo = req.files['logo'] ? `/uploads/${req.files['logo'][0].filename}` : null;
    const sponsor = req.files['sponsor_logo'] ? `/uploads/${req.files['sponsor_logo'][0].filename}` : null;

    db.run("INSERT INTO teams (name, budget, logo, sponsor_logo, captain_name, owner_name) VALUES (?, ?, ?, ?, ?, ?)", [name, budget, logo, sponsor, captain_name, owner_name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, budget, captain_name, owner_name });
    });
});

// Edit Team
router.put('/:id', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'sponsor_logo', maxCount: 1 }]), (req, res) => {
    const { name, budget, captain_name, owner_name } = req.body;
    const { id } = req.params;

    // First get existing to keep files if not replaced
    db.get("SELECT logo, sponsor_logo FROM teams WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        const logo = req.files['logo'] ? `/uploads/${req.files['logo'][0].filename}` : row.logo;
        const sponsor = req.files['sponsor_logo'] ? `/uploads/${req.files['sponsor_logo'][0].filename}` : row.sponsor_logo;

        db.run("UPDATE teams SET name = ?, budget = ?, logo = ?, sponsor_logo = ?, captain_name = ?, owner_name = ? WHERE id = ?",
            [name, budget, logo, sponsor, captain_name, owner_name, id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: "Team Updated" });
            }
        );
    });
});

// Delete Team
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM teams WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const io = req.app.get('socketio');
        if (io) io.emit('refresh_data');

        res.json({ message: "Team deleted successfully" });
    });
});

// Delete ALL Teams (for starting fresh league)
router.delete('/reset-all', (req, res) => {
    db.run("DELETE FROM teams", (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const io = req.app.get('socketio');
        if (io) io.emit('refresh_data');

        res.json({ message: "All teams deleted successfully" });
    });
});

module.exports = router;
