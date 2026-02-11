import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, RefreshCcw, AlertTriangle, Database, Users, UserX, Settings as SettingsIcon, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        default_team_budget: 300000,
        base_price: 5000,
        squad_size: 11,
        has_sponsor_player: 1,
        tier1_threshold: 10000,
        tier1_increment: 1000,
        tier2_threshold: 20000,
        tier2_increment: 2000,
        tier3_increment: 5000,
        combo_mode: 0,
        combo_size: 2,
        combo_base_price_mode: 'per_combo',
        has_captain_player: 0,
        captain_price: 0,
        sponsor_logo: null,
        tournament_logo: null
    });
    const [logoFiles, setLogoFiles] = useState({ tournament: null, sponsor: null });
    const [sponsors, setSponsors] = useState([]);
    const [newSponsor, setNewSponsor] = useState({ name: '', type: 'co', file: null });

    useEffect(() => {
        fetchConfig();
        fetchSponsors();
    }, []);

    const fetchSponsors = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/sponsors');
            setSponsors(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAddSponsor = async (e) => {
        e.preventDefault();
        if (!newSponsor.name || !newSponsor.file) return alert('Name and Logo required');

        const formData = new FormData();
        formData.append('name', newSponsor.name);
        formData.append('type', newSponsor.type);
        formData.append('logo', newSponsor.file);

        try {
            setLoading(true);
            await axios.post('http://localhost:5000/api/sponsors', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewSponsor({ name: '', type: 'co', file: null });
            fetchSponsors();
            alert('✅ Sponsor added successfully!');
        } catch (err) {
            alert('❌ Error adding sponsor');
        }
        setLoading(false);
    };

    const handleDeleteSponsor = async (id) => {
        if (!confirm('Delete this sponsor?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/sponsors/${id}`);
            fetchSponsors();
        } catch (err) { alert('Error deleting'); }
    };

    const fetchConfig = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/config');
            setConfig(res.data);
        } catch (err) {
            console.error('Error fetching config:', err);
        }
    };

    const handleConfigSave = async () => {
        if (!confirm('💾 Save Auction Configuration?\n\nThis will update:\n- Branding Logos\n- Default team budget\n- Bid increment amounts\n- Increment threshold\n\nContinue?')) return;

        setLoading(true);
        try {
            const formData = new FormData();
            // Append all config fields
            Object.keys(config).forEach(key => {
                // Don't append existing logo URLs as text, backend handles them via file upload or keeps existing
                if (key !== 'tournament_logo' && key !== 'sponsor_logo') {
                    formData.append(key, config[key]);
                }
            });

            // Append new files if selected
            if (logoFiles.tournament) formData.append('tournament_logo', logoFiles.tournament);
            if (logoFiles.sponsor) formData.append('sponsor_logo', logoFiles.sponsor);

            const res = await axios.put('http://localhost:5000/api/config', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setConfig(res.data); // Update state with new text/paths
            setLogoFiles({ tournament: null, sponsor: null }); // Reset file inputs
            alert('✅ Configuration saved successfully!');
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
        setLoading(false);
    };

    // Helper function to safely format numbers
    const formatNumber = (value) => (value || 0).toLocaleString();

    const handleResetAuction = async () => {
        const budgetDisplay = config.default_team_budget >= 10000000
            ? `₹${(config.default_team_budget / 10000000).toFixed(1)} Cr`
            : `₹${(config.default_team_budget / 100000).toFixed(0)} L`;

        if (!confirm(`⚠️ RESET AUCTION?\n\nThis will:\n- Mark all players as UNSOLD\n- Remove team assignments\n- Reset team budgets to ${budgetDisplay}\n\nPlayers and teams will NOT be deleted.\n\nContinue?`)) return;

        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/players/reset');
            alert('✅ Auction reset successfully! All players are now unsold.');
            window.location.reload();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
        setLoading(false);
    };

    const handleDeleteAllPlayers = async () => {
        if (!confirm('🚨 DELETE ALL PLAYERS?\n\nThis will PERMANENTLY delete ALL players from the database.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) return;

        if (!confirm('⚠️ FINAL WARNING!\n\nYou are about to delete ALL players permanently.\n\nType "DELETE" in the next prompt to confirm.')) return;

        const confirmation = prompt('Type "DELETE" to confirm:');
        if (confirmation !== 'DELETE') {
            alert('❌ Deletion cancelled. Confirmation text did not match.');
            return;
        }

        setLoading(true);
        try {
            await axios.delete('http://localhost:5000/api/players/reset-all');
            alert('✅ All players deleted successfully!');
            window.location.reload();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
        setLoading(false);
    };

    const handleDeleteAllTeams = async () => {
        if (!confirm('🚨 DELETE ALL TEAMS?\n\nThis will PERMANENTLY delete ALL teams from the database.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) return;

        if (!confirm('⚠️ FINAL WARNING!\n\nYou are about to delete ALL teams permanently.\n\nType "DELETE" in the next prompt to confirm.')) return;

        const confirmation = prompt('Type "DELETE" to confirm:');
        if (confirmation !== 'DELETE') {
            alert('❌ Deletion cancelled. Confirmation text did not match.');
            return;
        }

        setLoading(true);
        try {
            await axios.delete('http://localhost:5000/api/teams/reset-all');
            alert('✅ All teams deleted successfully!');
            window.location.reload();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
        setLoading(false);
    };

    const handleDeleteEverything = async () => {
        if (!confirm('🚨🚨 NUCLEAR OPTION 🚨🚨\n\nThis will PERMANENTLY delete:\n- ALL PLAYERS\n- ALL TEAMS\n\nThis is for starting a COMPLETELY FRESH league.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) return;

        if (!confirm('⚠️ FINAL WARNING!\n\nYou are about to delete EVERYTHING.\n\nType "DELETE EVERYTHING" in the next prompt to confirm.')) return;

        const confirmation = prompt('Type "DELETE EVERYTHING" to confirm:');
        if (confirmation !== 'DELETE EVERYTHING') {
            alert('❌ Deletion cancelled. Confirmation text did not match.');
            return;
        }

        setLoading(true);
        try {
            await axios.delete('http://localhost:5000/api/players/reset-all');
            await axios.delete('http://localhost:5000/api/teams/reset-all');
            alert('✅ Everything deleted successfully! Starting fresh.');
            window.location.reload();
        } catch (err) {
            alert('❌ Error: ' + err.message);
        }
        setLoading(false);
    };

    // --- Calculation Logic ---
    const calculateReservedBudget = () => {
        let reserved = 0;
        const itemsToBuy = Number(config.squad_size) || 0;
        const basePrice = Number(config.base_price) || 0;
        const comboSize = Number(config.combo_size) || 2;

        if (config.combo_mode === 1) {
            if (config.combo_base_price_mode === 'per_combo') {
                reserved += itemsToBuy * basePrice;
            } else {
                reserved += (itemsToBuy * comboSize) * basePrice;
            }
        } else {
            reserved += itemsToBuy * basePrice;
        }

        if (config.has_captain_player === 1) {
            reserved += (Number(config.captain_price) || 0);
        }

        return reserved;
    };

    const reservedBudget = calculateReservedBudget();

    // Calculate Max Available for the first auction item
    const totalBudget = Number(config.default_team_budget) || 0;
    const captainCost = config.has_captain_player === 1 ? (Number(config.captain_price) || 0) : 0;

    let costPerItem = Number(config.base_price);
    if (config.combo_mode === 1 && config.combo_base_price_mode === 'per_player') {
        costPerItem = Number(config.base_price) * (Number(config.combo_size) || 2);
    }

    const itemsToReserveFor = Math.max(0, (Number(config.squad_size) || 1) - 1);
    const reservedForOthers = itemsToReserveFor * costPerItem;
    const maxAvailable = totalBudget - captainCost - reservedForOthers;

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>League Settings</h1>
                <p style={{ opacity: 0.6, margin: 0 }}>Manage your auction data and reset options for multiple leagues.</p>
            </header>

            {/* Auction Configuration Section */}
            <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <SettingsIcon size={24} color="#3b82f6" />
                    <h2 style={{ color: '#3b82f6', margin: 0 }}>Auction Configuration</h2>
                </div>
                <p style={{ opacity: 0.7, marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Customize auction parameters for different leagues. Configure budgets, squad size, base prices, and multi-tier bidding increments.
                </p>

                {/* 0. League Branding */}
                <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1rem' }}>🎨 League Branding</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '2rem', background: 'rgba(139, 92, 246, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <div className="form-group">
                        <label>🏆 Tournament Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: 'white', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '5px' }}>
                                {logoFiles.tournament ? (
                                    <img src={URL.createObjectURL(logoFiles.tournament)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : config.tournament_logo ? (
                                    <img src={`http://localhost:5000${config.tournament_logo}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ opacity: 0.2, fontSize: '0.7rem' }}>No Logo</div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setLogoFiles(prev => ({ ...prev, tournament: e.target.files[0] }))}
                                    style={{ fontSize: '0.8rem' }}
                                />
                                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '5px' }}>Recommended: PNG with transparency</div>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>🤝 Sponsor Logo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '10px', background: 'white', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '5px' }}>
                                {logoFiles.sponsor ? (
                                    <img src={URL.createObjectURL(logoFiles.sponsor)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : config.sponsor_logo ? (
                                    <img src={`http://localhost:5000${config.sponsor_logo}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{ opacity: 0.2, fontSize: '0.7rem' }}>No Logo</div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setLogoFiles(prev => ({ ...prev, sponsor: e.target.files[0] }))}
                                    style={{ fontSize: '0.8rem' }}
                                />
                                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '5px' }}>Shows on Projector screen</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 0.5 Sponsors Management */}
                <h3 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1rem' }}>🤝 Sponsor Partners</h3>
                <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    {/* Add Sponsor Form */}
                    <form onSubmit={handleAddSponsor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Sponsor Name</label>
                            <input
                                type="text"
                                value={newSponsor.name}
                                onChange={e => setNewSponsor({ ...newSponsor, name: e.target.value })}
                                placeholder="e.g. Acme Corp"
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Type</label>
                            <select value={newSponsor.type} onChange={e => setNewSponsor({ ...newSponsor, type: e.target.value })}>
                                <option value="main">Main Sponsor</option>
                                <option value="powered">Powered By</option>
                                <option value="co">Co-Sponsor</option>
                                <option value="associate">Associate Sponsor</option>
                                <option value="team">Team Sponsor</option>
                                <option value="trophy">Trophy Sponsor</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Logo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setNewSponsor({ ...newSponsor, file: e.target.files[0] })}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '42px', background: '#f59e0b', border: 'none' }}>
                            Add
                        </button>
                    </form>

                    {/* Sponsors List */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                        {sponsors.map(sp => (
                            <div key={sp.id} style={{ background: 'white', padding: '10px', borderRadius: '10px', position: 'relative', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                <button
                                    onClick={() => handleDeleteSponsor(sp.id)}
                                    style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >×</button>
                                <img src={`http://localhost:5000${sp.logo}`} style={{ height: '60px', maxWidth: '100%', objectFit: 'contain', marginBottom: '10px' }} />
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0f172a' }}>{sp.name}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', color: '#64748b' }}>{sp.type}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 1. Auction Mode & Squad */}
                <h3 style={{ color: '#ec4899', marginBottom: '1rem', fontSize: '1rem' }}>🎭 Auction Mode & Squad</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '2rem', background: 'rgba(236, 72, 153, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>

                    {/* Auction Mode */}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🎮 Auction Mode
                        </label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="combo_mode"
                                    checked={config.combo_mode === 0}
                                    onChange={() => setConfig({ ...config, combo_mode: 0 })}
                                />
                                <span>Individual Players (Standard)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="combo_mode"
                                    checked={config.combo_mode === 1}
                                    onChange={() => setConfig({ ...config, combo_mode: 1 })}
                                />
                                <span>Combo Bidding (Pairs/Groups)</span>
                            </label>
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            {config.combo_mode === 0 ? 'Bid on one player at a time.' : `Bid on a group of ${config.combo_size || 2} players at once.`}
                        </div>
                    </div>

                    {/* Squad Size */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👥 {config.combo_mode === 1 ? 'Number of Combos' : 'Squad Size'}
                        </label>
                        <input
                            type="number"
                            value={config.squad_size}
                            onChange={e => setConfig({ ...config, squad_size: Number(e.target.value) })}
                            placeholder="e.g. 11"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            {config.combo_mode === 1
                                ? `${config.squad_size} combos × ${config.combo_size || 2} players = ${config.squad_size * (config.combo_size || 2)} players`
                                : `${config.squad_size} players per team`
                            }
                        </div>
                    </div>

                    {/* Combo Size (Conditional) */}
                    {config.combo_mode === 1 && (
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔗 Players Per Combo
                            </label>
                            <input
                                type="number"
                                value={config.combo_size}
                                onChange={e => setConfig({ ...config, combo_size: Number(e.target.value) })}
                                min="2"
                                placeholder="2"
                            />
                        </div>
                    )}

                    {/* Captain Player */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            👑 Captain Player
                        </label>
                        <select
                            value={config.has_captain_player}
                            onChange={e => setConfig({ ...config, has_captain_player: Number(e.target.value) })}
                        >
                            <option value={1}>Yes (Fixed Price)</option>
                            <option value={0}>No</option>
                        </select>
                    </div>

                    {/* Captain Price (Conditional) */}
                    {config.has_captain_player === 1 && (
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                💰 Captain Cost
                            </label>
                            <input
                                type="number"
                                value={config.captain_price}
                                onChange={e => setConfig({ ...config, captain_price: Number(e.target.value) })}
                                placeholder="10000"
                            />
                            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                                Deducted from budget automatically.
                            </div>
                        </div>
                    )}

                    {/* Sponsor Player */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ⭐ Sponsor Player
                        </label>
                        <select
                            value={config.has_sponsor_player}
                            onChange={e => setConfig({ ...config, has_sponsor_player: Number(e.target.value) })}
                        >
                            <option value={1}>Yes (Free)</option>
                            <option value={0}>No</option>
                        </select>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            Extra player, distinct from auctions.
                        </div>
                    </div>
                </div>

                {/* 2. Financial Settings */}
                <h3 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '1rem' }}>💰 Financial Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                    {/* Team Budget */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🏦 Total Team Budget
                        </label>
                        <input
                            type="number"
                            value={config.default_team_budget}
                            onChange={e => setConfig({ ...config, default_team_budget: Number(e.target.value) })}
                            placeholder="e.g. 300000"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            Current: ₹{formatNumber(config.default_team_budget)}
                        </div>
                    </div>

                    {/* Base Price */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🏷️ Base Price {config.combo_mode === 1 ? '(Per Combo)' : '(Per Player)'}
                        </label>
                        <input
                            type="number"
                            value={config.base_price}
                            onChange={e => setConfig({ ...config, base_price: Number(e.target.value) })}
                            placeholder="e.g. 5000"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            {config.combo_mode === 1 && config.combo_base_price_mode === 'per_combo'
                                ? `Base price for entire combo.`
                                : `Starting bid amount.`}
                        </div>
                    </div>

                    {/* Base Price Mode (Combo only) */}
                    {config.combo_mode === 1 && (
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🧮 Base Price Calculation
                            </label>
                            <select
                                value={config.combo_base_price_mode}
                                onChange={e => setConfig({ ...config, combo_base_price_mode: e.target.value })}
                            >
                                <option value="per_combo">Per Combo (Flat)</option>
                                <option value="per_player">Per Player (Multiplied)</option>
                            </select>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                                {config.combo_base_price_mode === 'per_combo'
                                    ? `Total base price is ₹${formatNumber(config.base_price)}`
                                    : `Total base = ₹${formatNumber(config.base_price)} × ${config.combo_size} = ₹${formatNumber(config.base_price * config.combo_size)}`}
                            </div>
                        </div>
                    )}
                </div>

                {/* Multi-Tier Increments */}
                <h3 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '1rem' }}>📊 Multi-Tier Bid Increments</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    {/* Tier 1 */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📈 Tier 1 Threshold
                        </label>
                        <input
                            type="number"
                            value={config.tier1_threshold}
                            onChange={e => setConfig({ ...config, tier1_threshold: Number(e.target.value) })}
                            placeholder="e.g. 10000"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            Up to ₹{formatNumber(config.tier1_threshold)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ➕ Tier 1 Increment
                        </label>
                        <input
                            type="number"
                            value={config.tier1_increment}
                            onChange={e => setConfig({ ...config, tier1_increment: Number(e.target.value) })}
                            placeholder="e.g. 1000"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            +₹{formatNumber(config.tier1_increment)} per bid
                        </div>
                    </div>

                    {/* Tier 2 */}
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📈 Tier 2 Threshold
                        </label>
                        <input
                            type="number"
                            value={config.tier2_threshold}
                            onChange={e => setConfig({ ...config, tier2_threshold: Number(e.target.value) })}
                            placeholder="e.g. 20000"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            Up to ₹{formatNumber(config.tier2_threshold)}
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ➕ Tier 2 Increment
                        </label>
                        <input
                            type="number"
                            value={config.tier2_increment}
                            onChange={e => setConfig({ ...config, tier2_increment: Number(e.target.value) })}
                            placeholder="e.g. 2000"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            +₹{formatNumber(config.tier2_increment)} per bid
                        </div>
                    </div>

                    {/* Tier 3 */}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ➕ Tier 3 Increment (Above ₹{formatNumber(config.tier2_threshold)})
                        </label>
                        <input
                            type="number"
                            value={config.tier3_increment}
                            onChange={e => setConfig({ ...config, tier3_increment: Number(e.target.value) })}
                            placeholder="e.g. 5000"
                        />
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '5px' }}>
                            +₹{formatNumber(config.tier3_increment)} per bid
                        </div>
                    </div>
                </div>

                {/* Reserved Budget Calculation */}
                <div style={{ marginTop: '1.5rem', padding: '15px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', fontSize: '0.85rem', lineHeight: '1.6', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <strong style={{ color: '#22c55e' }}>💡 Reserved Budget Calculation:</strong><br />
                    • Total Budget: <strong>₹{formatNumber(config.default_team_budget)}</strong><br />
                    • Reserved Amount: <strong>₹{formatNumber(reservedBudget)}</strong>
                    <span style={{ opacity: 0.7 }}> (
                        {config.combo_mode === 1
                            ? `${config.squad_size} combos`
                            : `${config.squad_size} players`
                        }
                        {config.has_captain_player === 1 ? ' + Captain' : ''}
                        )</span><br />
                    • Maximum Available for 1st Buy: <strong>₹{formatNumber(maxAvailable)}</strong><br />

                    {config.has_sponsor_player === 1 && <span style={{ opacity: 0.8 }}>• Note: Sponsor player is separate (Free)<br /></span>}
                    {config.has_captain_player === 1 && <span style={{ opacity: 0.8 }}>• Note: Captain price ₹{formatNumber(config.captain_price)} is included in reserved<br /></span>}
                </div>

                {/* Explanation */}
                <div style={{ marginTop: '1.5rem', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <strong style={{ color: '#3b82f6' }}>📖 How Multi-Tier Bidding Works:</strong><br />
                    • <strong>Tier 1:</strong> Up to ₹{formatNumber(config.tier1_threshold)} → Increment: ₹{formatNumber(config.tier1_increment)}<br />
                    • <strong>Tier 2:</strong> Up to ₹{formatNumber(config.tier2_threshold)} → Increment: ₹{formatNumber(config.tier2_increment)}<br />
                    • <strong>Tier 3:</strong> Above ₹{formatNumber(config.tier2_threshold)} → Increment: ₹{Number(config.tier3_increment) > 0 ? formatNumber(config.tier3_increment) : formatNumber(config.tier2_increment)}<br /><br />

                    <strong>Example:</strong> Base ₹{formatNumber(config.base_price)}
                    {Number(config.base_price) <= Number(config.tier1_threshold)
                        ? ` → ₹${formatNumber(Number(config.base_price) + Number(config.tier1_increment))} (+${formatNumber(config.tier1_increment)})`
                        : ` → ₹${formatNumber(Number(config.base_price) + Number(config.tier2_increment))} (+${formatNumber(config.tier2_increment)})`
                    }
                    → ... → At ₹{formatNumber(config.tier1_threshold)}, next bid uses Tier 1 increment ({formatNumber(config.tier1_increment)})
                    → At ₹{formatNumber(config.tier2_threshold)}, next bid uses Tier 2 increment ({formatNumber(config.tier2_increment)})
                </div>

                {/* Save Button */}
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfigSave}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                    >
                        <Save size={18} />
                        Save Configuration
                    </button>
                </div>
            </div>

            {/* Warning Banner */}
            <div style={{ marginBottom: '2rem', padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.3)', borderRadius: '15px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <AlertTriangle color="#ef4444" size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.1rem' }}>⚠️ Danger Zone</h3>
                    <p style={{ fontSize: '0.9rem', color: '#fca5a5', margin: 0 }}>
                        These actions are <strong>irreversible</strong>. Use with extreme caution.
                        Always backup your database before performing destructive operations.
                    </p>
                </div>
            </div>

            {/* Reset Options Grid */}
            <div style={{ display: 'grid', gap: '20px' }}>

                {/* Option 1: Reset Auction */}
                <motion.div
                    className="glass-card"
                    whileHover={{ scale: 1.02 }}
                    style={{ border: '1px solid rgba(34, 197, 94, 0.3)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                <RefreshCcw size={24} color="#22c55e" />
                                <h3 style={{ color: '#22c55e', margin: 0 }}>Reset Auction</h3>
                            </div>
                            <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.9rem' }}>
                                Mark all players as <strong>UNSOLD</strong> and reset team budgets to {config.default_team_budget >= 10000000 ? `₹${(config.default_team_budget / 10000000).toFixed(1)} Cr` : `₹${(config.default_team_budget / 100000).toFixed(0)} L`}.
                                Players and teams remain in the database.
                            </p>
                            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>
                                ✅ Keeps all players<br />
                                ✅ Keeps all teams<br />
                                ✅ Resets auction status only
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleResetAuction}
                            disabled={loading}
                            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', minWidth: '140px' }}
                        >
                            <RefreshCcw size={18} />
                            Reset Auction
                        </button>
                    </div>
                </motion.div>

                {/* Option 2: Delete All Players */}
                <motion.div
                    className="glass-card"
                    whileHover={{ scale: 1.02 }}
                    style={{ border: '1px solid rgba(251, 146, 60, 0.3)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                <UserX size={24} color="#fb923c" />
                                <h3 style={{ color: '#fb923c', margin: 0 }}>Delete All Players</h3>
                            </div>
                            <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.9rem' }}>
                                <strong>PERMANENTLY</strong> delete all players from the database.
                                Teams will remain intact.
                            </p>
                            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>
                                ⚠️ Deletes all players<br />
                                ✅ Keeps all teams<br />
                                🔴 Cannot be undone
                            </div>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteAllPlayers}
                            disabled={loading}
                            style={{ minWidth: '140px' }}
                        >
                            <Trash2 size={18} />
                            Delete Players
                        </button>
                    </div>
                </motion.div>

                {/* Option 3: Delete All Teams */}
                <motion.div
                    className="glass-card"
                    whileHover={{ scale: 1.02 }}
                    style={{ border: '1px solid rgba(251, 146, 60, 0.3)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                <Users size={24} color="#fb923c" />
                                <h3 style={{ color: '#fb923c', margin: 0 }}>Delete All Teams</h3>
                            </div>
                            <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.9rem' }}>
                                <strong>PERMANENTLY</strong> delete all teams from the database.
                                Players will remain intact.
                            </p>
                            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>
                                ✅ Keeps all players<br />
                                ⚠️ Deletes all teams<br />
                                🔴 Cannot be undone
                            </div>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteAllTeams}
                            disabled={loading}
                            style={{ minWidth: '140px' }}
                        >
                            <Trash2 size={18} />
                            Delete Teams
                        </button>
                    </div>
                </motion.div>

                {/* Option 4: Nuclear Option */}
                <motion.div
                    className="glass-card"
                    whileHover={{ scale: 1.02 }}
                    style={{ border: '2px solid rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.05)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                <Database size={24} color="#ef4444" />
                                <h3 style={{ color: '#ef4444', margin: 0 }}>🚨 Delete Everything (Nuclear Option)</h3>
                            </div>
                            <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.9rem' }}>
                                <strong>PERMANENTLY</strong> delete <strong>ALL PLAYERS AND ALL TEAMS</strong>.
                                Use this to start a completely fresh league from scratch.
                            </p>
                            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>
                                🔴 Deletes all players<br />
                                🔴 Deletes all teams<br />
                                🔴 Complete database wipe<br />
                                🔴 CANNOT BE UNDONE
                            </div>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteEverything}
                            disabled={loading}
                            style={{ minWidth: '160px', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
                        >
                            <Database size={18} />
                            Delete Everything
                        </button>
                    </div>
                </motion.div>

            </div>

            {/* Info Section */}
            <div style={{ marginTop: '3rem', padding: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '15px' }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '1rem', fontSize: '1.1rem' }}>💡 Use Cases</h3>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.8' }}>
                    <p><strong>Reset Auction:</strong> Use this between auction rounds or to restart bidding without losing your player/team data.</p>
                    <p><strong>Delete All Players:</strong> Use this when you want to import a completely new player list for a different league while keeping the same teams.</p>
                    <p><strong>Delete All Teams:</strong> Use this when you want to set up new teams while keeping the same player pool.</p>
                    <p><strong>Delete Everything:</strong> Use this when starting a brand new league with different teams and players (e.g., switching from IPL to BBL).</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
