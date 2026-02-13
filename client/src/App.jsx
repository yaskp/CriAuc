import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
import { Gavel, Users, Shield, Tv, BarChart3, ListChecks, Settings as SettingsIcon, Flag } from 'lucide-react';

const NavBar = () => {
    const location = useLocation();

    // Hide Navbar on Display, Leaderboard, and Public Screens
    if (location.pathname === '/display' ||
        location.pathname === '/leaderboard' ||
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
            </ul>
        </nav>
    );
};

const Footer = () => {
    const location = useLocation();

    // Hide Footer on Display, Leaderboard, and Public Screens (Broadcast modes)
    if (location.pathname === '/display' ||
        location.pathname === '/leaderboard' ||
        location.pathname.startsWith('/public/')) return null;

    return (
        <footer style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                    © {new Date().getFullYear()} <span style={{ color: 'var(--primary)' }}>CricAuction</span>. All Rights Reserved.
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    Proudly Developed by <a href="https://vycle.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>Vycle Private Limited</a>
                </p>
            </div>
        </footer>
    );
};

function App() {
    return (
        <Router>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <NavBar />
                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<Auction />} />
                        <Route path="/display" element={<Display />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/registry" element={<Players />} />
                        <Route path="/teams" element={<Teams />} />
                        <Route path="/teams/:teamId" element={<Teams />} />
                        <Route path="/manage-teams" element={<ManageTeams />} />
                        <Route path="/settings" element={<Settings />} />

                        {/* Public Routes */}
                        <Route path="/public/leaderboard" element={<PublicLeaderboard />} />
                        <Route path="/public/team/:teamId" element={<PublicTeamView />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
