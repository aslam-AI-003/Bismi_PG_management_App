import React, { useState, useEffect } from 'react';
import './styles.css';
import Login from './components/Login';
import TenantDashboard from './components/TenantDashboard';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Rooms from './components/Rooms';
import Payments from './components/Payments';
import Electricity from './components/Electricity';
import Expenses from './components/Expenses';
import Issues from './components/Issues';
import Reports from './components/Reports';
import TenantProfile from './components/TenantProfile';

const API_URL = process.env.REACT_APP_API_URL || 'https://bismi-pg-backend.onrender.com';

function App() {
  const [role, setRole] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewProfileId, setViewProfileId] = useState(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('bismi_role');
    if (savedRole === 'admin') {
      setRole('admin');
    } else if (savedRole === 'tenant') {
      const savedTenant = localStorage.getItem('bismi_tenant');
      if (savedTenant) {
        setRole('tenant');
        setTenant(JSON.parse(savedTenant));
      }
    }
  }, []);

  const handleLogin = (userRole, tenantData) => {
    setRole(userRole);
    setTenant(tenantData);
  };

  const handleLogout = () => {
    localStorage.removeItem('bismi_role');
    localStorage.removeItem('bismi_token');
    localStorage.removeItem('bismi_tenant');
    setRole(null);
    setTenant(null);
    setCurrentPage('dashboard');
  };

  // Show Login if not logged in
  if (!role) {
    return <Login apiUrl={API_URL} onLogin={handleLogin} />;
  }

  // Show Tenant Dashboard
  if (role === 'tenant') {
    return <TenantDashboard apiUrl={API_URL} tenant={tenant} onLogout={handleLogout} />;
  }

  // Tenant Profile View
  if (viewProfileId) {
    return (
      <div className="app">
        <div className="main-content">
          <button className="btn btn-secondary" onClick={() => setViewProfileId(null)}>← Back</button>
          <TenantProfile apiUrl={API_URL} customerId={viewProfileId} />
        </div>
      </div>
    );
  }

  // Admin Dashboard
  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard apiUrl={API_URL} onNavigate={setCurrentPage} />;
      case 'customers': return <Customers apiUrl={API_URL} onViewProfile={setViewProfileId} />;
      case 'rooms': return <Rooms apiUrl={API_URL} />;
      case 'payments': return <Payments apiUrl={API_URL} />;
      case 'electricity': return <Electricity apiUrl={API_URL} />;
      case 'expenses': return <Expenses apiUrl={API_URL} />;
      case 'issues': return <Issues apiUrl={API_URL} />;
      case 'reports': return <Reports apiUrl={API_URL} />;
      default: return <Dashboard apiUrl={API_URL} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        <img src="/logo.png" alt="Logo" className="header-logo" />
        <h1>BISMI MEN'S PLAZA</h1>
        <span className="header-badge">Admin</span>
      </div>

      {/* Sidebar */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <h2>BISMI MEN'S PLAZA</h2>
          <p className="sidebar-subtitle">Admin Panel</p>
        </div>
        {[
          { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
          { id: 'customers', icon: '👥', label: 'Tenants' },
          { id: 'rooms', icon: '🛏️', label: 'Rooms' },
          { id: 'payments', icon: '💰', label: 'Payments' },
          { id: 'electricity', icon: '⚡', label: 'Electricity' },
          { id: 'expenses', icon: '📤', label: 'Expenses' },
          { id: 'issues', icon: '🎫', label: 'Issues' },
          { id: 'reports', icon: '📊', label: 'Reports' },
        ].map(item => (
          <button key={item.id} className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}>
            <span className="nav-icon">{item.icon}</span> {item.label}
          </button>
        ))}
        <button className="nav-item" onClick={handleLogout}>
          <span className="nav-icon">🚪</span> Logout
        </button>
        <div className="sidebar-footer">
          <p className="developer-name">ASVEN Technology</p>
          <p>v2.0</p>
        </div>
      </div>

      {/* Watermark */}
      <div className="watermark"><img src="/logo.png" alt="" /></div>

      {/* Main Content */}
      <div className="main-content">
        {renderPage()}
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        {[
          { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
          { id: 'customers', icon: '👥', label: 'Tenants' },
          { id: 'rooms', icon: '🛏️', label: 'Rooms' },
          { id: 'payments', icon: '💰', label: 'Payments' },
          { id: 'electricity', icon: '⚡', label: 'Electricity' },
        ].map(item => (
          <button key={item.id} className={`bottom-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}>
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
