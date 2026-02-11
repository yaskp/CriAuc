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
    db.all("SELECT * FROM teams", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
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
