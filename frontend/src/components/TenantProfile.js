import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TenantProfile({ apiUrl, tenantId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantId) fetchProfile();
  }, [tenantId]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/tenant/${tenantId}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const shareProfile = () => {
    const url = `${window.location.origin}?tenant=${tenantId}`;
    if (navigator.share) {
      navigator.share({
        title: `${data.tenant.name} - BISMI MEN'S PLAZA`,
        text: `Tenant Profile & Payment for ${data.tenant.name}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard!');
    }
  };

  const shareViaWhatsApp = () => {
    const url = `${window.location.origin}?tenant=${tenantId}`;
    const message = `Hi ${data.tenant.name},\n\nHere is your tenant profile for BISMI MEN'S PLAZA.\nYou can view your rent details and make payments here:\n\n${url}\n\nThank you!`;
    const cleanPhone = data.tenant.phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getUPIPaymentLink = (amount) => {
    const upiId = data.hostel.upi_id || '9894092449@jupiteraxis';
    const name = encodeURIComponent("BISMI MENS PLAZA");
    return `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tn=Rent Payment - ${data.tenant.name}`;
  };

  const pendingPayments = data?.payments?.filter(p => p.status === 'Pending') || [];
  const paidPayments = data?.payments?.filter(p => p.status === 'Paid') || [];
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!data || !data.tenant) return <div className="loading">Tenant not found</div>;

  return (
    <div className="tenant-profile-page">
      {onBack && (
        <button className="back-btn" onClick={onBack}>← Back</button>
      )}

      {/* Profile Header */}
      <div className="profile-header">
        <img src="/logo.png" alt="Bismi Logo" className="profile-logo" />
        <h2 className="profile-hostel-name">{data.hostel.name}</h2>
        <div className="profile-card">
          <div className="profile-avatar">👤</div>
          <h3>{data.tenant.name}</h3>
          <p className="profile-phone">📞 {data.tenant.phone}</p>
          <div className="profile-details">
            <span>🛏️ {data.tenant.room_number} - {data.tenant.bed_number}</span>
            <span>📅 Since {data.tenant.check_in_date || 'N/A'}</span>
          </div>
          <div className="profile-rent">
            <span>Monthly Rent</span>
            <strong>₹{data.tenant.monthly_rent}</strong>
          </div>
          <span className={`badge ${data.tenant.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
            {data.tenant.status}
          </span>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="profile-share-buttons">
        <button className="btn btn-primary" onClick={shareProfile}>
          🔗 Share Profile
        </button>
        <button className="btn btn-whatsapp" onClick={shareViaWhatsApp}>
          📱 Share via WhatsApp
        </button>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="profile-section">
          <h3 className="section-title">⏳ Pending Payments</h3>
          <div className="pending-total">
            <span>Total Due:</span>
            <strong>₹{totalPending}</strong>
          </div>
          {pendingPayments.map(p => (
            <div key={p.id} className="payment-card pending">
              <div className="payment-card-info">
                <strong>{p.month} {p.year}</strong>
                <span>₹{p.amount}</span>
              </div>
              <a href={getUPIPaymentLink(p.amount)} className="btn btn-pay">
                💳 Pay ₹{p.amount}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* UPI Payment Section */}
      <div className="profile-section">
        <h3 className="section-title">💳 Pay Rent</h3>
        <div className="upi-section">
          <div className="qr-code-container">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getUPIPaymentLink(data.tenant.monthly_rent))}`}
              alt="UPI QR Code"
              className="qr-code"
            />
            <p className="qr-label">Scan to Pay</p>
          </div>
          <div className="upi-details">
            <div className="upi-info">
              <span>UPI ID:</span>
              <strong>{data.hostel.upi_id}</strong>
            </div>
            <div className="upi-info">
              <span>Phone:</span>
              <strong>{data.hostel.payment_phone}</strong>
            </div>
            <div className="upi-info">
              <span>Amount:</span>
              <strong>₹{data.tenant.monthly_rent}</strong>
            </div>
            <a href={getUPIPaymentLink(data.tenant.monthly_rent)} className="btn btn-pay btn-full">
              💳 Pay ₹{data.tenant.monthly_rent} via UPI
            </a>
            <a href={`https://wa.me/91${data.hostel.payment_phone}?text=${encodeURIComponent(`Hi, I have paid my rent of ₹${data.tenant.monthly_rent} for BISMI MEN'S PLAZA. Name: ${data.tenant.name}, Room: ${data.tenant.room_number}`)}`} 
               className="btn btn-whatsapp btn-full" target="_blank" rel="noreferrer">
              📱 Notify Payment via WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {paidPayments.length > 0 && (
        <div className="profile-section">
          <h3 className="section-title">✅ Payment History</h3>
          <div className="list">
            {paidPayments.map(p => (
              <div key={p.id} className="list-item">
                <div className="list-item-left">
                  <div className="list-avatar">✅</div>
                  <div>
                    <strong>{p.month} {p.year}</strong>
                    <span className="list-subtitle">{p.payment_method} - {p.payment_date}</span>
                  </div>
                </div>
                <div className="list-item-right">
                  <span className="amount">₹{p.amount}</span>
                  <span className="badge badge-green">Paid</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="profile-footer">
        <img src="/logo.png" alt="Logo" className="footer-logo" />
        <p>BISMI MEN'S PLAZA</p>
        <p className="footer-dev">Powered by ASVEN Technology</p>
      </div>
    </div>
  );
}

export default TenantProfile;
