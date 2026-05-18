import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Bot, Shield, ShoppingCart, Map, UserCircle } from 'lucide-react';
import Chatbot from './components/Chatbot';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminOverview from './components/AdminOverview';
import AdminDestinations from './components/AdminDestinations';
import AdminBookings from './components/AdminBookings';
import AdminTripPlans from './components/AdminTripPlans';
import TripTable from './components/TripTable';
import CartPage from './components/CartPage';
import LoginRegister from './components/LoginRegister';
import TravelerDashboard from './components/TravelerDashboard';

function App() {
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const addToCart = (trip) => {
    setCart((prevCart) => [...prevCart, trip]);
  };

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="navbar-logo">
            <Bot size={32} color="#818cf8" />
            AI Tourist Assistant
          </Link>
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <Link to="/">Chat</Link>
            <Link to="/trips" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Map size={18} /> Trips
            </Link>
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
              <ShoppingCart size={18} /> Cart
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                  {cart.length}
                </span>
              )}
            </Link>
            {token ? (
               <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent)' }}>
                 <UserCircle size={18} /> My Account
               </Link>
            ) : (
               <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <UserCircle size={18} /> Login
               </Link>
            )}
            <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Shield size={18} /> Admin
            </Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Chatbot addToCart={addToCart} />} />
            <Route path="/trips" element={<TripTable addToCart={addToCart} />} />
            <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
            <Route path="/login" element={<LoginRegister />} />
            <Route path="/dashboard" element={<TravelerDashboard />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />}>
              <Route index element={<AdminOverview />} />
              <Route path="destinations" element={<AdminDestinations />} />
              <Route path="tripplans" element={<AdminTripPlans />} />
              <Route path="bookings" element={<AdminBookings />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
