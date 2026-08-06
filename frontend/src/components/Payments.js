import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Payments({ apiUrl }) {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({
    customer_id: '', amount: '', rent_amount: '', eb_amount: '', payment_type: 'Rent + EB',
    payment_method: 'Cash', payment_date: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(), status: 'Paid', notes: ''
  });

  useEffect(() => { fetchPayments(); fetchCustomers(); }, []);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/payments`);
      setPayments(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/customers`);
      setCustomers(res.data.filter(c => c.status === 'Active'));
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const rent = parseFloat(form.rent_amount) || 0;
      const eb = parseFloat(form.eb_amount) || 0;
      const totalAmount = parseFloat(form.amount) || (rent + eb);
      
      await axios.post(`${apiUrl}/api/payments`, {
        ...form,
        amount: totalAmount,
        notes: `Rent: ₹${rent}, EB: ₹${eb}${form.notes ? ' | ' + form.notes : ''}`
      });
      setShowForm(false);
      setForm({
        customer_id: '', amount: '', rent_amount: '', eb_amount: '', payment_type: 'Rent + EB',
        payment_method: 'Cash', payment_date: new Date().toISOString().split('T')[0],
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(), status: 'Paid', notes: ''
      });
      fetchPayments();
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const markAsPaid = async (id) => {
    try {
      await axios.put(`${apiUrl}/api/payments/${id}`, {
        status: 'Paid',
        payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0]
      });
      fetchPayments();
    } catch (err) { alert('Error updating payment'); }
  };

  const deletePayment = async (id) => {
    if (window.confirm('Delete this payment record?')) {
      try {
        await axios.delete(`${apiUrl}/api/payments/${id}`);
        fetchPayments();
      } catch (err) { alert('Error deleting payment'); }
    }
  };

  const sendWhatsAppReminder = (payment) => {
    const rentMatch = payment.notes?.match(/Rent: ₹(\d+)/);
    const ebMatch = payment.notes?.match(/EB: ₹(\d+)/);
    const rent = rentMatch ? rentMatch[1] : payment.amount;
    const eb = ebMatch ? ebMatch[1] : '0';
    
    const message = `Hi ${payment.customer_name},\n\n🏠 *BISMI MEN'S PLAZA*\n📅 ${payment.month} ${payment.year} Bill\n\n💰 Rent: ₹${rent}\n⚡ EB Charge: ₹${eb}\n━━━━━━━━━━━━\n📊 *Total: ₹${payment.amount}*\n\n💳 UPI: 9894092449@jupiteraxis\n📱 Phone: 9894092449\n\nPlease pay before due date.\nThank you! 🙏`;
    
    const cleanPhone = payment.customer_phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const generateMonthlyRent = async () => {
    const month = form.month;
    const year = form.year;
    if (window.confirm(`Generate rent for ${month} ${year} for all active tenants?`)) {
      try {
        const res = await axios.post(`${apiUrl}/api/payments/generate-rent`, { month, year });
        alert(res.data.message);
        fetchPayments();
      } catch (err) { alert('Error generating rent'); }
    }
  };

  const sendAllReminders = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/reminders/pending`);
      const reminders = res.data;
      if (!reminders || reminders.length === 0) {
        alert('No pending payments to remind!');
        return;
      }
      if (window.confirm(`Send WhatsApp reminders to ${reminders.length} tenants with pending payments?`)) {
        // Open WhatsApp links one by one (with small delay)
        for (let i = 0; i < reminders.length; i++) {
          setTimeout(() => {
            window.open(reminders[i].whatsapp_link, '_blank');
          }, i * 1500); // 1.5 second gap between each
        }
        alert(`Opening ${reminders.length} WhatsApp reminders. Send each one manually.`);
      }
    } catch (err) { alert('Error fetching reminders'); }
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Paid') return p.status === 'Paid';
    if (filter === 'Pending') return p.status === 'Pending';
    return true;
  });

  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  const selectedCustomer = customers.find(c => c.id === parseInt(form.customer_id));

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Payments</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add</button>
      </div>

      {/* Summary */}
      <div className="payment-summary">
        <div className="summary-item green">
          <span>Collected</span>
          <strong>₹{totalPaid}</strong>
        </div>
        <div className="summary-item orange">
          <span>Pending</span>
          <strong>₹{totalPending}</strong>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap'}}>
        <button className="btn btn-secondary" onClick={generateMonthlyRent}>
          🔄 Generate Monthly Rent
        </button>
        {totalPending > 0 && (
          <button className="btn btn-whatsapp-all" onClick={sendAllReminders} style={{background: '#25D366', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>
            📱 Send All Reminders ({payments.filter(p => p.status === 'Pending').length})
          </button>
        )}
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Tenant *</label>
            <select value={form.customer_id} onChange={e => {
              const cust = customers.find(c => c.id === parseInt(e.target.value));
              setForm({...form, customer_id: e.target.value, rent_amount: cust?.monthly_rent || ''});
            }} required>
              <option value="">Select tenant...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.room_number}</option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="calculation-box">
              <p>🛏️ {selectedCustomer.room_number} | Monthly Rent: ₹{selectedCustomer.monthly_rent}</p>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Rent Amount (₹)</label>
              <input type="number" placeholder="Enter rent" value={form.rent_amount} onChange={e => {
                const rent = parseFloat(e.target.value) || 0;
                const eb = parseFloat(form.eb_amount) || 0;
                setForm({...form, rent_amount: e.target.value, amount: rent + eb});
              }} />
            </div>
            <div className="form-group">
              <label>EB Amount (₹)</label>
              <input type="number" placeholder="Electricity charge" value={form.eb_amount} onChange={e => {
                const eb = parseFloat(e.target.value) || 0;
                const rent = parseFloat(form.rent_amount) || 0;
                setForm({...form, eb_amount: e.target.value, amount: rent + eb});
              }} />
            </div>
          </div>

          <div className="form-group">
            <label>Total Amount (₹) *</label>
            <input type="number" placeholder="Total amount (auto-calculated or manual)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
            <span className="form-help">Auto-calculated from Rent + EB, or enter manually</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Month</label>
              <select value={form.month} onChange={e => setForm({...form, month: e.target.value})}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>
                <option>Cash</option>
                <option>UPI</option>
                <option>GPay</option>
                <option>PhonePe</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option>Paid</option>
                <option>Pending</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Payment Date</label>
            <input type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <input type="text" placeholder="Optional notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>

          <button type="submit" className="btn btn-primary btn-full">Record Payment</button>
        </form>
      )}

      {/* Filter */}
      <div className="filter-tabs">
        {['All', 'Paid', 'Pending'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className="list">
        {filteredPayments.map(p => (
          <div key={p.id} className="list-item">
            <div className="list-item-left">
              <div className="list-avatar">{p.status === 'Paid' ? '✅' : '⏳'}</div>
              <div>
                <strong>{p.customer_name}</strong>
                <span className="list-subtitle">{p.room_number} | {p.month} {p.year}</span>
                {p.notes && <span className="list-subtitle">{p.notes}</span>}
              </div>
            </div>
            <div className="list-item-right">
              <span className="amount">₹{p.amount}</span>
              <span className={`badge ${p.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>{p.status}</span>
              <div className="payment-actions">
                {p.status === 'Pending' && (
                  <button className="btn-sm btn-green" onClick={(e) => { e.stopPropagation(); markAsPaid(p.id); }}>✓ Paid</button>
                )}
                <button className="btn-sm btn-whatsapp" onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(p); }}>📱</button>
                <button className="btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); deletePayment(p.id); }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
        {filteredPayments.length === 0 && <p className="empty-text">No payments found</p>}
      </div>
    </div>
  );
}

export default Payments;
