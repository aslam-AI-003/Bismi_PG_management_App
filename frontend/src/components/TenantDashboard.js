import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TenantDashboard({ apiUrl, tenant, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState(false);
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

  // Edit Profile
  const startEdit = () => {
    setEditForm({
      name: profile.tenant.name || '',
      phone: profile.tenant.phone || '',
      email: profile.tenant.email || '',
      emergency_contact: profile.tenant.emergency_contact || '',
      emergency_name: profile.tenant.emergency_name || '',
      address: profile.tenant.address || ''
    });
    setEditMode(true);
  };

  const saveProfile = async () => {
    try {
      await axios.put(`${apiUrl}/api/customers/${tenant.id}`, editForm);
      alert('Profile updated successfully!');
      setEditMode(false);
      fetchProfile();
    } catch (err) { alert('Error updating profile: ' + (err.response?.data?.error || err.message)); }
  };

  // Photo Upload
  const uploadPhoto = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = type === 'photo' ? 'user' : 'environment';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large! Max 5MB');
        return;
      }
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('id_proof', file);
        const endpoint = type === 'photo' 
          ? `${apiUrl}/api/customers/${tenant.id}/upload-photo`
          : `${apiUrl}/api/customers/${tenant.id}/upload-id`;
        await axios.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(type === 'photo' ? 'Profile photo updated!' : 'ID Proof uploaded!');
        fetchProfile();
      } catch (err) { 
        alert('Upload failed: ' + (err.response?.data?.error || err.message)); 
      }
      setUploading(false);
    };
    input.click();
  };

  // Get due date for current month (10th)
  const getDueDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`;
  };

  const getDueDateDisplay = () => {
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 10);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { text: `Overdue by ${Math.abs(daysLeft)} days`, color: 'red', icon: '🔴' };
    } else if (daysLeft === 0) {
      return { text: 'Due Today!', color: 'orange', icon: '⚠️' };
    } else if (daysLeft <= 3) {
      return { text: `Due in ${daysLeft} days`, color: 'orange', icon: '⏰' };
    } else {
      return { text: `Due: 10th (${daysLeft} days left)`, color: 'green', icon: '📅' };
    }
  };

  const downloadBill = (payment) => {
    const rentMatch = payment.notes?.match(/Rent: ₹(\d+)/);
    const ebMatch = payment.notes?.match(/EB: ₹(\d+)/);
    const rent = rentMatch ? rentMatch[1] : payment.amount;
    const eb = ebMatch ? ebMatch[1] : '0';
    
    const billContent = `
════════════════════════════════
     BISMI MEN'S PLAZA
     RENT RECEIPT
════════════════════════════════

Name: ${tenant.name}
Room: ${tenant.room_number}
Month: ${payment.month} ${payment.year}

────────────────────────────────
Rent Amount:     ₹${rent}
EB Charge:       ₹${eb}
────────────────────────────────
TOTAL:           ₹${payment.amount}
────────────────────────────────

Status: ${payment.status}
Method: ${payment.payment_method || '-'}
Date: ${payment.payment_date || '-'}
Invoice: ${payment.invoice_number || '-'}

════════════════════════════════
UPI: 9894092449@jupiteraxis
Phone: 9894092449
════════════════════════════════
     Thank you! 🙏
    `;
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${payment.month}_${payment.year}.txt`;
    a.click();
  };

  if (!profile) return <div className="loading">Loading...</div>;

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  const currentMonthPayment = profile.payments?.find(p => p.month === currentMonth && p.year === currentYear);
  const dueInfo = getDueDateDisplay();

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
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            {profile.tenant.photo ? (
              <img src={profile.tenant.photo} alt="Profile" style={{width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white'}} />
            ) : (
              <div style={{width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>👤</div>
            )}
            <div>
              <h2 style={{margin: 0}}>Welcome, {tenant.name}! 👋</h2>
              <p style={{margin: 0, opacity: 0.9}}>{tenant.room_number} | {tenant.bed_number}</p>
            </div>
          </div>
        </div>

        {/* Current Month Status Card */}
        <div className="detail-card" style={{background: currentMonthPayment?.status === 'Paid' ? '#e8f5e9' : '#fff3e0', border: currentMonthPayment?.status === 'Paid' ? '2px solid #4caf50' : '2px solid #ff9800'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <strong style={{fontSize: '16px'}}>{currentMonth} {currentYear}</strong>
              <p style={{margin: '4px 0', color: '#666'}}>{dueInfo.icon} {dueInfo.text}</p>
            </div>
            <div style={{textAlign: 'right'}}>
              {currentMonthPayment ? (
                <>
                  <span className={`badge ${currentMonthPayment.status === 'Paid' ? 'badge-green' : 'badge-orange'}`} style={{fontSize: '14px'}}>
                    {currentMonthPayment.status === 'Paid' ? '✅ PAID' : '⏳ PENDING'}
                  </span>
                  <p style={{margin: '4px 0', fontWeight: 'bold', fontSize: '18px'}}>₹{currentMonthPayment.amount}</p>
                </>
              ) : (
                <span className="badge badge-orange">No Bill Yet</span>
              )}
            </div>
          </div>
          {currentMonthPayment?.notes && (
            <div style={{marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', fontSize: '13px'}}>
              {(() => {
                const rentMatch = currentMonthPayment.notes?.match(/Rent: ₹(\d+)/);
                const ebMatch = currentMonthPayment.notes?.match(/EB: ₹(\d+)/);
                return (
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>🏠 Rent: ₹{rentMatch ? rentMatch[1] : currentMonthPayment.amount}</span>
                    <span>⚡ EB: ₹{ebMatch ? ebMatch[1] : '0'}</span>
                  </div>
                );
              })()}
            </div>
          )}
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
            {!editMode ? (
              <div className="detail-card">
                <div style={{textAlign: 'center', marginBottom: '12px'}}>
                  {profile.tenant.photo ? (
                    <img src={profile.tenant.photo} alt="Profile" style={{width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1976d2'}} />
                  ) : (
                    <div className="customer-avatar" style={{margin: '0 auto'}}>👤</div>
                  )}
                  <button className="btn-sm btn-primary" onClick={() => uploadPhoto('photo')} disabled={uploading} style={{marginTop: '8px'}}>
                    {uploading ? 'Uploading...' : '📷 Change Photo'}
                  </button>
                </div>
                <p><strong>Name:</strong> {profile.tenant.name}</p>
                <p><strong>Phone:</strong> {profile.tenant.phone}</p>
                <p><strong>Email:</strong> {profile.tenant.email || '-'}</p>
                <p><strong>Room:</strong> {profile.tenant.room_number}</p>
                <p><strong>Bed:</strong> {profile.tenant.bed_number}</p>
                <p><strong>Check-in:</strong> {profile.tenant.check_in_date}</p>
                <p><strong>Monthly Rent:</strong> ₹{profile.tenant.monthly_rent}</p>
                <p><strong>Security Deposit:</strong> ₹{profile.tenant.security_deposit}</p>
                <p><strong>Emergency Contact:</strong> {profile.tenant.emergency_name || '-'} - {profile.tenant.emergency_contact || '-'}</p>
                <p><strong>Address:</strong> {profile.tenant.address || '-'}</p>
                
                <div className="action-buttons" style={{marginTop: '12px'}}>
                  <button className="btn btn-primary" onClick={startEdit}>✏️ Edit Profile</button>
                </div>
              </div>
            ) : (
              <div className="form-card">
                <h3 style={{marginBottom: '12px'}}>✏️ Edit Profile</h3>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input type="text" value={editForm.emergency_name} onChange={e => setEditForm({...editForm, emergency_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input type="tel" value={editForm.emergency_contact} onChange={e => setEditForm({...editForm, emergency_contact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                </div>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={saveProfile}>💾 Save Changes</button>
                  <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* ID Proof Section */}
            <div className="detail-card" style={{marginTop: '12px'}}>
              <h3 className="section-title">📄 ID Proof</h3>
              {profile.tenant.id_proof_photo ? (
                <div style={{textAlign: 'center'}}>
                  <img src={profile.tenant.id_proof_photo} alt="ID Proof" style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd'}} />
                  <p style={{color: 'green', fontSize: '13px'}}>✅ ID Proof uploaded</p>
                </div>
              ) : (
                <p className="empty-text">No ID proof uploaded yet</p>
              )}
              <button className="btn btn-secondary btn-full" onClick={() => uploadPhoto('id')} disabled={uploading} style={{marginTop: '8px'}}>
                📷 {profile.tenant.id_proof_photo ? 'Update' : 'Upload'} ID Proof (Aadhaar/Photo ID)
              </button>
            </div>

            {/* UPI Payment Section */}
            <div className="detail-card" style={{marginTop: '12px'}}>
              <h3 className="section-title">💳 Payment Details</h3>
              <p><strong>UPI ID:</strong> {profile.hostel.upi_id}</p>
              <p><strong>Phone:</strong> {profile.hostel.payment_phone}</p>
              <p><strong>Due Date:</strong> Every month 10th</p>
              <a href={`upi://pay?pa=${profile.hostel.upi_id}&pn=BISMI%20MENS%20PLAZA&am=${profile.tenant.monthly_rent}&cu=INR`} className="btn btn-pay btn-full" style={{marginTop:'10px'}}>
                💳 Pay ₹{profile.tenant.monthly_rent} via UPI
              </a>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div>
            {/* Payment Summary */}
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

            {/* Due Date Info */}
            <div style={{background: '#f5f5f5', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span>{dueInfo.icon} <strong>Due Date:</strong> 10th of every month</span>
              <span style={{color: dueInfo.color === 'red' ? '#d32f2f' : dueInfo.color === 'orange' ? '#f57c00' : '#4caf50', fontWeight: 'bold', fontSize: '12px'}}>
                {dueInfo.text}
              </span>
            </div>

            {/* Payment List with Rent + EB details */}
            <div className="list">
              {profile.payments.map(p => {
                const rentMatch = p.notes?.match(/Rent: ₹(\d+)/);
                const ebMatch = p.notes?.match(/EB: ₹(\d+)/);
                const rent = rentMatch ? rentMatch[1] : p.amount;
                const eb = ebMatch ? ebMatch[1] : '0';
                
                return (
                  <div key={p.id} className="list-item" style={{flexDirection: 'column', alignItems: 'stretch'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <div className="list-avatar">{p.status === 'Paid' ? '✅' : '⏳'}</div>
                        <div>
                          <strong>{p.month} {p.year}</strong>
                          <span className="list-subtitle">{p.payment_method || 'Pending'} | {p.payment_date || '-'}</span>
                        </div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <span className="amount">₹{p.amount}</span>
                        <span className={`badge ${p.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>{p.status}</span>
                      </div>
                    </div>
                    {/* Rent + EB Breakdown */}
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '6px', padding: '6px 10px', background: '#f8f9fa', borderRadius: '6px', fontSize: '12px'}}>
                      <span>🏠 Rent: ₹{rent}</span>
                      <span>⚡ EB: ₹{eb}</span>
                      {p.status === 'Paid' && (
                        <button className="btn-sm btn-green" onClick={() => downloadBill(p)} style={{fontSize: '11px', padding: '2px 6px'}}>📥 Bill</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {profile.payments.length === 0 && <p className="empty-text">No payment records yet</p>}
            </div>

            {/* UPI Link */}
            <div className="detail-card" style={{marginTop:'16px'}}>
              <h3 className="section-title">💳 Pay Now</h3>
              <p>UPI: <strong>{profile.hostel.upi_id}</strong></p>
              <p>Phone: <strong>{profile.hostel.payment_phone}</strong></p>
              <a href={`upi://pay?pa=${profile.hostel.upi_id}&pn=BISMI%20MENS%20PLAZA&am=${profile.tenant.monthly_rent}&cu=INR`} className="btn btn-pay btn-full">
                💳 Pay ₹{profile.tenant.monthly_rent} via UPI
              </a>
              <a href={`https://wa.me/91${profile.hostel.payment_phone}?text=${encodeURIComponent(`Hi, I have paid my rent of ₹${profile.tenant.monthly_rent} for BISMI MEN'S PLAZA.\nName: ${tenant.name}\nRoom: ${tenant.room_number}\nMonth: ${currentMonth} ${currentYear}`)}`} 
                 className="btn btn-whatsapp btn-full" target="_blank" rel="noreferrer" style={{marginTop: '8px'}}>
                📱 Notify Payment via WhatsApp
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
                      {issue.admin_response && <span className="list-subtitle" style={{color: '#1976d2'}}>💬 Admin: {issue.admin_response}</span>}
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
