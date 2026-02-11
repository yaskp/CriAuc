import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Wallet, Shield, ShoppingBag, TrendingUp, Info, ArrowLeft, Download, FileText, Image as ImageIcon, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Teams = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [squads, setSquads] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedTeamId, setSelectedTeamId] = useState(teamId ? Number(teamId) : null);
    const squadRef = React.useRef(null);
    const [viewMode, setViewMode] = useState(teamId ? 'details' : 'grid');
    const [config, setConfig] = useState({ default_team_budget: 80000000 });
    const [sponsors, setSponsors] = useState([]);

    useEffect(() => {
        if (teamId) {
            setSelectedTeamId(Number(teamId));
            setViewMode('grid'); // We use grid + selectedTeamId to show details
        }
    }, [teamId]);

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
            console.error("Error fetching team data", err);
            setLoading(false);
        }
    };

    const formatMoney = (amount) => {
        if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(1)} L`;
        return `₹ ${amount.toLocaleString('en-IN')}`;
    };

    const handleDownload = async (format) => {
        if (!squadRef.current) return;

        const canvas = await html2canvas(squadRef.current, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#0f172a'
        });

        const imgData = canvas.toDataURL('image/png');
        const fileName = `${selectedTeam.name.replace(/\s+/g, '_')}_Squad`;

        if (format === 'pdf') {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${fileName}.pdf`);
        } else {
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `${fileName}.png`;
            link.click();
        }
    };

    if (loading) return <div className="container" style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Loading War Room...</div>;

    const selectedTeam = selectedTeamId ? teams.find(t => t.id === Number(selectedTeamId)) : null;
    const selectedSquad = selectedTeam ? squads[selectedTeam.id] || [] : [];

    // All sold players for consolidated view
    const allSoldPlayers = Object.values(squads).flat().sort((a, b) => b.sold_price - a.sold_price);

    // Reserved players for consolidated view
    const allReservedPlayers = teams.flatMap(t => {
        const res = [];
        if (t.owner_name) res.push({ id: `ro-${t.id}`, name: t.owner_name, team_id: t.id, category: 'Owner/Sponsor', sold_price: 0, auction_set: 'Reserved', status: 'reserved', is_icon: 1 });
        if (t.captain_name) res.push({ id: `rc-${t.id}`, name: t.captain_name, team_id: t.id, category: 'Captain', sold_price: 0, auction_set: 'Reserved', status: 'reserved', is_captain: 1 });
        return res;
    });

    const displaySoldPlayers = [...allReservedPlayers, ...allSoldPlayers];

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {config.tournament_logo && <img src={`http://localhost:5000${config.tournament_logo}`} style={{ height: 60, background: 'white', padding: '5px', borderRadius: '8px' }} alt="Tournament Logo" />}
                    <div>
                        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>War Room Strategy</h1>
                        <p style={{ opacity: 0.6, margin: 0 }}>Monitor team rosters and financial health in real-time.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {mainSponsor && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ opacity: 0.5, fontSize: '0.8rem', letterSpacing: '2px' }}>SPONSORED BY</span>
                            <img src={`http://localhost:5000${mainSponsor.logo}`} style={{ height: 40, background: 'white', padding: '4px', borderRadius: '6px' }} alt="Sponsor Logo" />
                        </div>
                    )}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '10px', height: 'fit-content' }}>
                        <button
                            onClick={() => { setViewMode('grid'); setSelectedTeamId(null); navigate('/teams'); }}
                            className={`btn ${viewMode === 'grid' ? 'btn-primary' : ''}`}
                            style={{ padding: '5px 15px', borderRadius: '8px', border: 'none', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? 'black' : 'white' }}
                        >Grid View</button>
                        <button
                            onClick={() => { setViewMode('table'); setSelectedTeamId(null); navigate('/teams'); }}
                            className={`btn ${viewMode === 'table' ? 'btn-primary' : ''}`}
                            style={{ padding: '5px 15px', borderRadius: '8px', border: 'none', background: viewMode === 'table' ? 'var(--primary)' : 'transparent', color: viewMode === 'table' ? 'black' : 'white' }}
                        >Full Table</button>
                    </div>
                </div>
            </header>

            {/* Statistics Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Wallet size={20} color="#3b82f6" />
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Total Budget</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {formatMoney(teams.reduce((sum, t) => sum + (config.default_team_budget || 300000), 0))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <TrendingUp size={20} color="#ef4444" />
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Total Spent</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                        {formatMoney(teams.reduce((sum, t) => sum + ((config.default_team_budget || 300000) - t.budget), 0))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '15px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <ShoppingBag size={20} color="#22c55e" />
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Total Remaining</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
                        {formatMoney(teams.reduce((sum, t) => sum + t.budget, 0))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '15px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <Info size={20} color="#fbbf24" />
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Avg Spending</div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                        {formatMoney(teams.reduce((sum, t) => sum + ((config.default_team_budget || 300000) - t.budget), 0) / (teams.length || 1))}
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {selectedTeam ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key="detail-view"
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => { setSelectedTeamId(null); navigate('/teams'); }}
                                className="btn btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <ArrowLeft size={16} /> Back to War Room
                            </button>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => window.open(`/public/team/${selectedTeamId}`, '_blank')}
                                    className="btn btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}
                                >
                                    <Share2 size={16} /> View Public Page
                                </button>
                                <button
                                    onClick={() => handleDownload('image')}
                                    className="btn btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                >
                                    <ImageIcon size={16} /> Download Image
                                </button>
                                <button
                                    onClick={() => handleDownload('pdf')}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)' }}
                                >
                                    <FileText size={16} /> Download PDF
                                </button>
                            </div>
                        </div>

                        <div ref={squadRef} className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '2px solid rgba(255, 215, 0, 0.2)' }}>
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {selectedTeam.logo && <img src={`http://localhost:5000${selectedTeam.logo}`} style={{ height: 50, background: 'white', padding: '4px', borderRadius: '8px' }} alt="" />}
                                    <div>
                                        <h2 style={{ margin: 0 }}>{selectedTeam.name} Squad</h2>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>
                                            {selectedTeam.owner_name && <span>Owner: {selectedTeam.owner_name}</span>}
                                            {selectedTeam.owner_name && selectedTeam.captain_name && <span> • </span>}
                                            {selectedTeam.captain_name && <span style={{ color: '#ffd700' }}>Captain: {selectedTeam.captain_name}</span>}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#22c55e' }}>Purse Remaining: {formatMoney(selectedTeam.budget)}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{selectedSquad.length + (selectedTeam.captain_name ? 1 : 0) + (selectedTeam.owner_name ? 1 : 0)}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Players Collected</div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                                        <tr>
                                            <th style={{ padding: '15px' }}>Player</th>
                                            <th style={{ padding: '15px' }}>Category</th>
                                            <th style={{ padding: '15px' }}>Set</th>
                                            <th style={{ padding: '15px' }}>Price Paid</th>
                                            <th style={{ padding: '15px', textAlign: 'right' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Virtual Reserved Players */}
                                        {selectedTeam.owner_name && (
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(236, 72, 153, 0.05)' }}>
                                                <td style={{ padding: '10px 15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <ShoppingBag size={20} color="#ec4899" />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', color: '#ec4899' }}>{selectedTeam.owner_name}</div>
                                                            <span style={{ fontSize: '0.6rem', color: '#ec4899', textTransform: 'uppercase' }}>★ Owner/Sponsor</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>Sponsor</td>
                                                <td style={{ padding: '15px', opacity: 0.6 }}>Reserved</td>
                                                <td style={{ padding: '15px', fontWeight: 'bold' }}>₹ 0</td>
                                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                                    <span className="badge" style={{ background: '#ec4899', color: 'white' }}>Icon</span>
                                                </td>
                                            </tr>
                                        )}
                                        {selectedTeam.captain_name && (
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(34, 197, 94, 0.05)' }}>
                                                <td style={{ padding: '10px 15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Shield size={20} color="#22c55e" />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', color: '#22c55e' }}>{selectedTeam.captain_name}</div>
                                                            <span style={{ fontSize: '0.6rem', color: '#22c55e', textTransform: 'uppercase' }}>© Captain</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>Captain</td>
                                                <td style={{ padding: '15px', opacity: 0.6 }}>Reserved</td>
                                                <td style={{ padding: '15px', fontWeight: 'bold' }}>₹ 0</td>
                                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                                    <span className="badge" style={{ background: '#22c55e', color: 'white' }}>Captain</span>
                                                </td>
                                            </tr>
                                        )}
                                        {selectedSquad.length > 0 ? (
                                            selectedSquad.map(p => (
                                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '10px 15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', overflow: 'hidden' }}>
                                                                {p.image ? (
                                                                    <img src={`http://localhost:5000${p.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                                ) : <User size={20} style={{ margin: '10px' }} />}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                                                {p.is_icon === 1 && <span style={{ fontSize: '0.6rem', color: '#ffd700', textTransform: 'uppercase', marginRight: '5px' }}>★ Icon</span>}
                                                                {p.combo_display_name && <span style={{ fontSize: '0.6rem', color: '#ec4899', border: '1px solid #ec4899', padding: '1px 3px', borderRadius: '3px' }}>🔗 {p.combo_display_name}</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>{p.category}</td>
                                                    <td style={{ padding: '15px', opacity: 0.6 }}>{p.auction_set}</td>
                                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{formatMoney(p.sold_price)}</td>
                                                    <td style={{ padding: '15px', textAlign: 'right' }}>
                                                        <span className="badge badge-success" style={{ background: '#065f46', color: '#34d399' }}>Purchased</span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (selectedTeam.captain_name || selectedTeam.owner_name) ? null : (
                                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', opacity: 0.3 }}>No players in squad.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : viewMode === 'table' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="table-view" className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ margin: 0 }}>Consolidated Purchase List</h2>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>Player</th>
                                        <th style={{ padding: '15px' }}>Team</th>
                                        <th style={{ padding: '15px' }}>Category</th>
                                        <th style={{ padding: '15px' }}>Price</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Set</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displaySoldPlayers.length > 0 ? (
                                        displaySoldPlayers.map(p => {
                                            const team = teams.find(t => t.id === p.team_id);
                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '10px 15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            {p.image ? (
                                                                <img src={`http://localhost:5000${p.image}`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                                            ) : (
                                                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <User size={20} />
                                                                </div>
                                                            )}
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                                                {p.combo_display_name && <div style={{ fontSize: '0.7rem', color: '#ec4899' }}>🔗 {p.combo_display_name}</div>}
                                                                {p.status === 'reserved' && <div style={{ fontSize: '0.6rem', color: '#fbbf24' }}>RESERVED</div>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {team?.logo && <img src={`http://localhost:5000${team.logo}`} style={{ height: 20, background: 'white', padding: '2px', borderRadius: '4px' }} alt="" />}
                                                            {team?.name}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '15px' }}>{p.category}</td>
                                                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatMoney(p.sold_price)}</td>
                                                    <td style={{ padding: '15px', textAlign: 'right', opacity: 0.5 }}>{p.auction_set}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan="5" style={{ padding: '100px', textAlign: 'center', opacity: 0.3 }}>No players sold yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="grid-view" className="grid grid-3" style={{ marginBottom: '2rem' }}>
                        {teams.map(t => {
                            const squad = squads[t.id] || [];
                            const spent = (config.default_team_budget || 300000) - t.budget;

                            return (
                                <motion.div
                                    key={t.id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => { setSelectedTeamId(t.id); navigate(`/teams/${t.id}`); }}
                                    className="glass-card"
                                    style={{
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.03)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {t.logo ? (
                                                <img src={`http://localhost:5000${t.logo}`} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'white', padding: '2px' }} alt={t.name} />
                                            ) : (
                                                <Shield size={24} color="#666" />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t.name}</h3>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>
                                                {t.owner_name && <span>{t.owner_name}</span>}
                                                {t.owner_name && t.captain_name && <span> • </span>}
                                                {t.captain_name && <span style={{ color: '#ffd700' }}>C: {t.captain_name}</span>}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '5px' }}>{squad.length + (t.captain_name ? 1 : 0) + (t.owner_name ? 1 : 0)} Players</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '2px' }}>Spent</div>
                                            <div style={{ fontWeight: 'bold', color: '#ef4444', fontSize: '0.9rem' }}>{formatMoney(spent)}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '8px', marginBottom: '2px' }}>Balance</div>
                                            <div style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '1rem' }}>{formatMoney(t.budget)}</div>
                                        </div>
                                    </div>

                                    {/* Mini Progress Bar */}
                                    <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(spent / (config.default_team_budget || 300000)) * 100}%`,
                                            background: 'linear-gradient(90deg, #ef4444 0%, #fbbf24 100%)',
                                            height: '100%',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.7rem', opacity: 0.5 }}>
                                        <span>{((spent / (config.default_team_budget || 300000)) * 100).toFixed(1)}% Used</span>
                                        <span>{((t.budget / (config.default_team_budget || 300000)) * 100).toFixed(1)}% Left</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {viewMode === 'table' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ margin: 0 }}>Consolidated Purchase List</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <tr>
                                    <th style={{ padding: '15px' }}>Player</th>
                                    <th style={{ padding: '15px' }}>Team</th>
                                    <th style={{ padding: '15px' }}>Category</th>
                                    <th style={{ padding: '15px' }}>Price</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Set</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displaySoldPlayers.length > 0 ? (
                                    displaySoldPlayers.map(p => {
                                        const team = teams.find(t => t.id === p.team_id);
                                        return (
                                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '10px 15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        {p.image ? (
                                                            <img src={`http://localhost:5000${p.image}`} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                                        ) : (
                                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <User size={20} />
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                                            {p.combo_display_name && <div style={{ fontSize: '0.7rem', color: '#ec4899' }}>🔗 {p.combo_display_name}</div>}
                                                            {p.status === 'reserved' && <div style={{ fontSize: '0.6rem', color: '#fbbf24' }}>RESERVED</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {team?.logo && <img src={`http://localhost:5000${team.logo}`} style={{ height: 20 }} alt="" />}
                                                        {team?.name}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>{p.category}</td>
                                                <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatMoney(p.sold_price)}</td>
                                                <td style={{ padding: '15px', textAlign: 'right', opacity: 0.5 }}>{p.auction_set}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="5" style={{ padding: '100px', textAlign: 'center', opacity: 0.3 }}>No players sold yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div >
    );
};

export default Teams;
