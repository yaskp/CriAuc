import React, { useState, useEffect } from 'react';
import socket from '../socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, Star, Crown, User, Shuffle } from 'lucide-react';
import axios from 'axios';

const Display = () => {
    const [auction, setAuction] = useState({ player: null, currentBid: 0, highestBidder: null, status: 'idle', bidHistory: [] });
    const [lastBidderTeam, setLastBidderTeam] = useState(null);
    const [lastSold, setLastSold] = useState(null);
    const [config, setConfig] = useState({
        tier1_threshold: 10000,
        tier1_increment: 2000,
        tier2_threshold: 20000,
        tier2_increment: 5000,
        tier3_increment: 10000,
        base_price: 10000
    });
    const [sponsors, setSponsors] = useState([]);
    const [teams, setTeams] = useState([]);

    // Use a ref to keep track of the current auction state inside the socket listener 
    // without triggering effect re-runs
    const auctionStateRef = React.useRef(auction);
    useEffect(() => {
        auctionStateRef.current = auction;
    }, [auction]);

    useEffect(() => {
        const bidSound = new Audio('/bid.mp3');
        const soldSound = new Audio('/gavel.mp3');
        socket.emit('request_auction_state'); // Sync immediately on mount

        const onAuctionUpdate = (data) => {
            // Sound logic using Ref to check previous state
            const prevAuction = auctionStateRef.current;
            if (data.status === 'bidding' && data.currentBid > prevAuction.currentBid && prevAuction.status !== 'idle') {
                bidSound.currentTime = 0;
                bidSound.play().catch(e => console.warn("Sound blocked", e));
            }

            // Capture Last Sold
            if (data.status === 'sold' && data.player && data.highestBidder) {
                console.log("🎯 CAPTURING SOLD PLAYER:", data.player.name);
                axios.get('http://localhost:5000/api/teams').then(res => {
                    const t = res.data.find(x => x.id === data.highestBidder.teamId);
                    setLastSold({ player: data.player, price: data.currentBid, team: t });
                });
            }

            if (data.status === 'bidding' || data.status === 'lucky_dip') {
                setLastSold(null);
            }

            setAuction(data);

            if (data.highestBidder) {
                axios.get('http://localhost:5000/api/teams').then(res => {
                    const t = res.data.find(x => x.id === data.highestBidder.teamId);
                    setLastBidderTeam(t);
                });
            } else {
                setLastBidderTeam(null);
            }
        };

        const onAuctionEnded = (data) => {
            if (data.success) {
                soldSound.currentTime = 0;
                soldSound.play().catch(e => console.warn("Sound blocked", e));
            }
        };

        const onRefresh = () => {
            axios.get('http://localhost:5000/api/config').then(res => setConfig(res.data));
            axios.get('http://localhost:5000/api/sponsors').then(res => setSponsors(res.data));
            axios.get('http://localhost:5000/api/teams').then(res => setTeams(res.data));
        };

        socket.on('auction_update', onAuctionUpdate);
        socket.on('auction_ended', onAuctionEnded);
        socket.on('refresh_data', onRefresh);

        return () => {
            socket.off('auction_update', onAuctionUpdate);
            socket.off('auction_ended', onAuctionEnded);
            socket.off('refresh_data', onRefresh);
        };
    }, []);

    useEffect(() => {
        axios.get('http://localhost:5000/api/config').then(res => setConfig(res.data));
        axios.get('http://localhost:5000/api/sponsors').then(res => setSponsors(res.data));
        axios.get('http://localhost:5000/api/teams').then(res => setTeams(res.data));
    }, []);

    // Filter Sponsors
    const mainSponsor = sponsors.find(s => s.type === 'main' || s.type === 'powered') || (config?.sponsor_logo ? { logo: config.sponsor_logo, name: 'Sponsor' } : null);
    const otherSponsors = sponsors.filter(s => s.type !== 'main' && s.type !== 'powered');

    const formatMoney = (amount) => {
        if (!amount) return '₹ 0';
        if (amount >= 10000000) {
            const cr = amount / 10000000;
            const rounded = Number(cr.toFixed(2));
            if (Math.abs(cr - rounded) > 0.001) {
                return `₹ ${amount.toLocaleString('en-IN')}`;
            }
            return `₹ ${cr.toFixed(2)} Cr`;
        }
        return `₹ ${amount.toLocaleString('en-IN')}`;
    };

    const [unsoldPlayers, setUnsoldPlayers] = useState([]);
    const [shufflePlayer, setShufflePlayer] = useState(null);
    const [shuffleDone, setShuffleDone] = useState(false);

    useEffect(() => {
        if (auction.status === 'lucky_dip') {
            setShuffleDone(false);
            axios.get('http://localhost:5000/api/players').then(res => {
                const list = res.data.filter(p => p.status === 'unsold' && !p.team_id);
                setUnsoldPlayers(list);

                // Shuffle logic
                let count = 0;
                const interval = setInterval(() => {
                    setShufflePlayer(list[Math.floor(Math.random() * list.length)]);
                    count++;
                    if (count > 25) {
                        clearInterval(interval);
                        setShufflePlayer(auction.player); // Land on the real one
                        setShuffleDone(true);
                    }
                }, 120);
            });
        }
    }, [auction.status, auction.player]);

    const MarqueeFooter = () => (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, width: '100%',
            background: 'rgba(255, 255, 255, 0.95)', padding: '12px 0',
            overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '3px solid #ffd700',
            zIndex: 1000, boxShadow: '0 -10px 25px rgba(0,0,0,0.2)'
        }}>
            <div style={{ display: 'inline-block', animation: 'marquee-display 60s linear infinite' }}>
                {[...teams, ...sponsors].map((item, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '60px' }}>
                        <img src={`http://localhost:5000${item.logo}`} style={{ height: 50, marginRight: '15px', objectFit: 'contain' }} alt="" />
                        <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.name}</span>
                    </span>
                ))}
                {[...teams, ...sponsors].map((item, i) => (
                    <span key={`dup-${i}`} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '60px' }}>
                        <img src={`http://localhost:5000${item.logo}`} style={{ height: 50, marginRight: '15px', objectFit: 'contain' }} alt="" />
                        <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.name}</span>
                    </span>
                ))}
            </div>
        </div>
    );

    if (auction.status === 'lucky_dip') {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)', color: 'white' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', color: '#818cf8', fontWeight: 'bold', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '10px' }}>
                        🎲 LUCKY DIP 🎲
                    </div>

                    <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={shufflePlayer?.id}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -50, opacity: 0 }}
                                style={{ fontSize: '5.5rem', fontWeight: '900', color: '#ffd700', textShadow: '0 0 30px rgba(255, 215, 0, 0.4)' }}
                            >
                                {shufflePlayer?.name || 'PICKING...'}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {shuffleDone ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <button
                                onClick={() => socket.emit('start_auction', auction.player)}
                                style={{
                                    background: '#ef4444', color: 'white', padding: '20px 60px', borderRadius: '50px',
                                    fontSize: '2.5rem', fontWeight: '900', border: 'none', cursor: 'pointer',
                                    boxShadow: '0 0 40px rgba(239, 68, 68, 0.5)', textTransform: 'uppercase'
                                }}
                            >
                                START AUCTION
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ color: '#475569', fontSize: '1.5rem', letterSpacing: '3px' }}>
                            SHUFFLING PLAYERS...
                        </div>
                    )}
                </motion.div>
                <MarqueeFooter />
                <style>{`
                    @keyframes marquee-display {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `}</style>
            </div>
        );
    }

    if (auction.status === 'idle') {
        if (lastSold) {
            // SHOW SOLD SCREEN INSTEAD OF IDLE
            return (
                <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #064e3b 0%, #061713 100%)', position: 'relative' }}>
                    {/* Upper Branding */}
                    <div style={{ position: 'absolute', top: 40, width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 50px', alignItems: 'center' }}>
                        {config?.tournament_logo && <img src={`http://localhost:5000${config.tournament_logo}`} style={{ height: 100, background: 'white', padding: '10px', borderRadius: '15px' }} />}
                        {mainSponsor && <img src={`http://localhost:5000${mainSponsor.logo}`} style={{ height: 80, background: 'white', padding: '10px', borderRadius: '15px' }} />}
                    </div>

                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ textAlign: 'center' }}>
                        <div style={{ background: '#ffd700', color: 'black', padding: '10px 40px', borderRadius: '50px', fontWeight: 'bold', fontSize: '2rem', marginBottom: '2rem', boxShadow: '0 0 50px gold' }}>
                            SOLD
                        </div>
                        <div style={{ width: '40vh', height: '40vh', borderRadius: '20px', overflow: 'hidden', margin: '0 auto', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', padding: '15px' }}>
                            {lastSold.player.image ? (
                                <img src={`http://localhost:5000${lastSold.player.image}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ color: '#0f172a', opacity: 0.1 }}><User size={150} /></div>
                            )}
                        </div>
                        <h1 style={{ fontSize: '4rem', margin: '1rem 0', color: 'white', textTransform: 'uppercase', fontWeight: '900', textShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>{lastSold.player.name}</h1>
                        <h2 style={{ fontSize: '3rem', color: '#ffd700', fontWeight: 'bold' }}>{lastSold.team.name}</h2>
                        <h3 style={{ fontSize: '2rem', color: 'white', background: 'rgba(0,0,0,0.3)', display: 'inline-block', padding: '10px 30px', borderRadius: '15px', marginTop: '1rem' }}>{formatMoney(lastSold.price)}</h3>
                    </motion.div>

                    <MarqueeFooter />
                    <style>{`
                        @keyframes marquee-display {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                    `}</style>
                </div>
            );
        }

        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)', overflow: 'hidden' }}>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 5 }}>
                    {config?.tournament_logo ? (
                        <img src={`http://localhost:5000${config.tournament_logo}`} style={{ height: 200, filter: 'drop-shadow(0 0 20px gold)', background: 'white', padding: '15px', borderRadius: '20px' }} />
                    ) : (
                        <Gavel size={150} color="#ffd700" />
                    )}
                </motion.div>
                <h1 style={{ fontSize: '5rem', marginTop: '2rem', textTransform: 'uppercase', letterSpacing: '15px', color: 'white', textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}>IPL Auction 2026</h1>
                <h2 style={{ color: '#94a3b8', letterSpacing: '5px' }}>OFFICIAL BROADCAST</h2>
                {mainSponsor && (
                    <div style={{ position: 'absolute', bottom: 120, right: 40, display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: 'white', opacity: 0.6, fontSize: '0.9rem', textTransform: 'uppercase' }}>Sponsored by</span>
                        <img src={`http://localhost:5000${mainSponsor.logo}`} style={{ height: 60, background: 'white', padding: '5px', borderRadius: '10px' }} />
                    </div>
                )}
                <MarqueeFooter />
                <style>{`
                    @keyframes marquee-display {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', overflow: 'hidden', padding: '2rem', background: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '1rem', position: 'relative' }}>
                {config?.tournament_logo && (
                    <img src={`http://localhost:5000${config.tournament_logo}`} style={{ height: 60, marginRight: '20px', background: 'white', padding: '5px', borderRadius: '8px' }} />
                )}
                <div style={{ fontSize: '1.5rem', color: '#ffd700', fontWeight: 'bold', textTransform: 'uppercase', flex: 1 }}>
                    SET: <span style={{ color: 'white' }}>{auction.player.auction_set}</span>
                </div>
                {config?.sponsor_logo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px' }}>
                        <span style={{ color: 'white', opacity: 0.5, fontSize: '0.8rem' }}>SPONSORED BY</span>
                        <img src={`http://localhost:5000${config.sponsor_logo}`} style={{ height: 40, background: 'white', padding: '3px', borderRadius: '6px' }} />
                    </div>
                )}
                <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>
                    LOT: #{auction.player.id}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '30% 45% 25%', height: '85vh', marginTop: '1rem' }}>
                {/* PLAYER CARD */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {auction.isCombo ? (
                        <div style={{ textAlign: 'center', zIndex: 10, width: '100%' }}>
                            <h2 style={{ fontSize: '2rem', color: '#ec4899', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '3px' }}>
                                {auction.player.combo_display_name || 'COMBO PAIR'}
                            </h2>
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {auction.comboPlayers && auction.comboPlayers.map(p => (
                                    <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: p.is_icon ? '3px solid gold' : '3px solid rgba(255,255,255,0.2)' }}>
                                            <img src={p.image ? `http://localhost:5000${p.image}` : 'https://via.placeholder.com/200'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', margin: '10px 0', color: 'white' }}>{p.name}</h3>
                                        {p.is_captain === 1 && <span style={{ background: '#e11d48', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.6rem' }}>CAPTAIN</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <motion.img
                                key={auction.player.image}
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                src={auction.player.image ? `http://localhost:5000${auction.player.image}` : 'https://via.placeholder.com/600?text=No+Photo'}
                                style={{ height: '60%', objectFit: 'contain', zIndex: 10 }}
                            />
                            <div style={{ textAlign: 'center', marginTop: '1rem', zIndex: 10 }}>
                                <h1 style={{ fontSize: '3rem', fontWeight: '900', margin: 0, color: auction.player.is_icon ? 'gold' : 'white' }}>{auction.player.name}</h1>
                                <h2 style={{ color: '#cbd5e1', fontSize: '1.5rem', textTransform: 'uppercase' }}>{auction.player.category}</h2>
                            </div>
                        </>
                    )}
                </div>

                {/* BIDDING STATUS */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 2rem', borderLeft: '1px solid #333', borderRight: '1px solid #333' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                        <h3 style={{ color: '#94a3b8', fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Bid</h3>
                        <motion.div
                            key={auction.currentBid}
                            initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                            style={{ fontSize: '6rem', fontWeight: '900', color: '#ffd700', fontFamily: 'monospace' }}
                        >
                            {formatMoney(auction.currentBid)}
                        </motion.div>
                    </div>

                    <div style={{ marginTop: '2rem', minHeight: '150px' }}>
                        <AnimatePresence mode="wait">
                            {lastBidderTeam ? (
                                <motion.div
                                    key={lastBidderTeam.id}
                                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '20px', borderLeft: '8px solid gold' }}
                                >
                                    {lastBidderTeam.logo && <img src={`http://localhost:5000${lastBidderTeam.logo}`} style={{ height: 100, background: 'white', padding: '8px', borderRadius: '15px' }} />}
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Highest Bidder</div>
                                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{lastBidderTeam.name}</div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div style={{ fontSize: '1.5rem', color: '#475569', textAlign: 'center' }}>Waiting for bids...</div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* BIDDING LOG */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
                    <div style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}>
                        Bidding Sequence
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '10px' }}>
                            {auction.bidHistory && auction.bidHistory.map((bid, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: i === auction.bidHistory.length - 1 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                                        border: i === auction.bidHistory.length - 1 ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 'bold', color: i === auction.bidHistory.length - 1 ? '#22c55e' : 'white', fontSize: '1rem' }}>
                                            {bid.teamName}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{bid.time}</span>
                                    </div>
                                    <div style={{ color: '#ffd700', fontWeight: '900', fontSize: '1.2rem', marginTop: '2px' }}>
                                        {formatMoney(bid.amount)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <MarqueeFooter />

            <style>{`
                @keyframes marquee-display {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default Display;
