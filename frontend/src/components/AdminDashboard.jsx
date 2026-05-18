import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Map, Calendar, LogOut, Activity } from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/');
    };

    return (
        <div className="glass-panel admin-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
            <div className="admin-sidebar" style={{ borderRight: '1px solid var(--border)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', width: '220px', flexShrink: 0 }}>
                <h3 style={{ marginBottom: '20px', paddingLeft: '20px', fontSize: '18px', color: 'var(--text-main)' }}>Dashboard</h3>
                <Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/' ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderRadius: '8px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.3s' }}>
                    <Activity size={18} /> Overview
                </Link>
                <Link to="/admin/dashboard/destinations" className={location.pathname.includes('destinations') ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderRadius: '8px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.3s' }}>
                    <Map size={18} /> Destinations
                </Link>
                <Link to="/admin/dashboard/tripplans" className={location.pathname.includes('tripplans') ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderRadius: '8px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.3s' }}>
                    <Map size={18} /> Trip Plans
                </Link>
                <Link to="/admin/dashboard/bookings" className={location.pathname.includes('bookings') ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderRadius: '8px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.3s' }}>
                    <Calendar size={18} /> Bookings
                </Link>
                <div style={{ marginTop: 'auto' }}>
                    <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleLogout}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>
            <div style={{ flex: '1', padding: '30px', overflowY: 'auto' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminDashboard;
