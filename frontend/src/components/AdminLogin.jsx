import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) navigate('/admin/dashboard/destinations');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5005/api/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            navigate('/admin/dashboard/destinations');
        } catch (err) {
            alert('Invalid credentials');
        }
    };

    return (
        <div className="glass-panel" style={{ maxWidth: '400px', margin: '100px auto', padding: '40px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn" style={{ width: '100%' }}>Login</button>
            </form>
        </div>
    );
};

export default AdminLogin;
