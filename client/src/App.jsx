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
import { Gavel, Users, Shield, Tv, BarChart3, ListChecks, Settings as SettingsIcon, Flag } from 'lucide-react';

const NavBar = () => {
    const location = useLocation();

    // Hide Navbar on Display and Leaderboard Screens
    if (location.pathname === '/display' || location.pathname === '/leaderboard') return null;

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

function App() {
    return (
        <Router>
            <NavBar />
            <div style={{ paddingBottom: '3rem' }}>
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
                </Routes>
            </div>
        </Router>
    );
}

export default App;
