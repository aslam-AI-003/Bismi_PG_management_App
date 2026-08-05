import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Payments({ apiUrl }) {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showGenerateRent, setShowGenerateRent] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({
    customer_id: '', amount: '', payment_type: 'Rent', payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(), status: 'Paid', notes: ''
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
      await axios.post(`${apiUrl}/api/payments`, form);
      setShowForm(false);
      setForm({
        customer_id: '', amount: '', payment_type: 'Rent', payment_method: 'Cash',
        payment_date: new Date().toISOString().split('T')[0],
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(), status: 'Paid', notes: ''
      });
      fetchPayments();
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const generateRent = async () => {
    try {
      const month = document.getElementById('gen-month').value;
      const year = parseInt(document.getElementById('gen-year').value);
      const res = await axios.post(`${apiUrl}/api/payments/generate-rent`, { month, year });
      alert(res.data.message);
      setShowGenerateRent(false);
      fetchPayments();
    } catch (err) { alert('Error generating rent'); }
  };

  const markPaid = async (id) => {
    try {
      await axios.put(`${apiUrl}/api/payments/${id}`, {
        status: 'Paid',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash'
      });
      fetchPayments();
    } catch (err) { alert('Error updating payment'); }
  };

  const sendReminder = (phone, name, amount, month) => {
    const message = `Hi ${name},\n\nThis is a friendly reminder from BISMI MEN'S PLAZA.\n\nYour rent of ₹${amount} for ${month} is pending. Please make the payment at your earliest convenience.\n\nThank you!`;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredPayments = payments.filter(p => filter === 'All' || p.status === filter);

  const totalPending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Payments</h2>
        <div>
          <button className="btn btn-secondary" onClick={() => setShowGenerateRent(!showGenerateRent)}>⚡ Generate</button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add</button>
        </div>
      </div>

      <div className="payment-summary">
        <div className="summary-item green">
          <span>Paid</span>
          <strong>₹{totalPaid}</strong>
        </div>
        <div className="summary-item orange">
          <span>Pending</span>
          <strong>₹{totalPending}</strong>
        </div>
      </div>

      <div className="filter-tabs">
        {['All', 'Paid', 'Pending'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {showGenerateRent && (
        <div className="form-card">
          <h3>Generate Monthly Rent</h3>
          <p className="form-help">This will create pending payment entries for all active tenants</p>
          <div className="form-row">
            <div className="form-group">
              <label>Month</label>
              <select id="gen-month" defaultValue={new Date().toLocaleString('default', { month: 'long' })}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input id="gen-year" type="number" defaultValue={new Date().getFullYear()} />
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={generateRent}>Generate Rent</button>
        </div>
      )}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer *</label>
            <select value={form.customer_id} onChange={e => {
              const customer = customers.find(c => c.id === parseInt(e.target.value));
              setForm({...form, customer_id: parseInt(e.target.value), amount: customer?.monthly_rent || form.amount});
            }} required>
              <option value="">Select customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.room_number}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.payment_type} onChange={e => setForm({...form, payment_type: e.target.value})}>
                <option>Rent</option>
                <option>Security Deposit</option>
                <option>Electricity</option>
                <option>Maintenance</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Method</label>
              <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>PhonePe</option>
                <option>GPay</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Month</label>
              <select value={form.month} onChange={e => setForm({...form, month: e.target.value})}>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Record Payment</button>
        </form>
      )}

      <div className="list">
        {filteredPayments.map(payment => (
          <div key={payment.id} className="list-item payment-item">
            <div className="list-item-left">
              <div className="list-avatar">{payment.status === 'Paid' ? '✅' : '⏳'}</div>
              <div>
                <strong>{payment.customer_name}</strong>
                <span className="list-subtitle">{payment.room_number} | {payment.month} {payment.year}</span>
                <span className="list-subtitle">{payment.payment_method} - {payment.payment_date || 'Pending'}</span>
              </div>
            </div>
            <div className="list-item-right">
              <span className="amount">₹{payment.amount}</span>
              <span className={`badge ${payment.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>{payment.status}</span>
              {payment.status === 'Pending' && (
                <div className="payment-actions">
                  <button className="btn-sm btn-green" onClick={() => markPaid(payment.id)}>✓ Paid</button>
                  <button className="btn-sm btn-whatsapp" onClick={() => sendReminder(payment.customer_phone, payment.customer_name, payment.amount, payment.month)}>📱</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredPayments.length === 0 && <p className="empty-text">No payments found</p>}
      </div>
    </div>
  );
}

export default Payments;
