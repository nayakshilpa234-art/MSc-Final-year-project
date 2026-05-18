import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TravelerDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const ax = axios.create({ headers: { Authorization: `Bearer ${token}` } });
        
        ax.get('http://localhost:5005/api/auth/me')
            .then(res => setUser(res.data))
            .catch(() => navigate('/login'));

        ax.get('http://localhost:5005/api/bookings/my')
            .then(res => setBookings(res.data))
            .catch(console.error);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.dispatchEvent(new Event('authChange'));
        navigate('/');
    };

    if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2>Welcome Back, {user.username}!</h2>
                <button className="btn btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <LogOut size={16} /> Logout
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>My Bookings</h3>
                {bookings.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>You have no bookings yet. Go to the Chatbot to plan your next trip!</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {bookings.map(book => (
                            <div key={book._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>{book.destination?.name || 'Custom Trip'}</h4>
                                    <span style={{
                                        padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                        background: book.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.2)' : book.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                        color: book.status === 'Confirmed' ? '#10b981' : book.status === 'Cancelled' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        STATUS: {book.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    <div><strong>Date:</strong> {new Date(book.travelDate).toLocaleDateString()}</div>
                                    <div><strong>People:</strong> {book.numberOfPeople}</div>
                                    <div><strong>Transport:</strong> {book.transport?.name || 'Not selected'}</div>
                                    <div><strong>Stay:</strong> {book.stay?.name || 'Not selected'}</div>
                                    <div><strong>Total Cost:</strong> ₹{book.totalCost || 'Processing'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TravelerDashboard;
