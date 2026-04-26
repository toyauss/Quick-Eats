// src/components/UpiPaymentButton.tsx

import React, { useMemo } from 'react';

interface UpiPaymentButtonProps {
  // Details passed from the page/parent component
  amount: number;
  orderId: string; // Must be unique for the transaction
  description: string;
}

// --- UPI Constants ---
// Replace with your actual VPA and Name (URL encoded)
const YOUR_VPA: string = 'yourvpa@bankname'; 
const YOUR_PAYEE_NAME: string = 'Hackathon%20Demo';
const CURRENCY: string = 'INR';

const UpiPaymentButton: React.FC<UpiPaymentButtonProps> = ({ amount, orderId, description }) => {

  // useMemo ensures the link is only rebuilt when the props change
  const upiLink = useMemo(() => {
    // Construct the UPI Deep Link URL
    // amount.toFixed(2) ensures two decimal places (e.g., 50.00)
    return `upi://pay?pa=${YOUR_VPA}&pn=${YOUR_PAYEE_NAME}&am=${amount.toFixed(2)}&tr=${orderId}&tn=${description}&cu=${CURRENCY}`;
  }, [amount, orderId, description]);

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Payment Details: ₹{amount.toFixed(2)}</h3>
      
      {/* The core link implementation */}
      <a 
        href={upiLink} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ textDecoration: 'none' }}
      >
        <button 
          style={{ 
            padding: '12px 25px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Pay with UPI App 📱
        </button>
      </a>

      <p style={{ fontSize: '0.8em', color: '#666' }}>
        Clicking this works best on a mobile browser.
      </p>
    </div>
  );
};

export default UpiPaymentButton;