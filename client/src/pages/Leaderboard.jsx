import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL, { getApiUrl, getImageUrl } from '../config';
import socket from '../socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Wallet, TrendingUp, Users, Award } from 'lucide-react';

const Leaderboard = () => {
    const [teams, setTeams] = useState([]);
    const [squads, setSquads] = useState({});
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ default_team_budget: 300000 });
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
            const res = await axios.get(getApiUrl('/api/config'));
            setConfig(res.data);
            const sRes = await axios.get(getApiUrl('/api/sponsors'));
            setSponsors(sRes.data);
        } catch (err) {
            console.error("Error fetching config", err);
        }
    };

    const mainSponsor = sponsors.find(s => s.type === 'main' || s.type === 'powered') || (config?.sponsor_logo ? { logo: config.sponsor_logo, name: 'Sponsor' } : null);
    const otherSponsors = sponsors.filter(s => s.type !== 'main' && s.type !== 'powered');

    const fetchData = async () => {
        try {
            const res = await axios.get(getApiUrl('/api/teams'));
            const teamList = res.data;
            setTeams(teamList);

            const squadData = {};
            for (const t of teamList) {
                const sRes = await axios.get(getApiUrl(`/api/teams/${t.id}/squad`));
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
        if (!amount && amount !== 0) return '₹ 0';
        if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} L`;
        return `₹ ${amount.toLocaleString('en-IN')}`;
    };

    if (loading) return (
        <div style={{ background: '#020617', height: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '4px solid rgba(255,215,0,0.1)', borderTopColor: '#ffd700', borderRadius: '50%' }} />
            <div style={{ letterSpacing: '2px', opacity: 0.6 }}>PREPARING LEADERBOARD...</div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)', color: 'white', padding: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '20px',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    {config.tournament_logo && (
                        <motion.img
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                            src={getImageUrl(config.tournament_logo)}
                            style={{ height: 90, filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.3))', background: 'white', padding: '8px', borderRadius: '12px' }}
                            alt="Tournament Logo"
                        />
                    )}
                    <div>
                        <h1 style={{ fontSize: '3.5rem', margin: 0, fontWeight: '900', background: 'linear-gradient(to bottom, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '4px', textTransform: 'uppercase' }}>Team Standings</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                            <div style={{ height: '4px', width: '30px', background: '#ffd700', borderRadius: '2px' }} />
                            <div style={{ opacity: 0.9, letterSpacing: '3px', fontSize: '1rem', fontWeight: '500', color: '#ffd700' }}>SQUAD TRACKER & REAL-TIME STATS</div>
                        </div>
                    </div>
                </div>
                {mainSponsor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px 25px', borderRadius: '15px' }}>
                        <span style={{ opacity: 0.5, fontSize: '0.8rem', letterSpacing: '3px', fontWeight: '600' }}>SPONSORED BY</span>
                        <img src={getImageUrl(mainSponsor.logo)} style={{ height: 50, background: 'white', padding: '5px', borderRadius: '8px' }} alt="Sponsor Logo" />
                    </div>
                )}
            </header>

            {/* 10 Team Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '20px',
                minHeight: 'calc(100vh - 280px)',
                paddingBottom: '20px'
            }}>
                {teams.map((team, idx) => {
                    const squad = squads[team.id] || [];
                    const defaultBudget = config.default_team_budget || 300000;
                    const spent = defaultBudget - team.budget;
                    const totalPlayers = squad.length + (team.captain_name ? 1 : 0) + (team.owner_name ? 1 : 0);

                    return (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                position: 'relative'
                            }}
                        >
                            {/* Team Header */}
                            <div style={{
                                padding: '20px',
                                background: 'rgba(255,255,255,0.03)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '5px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {team.logo ? (
                                            <img src={getImageUrl(team.logo)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'white', borderRadius: '8px', padding: '2px' }} alt="" />
                                        ) : <Shield size={34} color="rgba(255,255,255,0.3)" />}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}>{team.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                                            <Users size={12} color="#ffd700" />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffd700' }}>{totalPlayers} Players</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#f87171', fontWeight: 'bold', textTransform: 'uppercase' }}>Spent</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>{formatMoney(spent)}</div>
                                    </div>
                                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)' }}>
                                        <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 'bold', textTransform: 'uppercase' }}>Balance</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>{formatMoney(team.budget)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Player List (Compact Table) */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <tbody>
                                        {/* Reserved Players (Captain/Owner) */}
                                        {team.owner_name && (
                                            <tr style={{ background: 'rgba(255,215,0,0.08)' }}>
                                                <td style={{ padding: '8px 12px', borderRadius: '12px 0 0 12px', width: '25px' }}><Shield size={14} color="#ffd700" /></td>
                                                <td style={{ padding: '8px 0' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{team.owner_name}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 'bold' }}>OWNER</div>
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', borderRadius: '0 12px 12px 0', opacity: 0.5 }}>₹ 0</td>
                                            </tr>
                                        )}
                                        {team.captain_name && (
                                            <tr style={{ background: 'rgba(34,197,94,0.08)' }}>
                                                <td style={{ padding: '8px 12px', borderRadius: '12px 0 0 12px', width: '25px' }}><Award size={14} color="#4ade80" /></td>
                                                <td style={{ padding: '8px 0' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{team.captain_name}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 'bold' }}>CAPTAIN</div>
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', borderRadius: '0 12px 12px 0', opacity: 0.5 }}>₹ 0</td>
                                            </tr>
                                        )}
                                        {squad.map((player, idx) => (
                                            <tr key={player.id} style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '8px 12px', borderRadius: '12px 0 0 12px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', fontSize: '0.7rem' }}>{idx + 1}</td>
                                                <td style={{ padding: '8px 0' }}>
                                                    <div style={{ fontWeight: '600', color: '#e2e8f0' }}>{player.name}</div>
                                                    <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 'bold' }}>{player.category.toUpperCase()}</div>
                                                </td>
                                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#fff', borderRadius: '0 12px 12px 0' }}>
                                                    {formatMoney(player.sold_price)}
                                                </td>
                                            </tr>
                                        ))}

                                        {totalPlayers === 0 && (
                                            <tr>
                                                <td colSpan="3" style={{ padding: '40px 10px', textAlign: 'center' }}>
                                                    <div style={{ opacity: 0.1, marginBottom: '10px' }}><Shield size={40} style={{ margin: 'auto' }} /></div>
                                                    <div style={{ opacity: 0.3, fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px' }}>PENDING ROSTER</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Team Footer (Progress Bar) */}
                            <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.3)' }}>
                                <div style={{ fontSize: '0.7rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <span style={{ opacity: 0.6 }}>Budget Utilization</span>
                                    <span style={{ color: spent > defaultBudget ? '#ef4444' : '#ffd700' }}>{Math.round((spent / defaultBudget) * 100)}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, (spent / defaultBudget) * 100)}%` }}
                                        style={{
                                            height: '100%',
                                            background: `linear-gradient(90deg, ${spent > defaultBudget * 0.8 ? '#ef4444' : '#ffd700'} 0%, #fbbf24 100%)`,
                                            boxShadow: '0 0 10px rgba(255,215,0,0.3)'
                                        }}
                                    />
                                </div>
                                <div
                                    onClick={() => window.open(`/teams/${team.id}`, '_blank')}
                                    style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', fontWeight: '800', color: '#ffd700', cursor: 'pointer', letterSpacing: '1px' }}
                                >
                                    EXPLORE FULL SQUAD →
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Summary Bar */}
            <footer style={{
                marginTop: '1.5rem',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '1rem',
                fontWeight: '600',
                paddingBottom: otherSponsors.length > 0 ? '80px' : '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={20} color="#ffd700" />
                    <span style={{ opacity: 0.6 }}>Total Players:</span>
                    <span style={{ color: '#fff' }}>{Object.values(squads).flat().length + teams.reduce((acc, t) => acc + (t.captain_name ? 1 : 0) + (t.owner_name ? 1 : 0), 0)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={20} color="#ffd700" />
                    <span style={{ opacity: 0.6 }}>Auction Volume:</span>
                    <span style={{ color: '#fff' }}>{formatMoney(Object.values(squads).flat().reduce((acc, p) => acc + p.sold_price, 0))}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} />
                    <span style={{ opacity: 0.6 }}>Market Status:</span>
                    <span style={{ color: '#22c55e' }}>LIVE</span>
                </div>
            </footer>

            {/* MOVING LOGO MARQUEE FOOTER (Matches Display.jsx) */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                borderTop: '3px solid #ffd700',
                zIndex: 1000,
                boxShadow: '0 -10px 25px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'inline-block', animation: 'marquee-display 60s linear infinite' }}>
                    {/* Combine Teams and Sponsors for the marquee */}
                    {[...teams, ...sponsors].map((item, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '60px' }}>
                            <img
                                src={getImageUrl(item.logo)}
                                style={{ height: 50, marginRight: '15px', objectFit: 'contain' }}
                                alt=""
                            />
                            <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {item.name}
                            </span>
                        </span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {[...teams, ...sponsors].map((item, i) => (
                        <span key={`dup-${i}`} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '60px' }}>
                            <img
                                src={getImageUrl(item.logo)}
                                style={{ height: 50, marginRight: '15px', objectFit: 'contain' }}
                                alt=""
                            />
                            <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {item.name}
                            </span>
                        </span>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes marquee-display {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                *::-webkit-scrollbar { width: 4px; }
                *::-webkit-scrollbar-track { background: transparent; }
                *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
                *::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default Leaderboard;
