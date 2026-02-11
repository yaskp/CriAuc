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
            currentAuction.currentBid = amount;
            currentAuction.highestBidder = { teamId, teamName };

            currentAuction.bidHistory.push({
                teamId, teamName, amount, time: new Date().toLocaleTimeString()
            });

            io.emit('auction_update', currentAuction);
            io.emit('new_bid', { teamName, amount });
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
        currentAuction = {
            player: player,
            status: 'lucky_dip',
            bidHistory: []
        };
        io.emit('auction_update', currentAuction);
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
