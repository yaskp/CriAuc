import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Star, Crown, LayoutDashboard, RefreshCcw, Shuffle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Auction = () => {
    const navigate = useNavigate();
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [auction, setAuction] = useState({ player: null, currentBid: 0, highestBidder: null, status: 'idle', bidHistory: [] });
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [lastBidderTeam, setLastBidderTeam] = useState(null);
    const [lastSoldPlayer, setLastSoldPlayer] = useState(null); // Track last sold player
    const [config, setConfig] = useState({
        tier1_threshold: 10000,
        tier1_increment: 2000,
        tier2_threshold: 20000,
        tier2_increment: 5000,
        tier3_increment: 10000,
        base_price: 10000
    });

    const fetchTeams = () => axios.get('http://localhost:5000/api/teams').then(res => setTeams(res.data));
    const [sponsors, setSponsors] = useState([]);

    const fetchConfig = () => {
        axios.get('http://localhost:5000/api/config').then(res => setConfig(res.data));
        axios.get('http://localhost:5000/api/sponsors').then(res => setSponsors(res.data));
    };

    const mainSponsor = sponsors.find(s => s.type === 'main' || s.type === 'powered') || (config?.sponsor_logo ? { logo: config.sponsor_logo, name: 'Sponsor' } : null);


    const fetchPlayers = () => axios.get('http://localhost:5000/api/players').then(res => setPlayers(res.data));

    useEffect(() => {
        fetchTeams();
        fetchPlayers();
        fetchConfig();
        socket.emit('request_auction_state'); // Sync immediately on mount

        const onAuctionUpdate = (data) => {
            setAuction(data);

            if (data.status === 'sold' || data.status === 'unsold') {
                fetchTeams();
                if (data.status === 'sold' && data.player && data.highestBidder) {
                    setLastSoldPlayer({
                        player: data.player,
                        soldPrice: data.currentBid,
                        buyer: data.highestBidder
                    });
                }
            }

            if (data.highestBidder) {
                axios.get('http://localhost:5000/api/teams').then(res => {
                    const t = res.data.find(x => x.id === data.highestBidder.teamId);
                    setLastBidderTeam(t);
                });
            } else {
                setLastBidderTeam(null);
            }
        };

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('auction_update', onAuctionUpdate);

        const handleRefresh = () => { fetchTeams(); fetchPlayers(); fetchConfig(); };
        socket.on('refresh_data', handleRefresh);

        return () => {
            socket.off('auction_update', onAuctionUpdate);
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('refresh_data', handleRefresh);
        };
    }, []);

    const handleBid = (team) => {
        if (!auction.player) return;

        // Force Number Types to prevent string concatenation errors
        const currentBid = Number(auction.currentBid);
        const basePrice = Number(auction.player.base_price);
        const teamBudget = Number(team.budget);

        console.log(`Bid Attempt: Team ${team.name} (${teamBudget}) vs Current ${currentBid}`);
        console.log("🎯 Auction State:", { currentBid, basePrice, highestBidder: auction.highestBidder, status: auction.status });


        // Logic: If nobody has bid yet (highestBidder is null), the first bid is the Base Price.
        let nextBid;
        if (!auction.highestBidder) {
            nextBid = basePrice;
        } else {
            // Multi-tier increment logic
            let increment;
            if (currentBid < config.tier1_threshold) {
                increment = config.tier1_increment;
            } else if (currentBid < config.tier2_threshold) {
                increment = config.tier2_increment;
            } else {
                increment = config.tier3_increment;
            }
            nextBid = currentBid + increment;
        }


        if (teamBudget < nextBid) {
            alert(`❌ INSUFFICIENT FUNDS!\n\nTeam: ${team.name}\nBudget: ₹${(teamBudget / 100000).toFixed(0)}L\nRequired: ₹${(nextBid / 100000).toFixed(0)}L`);
            return;
        }

        console.log("Placing Bid:", nextBid);
        socket.emit('place_bid', { teamId: team.id, teamName: team.name, amount: nextBid });
    };

    const handleSell = () => {
        if (confirm(`Sell ${auction.player.name} to ${lastBidderTeam ? lastBidderTeam.name : 'Unsold'} for ${formatMoney(auction.currentBid)}?`)) {
            socket.emit('end_auction');
        }
    };

    const formatMoney = (amount) => {
        if (amount >= 10000000) {
            // Check if rounding to 2 decimals hides value (e.g. 1.0005 Cr -> 1.00 Cr)
            const cr = amount / 10000000;
            const rounded = Number(cr.toFixed(2));
            if (Math.abs(cr - rounded) > 0.001) {
                return `₹ ${amount.toLocaleString('en-IN')}`;
            }
            return `₹ ${cr.toFixed(2)} Cr`;
        }
        // For amounts < 1 Cr, show full number with commas (e.g. 10,000, 1,00,000)
        return `₹ ${amount.toLocaleString('en-IN')}`;
    };

    // --- LUCKY DIP PICK SCREEN ---
    if (auction.status === 'lucky_dip') {
        return (
            <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ textAlign: 'center', padding: '3rem', border: '2px solid #ffd700', borderRadius: '30px', minWidth: '450px' }}>
                    <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '2px' }}>🎲 LUCKY DIP RESULT</div>
                    <div style={{ width: 150, height: 150, borderRadius: '50%', background: '#1e293b', margin: '0 auto 20px auto', overflow: 'hidden', border: '4px solid gold' }}>
                        {auction.player.image ? <img src={`http://localhost:5000${auction.player.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Gavel size={60} style={{ padding: '40px', opacity: 0.2 }} />}
                    </div>
                    <h1 style={{ fontSize: '3.5rem', margin: '0 0 1rem 0', fontWeight: '900' }}>{auction.player.name}</h1>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '10px', display: 'inline-block', marginBottom: '2.5rem' }}>
                        {auction.player.category} | {auction.player.auction_set}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ padding: '20px', fontSize: '1.4rem', borderRadius: '15px', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                            REVEAL ON PROJECTOR...
                        </div>
                        <button className="btn btn-secondary" onClick={() => socket.emit('update_status', 'idle')} style={{ padding: '12px' }}>
                            Cancel Pick
                        </button>
                    </div>
                </motion.div>
                <div style={{ marginTop: '2rem', color: '#475569', textAlign: 'center' }}>
                    PROJECTOR IS CURRENTLY SHOWING NAMES SHUFFLE...
                </div>
            </div>
        );
    }

    // --- IDLE / WAITING SCREEN ---
    if (auction.status === 'idle') {
        return (
            <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: '2rem', position: 'relative' }}>

                {/* Connection Status Indicator */}
                <div style={{ position: 'absolute', top: 20, right: 20, padding: '5px 15px', borderRadius: '20px', background: isConnected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isConnected ? '#22c55e' : '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444' }} />
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>

                {lastSoldPlayer ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ marginBottom: '3rem', textAlign: 'center', padding: '2.5rem', border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '30px' }}>
                        <div style={{ color: '#22c55e', fontWeight: 'bold', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '3px' }}>
                            ✓ LAST SOLD
                        </div>
                        <h2 style={{ fontSize: '3rem', margin: '0.5rem 0', fontWeight: '900' }}>{lastSoldPlayer.player.name}</h2>
                        <div style={{ fontSize: '1.8rem', color: '#ffd700', fontWeight: 'bold', margin: '1rem 0' }}>{lastSoldPlayer.buyer.teamName}</div>
                        <div style={{ fontSize: '1.4rem', color: 'white', background: 'rgba(0,0,0,0.3)', padding: '10px 25px', borderRadius: '15px', display: 'inline-block' }}>
                            Sold @ {formatMoney(lastSoldPlayer.soldPrice)}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }}>
                        <Gavel size={120} color="#334155" />
                    </motion.div>
                )}

                <h1 style={{ fontSize: '2.5rem', color: '#475569', marginTop: '1.5rem' }}>Ready for Next Lot...</h1>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn btn-primary"
                        onClick={() => {
                            const unsold = players.filter(p => !p.team_id && p.status === 'unsold');
                            if (unsold.length === 0) return alert("No unsold players left!");
                            const random = unsold[Math.floor(Math.random() * unsold.length)];
                            if (confirm(`Trigger Lucky Dip for ${random.name}?`)) {
                                socket.emit('trigger_lucky_dip', random);
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 35px', fontSize: '1.2rem', borderRadius: '15px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)' }}
                    >
                        <Shuffle size={20} /> Lucky Dip
                    </button>

                    <button className="btn btn-secondary" onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 35px', fontSize: '1.2rem', borderRadius: '15px' }}>
                        <LayoutDashboard size={20} /> Control Room
                    </button>

                    <button className="btn btn-secondary" onClick={() => fetchTeams()} style={{ padding: '15px 30px', borderRadius: '15px' }}>
                        <RefreshCcw size={20} /> Refresh Budgets
                    </button>
                </div>
            </div>
        );
    }

    // --- ACTIVE AUCTION SCREEN ---
    return (
        <div style={{ height: '100vh', overflow: 'hidden', padding: '1rem', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>

            {/* Header / Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                {config.tournament_logo && (
                    <img src={`http://localhost:5000${config.tournament_logo}`} style={{ height: 50, marginRight: '15px' }} alt="Tournament Logo" />
                )}

                <div style={{ background: '#1e293b', padding: '10px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333', flex: 1 }}>
                    <div style={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>Current Set: <span style={{ color: '#fff', fontWeight: 'bold' }}>{auction.player.auction_set}</span></div>
                    <div style={{ color: '#ffd700', fontWeight: 'bold' }}>BASE PRICE: {formatMoney(auction.player.base_price)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '15px', gap: '15px' }}>
                    {mainSponsor && (
                        <img src={`http://localhost:5000${mainSponsor.logo}`} style={{ height: 40 }} alt="Sponsor Logo" />
                    )}
                    <div style={{ color: isConnected ? '#22c55e' : '#ef4444', fontSize: '1rem', marginTop: '-2px' }}>
                        {isConnected ? '●' : '○'}
                    </div>
                </div>
            </div>

            <div style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '25% 50% 25%', gap: '1rem' }}>

                {/* LEFT: PLAYER CARD */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {auction.isCombo ? (
                        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '4px solid #ec4899', padding: '15px' }}>
                            <div style={{ position: 'absolute', top: 10, left: 10, background: '#ec4899', color: 'white', fontWeight: 'bold', padding: '5px 10px', borderRadius: '5px', fontSize: '0.8rem' }}>
                                COMBO
                            </div>
                            <h2 style={{ fontSize: '1.8rem', color: '#ec4899', margin: '0 0 15px 0', textTransform: 'uppercase', textAlign: 'center' }}>
                                {auction.player.combo_display_name || 'Combo Set'}
                            </h2>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', overflowY: 'auto', maxHeight: '100%' }}>
                                {auction.comboPlayers && auction.comboPlayers.map(p => (
                                    <div key={p.id} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '15px', width: '100px' }}>
                                        <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 5px auto', border: p.is_icon ? '2px solid gold' : '2px solid #555' }}>
                                            <img src={p.image ? `http://localhost:5000${p.image}` : 'https://via.placeholder.com/150'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                        <div style={{ color: '#aaa', fontSize: '0.7rem' }}>{p.category}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: auction.player.is_icon === 1 ? '4px solid gold' : '2px solid #333' }}>
                            <motion.img
                                key={auction.player.image}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                src={auction.player.image ? `http://localhost:5000${auction.player.image}` : 'https://via.placeholder.com/400?text=No+Image'}
                                style={{ height: '250px', objectFit: 'contain', zIndex: 1 }}
                            />
                            <div style={{ zIndex: 2, textAlign: 'center', marginTop: '15px', padding: '0 10px' }}>
                                <h1 style={{ fontSize: '2.2rem', margin: 0, color: auction.player.is_icon === 1 ? 'gold' : 'white' }}>
                                    {auction.player.name}
                                </h1>
                                <div style={{ fontSize: '1rem', color: '#aaa', textTransform: 'uppercase' }}>{auction.player.category}</div>
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
                                    {auction.player.is_captain === 1 && <span className="badge" style={{ background: '#e11d48', fontSize: '0.7rem' }}>CAPTAIN</span>}
                                    {auction.player.is_icon === 1 && <span className="badge" style={{ background: 'gold', color: 'black', fontSize: '0.7rem' }}>ICON</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MIDDLE: BIDDING CONSOLE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Current Bid Display */}
                    <div className="glass-card" style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px solid gold', background: 'rgba(0,0,0,0.4)' }}>
                        <div style={{ fontSize: '1rem', color: '#aaa', textTransform: 'uppercase' }}>Current Bid</div>
                        <motion.div
                            key={auction.currentBid}
                            initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                            style={{ fontSize: '4rem', fontWeight: '900', color: '#ffd700', fontFamily: 'monospace' }}
                        >
                            {formatMoney(auction.currentBid)}
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {lastBidderTeam && (
                                <motion.div
                                    key={lastBidderTeam.id}
                                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}
                                >
                                    {lastBidderTeam.name}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Team Grid Buttons */}
                    <div className="glass-card" style={{ flex: 1, padding: '15px', overflowY: 'auto' }}>
                        <h3 style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem', letterSpacing: '2px' }}>CLICK TEAM TO BID</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                            {teams.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleBid(t)}
                                    disabled={lastBidderTeam?.id === t.id}
                                    style={{
                                        padding: '10px 5px', borderRadius: '10px', border: '1px solid #334155',
                                        background: lastBidderTeam?.id === t.id ? '#22c55e' : '#1e293b',
                                        color: 'white', cursor: lastBidderTeam?.id === t.id ? 'default' : 'pointer',
                                        opacity: lastBidderTeam?.id === t.id ? 1 : 0.8,
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                                        transition: 'all 0.1s',
                                        height: '75px'
                                    }}
                                >
                                    {t.logo ? <img src={`http://localhost:5000${t.logo}`} style={{ height: 25, objectFit: 'contain' }} /> : <div style={{ fontSize: '0.8rem' }}>{t.name.substring(0, 3)}</div>}
                                    <div style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 'bold' }}>
                                        + ₹{(auction.currentBid < config.tier1_threshold ? config.tier1_increment : auction.currentBid < config.tier2_threshold ? config.tier2_increment : config.tier3_increment).toLocaleString()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SOLD / UNSOLD SECTION */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                            onClick={handleSell}
                            style={{
                                flex: 3,
                                background: lastBidderTeam ? '#ef4444' : '#64748b',
                                color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
                                padding: '1.2rem', border: 'none', borderRadius: '12px', cursor: 'pointer',
                                textTransform: 'uppercase', letterSpacing: '2px',
                                boxShadow: lastBidderTeam ? '0 10px 20px rgba(239, 68, 68, 0.3)' : 'none'
                            }}
                        >
                            {lastBidderTeam ? '🔨 SOLD / CLOSE' : '🔨 MARK UNSOLD'}
                        </button>

                        <button
                            onClick={() => { if (confirm("Undo last bid?")) socket.emit('undo_bid'); }}
                            disabled={!auction.bidHistory || auction.bidHistory.length <= 1}
                            style={{
                                flex: 1,
                                background: '#1e293b',
                                color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold',
                                padding: '1rem', border: '1px solid #334155', borderRadius: '12px', cursor: 'pointer',
                                opacity: (!auction.bidHistory || auction.bidHistory.length <= 1) ? 0.3 : 1
                            }}
                        >
                            <RefreshCcw size={18} style={{ marginBottom: '5px' }} /><br />
                            Undo
                        </button>
                    </div>
                </div>

                {/* RIGHT: BIDDING LOG */}
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', color: '#94a3b8', fontSize: '0.9rem', letterSpacing: '1px' }}>
                        📜 BIDDING LOG
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '8px' }}>
                            {auction.bidHistory && auction.bidHistory.map((bid, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        background: i === auction.bidHistory.length - 1 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: i === auction.bidHistory.length - 1 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 'bold', color: i === auction.bidHistory.length - 1 ? '#22c55e' : '#fff' }}>
                                            {bid.teamName}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{bid.time}</span>
                                    </div>
                                    <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1rem' }}>
                                        {formatMoney(bid.amount)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default Auction;
