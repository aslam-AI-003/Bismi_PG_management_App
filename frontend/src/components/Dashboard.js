import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ apiUrl, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/dashboard`);
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h2 className="page-title">Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card blue" onClick={() => onNavigate('rooms')}>
          <div className="stat-icon">🛏️</div>
          <div className="stat-info">
            <span className="stat-number">{data?.totalBeds || 0}</span>
            <span className="stat-label">Total Beds</span>
          </div>
        </div>

        <div className="stat-card green" onClick={() => onNavigate('customers')}>
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">{data?.occupiedBeds || 0}</span>
            <span className="stat-label">Occupied</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <span className="stat-number">{data?.vacantBeds || 0}</span>
            <span className="stat-label">Vacant Beds</span>
          </div>
        </div>

        <div className="stat-card purple" onClick={() => onNavigate('customers')}>
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <span className="stat-number">{data?.activeCustomers || 0}</span>
            <span className="stat-label">Active Tenants</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card income" onClick={() => onNavigate('payments')}>
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-number">₹{data?.monthlyIncome || 0}</span>
            <span className="stat-label">Monthly Income</span>
          </div>
        </div>

        <div className="stat-card expense" onClick={() => onNavigate('expenses')}>
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <span className="stat-number">₹{data?.monthlyExpense || 0}</span>
            <span className="stat-label">Monthly Expense</span>
          </div>
        </div>

        <div className="stat-card pending" onClick={() => onNavigate('payments')}>
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-number">₹{data?.pendingPayments || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="stat-card rate">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-number">{data?.occupancyRate || 0}%</span>
            <span className="stat-label">Occupancy Rate</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <button className="action-btn" onClick={() => onNavigate('customers')}>
            <span>➕</span> Add Tenant
          </button>
          <button className="action-btn" onClick={() => onNavigate('payments')}>
            <span>💳</span> Record Payment
          </button>
          <button className="action-btn" onClick={() => onNavigate('electricity')}>
            <span>⚡</span> Meter Reading
          </button>
          <button className="action-btn" onClick={() => onNavigate('expenses')}>
            <span>📝</span> Add Expense
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
