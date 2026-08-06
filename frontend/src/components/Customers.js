import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Customers({ apiUrl, onViewProfile }) {
  const [customers, setCustomers] = useState([]);
  const [vacantBeds, setVacantBeds] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [filter, setFilter] = useState('Active');
  const [idProofFile, setIdProofFile] = useState(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', emergency_contact: '', emergency_name: '',
    aadhaar_number: '', address: '', room_id: '', bed_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    security_deposit: 0, monthly_rent: 0, notes: ''
  });

  useEffect(() => { fetchCustomers(); fetchVacantBeds(); fetchRooms(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/customers`);
      setCustomers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchVacantBeds = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/beds/vacant`);
      setVacantBeds(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/rooms`);
      setRooms(res.data);
    } catch (err) { console.error(err); }
  };

  const viewCustomer = async (id) => {
    try {
      const res = await axios.get(`${apiUrl}/api/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${apiUrl}/api/customers`, form);
      
      // Upload ID proof if selected
      if (idProofFile && res.data.id) {
        const formData = new FormData();
        formData.append('id_proof', idProofFile);
        formData.append('customer_id', res.data.id);
        await axios.post(`${apiUrl}/api/customers/${res.data.id}/upload-id`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setShowForm(false);
      setIdProofFile(null);
      setForm({
        name: '', phone: '', email: '', emergency_contact: '', emergency_name: '',
        aadhaar_number: '', address: '', room_id: '', bed_id: '',
        check_in_date: new Date().toISOString().split('T')[0],
        security_deposit: 0, monthly_rent: 0, notes: ''
      });
      fetchCustomers();
      fetchVacantBeds();
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const uploadIdProof = async (customerId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('id_proof', file);
        try {
          await axios.post(`${apiUrl}/api/customers/${customerId}/upload-id`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          alert('ID Proof uploaded successfully!');
          viewCustomer(customerId);
        } catch (err) { alert('Upload failed'); }
      }
    };
    input.click();
  };

  const checkoutCustomer = async (id) => {
    if (window.confirm('Check out this tenant?')) {
      try {
        await axios.put(`${apiUrl}/api/customers/${id}`, { status: 'Vacated' });
        fetchCustomers();
        fetchVacantBeds();
        setSelectedCustomer(null);
      } catch (err) { alert('Error checking out'); }
    }
  };

  const sendWhatsAppReminder = (customer) => {
    const message = `Hi ${customer.name},\n\n🏠 *BISMI MEN'S PLAZA*\n\nThis is a reminder for your monthly rent payment.\n\n💰 Rent: ₹${customer.monthly_rent}\n\n💳 UPI: 9894092449@jupiteraxis\n📱 Phone: 9894092449\n\nPlease pay at your earliest convenience.\nThank you! 🙏`;
    const cleanPhone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const filteredCustomers = customers.filter(c => filter === 'All' || c.status === filter);

  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editData, setEditData] = useState({});

  const startEditCustomer = () => {
    setEditData({
      name: selectedCustomer.name || '',
      phone: selectedCustomer.phone || '',
      email: selectedCustomer.email || '',
      emergency_contact: selectedCustomer.emergency_contact || '',
      emergency_name: selectedCustomer.emergency_name || '',
      aadhaar_number: selectedCustomer.aadhaar_number || '',
      address: selectedCustomer.address || '',
      monthly_rent: selectedCustomer.monthly_rent || 0,
      security_deposit: selectedCustomer.security_deposit || 0,
      notes: selectedCustomer.notes || ''
    });
    setEditingCustomer(true);
  };

  const saveEditCustomer = async () => {
    try {
      await axios.put(`${apiUrl}/api/customers/${selectedCustomer.id}`, editData);
      alert('Tenant updated successfully!');
      setEditingCustomer(false);
      viewCustomer(selectedCustomer.id);
      fetchCustomers();
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  if (selectedCustomer) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => { setSelectedCustomer(null); setEditingCustomer(false); }}>← Back</button>
          <h2>{selectedCustomer.name}</h2>
        </div>

        {!editingCustomer ? (
        <div className="detail-card">
          <div className="customer-avatar">👤</div>
          <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
          <p><strong>Email:</strong> {selectedCustomer.email || '-'}</p>
          <p><strong>Room:</strong> {selectedCustomer.room_number || 'Not assigned'}</p>
          <p><strong>Bed:</strong> {selectedCustomer.bed_number || 'Not assigned'}</p>
          <p><strong>Check-in:</strong> {selectedCustomer.check_in_date || '-'}</p>
          <p><strong>Monthly Rent:</strong> ₹{selectedCustomer.monthly_rent}</p>
          <p><strong>Security Deposit:</strong> ₹{selectedCustomer.security_deposit}</p>
          <p><strong>Aadhaar:</strong> {selectedCustomer.aadhaar_number || '-'}</p>
          <p><strong>Emergency:</strong> {selectedCustomer.emergency_name || '-'} - {selectedCustomer.emergency_contact || '-'}</p>
          <p><strong>Address:</strong> {selectedCustomer.address || '-'}</p>
          <p><strong>Status:</strong> <span className={`badge ${selectedCustomer.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{selectedCustomer.status}</span></p>
          {selectedCustomer.notes && <p><strong>Notes:</strong> {selectedCustomer.notes}</p>}
          <button className="btn btn-primary" onClick={startEditCustomer} style={{marginTop: '12px'}}>✏️ Edit Tenant Details</button>
        </div>
        ) : (
        <div className="form-card">
          <h3 style={{marginBottom: '12px'}}>✏️ Edit Tenant: {selectedCustomer.name}</h3>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input type="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Emergency Name</label>
              <input type="text" value={editData.emergency_name} onChange={e => setEditData({...editData, emergency_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Emergency Phone</label>
              <input type="tel" value={editData.emergency_contact} onChange={e => setEditData({...editData, emergency_contact: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Aadhaar Number</label>
            <input type="text" value={editData.aadhaar_number} onChange={e => setEditData({...editData, aadhaar_number: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monthly Rent (₹)</label>
              <input type="number" value={editData.monthly_rent} onChange={e => setEditData({...editData, monthly_rent: parseFloat(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Security Deposit (₹)</label>
              <input type="number" value={editData.security_deposit} onChange={e => setEditData({...editData, security_deposit: parseFloat(e.target.value)})} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} />
          </div>
          <div className="action-buttons" style={{marginTop: '12px'}}>
            <button className="btn btn-primary" onClick={saveEditCustomer}>💾 Save Changes</button>
            <button className="btn btn-secondary" onClick={() => setEditingCustomer(false)}>Cancel</button>
          </div>
        </div>
        )}

        {/* ID Proof Section */}
        <div className="detail-card">
          <h3 className="section-title">📄 ID Proof</h3>
          {selectedCustomer.id_proof_photo ? (
            <div className="id-proof-display">
              <img src={selectedCustomer.id_proof_photo.startsWith('http') ? selectedCustomer.id_proof_photo : `${apiUrl}/uploads/${selectedCustomer.id_proof_photo}`} alt="ID Proof" className="id-proof-image" />
              <button className="btn btn-secondary" onClick={() => window.open(selectedCustomer.id_proof_photo.startsWith('http') ? selectedCustomer.id_proof_photo : `${apiUrl}/uploads/${selectedCustomer.id_proof_photo}`, '_blank')}>
                🔍 View Full Size
              </button>
            </div>
          ) : (
            <p className="empty-text">No ID proof uploaded</p>
          )}
          <button className="btn btn-primary" onClick={() => uploadIdProof(selectedCustomer.id)} style={{marginTop: '8px'}}>
            📷 {selectedCustomer.id_proof_photo ? 'Change' : 'Upload'} ID Proof
          </button>
        </div>

        <div className="action-buttons">
          <button className="btn btn-profile" onClick={() => onViewProfile && onViewProfile(selectedCustomer.id)}>
            👤 View Profile
          </button>
          <button className="btn btn-whatsapp" onClick={() => sendWhatsAppReminder(selectedCustomer)}>
            📱 WhatsApp
          </button>
          <a href={`tel:${selectedCustomer.phone}`} className="btn btn-primary">📞 Call</a>
          {selectedCustomer.status === 'Active' && (
            <button className="btn btn-danger" onClick={() => checkoutCustomer(selectedCustomer.id)}>
              🚪 Check Out
            </button>
          )}
        </div>

        {selectedCustomer.payments && selectedCustomer.payments.length > 0 && (
          <>
            <h3 className="section-title">Payment History</h3>
            <div className="list">
              {selectedCustomer.payments.map(p => (
                <div key={p.id} className="list-item">
                  <div>
                    <strong>{p.month} {p.year}</strong>
                    <span className="list-subtitle">{p.payment_method} - {p.payment_date}</span>
                    {p.notes && <span className="list-subtitle">{p.notes}</span>}
                  </div>
                  <div>
                    <span className="amount">₹{p.amount}</span>
                    <span className={`badge ${p.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Tenants</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add</button>
      </div>

      <div className="filter-tabs">
        {['Active', 'Vacated', 'All'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f} {f === 'Active' ? `(${customers.filter(c => c.status === 'Active').length})` : ''}
          </button>
        ))}
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Aadhaar Number</label>
              <input type="text" value={form.aadhaar_number} onChange={e => setForm({...form, aadhaar_number: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Emergency Name</label>
              <input type="text" value={form.emergency_name} onChange={e => setForm({...form, emergency_name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Emergency Phone</label>
              <input type="tel" value={form.emergency_contact} onChange={e => setForm({...form, emergency_contact: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Select Bed (Vacant)</label>
            <select value={form.bed_id} onChange={e => {
              const bed = vacantBeds.find(b => b.id === parseInt(e.target.value));
              setForm({...form, bed_id: parseInt(e.target.value), room_id: bed?.room_id || '', monthly_rent: bed?.rent_per_bed || form.monthly_rent});
            }}>
              <option value="">Select a bed...</option>
              {vacantBeds.map(bed => (
                <option key={bed.id} value={bed.id}>{bed.room_number} - {bed.bed_number}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Check-in Date</label>
              <input type="date" value={form.check_in_date} onChange={e => setForm({...form, check_in_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Monthly Rent (₹)</label>
              <input type="number" value={form.monthly_rent} onChange={e => setForm({...form, monthly_rent: parseFloat(e.target.value)})} />
            </div>
          </div>
          <div className="form-group">
            <label>Security Deposit (₹)</label>
            <input type="number" value={form.security_deposit} onChange={e => setForm({...form, security_deposit: parseFloat(e.target.value)})} />
          </div>
          <div className="form-group">
            <label>📷 ID Proof (Aadhaar/Photo)</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setIdProofFile(e.target.files[0])} />
            <span className="form-help">Upload Aadhaar card or any ID proof image</span>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Add Tenant</button>
        </form>
      )}

      <div className="list">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="list-item" onClick={() => viewCustomer(customer.id)}>
            <div className="list-item-left">
              <div className="list-avatar">👤</div>
              <div>
                <strong>{customer.name}</strong>
                <span className="list-subtitle">{customer.room_number || 'No room'} | {customer.phone}</span>
              </div>
            </div>
            <div className="list-item-right">
              <span className="amount">₹{customer.monthly_rent}/m</span>
              <span className={`badge ${customer.status === 'Active' ? 'badge-green' : 'badge-red'}`}>{customer.status}</span>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && <p className="empty-text">No tenants found</p>}
      </div>
    </div>
  );
}

export default Customers;
