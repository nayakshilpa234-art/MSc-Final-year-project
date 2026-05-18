import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';

const TripTable = ({ addToCart, onTripAdded }) => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
      axios.get('http://localhost:5005/api/tripplans').then(res => setTrips(res.data)).catch(err => console.error(err));
  }, []);

  const handleAdd = (trip) => {
      addToCart(trip);
      if (onTripAdded) onTripAdded(trip);
  };

  const groupedTrips = trips.reduce((acc, trip) => {
      if (!acc[trip.type]) acc[trip.type] = [];
      acc[trip.type].push(trip);
      return acc;
  }, {});

  return (
    <div className="glass-panel" style={{ padding: '30px' }}>
      <h2 style={{ marginBottom: '20px' }}>Explore Our Trips</h2>
      {trips.length === 0 ? <p style={{color: 'var(--text-muted)'}}>No trip packages available currently.</p> : (
        <div>
          {Object.keys(groupedTrips).map((type) => (
            <div key={type} style={{ marginBottom: '40px' }}>
              <h3 style={{ 
                color: 'var(--text-main)', 
                borderBottom: '2px solid var(--accent)', 
                paddingBottom: '10px', 
                marginBottom: '20px', 
                textTransform: 'uppercase', 
                letterSpacing: '1px' 
              }}>
                {type} Packages
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {groupedTrips[type].map((trip) => (
                    <div key={trip._id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', lineHeight: '1.3' }}>{trip.destination}</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {trip.duration && (
                                <span style={{ fontSize: '12px', padding: '4px 10px', background: 'var(--accent)', color: 'white', borderRadius: '20px', fontWeight: 'bold' }}>
                                    {trip.duration}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '22px', fontWeight: 'bold', margin: 'auto 0 10px 0', color: 'var(--text-main)' }}>${trip.price}</p>
                        <button className="btn btn-accent" onClick={() => handleAdd(trip)} style={{ padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', fontSize: '14px' }}>
                          <ShoppingCart size={16} /> Add to Cart
                        </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripTable;
