import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TenantDashboard({ apiUrl, tenant, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({ title: '', description: '', category: 'General', priority: 'Normal' });

  useEffect(() => { fetchProfile(); fetchIssues(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/tenant/${tenant.id}`);
      setProfile(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchIssues = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/issues/tenant/${tenant.id}`);
      setIssues(res.data);
    } catch (err) { console.error(err); }
  };

  const submitIssue = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/api/issues`, { ...issueForm, customer_id: tenant.id });
      alert('Issue raised successfully!');
      setShowIssueForm(false);
      setIssueForm({ title: '', description: '', category: 'General', priority: 'Normal' });
      fetchIssues();
    } catch (err) { alert('Error raising issue'); }
  };

  const downloadBill = (payment) => {
    const billContent = `
BISMI MEN'S PLAZA
========================
RENT RECEIPT
========================
Name: ${tenant.name}
Room: ${tenant.room_number}
Month: ${payment.month} ${payment.year}
Amount: ₹${payment.amount}
Status: ${payment.status}
Method: ${payment.payment_method || '-'}
Date: ${payment.payment_date || '-'}
Invoice: ${payment.invoice_number || '-'}
========================
UPI: 9894092449@jupiteraxis
Phone: 9894092449
========================
Thank you!
    `;
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${payment.month}_${payment.year}.txt`;
    a.click();
  };

  if (!profile) return <div className="loading">Loading...</div>;

  return (
    <div className="app">
      <div className="header">
        <img src="/logo.png" alt="Logo" className="header-logo" />
        <h1>BISMI MEN'S PLAZA</h1>
        <button className="menu-btn" onClick={onLogout}>🚪</button>
      </div>

      <div className="watermark"><img src="/logo.png" alt="" /></div>

      <div className="main-content">
        {/* Tenant Info Card */}
        <div className="tenant-welcome">
          <h2>Welcome, {tenant.name}! 👋</h2>
          <p>{tenant.room_number} | {tenant.bed_number}</p>
        </div>

        {/* Tab Navigation */}
        <div className="filter-tabs">
          {['profile', 'payments', 'issues'].map(tab => (
            <button key={tab} className={`filter-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'profile' ? '👤 Profile' : tab === 'payments' ? '💰 Payments' : '🎫 Issues'}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="detail-card">
              <div className="customer-avatar">👤</div>
              <p><strong>Name:</strong> {profile.tenant.name}</p>
              <p><strong>Phone:</strong> {profile.tenant.phone}</p>
              <p><strong>Room:</strong> {profile.tenant.room_number}</p>
              <p><strong>Bed:</strong> {profile.tenant.bed_number}</p>
              <p><strong>Check-in:</strong> {profile.tenant.check_in_date}</p>
              <p><strong>Monthly Rent:</strong> ₹{profile.tenant.monthly_rent}</p>
              <p><strong>Security Deposit:</strong> ₹{profile.tenant.security_deposit}</p>
            </div>

            {/* UPI Payment Section */}
            <div className="detail-card">
              <h3 className="section-title">💳 Payment Details</h3>
              <p><strong>UPI ID:</strong> {profile.hostel.upi_id}</p>
              <p><strong>Phone:</strong> {profile.hostel.payment_phone}</p>
              <a href={`upi://pay?pa=${profile.hostel.upi_id}&pn=BISMI%20MENS%20PLAZA&am=${profile.tenant.monthly_rent}&cu=INR`} className="btn btn-pay btn-full" style={{marginTop:'10px'}}>
                💳 Pay ₹{profile.tenant.monthly_rent} via UPI
              </a>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            <div className="payment-summary">
              <div className="summary-item green">
                <span>Paid</span>
                <strong>₹{profile.payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0)}</strong>
              </div>
              <div className="summary-item orange">
                <span>Pending</span>
                <strong>₹{profile.payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0)}</strong>
              </div>
            </div>

            <div className="list">
              {profile.payments.map(p => (
                <div key={p.id} className="list-item">
                  <div className="list-item-left">
                    <div className="list-avatar">{p.status === 'Paid' ? '✅' : '⏳'}</div>
                    <div>
                      <strong>{p.month} {p.year}</strong>
                      <span className="list-subtitle">{p.payment_method || 'Pending'} | {p.payment_date || '-'}</span>
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className="amount">₹{p.amount}</span>
                    <span className={`badge ${p.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>{p.status}</span>
                    {p.status === 'Paid' && (
                      <button className="btn-sm btn-green" onClick={() => downloadBill(p)}>📥 Bill</button>
                    )}
                  </div>
                </div>
              ))}
              {profile.payments.length === 0 && <p className="empty-text">No payment records</p>}
            </div>

            {/* UPI Link */}
            <div className="detail-card" style={{marginTop:'16px'}}>
              <h3 className="section-title">💳 Pay Now</h3>
              <p>UPI: <strong>{profile.hostel.upi_id}</strong></p>
              <p>Phone: <strong>{profile.hostel.payment_phone}</strong></p>
              <a href={`upi://pay?pa=${profile.hostel.upi_id}&pn=BISMI%20MENS%20PLAZA&am=${profile.tenant.monthly_rent}&cu=INR`} className="btn btn-pay btn-full">
                💳 Pay ₹{profile.tenant.monthly_rent} via UPI
              </a>
            </div>
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div>
            <button className="btn btn-primary" onClick={() => setShowIssueForm(!showIssueForm)} style={{marginBottom:'12px'}}>
              + Raise Issue
            </button>

            {showIssueForm && (
              <form className="form-card" onSubmit={submitIssue}>
                <div className="form-group">
                  <label>Issue Title *</label>
                  <input type="text" placeholder="e.g. Water problem, WiFi not working" value={issueForm.title} onChange={e => setIssueForm({...issueForm, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={issueForm.category} onChange={e => setIssueForm({...issueForm, category: e.target.value})}>
                    <option>General</option>
                    <option>Plumbing</option>
                    <option>Electrical</option>
                    <option>WiFi</option>
                    <option>Cleaning</option>
                    <option>Maintenance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea placeholder="Describe the issue..." value={issueForm.description} onChange={e => setIssueForm({...issueForm, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={issueForm.priority} onChange={e => setIssueForm({...issueForm, priority: e.target.value})}>
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-full">Submit Issue</button>
              </form>
            )}

            <div className="list">
              {issues.map(issue => (
                <div key={issue.id} className="list-item">
                  <div className="list-item-left">
                    <div className="list-avatar">
                      {issue.status === 'Open' ? '🔴' : issue.status === 'In Progress' ? '🟡' : '🟢'}
                    </div>
                    <div>
                      <strong>{issue.title}</strong>
                      <span className="list-subtitle">{issue.category} | {issue.priority}</span>
                      {issue.admin_response && <span className="list-subtitle">💬 Admin: {issue.admin_response}</span>}
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className={`badge ${issue.status === 'Open' ? 'badge-red' : issue.status === 'Resolved' ? 'badge-green' : 'badge-orange'}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>
              ))}
              {issues.length === 0 && <p className="empty-text">No issues raised</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantDashboard;
