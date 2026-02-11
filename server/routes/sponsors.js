const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'sponsor-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Get all sponsors
router.get('/', (req, res) => {
    db.all("SELECT * FROM sponsors ORDER BY type", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add new sponsor
router.post('/', upload.single('logo'), (req, res) => {
    const { name, type } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !logo) return res.status(400).json({ error: 'Name and Logo are required' });

    db.run("INSERT INTO sponsors (name, type, logo) VALUES (?, ?, ?)", [name, type || 'sponsor', logo], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, type: type || 'sponsor', logo });
    });
});

// Delete sponsor
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    // Optional: Delete file logic here but usually fine to leave orphan files
    db.run("DELETE FROM sponsors WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted sponsor" });
    });
});

module.exports = router;
