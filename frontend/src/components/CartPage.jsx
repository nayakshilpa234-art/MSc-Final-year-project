import React from 'react';
import { Trash2 } from 'lucide-react';

const CartPage = ({ cart, setCart }) => {
  const removeItem = (idToRemove) => {
    setCart(cart.filter(item => item.id !== idToRemove));
  };

  const totalPrice = cart.reduce((total, item) => total + item.price, 0);

  return (
    <div className="glass-panel" style={{ padding: '30px' }}>
      <h2 style={{ marginBottom: '20px' }}>Your Cart</h2>
      
      {cart.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Your cart is empty. Explore some trips and add them to your cart!</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '15px', textAlign: 'left' }}>Trip</th>
                <th style={{ padding: '15px', textAlign: 'left' }}>Price ($)</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={`${item.id}-${index}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '15px' }}>
                    <strong>{item.type}</strong> - {item.destination}
                  </td>
                  <td style={{ padding: '15px', color: 'var(--accent)' }}>${item.price}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: 'var(--danger)' }} onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', padding: '20px 0', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0 }}>Total: <span style={{ color: 'var(--accent)' }}>${totalPrice}</span></h3>
            <button className="btn btn-accent">Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
