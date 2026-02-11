import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { Plus, Trash2, Edit, User, Shield, Star, Upload, Search, Filter, Layers, Users, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Players = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        id: null, name: '', category: 'Batsman', auction_set: 'Marquee', base_price: 1000000, is_captain: false, is_icon: false, combo_id: '', combo_display_name: '', photo: null
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSet, setFilterSet] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'combo'
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [showComboModal, setShowComboModal] = useState(false);
    const [comboForm, setComboForm] = useState({ id: '', name: '' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const deleteAllPlayers = async () => {
        if (!confirm('🚨 ARE YOU SURE?\n\nThis will delete ALL players from the database.\nThis action cannot be undone!')) return;
        try {
            await axios.delete('http://localhost:5000/api/players/reset-all');
            alert('✅ All players deleted.');
            fetchPlayers();
        } catch (err) {
            alert('❌ "Failed to delete players: " + err.message');
        }
    };

    const combos = React.useMemo(() => {
        const map = {};
        players.forEach(p => {
            if (p.combo_id) {
                if (!map[p.combo_id]) map[p.combo_id] = { id: p.combo_id, name: p.combo_display_name || p.combo_id, players: [] };
                map[p.combo_id].players.push(p);
            }
        });
        return Object.values(map);
    }, [players]);

    useEffect(() => {
        fetchPlayers();
        socket.on('refresh_data', fetchPlayers);
        return () => socket.off('refresh_data', fetchPlayers);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterSet, filterStatus]);

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/players');
            setPlayers(res.data);
        } catch (err) {
            console.error("Error fetching players", err);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (form[key] !== null) formData.append(key, form[key]);
        });

        try {
            if (form.id) await axios.put(`http://localhost:5000/api/players/${form.id}`, formData);
            else await axios.post('http://localhost:5000/api/players', formData);

            setForm({ id: null, name: '', category: 'Batsman', auction_set: 'Marquee', base_price: 1000000, is_captain: false, is_icon: false, combo_id: '', combo_display_name: '', photo: null });
            setShowModal(false);
            fetchPlayers();
            alert("✅ Player Saved!");
        } catch (err) {
            alert("❌ Error: " + err.message);
        }
    };

    const deletePlayer = async (id) => {
        if (confirm('Are you sure you want to delete this player?')) {
            await axios.delete(`http://localhost:5000/api/players/${id}`);
            fetchPlayers();
        }
    };

    const handleSelect = (id) => {
        setSelectedPlayers(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedPlayers.length === filteredPlayers.length) setSelectedPlayers([]);
        else setSelectedPlayers(filteredPlayers.map(p => p.id));
    };

    const handleCreateCombo = async () => {
        if (!comboForm.id || !comboForm.name) return alert("Please enter Combo ID and Name");
        try {
            await axios.put('http://localhost:5000/api/players/bulk-update', {
                ids: selectedPlayers,
                updates: { combo_id: comboForm.id, combo_display_name: comboForm.name }
            });
            setShowComboModal(false);
            setSelectedPlayers([]);
            setComboForm({ id: '', name: '' });
            fetchPlayers();
            alert("✅ Combo Created Successfully!");
        } catch (err) { alert("❌ Failed to create combo"); }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Visual validation for CSV
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert("❌ Invalid File Type: Please upload a .CSV file.\n\nTip: In Excel, go to 'Save As' and choose 'CSV (Comma delimited)' format.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post('http://localhost:5000/api/players/import', formData);
            fetchPlayers();
            alert(`✅ ${res.data.message}`);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message;
            alert("❌ Import Failed: " + errorMsg);
        }
    };

    const filteredPlayers = players.filter(p => {
        const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSet = filterSet === 'All' || p.auction_set === filterSet;
        const matchStatus = filterStatus === 'All' || p.status === filterStatus.toLowerCase();
        return matchName && matchSet && matchStatus;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPlayers = filteredPlayers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);

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
        if (amount < 100000 && amount > 0) return `₹ ${amount.toLocaleString('en-IN')}`;
        return `₹ ${(amount / 100000).toFixed(2)} L`;
    };

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>Player Registry</h1>
                    <p style={{ opacity: 0.6, margin: 0 }}>Manage the entire player pool for the auction.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="glass-card" style={{ padding: '5px 15px', position: 'relative', overflow: 'hidden' }}>
                        <input type="file" id="bulk-import" accept=".csv" hidden onChange={handleImport} />
                        <label htmlFor="bulk-import" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                            <Upload size={14} color="#ffd700" /> Bulk Import
                        </label>
                    </div>
                    <button className="btn btn-danger" style={{ padding: '5px 15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={deleteAllPlayers}>
                        <Trash2 size={14} /> Clear All
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '5px 15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                        const csvContent = "Name,Category,BasePrice,Set,IsCaptain,IsIcon,ComboID,ComboName\nVirat Kohli,Batsman,20000000,Marquee,1,1,,";
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'player_import_template.csv';
                        a.click();
                        window.URL.revokeObjectURL(url);
                    }}>
                        <Download size={14} /> Template
                    </button>
                    {selectedPlayers.length > 0 && (
                        <button className="btn btn-primary" style={{ background: '#ec4899', boxShadow: '0 0 15px rgba(236,72,153,0.4)' }} onClick={() => {
                            setComboForm({ id: `COMBO_${Date.now()}`, name: '' });
                            setShowComboModal(true);
                        }}>
                            <Layers size={18} style={{ marginRight: '5px' }} /> Create Combo ({selectedPlayers.length})
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => {
                        setForm({ id: null, name: '', category: 'Batsman', auction_set: 'Marquee', base_price: 1000000, is_captain: false, is_icon: false, photo: null });
                        setShowModal(true);
                    }}>
                        <Plus size={18} /> Add Player
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`btn`}
                        style={{ padding: '8px 15px', borderRadius: '8px', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? 'white' : '#aaa', fontSize: '0.85rem' }}
                    >
                        <Users size={16} style={{ marginRight: '8px' }} /> Players
                    </button>
                    <button
                        onClick={() => setViewMode('combo')}
                        className={`btn`}
                        style={{ padding: '8px 15px', borderRadius: '8px', background: viewMode === 'combo' ? 'var(--primary)' : 'transparent', color: viewMode === 'combo' ? 'white' : '#aaa', fontSize: '0.85rem' }}
                    >
                        <Layers size={16} style={{ marginRight: '8px' }} /> Combos
                    </button>
                </div>
                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                    <input
                        type="text"
                        placeholder="Search players..."
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '40px' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Filter size={18} style={{ opacity: 0.4 }} />
                    <select value={filterSet} onChange={e => setFilterSet(e.target.value)} className="input-field">
                        <option value="All">All Sets</option>
                        <option>Marquee</option>
                        <option>Icon Player</option>
                        <option>BAT 1</option><option>BOWL 1</option><option>WK 1</option><option>AL 1</option>
                        <option>Uncapped</option>
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field">
                        <option value="All">All Status</option>
                        <option value="Sold">Sold</option>
                        <option value="Unsold">Unsold</option>
                        <option value="Reserved">Reserved</option>
                    </select>
                </div>
                <div style={{ marginLeft: 'auto', fontWeight: 'bold', color: 'var(--primary)' }}>
                    Total: {filteredPlayers.length}
                </div>
            </div>

            {/* Player Table / Combo Grid */}
            {viewMode === 'combo' ? (
                <div className="grid grid-2" style={{ gap: '2rem' }}>
                    {combos.length > 0 ? (
                        combos.map(combo => (
                            <motion.div
                                key={combo.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card"
                                style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(236, 72, 153, 0.3)' }}
                            >
                                <div style={{ background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.1), transparent)', padding: '15px 20px', borderBottom: '1px solid rgba(236, 72, 153, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Layers size={18} color="#ec4899" />
                                        <h3 style={{ margin: 0, color: '#ec4899', fontSize: '1.2rem' }}>{combo.name}</h3>
                                        <span style={{ fontSize: '0.7rem', background: '#ec4899', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>{combo.players.length} Players</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>ID: {combo.id}</div>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    {combo.players.map(p => (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', overflow: 'hidden', flexShrink: 0 }}>
                                                {p.image ? <img src={`http://localhost:5000${p.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} style={{ margin: '10px' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{p.category} • {p.auction_set}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 'bold', color: '#ec4899' }}>{formatMoney(p.base_price)}</div>
                                                {p.status === 'sold' && <div className="badge" style={{ background: '#22c55e', color: 'white', marginTop: '4px' }}>SOLD</div>}
                                            </div>
                                            <button onClick={() => { setForm(p); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '5px' }}>
                                                <Edit size={16} color="white" />
                                            </button>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '15px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                                        Use Auction Console to start bidding for this combo.
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', opacity: 0.5 }}>No combos found. Create players with the same Combo ID to generate combos.</div>
                    )}
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <tr>
                                <th style={{ padding: '15px' }}>
                                    <input type="checkbox" checked={selectedPlayers.length > 0 && selectedPlayers.length === filteredPlayers.length} onChange={handleSelectAll} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                                </th>
                                <th style={{ padding: '15px' }}>Player</th>
                                <th style={{ padding: '15px' }}>Category</th>
                                <th style={{ padding: '15px' }}>Base Price</th>
                                <th style={{ padding: '15px' }}>Set</th>
                                <th style={{ padding: '15px' }}>Status</th>
                                <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPlayers.length > 0 ? (
                                currentPlayers.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: p.status === 'sold' ? 0.6 : 1 }}>
                                        <td style={{ padding: '15px' }}>
                                            <input type="checkbox" checked={selectedPlayers.includes(p.id)} onChange={() => handleSelect(p.id)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                                        </td>
                                        <td style={{ padding: '10px 15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', overflow: 'hidden' }}>
                                                    {p.image ? (
                                                        <img src={`http://localhost:5000${p.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                                    ) : <User size={20} style={{ margin: '10px' }} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                                    {p.combo_display_name && <div style={{ fontSize: '0.75rem', color: '#ec4899' }}>{p.combo_display_name}</div>}
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {p.is_icon === 1 && <span style={{ fontSize: '0.6rem', color: 'gold', border: '1px solid gold', padding: '1px 4px', borderRadius: '3px' }}>ICON</span>}
                                                        {p.is_captain === 1 && <span style={{ fontSize: '0.6rem', color: '#34d399', border: '1px solid #34d399', padding: '1px 4px', borderRadius: '3px' }}>CAPTAIN</span>}
                                                        {p.combo_id && <span style={{ fontSize: '0.6rem', color: '#ec4899', border: '1px solid #ec4899', padding: '1px 4px', borderRadius: '3px' }}>COMBO</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px' }}>{p.category}</td>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{formatMoney(p.base_price)}</td>
                                        <td style={{ padding: '15px', opacity: 0.6 }}>{p.auction_set}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span className={`badge ${p.status === 'sold' ? 'badge-success' : p.status === 'reserved' ? 'badge-warning' : 'badge-secondary'}`} style={{
                                                background: p.status === 'sold' ? 'rgba(34, 197, 94, 0.1)' :
                                                    p.status === 'reserved' ? 'rgba(234, 179, 8, 0.1)' :
                                                        'rgba(255,255,255,0.05)',
                                                color: p.status === 'sold' ? '#22c55e' :
                                                    p.status === 'reserved' ? '#eab308' :
                                                        '#94a3b8'
                                            }}>
                                                {p.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => {
                                                    setForm({
                                                        ...p,
                                                        photo: null,
                                                        is_captain: p.is_captain === 1,
                                                        is_icon: p.is_icon === 1,
                                                        combo_id: p.combo_id || '',
                                                        combo_display_name: p.combo_display_name || ''
                                                    });
                                                    setShowModal(true);
                                                }}>
                                                    <Edit size={14} />
                                                </button>
                                                <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => deletePlayer(p.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" style={{ padding: '100px', textAlign: 'center', opacity: 0.3 }}>No players found matching your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="btn btn-secondary"
                            >
                                Prev
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', color: '#aaa' }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="btn btn-secondary"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>{form.id ? 'Edit Player' : 'Register New Player'}</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MS Dhoni"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                        style={{ padding: '8px' }}
                                    />
                                </div>

                                <div className="grid grid-2" style={{ gap: '15px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Category</label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: '8px 12px', paddingRight: '3rem' }}>
                                            <option>Batsman</option>
                                            <option>Bowler</option>
                                            <option>All-rounder</option>
                                            <option>Wicket-keeper</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Auction Set</label>
                                        <select value={form.auction_set} onChange={e => setForm({ ...form, auction_set: e.target.value })} style={{ padding: '8px 12px', paddingRight: '3rem' }}>
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
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Base Price (in ₹)</label>
                                    <input
                                        type="number"
                                        value={form.base_price}
                                        onChange={e => setForm({ ...form, base_price: e.target.value })}
                                        required
                                        style={{ padding: '8px' }}
                                    />
                                </div>

                                {/* Combo Settings */}
                                {/* Combo Settings */}
                                <div style={{ padding: '8px', background: 'rgba(236, 72, 153, 0.05)', borderRadius: '6px', border: '1px solid rgba(236, 72, 153, 0.1)' }}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#ec4899' }}>🎭 Combo Settings (Optional)</h4>
                                    <div className="grid grid-2" style={{ gap: '10px' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Combo ID</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. PAIR_1"
                                                value={form.combo_id}
                                                onChange={e => setForm({ ...form, combo_id: e.target.value })}
                                                style={{ padding: '6px', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Combo Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Openers"
                                                value={form.combo_display_name}
                                                onChange={e => setForm({ ...form, combo_display_name: e.target.value })}
                                                style={{ padding: '6px', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '3px' }}>
                                        Players with the same Combo ID will be auctioned together.
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={form.is_captain}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setForm({
                                                    ...form,
                                                    is_captain: checked,
                                                    combo_id: checked ? '' : form.combo_id,
                                                    combo_display_name: checked ? '' : form.combo_display_name
                                                });
                                            }}
                                        />
                                        <Shield size={16} color="#34d399" /> <span style={{ color: 'var(--text)', fontWeight: '500', fontSize: '0.9rem' }}>Captain</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={form.is_icon}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setForm({
                                                    ...form,
                                                    is_icon: checked,
                                                    combo_id: checked ? '' : form.combo_id,
                                                    combo_display_name: checked ? '' : form.combo_display_name
                                                });
                                            }}
                                        />
                                        <Star size={16} color="gold" /> <span style={{ color: 'var(--text)', fontWeight: '500', fontSize: '0.9rem' }}>Icon</span>
                                    </label>
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Profile Photo</label>
                                    <input
                                        type="file"
                                        onChange={e => setForm({ ...form, photo: e.target.files[0] })}
                                        style={{ padding: '6px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{form.id ? 'Update Details' : 'Register Player'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: bold; }
            `}</style>
            {/* Create Combo Modal */}
            <AnimatePresence>
                {showComboModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}
                        >
                            <h2 style={{ marginTop: 0, color: '#ec4899', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Layers size={24} /> Create Combo
                            </h2>
                            <p style={{ opacity: 0.7 }}>Grouping {selectedPlayers.length} selected players.</p>

                            <div className="form-group">
                                <label>Combo Unique ID</label>
                                <input type="text" className="input-field" value={comboForm.id} onChange={e => setComboForm({ ...comboForm, id: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Combo Display Name</label>
                                <input type="text" className="input-field" placeholder="e.g. Openers Pair" value={comboForm.name} onChange={e => setComboForm({ ...comboForm, name: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
                                <button className="btn btn-primary" style={{ flex: 1, background: '#ec4899' }} onClick={handleCreateCombo}>Create Combo</button>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowComboModal(false)}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Players;
