import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Electricity({ apiUrl }) {
  const [readings, setReadings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    room_id: '', month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(), previous_reading: 0, current_reading: 0, rate_per_unit: 8
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchReadings(); fetchRooms(); }, []);

  const fetchReadings = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/electricity`);
      setReadings(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/rooms`);
      setRooms(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.current_reading < form.previous_reading) {
      alert('Current reading must be greater than previous reading');
      return;
    }
    try {
      await axios.post(`${apiUrl}/api/electricity`, form);
      setShowForm(false);
      setForm({
        room_id: '', month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(), previous_reading: 0, current_reading: 0, rate_per_unit: 8
      });
      fetchReadings();
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const deleteReading = async (id) => {
    if (window.confirm('Delete this reading?')) {
      try {
        await axios.delete(`${apiUrl}/api/electricity/${id}`);
        fetchReadings();
      } catch (err) { alert('Error deleting'); }
    }
  };

  const unitsConsumed = form.current_reading - form.previous_reading;
  const totalAmount = unitsConsumed * form.rate_per_unit;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Electricity</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Reading</button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Room *</label>
            <select value={form.room_id} onChange={e => setForm({...form, room_id: parseInt(e.target.value)})} required>
              <option value="">Select room...</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.room_number}</option>
              ))}
            </select>
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
          <div className="form-row">
            <div className="form-group">
              <label>Previous Reading</label>
              <input type="number" value={form.previous_reading} onChange={e => setForm({...form, previous_reading: parseFloat(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label>Current Reading</label>
              <input type="number" value={form.current_reading} onChange={e => setForm({...form, current_reading: parseFloat(e.target.value)})} required />
            </div>
          </div>
          <div className="form-group">
            <label>Rate per Unit (₹)</label>
            <input type="number" value={form.rate_per_unit} onChange={e => setForm({...form, rate_per_unit: parseFloat(e.target.value)})} />
          </div>
          
          {unitsConsumed > 0 && (
            <div className="calculation-box">
              <p>Units Consumed: <strong>{unitsConsumed}</strong></p>
              <p>Rate: <strong>₹{form.rate_per_unit}/unit</strong></p>
              <p className="total">Total: <strong>₹{totalAmount}</strong></p>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full">Add Reading</button>
        </form>
      )}

      <div className="list">
        {readings.map(reading => (
          <div key={reading.id} className="list-item">
            <div className="list-item-left">
              <div className="list-avatar">⚡</div>
              <div>
                <strong>{reading.room_number}</strong>
                <span className="list-subtitle">{reading.month} {reading.year}</span>
                <span className="list-subtitle">{reading.previous_reading} → {reading.current_reading} ({reading.units_consumed} units)</span>
              </div>
            </div>
            <div className="list-item-right">
              <span className="amount">₹{reading.total_amount}</span>
              <button className="btn-sm btn-danger" onClick={() => deleteReading(reading.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {readings.length === 0 && <p className="empty-text">No readings found</p>}
      </div>
    </div>
  );
}

export default Electricity;
