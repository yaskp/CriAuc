import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Auction from './pages/Auction';
import Admin from './pages/Admin';
import Teams from './pages/Teams';
import Display from './pages/Display';
import Leaderboard from './pages/Leaderboard';
import Players from './pages/Players';
import Settings from './pages/Settings';
import ManageTeams from './pages/ManageTeams';
import PublicLeaderboard from './pages/PublicLeaderboard';
import PublicTeamView from './pages/PublicTeamView';
import Login from './pages/Login';
import { Gavel, Users, Shield, Tv, BarChart3, ListChecks, Settings as SettingsIcon, Flag, LogOut } from 'lucide-react';

const NavBar = ({ onLogout }) => {
    const location = useLocation();

    // Hide Navbar on Display, Leaderboard, Public Screens, and Login
    if (location.pathname === '/display' ||
        location.pathname === '/leaderboard' ||
        location.pathname === '/login' ||
        location.pathname.startsWith('/public/')) return null;

    return (
        <nav>
            <div className="logo">
                IPL Auction <span style={{ color: 'var(--text)', fontSize: '0.8rem' }}>v1.0</span>
            </div>
            <ul>
                <li>
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        <Gavel size={18} style={{ marginBottom: '-2px' }} /> Console
                    </Link>
                </li>
                <li>
                    <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                        <Users size={18} style={{ marginBottom: '-2px' }} /> Control Room
                    </Link>
                </li>
                <li>
                    <Link to="/registry" className={location.pathname === '/registry' ? 'active' : ''}>
                        <ListChecks size={18} style={{ marginBottom: '-2px' }} /> Registry
                    </Link>
                </li>
                <li>
                    <Link to="/display" target="_blank" className={location.pathname === '/display' ? 'active' : ''}>
                        <Tv size={18} style={{ marginBottom: '-2px' }} /> Projector
                    </Link>
                </li>
                <li>
                    <Link to="/leaderboard" target="_blank" className={location.pathname === '/leaderboard' ? 'active' : ''}>
                        <BarChart3 size={18} style={{ marginBottom: '-2px' }} /> Standings
                    </Link>
                </li>
                <li>
                    <Link to="/teams" className={location.pathname === '/teams' ? 'active' : ''}>
                        <Shield size={18} style={{ marginBottom: '-2px' }} /> Teams
                    </Link>
                </li>
                <li>
                    <Link to="/manage-teams" className={location.pathname === '/manage-teams' ? 'active' : ''}>
                        <Flag size={18} style={{ marginBottom: '-2px' }} /> Manage Teams
                    </Link>
                </li>
                <li>
                    <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
                        <SettingsIcon size={18} style={{ marginBottom: '-2px' }} /> Settings
                    </Link>
                </li>
                <li>
                    <button
                        onClick={onLogout}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </li>
            </ul>
        </nav>
    );
};

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const authStatus = localStorage.getItem('isAuthenticated');
        setIsAuthenticated(authStatus === 'true');
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        window.location.href = '/login';
    };

    return (
        <Router>
            <NavBar onLogout={handleLogout} />
            <div style={{ paddingBottom: '3rem' }}>
                <Routes>
                    {/* Login Route */}
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />

                    {/* Protected Admin Routes */}
                    <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Auction /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Admin /></ProtectedRoute>} />
                    <Route path="/registry" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Players /></ProtectedRoute>} />
                    <Route path="/teams" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Teams /></ProtectedRoute>} />
                    <Route path="/teams/:teamId" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Teams /></ProtectedRoute>} />
                    <Route path="/manage-teams" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ManageTeams /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Settings /></ProtectedRoute>} />

                    {/* Display and Leaderboard - Can be protected or public based on your preference */}
                    <Route path="/display" element={<Display />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />

                    {/* Public Routes - Always Accessible */}
                    <Route path="/public/leaderboard" element={<PublicLeaderboard />} />
                    <Route path="/public/team/:teamId" element={<PublicTeamView />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
