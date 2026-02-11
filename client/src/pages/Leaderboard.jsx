import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { motion } from 'framer-motion';
import { Shield, User, Wallet } from 'lucide-react';

const Leaderboard = () => {
    const [teams, setTeams] = useState([]);
    const [squads, setSquads] = useState({});
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ default_team_budget: 80000000 });
    const [sponsors, setSponsors] = useState([]);

    useEffect(() => {
        fetchData();
        fetchConfig();
        const handleRefresh = () => { fetchData(); fetchConfig(); };
        socket.on('auction_ended', handleRefresh);
        socket.on('refresh_data', handleRefresh);
        return () => {
            socket.off('auction_ended', handleRefresh);
            socket.off('refresh_data', handleRefresh);
        };
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/config');
            setConfig(res.data);
            const sRes = await axios.get('http://localhost:5000/api/sponsors');
            setSponsors(sRes.data);
        } catch (err) {
            console.error("Error fetching config", err);
        }
    };

    const mainSponsor = sponsors.find(s => s.type === 'main' || s.type === 'powered') || (config?.sponsor_logo ? { logo: config.sponsor_logo, name: 'Sponsor' } : null);
    const otherSponsors = sponsors.filter(s => s.type !== 'main' && s.type !== 'powered');

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/teams');
            const teamList = res.data;
            setTeams(teamList);

            const squadData = {};
            for (const t of teamList) {
                const sRes = await axios.get(`http://localhost:5000/api/teams/${t.id}/squad`);
                squadData[t.id] = sRes.data;
            }
            setSquads(squadData);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching leaderboard data", err);
            setLoading(false);
        }
    };

    const formatMoney = (amount) => {
        if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
        return `₹ ${(amount / 100000).toFixed(0)} L`;
    };

    if (loading) return <div style={{ background: '#0f172a', height: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Leaderboard...</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: 'white', padding: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {config.tournament_logo && <img src={`http://localhost:5000${config.tournament_logo}`} style={{ height: 80 }} alt="Tournament Logo" />}
                    <div>
                        <h1 style={{ fontSize: '3rem', margin: 0, color: '#ffd700', textTransform: 'uppercase', letterSpacing: '5px' }}>Team Standings</h1>
                        <div style={{ opacity: 0.5, letterSpacing: '3px', fontSize: '0.9rem' }}>IPL AUCTION 2026 - LIVE SQUAD TRACKER</div>
                    </div>
                </div>
                {mainSponsor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ opacity: 0.5, fontSize: '0.8rem', letterSpacing: '2px' }}>POWERED BY</span>
                        <img src={`http://localhost:5000${mainSponsor.logo}`} style={{ height: 60 }} alt="Sponsor Logo" />
                    </div>
                )}
            </header>

            {/* 10 Team Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '15px',
                height: 'calc(100vh - 200px)', // Reduced height to fit footer/marquee
                paddingBottom: '20px'
            }}>
                {teams.map(team => {
                    const squad = squads[team.id] || [];
                    const spent = (config.default_team_budget || 80000000) - team.budget;

                    return (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '15px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Team Header */}
                            <div style={{
                                padding: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                {team.logo ? (
                                    <img src={`http://localhost:5000${team.logo}`} style={{ height: 50, width: 50, objectFit: 'contain' }} alt="" />
                                ) : <Shield size={40} />}
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.0rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>
                                        <span style={{ color: '#ef4444' }}>Spent: {formatMoney(spent)}</span>
                                        <span style={{ margin: '0 4px' }}>•</span>
                                        <span style={{ color: '#22c55e' }}>Bal: {formatMoney(team.budget)}</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '10px' }}>
                                    {squad.length}
                                </div>
                            </div>

                            {/* Player List (Compact Table) */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '5px' }}>
                                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {squad.length > 0 ? (
                                            squad.map((player, idx) => (
                                                <tr key={player.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                    <td style={{ padding: '6px 4px', width: '20px', opacity: 0.4 }}>{idx + 1}</td>
                                                    <td style={{ padding: '6px 4px' }}>
                                                        <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                                                            {player.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>{player.category[0]}</div>
                                                    </td>
                                                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>
                                                        {player.sold_price >= 10000000 ? (player.sold_price / 10000000).toFixed(1) + 'C' : (player.sold_price / 100000).toFixed(0) + 'L'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', opacity: 0.2, fontSize: '0.7rem' }}>EMPTY SQUAD</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Team Footer (Progress Bar) */}
                            <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ fontSize: '0.6rem', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Budget Used</span>
                                    <span>{Math.round((spent / (config.default_team_budget || 80000000)) * 100)}%</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(spent / (config.default_team_budget || 80000000)) * 100}%`, background: 'linear-gradient(90deg, #ef4444 0%, #fbbf24 100%)' }} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Bar */}
            <footer style={{
                marginTop: '1.0rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '10px 0',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '0.9rem',
                opacity: 0.6,
                paddingBottom: otherSponsors.length > 0 ? '60px' : '10px' // Add padding for marquee
            }}>
                <div>Players Sold: {Object.values(squads).flat().length}</div>
                <div>Auction Volume: {formatMoney(Object.values(squads).flat().reduce((acc, p) => acc + p.sold_price, 0))}</div>
                <div>Market Status: <span style={{ color: '#22c55e' }}>LIVE</span></div>
            </footer>
            {/* Sponsor Marquee */}
            {otherSponsors.length > 0 && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.95)', padding: '12px 0', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid #333', zIndex: 1000 }}>
                    <div style={{ display: 'inline-block', animation: 'marquee 25s linear infinite', paddingLeft: '100%' }}>
                        {otherSponsors.map((s, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '60px' }}>
                                <img src={`http://localhost:5000${s.logo}`} style={{ height: 40, marginRight: '15px', objectFit: 'contain' }} />
                                <span style={{ color: '#ccc', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.type}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
};

export default Leaderboard;
