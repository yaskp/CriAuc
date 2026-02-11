import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL, { getApiUrl, getImageUrl } from '../config';
import { motion } from 'framer-motion';
import { Shield, User, Award, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PublicLeaderboard = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [squads, setSquads] = useState({});
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({ default_team_budget: 300000 });
    const [sponsors, setSponsors] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [configRes, teamsRes, sponsorsRes] = await Promise.all([
                axios.get(getApiUrl('/api/config')),
                axios.get(getApiUrl('/api/teams')),
                axios.get(getApiUrl('/api/sponsors'))
            ]);

            setConfig(configRes.data);
            setTeams(teamsRes.data);
            setSponsors(sponsorsRes.data);

            const squadData = {};
            for (const t of teamsRes.data) {
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

    const mainSponsor = sponsors.find(s => s.type === 'main' || s.type === 'powered') || (config?.sponsor_logo ? { logo: config.sponsor_logo, name: 'Sponsor' } : null);

    if (loading) return (
        <div style={{ background: '#020617', height: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '4px solid rgba(255,215,0,0.1)', borderTopColor: '#ffd700', borderRadius: '50%' }} />
            <div style={{ letterSpacing: '2px', opacity: 0.6 }}>LOADING STANDINGS...</div>
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
                            <div style={{ opacity: 0.9, letterSpacing: '3px', fontSize: '1rem', fontWeight: '500', color: '#ffd700' }}>PUBLIC VIEW - READ ONLY</div>
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

            {/* Team Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '20px',
                minHeight: 'calc(100vh - 280px)',
                paddingBottom: '100px'
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
                            onClick={() => window.open(`/public/team/${team.id}`, '_blank')}
                            style={{
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'transform 0.3s ease'
                            }}
                            whileHover={{ y: -5 }}
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

                            {/* View Squad Button */}
                            <div style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#ffd700', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                    VIEW FULL SQUAD <ExternalLink size={14} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Moving Logo Marquee */}
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
                    {[...teams, ...sponsors].map((item, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '60px' }}>
                            <img src={getImageUrl(item.logo)} style={{ height: 50, marginRight: '15px', objectFit: 'contain' }} alt="" />
                            <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.name}</span>
                        </span>
                    ))}
                    {[...teams, ...sponsors].map((item, i) => (
                        <span key={`dup-${i}`} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '60px' }}>
                            <img src={getImageUrl(item.logo)} style={{ height: 50, marginRight: '15px', objectFit: 'contain' }} alt="" />
                            <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.name}</span>
                        </span>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes marquee-display {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
};

export default PublicLeaderboard;
