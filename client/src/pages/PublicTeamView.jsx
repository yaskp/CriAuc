import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, User, Award, Download, Share2, QrCode as QrCodeIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PublicTeamView = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [squad, setSquad] = useState([]);
    const [config, setConfig] = useState({});
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQR, setShowQR] = useState(false);
    const squadRef = useRef(null);

    useEffect(() => {
        fetchData();
        generateQRCode();
    }, [teamId]);

    const fetchData = async () => {
        try {
            const [configRes, teamRes, squadRes] = await Promise.all([
                axios.get('http://localhost:5000/api/config'),
                axios.get('http://localhost:5000/api/teams'),
                axios.get(`http://localhost:5000/api/teams/${teamId}/squad`)
            ]);

            setConfig(configRes.data);
            const foundTeam = teamRes.data.find(t => t.id === Number(teamId));
            setTeam(foundTeam);
            setSquad(squadRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching team data", err);
            setLoading(false);
        }
    };

    const generateQRCode = async () => {
        try {
            const url = window.location.href;
            const qrDataUrl = await QRCode.toDataURL(url, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (err) {
            console.error('QR Code generation failed', err);
        }
    };

    const handleDownload = async (format) => {
        if (!squadRef.current) return;

        const canvas = await html2canvas(squadRef.current, {
            useCORS: true,
            scale: 2,
            backgroundColor: '#0f172a'
        });

        const imgData = canvas.toDataURL('image/png');
        const fileName = `${team.name.replace(/\s+/g, '_')}_Squad`;

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

    const formatMoney = (amount) => {
        if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
        if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(1)} L`;
        return `₹ ${amount.toLocaleString('en-IN')}`;
    };

    if (loading) return (
        <div style={{ background: '#0f172a', height: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: 40, height: 40, border: '4px solid rgba(255,215,0,0.1)', borderTopColor: '#ffd700', borderRadius: '50%' }} />
        </div>
    );

    if (!team) return (
        <div style={{ background: '#0f172a', height: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
            <Shield size={80} color="#475569" />
            <h2>Team Not Found</h2>
        </div>
    );

    const totalPlayers = squad.length + (team.captain_name ? 1 : 0) + (team.owner_name ? 1 : 0);
    const defaultBudget = config.default_team_budget || 300000;
    const spent = defaultBudget - team.budget;

    return (
        <div style={{ height: '100vh', background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)', color: 'white', padding: '1.5rem', fontFamily: 'Outfit, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {config.tournament_logo && (
                        <img src={`http://localhost:5000${config.tournament_logo}`} style={{ height: 60, background: 'white', padding: '6px', borderRadius: '10px' }} alt="Tournament" />
                    )}
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>Team Squad</h1>
                        <p style={{ margin: '5px 0 0 0', opacity: 0.6, fontSize: '0.85rem' }}>Public View - Read Only</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setShowQR(!showQR)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                    >
                        <QrCodeIcon size={16} /> {showQR ? 'Hide' : 'Show'} QR
                    </button>
                    <button
                        onClick={() => handleDownload('image')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Download size={16} /> Image
                    </button>
                    <button
                        onClick={() => handleDownload('pdf')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#0f172a',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                        }}
                    >
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && qrCodeUrl && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        padding: '30px',
                        borderRadius: '20px',
                        zIndex: 1000,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        textAlign: 'center'
                    }}
                >
                    <h3 style={{ margin: '0 0 20px 0', color: '#0f172a' }}>Scan to View Squad</h3>
                    <img src={qrCodeUrl} alt="QR Code" style={{ width: 300, height: 300, border: '10px solid #0f172a', borderRadius: '15px' }} />
                    <p style={{ margin: '20px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Share this QR code with your team!</p>
                    <button
                        onClick={() => setShowQR(false)}
                        style={{
                            marginTop: '20px',
                            padding: '10px 30px',
                            background: '#0f172a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Close
                    </button>
                </motion.div>
            )}

            {/* Squad Card */}
            <div ref={squadRef} style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                borderRadius: '20px',
                border: '2px solid rgba(255, 215, 0, 0.2)',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
            }}>
                {/* Team Header */}
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
                    borderBottom: '2px solid rgba(255, 215, 0, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {team.logo && (
                            <div style={{
                                width: 80,
                                height: 80,
                                background: 'white',
                                borderRadius: '16px',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                            }}>
                                <img src={`http://localhost:5000${team.logo}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                            </div>
                        )}
                        <div>
                            <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>{team.name}</h2>
                            <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '6px' }}>
                                {team.owner_name && <span>Owner: {team.owner_name}</span>}
                                {team.owner_name && team.captain_name && <span> • </span>}
                                {team.captain_name && <span style={{ color: '#ffd700' }}>Captain: {team.captain_name}</span>}
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffd700' }}>{totalPlayers}</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Total Players</div>
                        <div style={{ marginTop: '12px', fontSize: '1.1rem', fontWeight: 'bold', color: '#22c55e' }}>
                            {formatMoney(team.budget)} Left
                        </div>
                    </div>
                </div>

                {/* Squad Table */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderRadius: '10px 0 0 10px' }}>Player</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Set</th>
                                <th style={{ padding: '12px', textAlign: 'right', borderRadius: '0 10px 10px 0' }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.owner_name && (
                                <tr style={{ background: 'rgba(236, 72, 153, 0.1)', borderRadius: '10px' }}>
                                    <td style={{ padding: '12px', borderRadius: '10px 0 0 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Shield size={18} color="#ec4899" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#ec4899' }}>{team.owner_name}</div>
                                                <span style={{ fontSize: '0.65rem', color: '#ec4899' }}>★ OWNER</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>Sponsor</td>
                                    <td style={{ padding: '12px', opacity: 0.6 }}>Reserved</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderRadius: '0 10px 10px 0' }}>₹ 0</td>
                                </tr>
                            )}
                            {team.captain_name && (
                                <tr style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
                                    <td style={{ padding: '12px', borderRadius: '10px 0 0 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Award size={18} color="#22c55e" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#22c55e' }}>{team.captain_name}</div>
                                                <span style={{ fontSize: '0.65rem', color: '#22c55e' }}>© CAPTAIN</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>Captain</td>
                                    <td style={{ padding: '12px', opacity: 0.6 }}>Reserved</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderRadius: '0 10px 10px 0' }}>₹ 0</td>
                                </tr>
                            )}
                            {squad.map((player, idx) => (
                                <tr key={player.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <td style={{ padding: '12px', borderRadius: '10px 0 0 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#334155', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {player.image ? (
                                                    <img src={`http://localhost:5000${player.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                ) : (
                                                    <User size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{player.name}</div>
                                                {player.is_icon === 1 && <span style={{ fontSize: '0.65rem', color: '#ffd700' }}>★ ICON</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>{player.category}</td>
                                    <td style={{ padding: '12px', opacity: 0.6 }}>{player.auction_set}</td>
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#ffd700', borderRadius: '0 10px 10px 0' }}>{formatMoney(player.sold_price)}</td>
                                </tr>
                            ))}
                            {totalPlayers === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '50px', textAlign: 'center', opacity: 0.3 }}>
                                        <Shield size={50} style={{ margin: '0 auto 15px auto', opacity: 0.2 }} />
                                        <div>No players in squad yet</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Stats */}
                <div style={{
                    padding: '16px 20px',
                    background: 'rgba(0,0,0,0.3)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Total Spent</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ef4444' }}>{formatMoney(spent)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Budget Utilization</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ffd700' }}>
                            {Math.round((spent / defaultBudget) * 100)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Watermark */}
            <div style={{ textAlign: 'center', marginTop: '15px', opacity: 0.4, fontSize: '0.8rem', flexShrink: 0 }}>
                Powered by CricAuction • Public View
            </div>
        </div>
    );
};

export default PublicTeamView;
