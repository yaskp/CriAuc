const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Import Routes
const playerRoutes = require('./routes/players');
const teamRoutes = require('./routes/teams');
const configRoutes = require('./routes/config');
const sponsorRoutes = require('./routes/sponsors');

app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/config', configRoutes);
app.use('/api/sponsors', sponsorRoutes);

// --- STATIC FRONTEND SERVING (For Render/Production) ---
// 1. Serve static files from the React dist folder
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// 2. Catch-all route for SPA (React Router)
// This MUST be the last route. It sends index.html for any request that doesn't match API or static files.
app.get('*', (req, res) => {
    // Only send index.html if it's not a request for a missing static file (like a .png)
    if (req.path.startsWith('/api') || req.path.includes('.')) {
        return res.status(404).json({ message: 'Not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// Socket Logic for Auction
let currentAuction = {
    player: null,
    currentBid: 0,
    highestBidder: null,
    status: 'idle',
    bidHistory: []
};

const broadcastUpdate = () => {
    io.emit('auction_update', currentAuction);
};

const resetAuction = () => {
    currentAuction = {
        player: null, currentBid: 0, highestBidder: null, status: 'idle', bidHistory: []
    };
    broadcastUpdate();
};

app.set('socketio', io);
app.set('resetAuction', resetAuction);
app.set('broadcastUpdate', broadcastUpdate);

io.on('connection', (socket) => {
    // Send state on connection
    socket.emit('auction_update', currentAuction);

    // Allow manual refresh of state
    socket.on('request_auction_state', () => {
        socket.emit('auction_update', currentAuction);
    });

    socket.on('start_auction', (player) => {
        console.log("⚡ START AUCTION REQUEST:", player.name, "Combo:", player.combo_id);

        // Fetch config first to ensure we use correct base price and multipliers
        db.get("SELECT * FROM auction_config WHERE id = 1", [], (err, config) => {
            const auctionConfig = config || {
                base_price: 10000,
                combo_base_price_mode: 'per_combo',
                combo_size: 2
            };

            if (player.combo_id) {
                db.all("SELECT * FROM players WHERE combo_id = ?", [player.combo_id], (err2, comboPlayers) => {
                    if (err2) { console.error(err2); return; }

                    // Calculate Base Price based on Config Mode
                    let startingBid = Number(auctionConfig.base_price);
                    if (auctionConfig.combo_base_price_mode === 'per_player') {
                        startingBid = Number(auctionConfig.base_price) * comboPlayers.length;
                    }

                    currentAuction = {
                        player: player,
                        comboPlayers: comboPlayers,
                        isCombo: true,
                        currentBid: startingBid,
                        highestBidder: null,
                        status: 'bidding',
                        bidHistory: [{ teamName: 'Starting Price', amount: startingBid, time: new Date().toLocaleTimeString() }]
                    };
                    io.emit('auction_update', currentAuction);
                    console.log("✅ COMBO AUCTION STARTED.", currentAuction);
                });
            } else {
                // For individual players, use player.base_price but fallback to config if missing
                const startingBid = Number(player.base_price) || Number(auctionConfig.base_price);

                currentAuction = {
                    player: player,
                    isCombo: false,
                    currentBid: startingBid,
                    highestBidder: null,
                    status: 'bidding',
                    bidHistory: [{ teamName: 'Starting Price', amount: startingBid, time: new Date().toLocaleTimeString() }]
                };
                io.emit('auction_update', currentAuction);
                console.log("✅ AUCTION STARTED.", currentAuction);
            }
        });
    });

    socket.on('place_bid', ({ teamId, teamName, amount }) => {
        console.log(`💰 BID RECEIVED: ${teamName} - ${amount}`);

        const isSameTeam = currentAuction.highestBidder?.teamId === teamId;
        const isValidAmount = amount > currentAuction.currentBid || (!currentAuction.highestBidder && amount === currentAuction.currentBid);

        if (currentAuction.status === 'bidding' && isValidAmount && !isSameTeam) {
            // --- MINIMUM RESERVE LOGIC ---
            db.get("SELECT * FROM auction_config WHERE id = 1", [], (err, config) => {
                if (err || !config) return;

                const hasCap = config.has_captain_player || 0;
                const hasSpo = config.has_sponsor_player || 0;
                const capPrice = Number(config.captain_price) || 0;
                const comboMode = config.combo_mode || 0;
                const comboSize = config.combo_size || 2;
                const squadSizeItems = config.squad_size || 11; // items to buy (combos or players)
                const targetTotalPlayers = comboMode === 1 ? (squadSizeItems * comboSize) : squadSizeItems;

                db.get(`
                    SELECT t.budget, 
                    (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) as players_in_db,
                    (CASE WHEN t.captain_name IS NOT NULL AND t.captain_name != '' THEN 1 ELSE 0 END) as has_cap_filled,
                    (CASE WHEN t.sponsor_logo IS NOT NULL AND t.sponsor_logo != '' THEN 1 ELSE 0 END) as has_spo_filled
                    FROM teams t WHERE t.id = ?
                `, [teamId], (err, teamData) => {
                    if (err || !teamData) return;

                    const currentCount = teamData.players_in_db + teamData.has_cap_filled + (hasSpo ? teamData.has_spo_filled : 0);
                    const purchaseSize = currentAuction.isCombo ? (currentAuction.comboPlayers?.length || comboSize) : 1;

                    // --- SQUAD SIZE LIMIT CHECK ---
                    if (currentCount >= targetTotalPlayers) {
                        const msg = `SQUAD FULL! ${teamName} already has ${currentCount}/${targetTotalPlayers} players and cannot bid further.`;
                        console.log(`❌ BID REJECTED: ${msg}`);
                        io.emit('error', { message: msg, teamName: teamName });
                        return;
                    }

                    if (currentCount + purchaseSize > targetTotalPlayers) {
                        const msg = `SQUAD LIMIT EXCEEDED! ${teamName} has ${currentCount} players and cannot buy ${purchaseSize} more players (Limit: ${targetTotalPlayers}).`;
                        console.log(`❌ BID REJECTED: ${msg}`);
                        io.emit('error', { message: msg, teamName: teamName });
                        return;
                    }

                    const playersLeftAfterThis = Math.max(0, targetTotalPlayers - (currentCount + purchaseSize));

                    let reserveNeeded = 0;
                    if (comboMode === 1) {
                        // In combo mode, we reserve based on items (combos) remaining
                        const combosLeft = Math.ceil(playersLeftAfterThis / comboSize);
                        if (config.combo_base_price_mode === 'per_player') {
                            reserveNeeded = playersLeftAfterThis * config.base_price;
                        } else {
                            reserveNeeded = combosLeft * config.base_price;
                        }
                    } else {
                        reserveNeeded = playersLeftAfterThis * config.base_price;
                    }

                    // Also reserve for Captain if not filled yet
                    if (hasCap && !teamData.has_cap_filled) {
                        reserveNeeded += capPrice;
                    }

                    const maxAllowedBid = teamData.budget - reserveNeeded;

                    if (amount > maxAllowedBid) {
                        const msg = `MINIMUM RESERVE VIOLATION! ${teamName} has ${currentCount}/${targetTotalPlayers} slots filled. Bidding for ${purchaseSize} more players. They must reserve ₹${reserveNeeded.toLocaleString()} for the remaining ${playersLeftAfterThis} players. Max allowed bid: ₹${maxAllowedBid.toLocaleString()}`;
                        console.log(`❌ BID REJECTED: ${msg}`);
                        io.emit('error', { message: msg, teamName: teamName });
                        return;
                    }

                    // Proceed with Bid
                    currentAuction.currentBid = amount;
                    currentAuction.highestBidder = { teamId, teamName };
                    currentAuction.bidHistory.push({
                        teamId, teamName, amount, time: new Date().toLocaleTimeString()
                    });

                    io.emit('auction_update', currentAuction);
                    io.emit('new_bid', { teamName, amount });
                });
            });
        }
    });

    socket.on('undo_bid', () => {
        if (currentAuction.status === 'bidding' && currentAuction.bidHistory.length > 1) {
            currentAuction.bidHistory.pop();
            const lastBid = currentAuction.bidHistory[currentAuction.bidHistory.length - 1];
            currentAuction.currentBid = lastBid.amount;

            if (currentAuction.bidHistory.length === 1) {
                currentAuction.highestBidder = null;
            } else {
                currentAuction.highestBidder = { teamId: lastBid.teamId, teamName: lastBid.teamName };
            }
            io.emit('auction_update', currentAuction);
        }
    });

    socket.on('trigger_lucky_dip', (player) => {
        db.get("SELECT status, team_id, combo_id FROM players WHERE id = ?", [player.id], (err, row) => {
            if (row && row.status === 'unsold' && !row.team_id) {
                if (row.combo_id) {
                    db.all("SELECT * FROM players WHERE combo_id = ?", [row.combo_id], (err2, comboPlayers) => {
                        currentAuction = {
                            player: player,
                            comboPlayers: comboPlayers,
                            isCombo: true,
                            status: 'lucky_dip',
                            bidHistory: []
                        };
                        io.emit('auction_update', currentAuction);
                    });
                } else {
                    currentAuction = {
                        player: player,
                        isCombo: false,
                        status: 'lucky_dip',
                        bidHistory: []
                    };
                    io.emit('auction_update', currentAuction);
                }
            } else {
                socket.emit('error', { message: 'This player is already sold or unavailable!' });
                socket.emit('refresh_data');
            }
        });
    });

    socket.on('end_auction', () => {
        if (currentAuction.status === 'bidding') {
            const { player, currentBid, highestBidder, isCombo, comboPlayers } = currentAuction;

            if (highestBidder) {
                db.get("SELECT budget FROM teams WHERE id = ?", [highestBidder.teamId], (err, team) => {
                    if (!team || team.budget < currentBid) {
                        io.emit('error', { message: 'Insufficient Funds!' });
                        return;
                    }

                    db.run("UPDATE teams SET budget = budget - ? WHERE id = ?", [currentBid, highestBidder.teamId], (err) => {
                        if (err) return;

                        if (isCombo && comboPlayers) {
                            const pricePerPlayer = currentBid / comboPlayers.length;
                            comboPlayers.forEach(p => {
                                db.run("UPDATE players SET status = 'sold', team_id = ?, sold_price = ? WHERE id = ?",
                                    [highestBidder.teamId, pricePerPlayer, p.id]);
                            });
                        } else {
                            db.run("UPDATE players SET status = 'sold', team_id = ?, sold_price = ? WHERE id = ?",
                                [highestBidder.teamId, currentBid, player.id]);
                        }

                        currentAuction.status = 'sold';
                        io.emit('auction_update', currentAuction);
                        io.emit('auction_ended', { success: true, player, soldTo: highestBidder, price: currentBid, isCombo });

                        setTimeout(() => resetAuction(), 2000);
                    });
                });
            } else {
                if (isCombo && comboPlayers) {
                    comboPlayers.forEach(p => db.run("UPDATE players SET status = 'unsold' WHERE id = ?", [p.id]));
                } else {
                    db.run("UPDATE players SET status = 'unsold' WHERE id = ?", [player.id]);
                }

                currentAuction.status = 'unsold';
                io.emit('auction_update', currentAuction);
                io.emit('auction_ended', { success: false, player, isCombo });

                setTimeout(() => resetAuction(), 2000);
            }
        }
    });

    socket.on('update_status', (status) => {
        currentAuction.status = status;
        io.emit('auction_update', currentAuction);
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
