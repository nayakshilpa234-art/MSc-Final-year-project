import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginRegister = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Retrieve guest history from localStorage to pass to backend for persistence/merging
            const guestHistoryStr = localStorage.getItem('chatHistory_guest');
            let guestHistory = [];
            if (guestHistoryStr) {
                try {
                    // Clean welcome message so we don't save duplicate standard welcomes
                    guestHistory = JSON.parse(guestHistoryStr).filter(m => !m.text.includes("Hi! I'm your AI Tourist Assistant"));
                } catch (e) {
                    console.error("Failed to parse guest history", e);
                }
            }

            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin 
                ? { username, password, guestHistory } 
                : { username, email, password, guestHistory };
            
            const res = await axios.post(`http://localhost:5005${endpoint}`, payload);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            
            // Clear guest history now that it's merged
            localStorage.removeItem('chatHistory_guest');

            // Dispatch global event so other components update their login/token state instantly
            window.dispatchEvent(new Event('authChange'));
            
            if (res.data.role === 'admin') {
                navigate('/admin/dashboard/destinations');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            alert(err.response?.data?.msg || 'Error processing request');
        }
    };

    return (
        <div className="glass-panel" style={{ maxWidth: '400px', margin: '100px auto', padding: '40px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>{isLogin ? 'Traveler Login' : 'Create Account'}</h2>
            <p style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                {!isLogin && (
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                )}
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>{isLogin ? 'Login' : 'Register'}</button>
            </form>
        </div>
    );
};

export default LoginRegister;
