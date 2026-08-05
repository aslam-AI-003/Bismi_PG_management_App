import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Rooms({ apiUrl }) {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
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
    try {
      await axios.post(`${apiUrl}/api/rooms`, form);
      setShowForm(false);
      setForm({ room_number: '', floor: 1, room_type: 'Non-AC', sharing_type: 2, total_beds: 2, rent_per_bed: 0 });
      fetchRooms();
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const deleteRoom = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await axios.delete(`${apiUrl}/api/rooms/${id}`);
        fetchRooms();
        setSelectedRoom(null);
      } catch (err) { alert('Error deleting room'); }
    }
  };

  if (selectedRoom) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="back-btn" onClick={() => setSelectedRoom(null)}>← Back</button>
          <h2>{selectedRoom.room_number}</h2>
        </div>
        <div className="detail-card">
          <p><strong>Floor:</strong> {selectedRoom.floor}</p>
          <p><strong>Type:</strong> {selectedRoom.room_type}</p>
          <p><strong>Sharing:</strong> {selectedRoom.sharing_type} sharing</p>
          <p><strong>Total Beds:</strong> {selectedRoom.total_beds}</p>
          <p><strong>Rent/Bed:</strong> ₹{selectedRoom.rent_per_bed}</p>
          <p><strong>Status:</strong> <span className={`badge ${selectedRoom.status === 'Available' ? 'badge-green' : 'badge-red'}`}>{selectedRoom.status}</span></p>
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
        <button className="btn btn-danger" onClick={() => deleteRoom(selectedRoom.id)}>Delete Room</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Rooms</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Room</button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Room Number</label>
            <input type="text" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Floor</label>
              <input type="number" value={form.floor} onChange={e => setForm({...form, floor: parseInt(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})}>
                <option>Non-AC</option>
                <option>AC</option>
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
              </select>
            </div>
            <div className="form-group">
              <label>Rent/Bed (₹)</label>
              <input type="number" value={form.rent_per_bed} onChange={e => setForm({...form, rent_per_bed: parseFloat(e.target.value)})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full">Add Room</button>
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
              <span>{room.sharing_type} Sharing | {room.room_type}</span>
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
