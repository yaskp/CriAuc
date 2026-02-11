import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL, { getApiUrl, getImageUrl } from '../config';
import socket from '../socket';
import { Shield, Plus, Edit, Trash2, X, Check, Save, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ManageTeams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [config, setConfig] = useState({ default_team_budget: 300000 });

    const [formData, setFormData] = useState({
        name: '',
        budget: 300000,
        logo: null,
        captain_name: '',
        owner_name: ''
    });

    useEffect(() => {
        fetchTeams();
        fetchConfig();
        socket.on('refresh_data', fetchTeams);
        return () => socket.off('refresh_data', fetchTeams);
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await axios.get(getApiUrl('/api/teams'));
            setTeams(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching teams", err);
            setLoading(false);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await axios.get(getApiUrl('/api/config'));
            setConfig(res.data);
            setFormData(prev => ({
                ...prev,
                budget: res.data.default_team_budget
            }));
        } catch (err) {
            console.error("Error fetching config", err);
        }
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, logo: e.target.files[0] });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            budget: config.default_team_budget,
            logo: null,
            captain_name: '',
            owner_name: ''
        });
        setEditingTeam(null);
        setIsModalOpen(false);
    };

    const openEdit = (team) => {
        setEditingTeam(team);
        setFormData({
            name: team.name,
            budget: team.budget,
            logo: null,
            captain_name: team.captain_name || '',
            owner_name: team.owner_name || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('budget', formData.budget);
        data.append('captain_name', formData.captain_name);
        data.append('owner_name', formData.owner_name);
        if (formData.logo) data.append('logo', formData.logo);

        try {
            if (editingTeam) {
                await axios.put(getApiUrl(`/api/teams/${editingTeam.id}`), data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post(getApiUrl('/api/teams'), data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            resetForm();
            fetchTeams();
        } catch (err) {
            alert("Error saving team: " + err.message);
        }
    };

    const deleteTeam = async (id) => {
        if (window.confirm("Are you sure? This will delete the team and all its bid history.")) {
            try {
                await axios.delete(getApiUrl(`/api/teams/${id}`));
                fetchTeams();
            } catch (err) {
                alert("Error deleting team");
            }
        }
    };

    if (loading) return <div className="container">Loading Teams...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Team Management</h1>
                    <p style={{ opacity: 0.6 }}>Add, edit, or remove teams from your league.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> Add New Team
                </button>
            </header>

            <div className="grid grid-3">
                {teams.map(team => (
                    <motion.div
                        layout
                        key={team.id}
                        className="glass-card"
                        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}
                    >
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', padding: '5px' }}>
                                {team.logo ? <img src={getImageUrl(team.logo)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Shield size={30} opacity={0.3} color="black" />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0 }}>{team.name}</h3>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                                    {team.owner_name && <span>{team.owner_name}</span>}
                                    {team.owner_name && team.captain_name && <span> • </span>}
                                    {team.captain_name && <span style={{ color: '#ffd700' }}>C: {team.captain_name}</span>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 'bold', marginTop: '5px' }}>Balance: ₹{team.budget.toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                            <button className="btn btn-secondary" onClick={() => openEdit(team)} style={{ flex: 1, padding: '8px' }}>
                                <Edit size={14} style={{ marginRight: '5px' }} /> Edit
                            </button>
                            <button className="btn" onClick={() => deleteTeam(team.id)} style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '450px', padding: '30px', position: 'relative' }}
                        >
                            <button onClick={resetForm} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>

                            <h2 style={{ marginBottom: '1.5rem' }}>{editingTeam ? 'Edit Team' : 'Add New Team'}</h2>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 }}>Team Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Mumbai Masters"
                                    />
                                </div>

                                <div className="grid grid-2" style={{ gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', opacity: 0.7 }}>Team Owner / Sponsor</label>
                                        <input
                                            type="text"
                                            value={formData.owner_name}
                                            onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                                            placeholder="Owner Name"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', opacity: 0.7 }}>Captain Name</label>
                                        <input
                                            type="text"
                                            value={formData.captain_name}
                                            onChange={e => setFormData({ ...formData, captain_name: e.target.value })}
                                            placeholder="Captain Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 }}>Initial Budget (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.budget}
                                        onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', opacity: 0.7 }}>Team Logo</label>
                                    <div style={{ position: 'relative', height: '100px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {formData.logo ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <Check size={20} color="#22c55e" />
                                                <div style={{ fontSize: '0.7rem' }}>{formData.logo.name}</div>
                                            </div>
                                        ) : editingTeam && editingTeam.logo ? (
                                            <div style={{ textAlign: 'center', height: '100%', background: 'white', padding: '5px', borderRadius: '8px' }}>
                                                <img src={getImageUrl(editingTeam.logo)} style={{ height: '80%', display: 'block', margin: '0 auto' }} />
                                                <div style={{ fontSize: '0.6rem', opacity: 0.5, color: '#666' }}>Current Logo (Click to Change)</div>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', opacity: 0.4 }}>
                                                <Upload size={24} style={{ marginBottom: '5px' }} />
                                                <div style={{ fontSize: '0.7rem' }}>Click to upload JPG/PNG</div>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', height: '50px' }}>
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    {editingTeam ? 'Update Team Details' : 'Initialize Team'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageTeams;
