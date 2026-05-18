import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, User, Mail, Calendar, Users, MapPin, ShieldCheck, CreditCard, QrCode, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartPage = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('cart'); // 'cart', 'details', 'customize', 'payment', 'success'
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    travelDate: '',
    numberOfPeople: 1,
    fromCity: 'Bangalore'
  });

  // Customization Options
  const [customizations, setCustomizations] = useState({
    transport: 'none', // 'none', 'flight', 'train', 'bus'
    stay: 'none', // 'none', 'luxury', 'boutique', 'budget'
    food: 'none' // 'none', 'all', 'breakfast'
  });

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi'
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiPaid, setUpiPaid] = useState(false);
  const [upiTimer, setUpiTimer] = useState(15);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);

  // Fetch user if logged in to prefill
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5005/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUserProfile(res.data);
        setFormData(prev => ({
          ...prev,
          name: res.data.username || '',
          email: res.data.email || ''
        }));
      })
      .catch(err => console.log("Guest checkout or token expired"));
    }
  }, []);

  // Timer for simulated UPI checkout
  useEffect(() => {
    let interval;
    if (step === 'payment' && paymentMethod === 'upi' && upiTimer > 0 && !upiPaid) {
      interval = setInterval(() => {
        setUpiTimer(prev => {
          if (prev <= 1) {
            setUpiPaid(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, paymentMethod, upiTimer, upiPaid]);

  const removeItem = (idToRemove) => {
    setCart(cart.filter(item => item.id !== idToRemove));
  };

  // Base Package Total
  const baseTotal = cart.reduce((total, item) => total + item.price, 0);

  // Customization Cost Rates
  const getTransportRate = () => {
    if (customizations.transport === 'flight') return 5000;
    if (customizations.transport === 'train') return 1500;
    if (customizations.transport === 'bus') return 800;
    return 0;
  };

  const getStayRate = () => {
    // Custom package standard assumes 4 nights stay
    if (customizations.stay === 'luxury') return 8000 * 4;
    if (customizations.stay === 'boutique') return 4000 * 4;
    if (customizations.stay === 'budget') return 1500 * 4;
    return 0;
  };

  const getFoodRate = () => {
    // Custom package standard assumes 5 days
    if (customizations.food === 'all') return 1500 * 5;
    if (customizations.food === 'breakfast') return 400 * 5;
    return 0;
  };

  const transportTotal = getTransportRate() * formData.numberOfPeople * cart.length;
  const stayTotal = getStayRate() * cart.length;
  const foodTotal = getFoodRate() * formData.numberOfPeople * cart.length;
  const grandTotal = baseTotal + transportTotal + stayTotal + foodTotal;

  // Checkout submission
  const handleCheckoutSubmit = async () => {
    setLoading(true);
    setTotalPaid(grandTotal);
    const token = localStorage.getItem('token');
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
      const createdBookings = [];

      // Create a database booking for each cart item
      for (const item of cart) {
        // Construct stay/transport/food objects
        const transportObj = customizations.transport !== 'none' ? {
          name: customizations.transport === 'flight' ? 'IndiGo Non-stop Flight' : customizations.transport === 'train' ? 'Rajdhani AC 2-Tier' : 'SRS Volvo AC Sleeper',
          price: getTransportRate() * formData.numberOfPeople
        } : null;

        const stayObj = customizations.stay !== 'none' ? {
          name: customizations.stay === 'luxury' ? 'Luxury Beach Resort' : customizations.stay === 'boutique' ? 'Boutique Garden Hotel' : 'Budget Comfort Inn',
          price: getStayRate()
        } : null;

        const foodObj = customizations.food !== 'none' ? {
          preference: 'Vegetarian',
          mealPlan: customizations.food === 'all' ? 'All-Inclusive Full Board' : 'Bed & Breakfast',
          price: getFoodRate() * formData.numberOfPeople
        } : null;

        const payload = {
          name: formData.name,
          email: formData.email,
          travelDate: formData.travelDate,
          numberOfPeople: formData.numberOfPeople,
          fromCity: formData.fromCity,
          destination: `dynamic_trip_${item.destination.replace(/[\s,]+/g, '_').toLowerCase()}`,
          destinationObj: {
            name: item.destination,
            location: item.destination,
            category: item.type === 'Beach Trip' ? 'beach' : item.type === 'Friends Trip' ? 'adventure' : 'historical',
            price: item.price,
            description: `Seeded package tour to ${item.destination}. Includes ${item.duration || 'duration packages'}.`,
            image_url: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000'
          },
          status: 'Confirmed', // Automatically confirm on successful checkout payment
          transport: transportObj,
          stay: stayObj,
          food: foodObj,
          totalCost: (item.price + (getTransportRate() * formData.numberOfPeople) + getStayRate() + (getFoodRate() * formData.numberOfPeople)),
          payment: {
            method: paymentMethod.toUpperCase(),
            amount: grandTotal,
            status: 'Success',
            transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        };

        const res = await axios.post('http://localhost:5005/api/bookings', payload, config);
        createdBookings.push(res.data);
      }

      setConfirmedBookings(createdBookings);
      setCart([]); // Clear Cart
      setStep('success');
    } catch (err) {
      console.error(err);
      alert('Checkout failed! Please make sure all fields are valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Dynamic Progress indicator */}
      {step !== 'cart' && step !== 'success' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px' }}>
          {['details', 'customize', 'payment'].map((s, idx) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step === s ? 'var(--accent)' : (idx === 0 || (idx === 1 && step === 'payment') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'),
                  color: step === s ? '#000' : (idx === 0 || (idx === 1 && step === 'payment') ? '#10b981' : 'var(--text-muted)'),
                  fontWeight: 'bold', border: step === s ? '2px solid var(--accent)' : '1px solid var(--border)'
                }}>
                  {idx + 1}
                </span>
                <span style={{ fontWeight: '600', color: step === s ? 'var(--text-main)' : 'var(--text-muted)', textTransform: 'capitalize', fontSize: '14px' }}>
                  {s === 'details' ? 'Travelers' : s === 'customize' ? 'Upgrades' : 'Payment'}
                </span>
              </div>
              {idx < 2 && <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.08)', margin: '0 20px' }}></div>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Cart Items Stage */}
      {step === 'cart' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🛒 Review Your Cart</h2>
          
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '20px' }}>Your cart is empty. Explore some trips and add them to your cart!</p>
              <button onClick={() => navigate('/trips')} className="btn btn-accent">Explore Trips</button>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Trip Details</th>
                    <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Price (₹)</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={`${item.id}-${index}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>{item.destination}</div>
                        <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px', display: 'inline-block' }}>{item.type}</div>
                      </td>
                      <td style={{ padding: '15px', color: 'var(--text-main)', fontSize: '18px', fontWeight: 'bold' }}>₹{item.price.toLocaleString()}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button className="btn" style={{ padding: '8px 12px', background: 'transparent', color: 'var(--danger)' }} onClick={() => removeItem(item.id)}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0 }}>Total: <span style={{ color: 'var(--accent)', fontSize: '26px' }}>₹{baseTotal.toLocaleString()}</span></h3>
                <button onClick={() => setStep('details')} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 30px' }}>
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 1: Traveler Details */}
      {step === 'details' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>👤 Traveler Information</h3>
          <form onSubmit={(e) => { e.preventDefault(); setStep('customize'); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Full Name</label>
                <input required type="text" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email Address</label>
                <input required type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Travel Date</label>
                <input required type="date" value={formData.travelDate} onChange={e => setFormData({ ...formData, travelDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Number of People</label>
                <input required type="number" min="1" value={formData.numberOfPeople} onChange={e => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Departure City</label>
                <select value={formData.fromCity} onChange={e => setFormData({ ...formData, fromCity: e.target.value })}>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button type="button" onClick={() => setStep('cart')} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Back to Cart
              </button>
              <button type="submit" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Continue to Upgrades <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Customizations & Upgrades */}
      {step === 'customize' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>✈️ Customize Your Journey</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
            
            {/* Transport Option */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ fontSize: '16px' }}>Select Transport Option</strong>
                <span style={{ color: 'var(--accent)', fontSize: '13px' }}>Price per person</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { id: 'none', label: 'None (Self-arrange)', price: 0 },
                  { id: 'flight', label: '✈️ Flight Upgrade', price: 5000 },
                  { id: 'train', label: '🚂 AC Train Coach', price: 1500 },
                  { id: 'bus', label: '🚌 Volvo Bus Sleeper', price: 800 }
                ].map(opt => (
                  <div key={opt.id} onClick={() => setCustomizations({ ...customizations, transport: opt.id })}
                    style={{
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      background: customizations.transport === opt.id ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                      border: customizations.transport === opt.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s'
                    }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{opt.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{opt.price === 0 ? 'Included' : `+₹${opt.price.toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Stay Option */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ fontSize: '16px' }}>Select Hotel Class (Assumes 4 Nights)</strong>
                <span style={{ color: 'var(--accent)', fontSize: '13px' }}>Price per stay</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { id: 'none', label: 'None (Self-arrange)', price: 0 },
                  { id: 'luxury', label: '🏨 Luxury 5★ Hotel', price: 8000 * 4 },
                  { id: 'boutique', label: '🏨 Boutique Hotel', price: 4000 * 4 },
                  { id: 'budget', label: '🏨 Budget Comfort Inn', price: 1500 * 4 }
                ].map(opt => (
                  <div key={opt.id} onClick={() => setCustomizations({ ...customizations, stay: opt.id })}
                    style={{
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      background: customizations.stay === opt.id ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                      border: customizations.stay === opt.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s'
                    }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{opt.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{opt.price === 0 ? 'Included' : `+₹${opt.price.toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Option */}
            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <strong style={{ fontSize: '16px' }}>Meal Package Plan (Assumes 5 Days)</strong>
                <span style={{ color: 'var(--accent)', fontSize: '13px' }}>Price per person</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { id: 'none', label: 'None (No pre-booked food)', price: 0 },
                  { id: 'all', label: '🍽️ All-Inclusive Meals', price: 1500 * 5 },
                  { id: 'breakfast', label: '🍽️ Breakfast Only', price: 400 * 5 }
                ].map(opt => (
                  <div key={opt.id} onClick={() => setCustomizations({ ...customizations, food: opt.id })}
                    style={{
                      padding: '15px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      background: customizations.food === opt.id ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.2)',
                      border: customizations.food === opt.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.3s'
                    }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{opt.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{opt.price === 0 ? 'Included' : `+₹${opt.price.toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setStep('details')} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back to Details
            </button>
            <button onClick={() => setStep('payment')} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Continue to Payment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment */}
      {step === 'payment' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          
          {/* Checkout Payment Form */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck color="#10b981" /> Secure Checkout</h3>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <button onClick={() => setPaymentMethod('card')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: paymentMethod === 'card' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                  border: paymentMethod === 'card' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  color: paymentMethod === 'card' ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.3s'
                }}>
                <CreditCard size={18} /> Card Payment
              </button>
              <button onClick={() => setPaymentMethod('upi')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: paymentMethod === 'upi' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                  border: paymentMethod === 'upi' ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                  color: paymentMethod === 'upi' ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.3s'
                }}>
                <QrCode size={18} /> BHIM UPI QR
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <div>
                {/* Visual Credit Card Mockup */}
                <div style={{
                  background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', borderRadius: '15px', padding: '25px', color: 'white', marginBottom: '25px',
                  position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(6,182,212,0.3)', minHeight: '170px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ background: '#eab308', width: '45px', height: '35px', borderRadius: '5px' }}></div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', fontStyle: 'italic' }}>TravelCard</div>
                  </div>
                  <div style={{ fontSize: '22px', letterSpacing: '4px', margin: '25px 0 10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {cardData.number || '•••• •••• •••• ••••'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <div>
                      <div style={{ opacity: 0.7, fontSize: '9px', textTransform: 'uppercase' }}>Card Holder</div>
                      <div>{cardData.name.toUpperCase() || 'YOUR NAME'}</div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.7, fontSize: '9px', textTransform: 'uppercase' }}>Expires</div>
                      <div>{cardData.expiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Cardholder Name</label>
                  <input required type="text" placeholder="John Doe" value={cardData.name} onChange={e => setCardData({ ...cardData, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Card Number</label>
                  <input required type="text" maxLength="19" placeholder="4111 2222 3333 4444" value={cardData.number}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      let matches = val.match(/\d{4,16}/g);
                      let match = (matches && matches[0]) || '';
                      let parts = [];
                      for (let i = 0, len = match.length; i < len; i += 4) {
                        parts.push(match.substring(i, i + 4));
                      }
                      setCardData({ ...cardData, number: parts.length > 0 ? parts.join(' ') : val });
                    }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input required type="text" maxLength="5" placeholder="MM/YY" value={cardData.expiry}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length >= 2) {
                          setCardData({ ...cardData, expiry: val.substring(0, 2) + '/' + val.substring(2, 4) });
                        } else {
                          setCardData({ ...cardData, expiry: val });
                        }
                      }} />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input required type="password" maxLength="3" placeholder="•••" value={cardData.cvv} onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })} />
                  </div>
                </div>

                <button disabled={loading} onClick={handleCheckoutSubmit} className="btn btn-accent" style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold' }}>
                  {loading ? 'Processing Secure Payment...' : `Pay & Book Now (₹${grandTotal.toLocaleString()})`}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                
                {/* Dynamic QR Code Mockup */}
                <div style={{
                  background: 'white', padding: '20px', borderRadius: '15px', display: 'inline-block', marginBottom: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '4px solid var(--accent)'
                }}>
                  <div style={{ background: '#f4f4f5', padding: '10px', borderRadius: '10px' }}>
                    {/* Simulated SVG QR Code */}
                    <svg width="180" height="180" viewBox="0 0 29 29" style={{ display: 'block' }}>
                      <path fill="black" d="M0 0h7v7H0zm1 1v5h5V1zm22-1h6v6h-6zm1 1v4h4V2zM0 22h7v7H0zm1 1v5h5v-5zm10-22h7v3h-3v4h-4zm3 1v1h2V4zm-3 8h4v3h-4zm5 0h3v4h-3zm-1 5h4v3h-4zm7 0h3v4h-3zm-10 5h4v3h-4zm11 0h3v3h-3zm-11-7h3v3h-3zm4 0h3v3h-3zm4 0h3v3h-3z" />
                    </svg>
                  </div>
                  <div style={{ color: '#000', fontWeight: 'bold', fontSize: '13px', marginTop: '10px' }}>AI-Tourist Merchant QR</div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>Scan & Pay with Any UPI App</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>GPay, PhonePe, Paytm, or BHIM</div>
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px',
                  padding: '15px', marginBottom: '25px', display: 'inline-block'
                }}>
                  {upiPaid ? (
                    <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> Payment Received! Proceeding...
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-main)', fontSize: '14px' }}>
                      ⏳ Simulating merchant verification... auto-resolving in <strong>{upiTimer}s</strong>
                    </div>
                  )}
                </div>

                <button disabled={!upiPaid || loading} onClick={handleCheckoutSubmit} className="btn btn-accent"
                  style={{
                    width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold',
                    opacity: upiPaid ? 1 : 0.5, cursor: upiPaid ? 'pointer' : 'not-allowed'
                  }}>
                  {loading ? 'Confirming Booking...' : upiPaid ? 'Complete Booking' : 'Waiting for UPI Payment Scan...'}
                </button>
              </div>
            )}

            <button onClick={() => setStep('customize')} className="btn" style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', marginTop: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
              ← Modify customizations
            </button>
          </div>

          {/* Pricing Summary Sidepanel */}
          <div className="glass-panel" style={{ padding: '30px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Invoice Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Package ({cart.length} Trip{cart.length > 1 ? 's' : ''})</span>
                <span style={{ fontWeight: '600' }}>₹{baseTotal.toLocaleString()}</span>
              </div>

              {customizations.transport !== 'none' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Transport Upgrade ({customizations.transport === 'flight' ? 'Flight' : customizations.transport === 'train' ? 'AC Train' : 'AC Bus'})
                  </span>
                  <span style={{ color: '#10b981' }}>+₹{transportTotal.toLocaleString()}</span>
                </div>
              )}

              {customizations.stay !== 'none' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Hotel Upgrade ({customizations.stay === 'luxury' ? '5★ Luxury' : customizations.stay === 'boutique' ? 'Boutique' : 'Comfort budget'})
                  </span>
                  <span style={{ color: '#10b981' }}>+₹{stayTotal.toLocaleString()}</span>
                </div>
              )}

              {customizations.food !== 'none' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Meals plan ({customizations.food === 'all' ? 'All-inclusive' : 'Breakfast'})
                  </span>
                  <span style={{ color: '#10b981' }}>+₹{foodTotal.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Travelers Count</span>
                <span style={{ fontWeight: '600' }}>{formData.numberOfPeople} Person{formData.numberOfPeople > 1 ? 's' : ''}</span>
              </div>
            </div>

            <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Grand Total</span>
              <span style={{ color: 'var(--accent)', fontSize: '28px', fontWeight: 'bold' }}>₹{grandTotal.toLocaleString()}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.05)' }}>
              🔒 <strong>SSL Encrypted:</strong> Your checkout session is completely encrypted. Safe MERN AI travel processing assured.
            </div>
          </div>

        </div>
      )}

      {/* STEP 4: Success Confirmed Screen */}
      {step === 'success' && (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', animation: 'scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '25px', borderRadius: '50%', color: '#10b981', marginBottom: '25px' }}>
            <CheckCircle size={70} />
          </div>
          
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '15px', color: 'var(--text-main)' }}>Booking Confirmed! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
            Congratulations, <strong>{formData.name}</strong>! Your customized trip packages have been successfully booked and payment has been verified. A confirmation ticket has been dispatched to <strong>{formData.email}</strong>.
          </p>

          <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border)', borderRadius: '15px', padding: '25px', maxWidth: '600px', margin: '0 auto 40px auto', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Booking Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
              <div><strong>Travel Date:</strong> {new Date(formData.travelDate).toLocaleDateString()}</div>
              <div><strong>Travelers Count:</strong> {formData.numberOfPeople} Person(s)</div>
              <div><strong>Departure From:</strong> {formData.fromCity}</div>
              <div><strong>Payment Transaction ID:</strong> <span style={{ color: 'var(--accent)' }}>{confirmedBookings[0]?.payment?.transactionId || 'TXN-SUCCESS'}</span></div>
              <div><strong>Grand Total Paid:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{totalPaid.toLocaleString()}</span></div>
              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <strong>Booked Packages:</strong>
                <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                  {confirmedBookings.map((b, i) => (
                    <li key={i} style={{ color: 'var(--text-muted)' }}>
                      {b.destination?.name || 'Custom Trip Package'} (Status: <span style={{ color: '#10b981' }}>{b.status}</span>)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-accent" style={{ padding: '12px 30px', fontWeight: 'bold' }}>
              Go to My Account Dashboard
            </button>
            <button onClick={() => navigate('/')} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 30px' }}>
              Plan Another Trip
            </button>
          </div>
          
          <style>{`
            @keyframes scaleUp {
              from { transform: scale(0.8); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
};

export default CartPage;
