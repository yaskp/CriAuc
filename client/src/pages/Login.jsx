import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple authentication - you can change these credentials
        if (username === 'admin' && password === 'auction2024') {
            localStorage.setItem('isAuthenticated', 'true');
            onLogin();
            navigate('/');
        } else {
            setError('Invalid username or password');
            setTimeout(() => setError(''), 3000);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '40px',
                    maxWidth: '400px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <Lock size={40} color="white" />
                    </div>
                    <h1 style={{ margin: 0, fontSize: '2rem', color: '#1f2937' }}>IPL Auction</h1>
                    <p style={{ margin: '10px 0 0 0', color: '#6b7280' }}>Admin Login</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                            Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                background: '#fee2e2',
                                color: '#991b1b',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                textAlign: 'center',
                                fontSize: '0.9rem'
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        Login
                    </button>
                </form>

                <div style={{ marginTop: '25px', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                    <p style={{ margin: 0 }}>Default credentials:</p>
                    <p style={{ margin: '5px 0 0 0', fontFamily: 'monospace' }}>admin / auction2024</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
