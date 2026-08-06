import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Rooms({ apiUrl }) {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    room_number: '', floor: 1, room_type: 'Non-AC', sharing_type: 2, total_beds: 2, rent_per_bed: 0
  });

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/rooms`);
      setRooms(res.data);
    } catch (err) { console.error(err); }
  };

  const viewRoom = async (id) => {
    try {
      const res = await axios.get(`${apiUrl}/api/rooms/${id}`);
      setSelectedRoom(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (editMode && selectedRoom) {
        await axios.put(`${apiUrl}/api/rooms/${selectedRoom.id}`, {
          room_number: form.room_number,
          floor: form.floor,
          room_type: form.room_type,
          sharing_type: form.sharing_type,
          rent_per_bed: form.rent_per_bed,
          status: form.status || 'Available',
          maintenance_note: form.maintenance_note || ''
        });
        alert('Room updated successfully!');
        // Refresh room data
        const res = await axios.get(`${apiUrl}/api/rooms/${selectedRoom.id}`);
        setSelectedRoom(res.data);
        setEditMode(false);
        setShowForm(false);
      } else {
        await axios.post(`${apiUrl}/api/rooms`, form);
        alert('Room added successfully!');
        setShowForm(false);
      }
      setForm({ room_number: '', floor: 1, room_type: 'Non-AC', sharing_type: 2, total_beds: 2, rent_per_bed: 0 });
      fetchRooms();
    } catch (err) { 
      alert('Error: ' + (err.response?.data?.error || err.message)); 
    }
    setLoading(false);
  };

  const startEdit = () => {
    setForm({
      room_number: selectedRoom.room_number,
      floor: selectedRoom.floor,
      room_type: selectedRoom.room_type,
      sharing_type: selectedRoom.sharing_type,
      total_beds: selectedRoom.total_beds,
      rent_per_bed: selectedRoom.rent_per_bed || 0,
      status: selectedRoom.status || 'Available',
      maintenance_note: selectedRoom.maintenance_note || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setShowForm(false);
    setForm({ room_number: '', floor: 1, room_type: 'Non-AC', sharing_type: 2, total_beds: 2, rent_per_bed: 0 });
  };

  const deleteRoom = async (id) => {
    if (window.confirm('Are you sure you want to delete this room? All beds in this room will also be deleted.')) {
      try {
        await axios.delete(`${apiUrl}/api/rooms/${id}`);
        fetchRooms();
        setSelectedRoom(null);
      } catch (err) { alert('Error deleting room: ' + (err.response?.data?.error || err.message)); }
    }
  };

  // Room Detail View
  if (selectedRoom && !editMode) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setSelectedRoom(null)}>← Back</button>
          <h2>{selectedRoom.room_number}</h2>
        </div>
        <div className="detail-card">
          <p><strong>Room Name:</strong> {selectedRoom.room_number}</p>
          <p><strong>Floor:</strong> {selectedRoom.floor}</p>
          <p><strong>Type:</strong> {selectedRoom.room_type}</p>
          <p><strong>Sharing:</strong> {selectedRoom.sharing_type} sharing</p>
          <p><strong>Total Beds:</strong> {selectedRoom.total_beds}</p>
          <p><strong>Rent/Bed:</strong> ₹{selectedRoom.rent_per_bed || 0}</p>
          <p><strong>Status:</strong> <span className={`badge ${selectedRoom.status === 'Available' ? 'badge-green' : 'badge-red'}`}>{selectedRoom.status || 'Available'}</span></p>
          {selectedRoom.maintenance_note && <p><strong>Note:</strong> {selectedRoom.maintenance_note}</p>}
        </div>
        
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={startEdit}>✏️ Edit Room</button>
          <button className="btn btn-danger" onClick={() => deleteRoom(selectedRoom.id)}>🗑️ Delete</button>
        </div>

        <h3 className="section-title">Beds</h3>
        <div className="beds-grid">
          {selectedRoom.beds?.map(bed => (
            <div key={bed.id} className={`bed-card ${bed.status === 'Occupied' ? 'occupied' : 'vacant'}`}>
              <span className="bed-icon">{bed.status === 'Occupied' ? '🧑' : '🛏️'}</span>
              <span className="bed-name">{bed.bed_number}</span>
              {bed.customer_name && <span className="bed-customer">{bed.customer_name}</span>}
              {bed.customer_phone && <span className="bed-phone">{bed.customer_phone}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Edit Form View (separate from Room Detail)
  if (editMode && showForm) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={cancelEdit}>← Cancel</button>
          <h2>Edit: {selectedRoom?.room_number}</h2>
        </div>
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Room Name / Number *</label>
            <input type="text" placeholder="e.g. Room A, 101" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Floor Number</label>
              <input type="number" value={form.floor} onChange={e => setForm({...form, floor: parseInt(e.target.value) || 1})} min="0" />
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})}>
                <option>Non-AC</option>
                <option>AC</option>
                <option>Semi-AC</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sharing Type</label>
              <select value={form.sharing_type} onChange={e => setForm({...form, sharing_type: parseInt(e.target.value)})}>
                <option value={1}>Single</option>
                <option value={2}>2 Sharing</option>
                <option value={3}>3 Sharing</option>
                <option value={4}>4 Sharing</option>
                <option value={5}>5 Sharing</option>
                <option value={6}>6 Sharing</option>
                <option value={8}>8 Sharing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rent per Bed (₹)</label>
              <input type="number" value={form.rent_per_bed} onChange={e => setForm({...form, rent_per_bed: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="Available">Available</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>
          <div className="form-group">
            <label>Maintenance Note</label>
            <textarea value={form.maintenance_note || ''} onChange={e => setForm({...form, maintenance_note: e.target.value})} placeholder="Any maintenance notes..." />
          </div>
          <div className="action-buttons">
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Updating...' : '✅ Update Room'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  // Room List View
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Rooms ({rooms.length})</h2>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditMode(false); }}>+ Add Room</button>
      </div>

      {showForm && !editMode && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Room Name / Number *</label>
            <input type="text" placeholder="e.g. Room A, 101, Ground Floor Room" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Floor Number</label>
              <input type="number" placeholder="e.g. 1, 2, 3" value={form.floor} onChange={e => setForm({...form, floor: parseInt(e.target.value) || 1})} min="0" />
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})}>
                <option>Non-AC</option>
                <option>AC</option>
                <option>Semi-AC</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sharing Type</label>
              <select value={form.sharing_type} onChange={e => setForm({...form, sharing_type: parseInt(e.target.value), total_beds: parseInt(e.target.value)})}>
                <option value={1}>Single</option>
                <option value={2}>2 Sharing</option>
                <option value={3}>3 Sharing</option>
                <option value={4}>4 Sharing</option>
                <option value={5}>5 Sharing</option>
                <option value={6}>6 Sharing</option>
                <option value={8}>8 Sharing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rent per Bed (₹)</label>
              <input type="number" placeholder="Monthly rent" value={form.rent_per_bed} onChange={e => setForm({...form, rent_per_bed: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Room'}
          </button>
        </form>
      )}

      <div className="rooms-grid">
        {rooms.map(room => (
          <div key={room.id} className="room-card" onClick={() => viewRoom(room.id)}>
            <div className="room-header">
              <h3>{room.room_number}</h3>
              <span className={`badge ${room.occupied_beds >= room.total_beds ? 'badge-red' : 'badge-green'}`}>
                {room.occupied_beds >= room.total_beds ? 'Full' : 'Available'}
              </span>
            </div>
            <div className="room-info">
              <span>Floor {room.floor} | {room.sharing_type} Sharing | {room.room_type}</span>
              <span className="room-occupancy">
                🛏️ {room.occupied_beds}/{room.total_beds} beds
              </span>
            </div>
            {room.rent_per_bed > 0 && <span className="room-rent">₹{room.rent_per_bed}/bed</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rooms;
