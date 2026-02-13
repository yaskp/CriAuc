import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL, { getApiUrl, getImageUrl } from '../config';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';
import { Play, RefreshCcw, User, Shield, Star, Shuffle, RotateCcw, AlertTriangle } from 'lucide-react';

const Admin = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pipeline');
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [livePlayerId, setLivePlayerId] = useState(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSet, setFilterSet] = useState('All');

    useEffect(() => {
        fetchPlayers();
        fetchTeams();

        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('auction_update', (data) => {
            console.log("📡 Admin received update:", data.status, data.player?.name);
            if (data.status === 'bidding' && data.player) {
                setLivePlayerId(data.player.id);
            } else {
                setLivePlayerId(null);
                // If a player was just sold or passed, refresh the list immediately
                if (data.status === 'sold' || data.status === 'unsold') {
                    console.log("🔄 Refreshing player list...");
                    fetchPlayers();
                }
            }
        });

        const handleRefresh = () => { fetchPlayers(); fetchTeams(); };
        socket.on('refresh_data', handleRefresh);

        return () => {
            socket.off('auction_update');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('refresh_data', handleRefresh);
        };
    }, []);

    const fetchPlayers = async () => { const res = await axios.get(getApiUrl('/api/players')); setPlayers(res.data); };
    const fetchTeams = async () => { const res = await axios.get(getApiUrl('/api/teams')); setTeams(res.data); };

    const startAuction = (player) => {
        if (!isConnected) return alert("❌ Connection Lost! Check Server.");
        if (player.status === 'sold') return alert("⚠️ Player already sold!");
        if (confirm(`Start auction for ${player.name}?`)) {
            socket.emit('start_auction', player);
            navigate('/'); // Auto-redirect to Console
        }
    };

    const resetPlayer = async (id) => {
        if (confirm("Move player back to UNSOLD?")) {
            await axios.post(getApiUrl(`/api/players/unsold/${id}`));
            fetchPlayers();
        }
    };

    const handleRandomPick = () => {
        const unsold = players.filter(p => p.status === 'unsold');
        // Unique Lots logic
        const uniqueLots = [];
        const seenCombos = new Set();
        unsold.forEach(p => {
            if (p.combo_id) {
                if (!seenCombos.has(p.combo_id)) {
                    seenCombos.add(p.combo_id);
                    uniqueLots.push(p);
                }
            } else {
                uniqueLots.push(p);
            }
        });

        if (uniqueLots.length === 0) return alert("No unsold players left!");
        const random = uniqueLots[Math.floor(Math.random() * uniqueLots.length)];

        if (confirm(`Trigger Lucky Dip animation on Projector?`)) {
            socket.emit('trigger_lucky_dip', random);
            navigate('/'); // Redirect to console
        }
    };

    const unsoldPlayers = players.filter(p => {
        const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSet = filterSet === 'All' || p.auction_set === filterSet;
        return p.status === 'unsold' && matchName && matchSet;
    });

    const soldPlayers = players.filter(p => p.status === 'sold');

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Auction Control Room</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isConnected ? '#22c55e' : '#ef4444' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444' }} />
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{isConnected ? 'SERVER ONLINE' : 'OFFLINE'}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={handleRandomPick}>
                        <Shuffle size={18} /> Lucky Dip
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                        if (confirm("RESET AUCTION STATE TO IDLE?")) socket.emit('update_status', 'idle');
                    }}>
                        <RefreshCcw size={18} /> Reset Hub
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '2rem' }}>
                <button className={`btn ${activeTab === 'pipeline' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('pipeline')}>
                    Auction Pipeline ({unsoldPlayers.length})
                </button>
                <button className={`btn ${activeTab === 'sold' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('sold')}>
                    Recently Sold ({soldPlayers.length})
                </button>
            </div>

            {activeTab === 'pipeline' ? (
                <div className="glass-card">
                    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '10px' }}>
                        <input type="text" placeholder="Search pipeline..." style={{ flex: 1 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <select value={filterSet} onChange={e => setFilterSet(e.target.value)}>
                            <option value="All">All Sets</option>
                            <option>Marquee</option>
                            <option>Icon Player</option>
                            <option>Sponsor Player</option>
                            <option>BAT 1</option>
                            <option>BOWL 1</option>
                            <option>WK 1</option>
                            <option>AL 1</option>
                            <option>Uncapped</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                        {unsoldPlayers.map(p => (
                            <div key={p.id} className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: livePlayerId === p.id ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: 45, height: 45, borderRadius: '10px', background: '#1e293b', overflow: 'hidden' }}>
                                        {p.image ? <img src={getImageUrl(p.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User style={{ padding: '10px', opacity: 0.3 }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{p.category} | {p.auction_set}</div>
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={() => startAuction(p)} style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Play size={18} fill="black" />
                                </button>
                            </div>
                        ))}
                    </div>
                    {unsoldPlayers.length === 0 && <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.3 }}>No players in pipeline matching your view.</div>}
                </div>
            ) : (
                <div className="glass-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Player</th>
                                <th style={{ padding: '10px' }}>Team</th>
                                <th style={{ padding: '10px' }}>Final Price</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {soldPlayers.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px' }}>{p.name}</td>
                                    <td style={{ padding: '10px', color: '#ffd700' }}>{p.team_name}</td>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>₹ {(p.sold_price / 10000000).toFixed(2)} Cr</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        <button className="btn btn-secondary" onClick={() => resetPlayer(p.id)} title="Reset to Pipeline">
                                            <RotateCcw size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: '2rem', padding: '15px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '10px', display: 'flex', gap: '15px' }}>
                <AlertTriangle color="#eab308" />
                <div style={{ fontSize: '0.9rem', color: '#eab308' }}>
                    <strong>Admin Note:</strong> Soldiers are automatically removed from the active pipeline. To add more players or edit existing details, use the <b>Player Registry</b> page.
                </div>
            </div>
        </div>
    );
};
export default Admin;
