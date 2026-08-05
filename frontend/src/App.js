import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Rooms from './components/Rooms';
import Payments from './components/Payments';
import Electricity from './components/Electricity';
import Expenses from './components/Expenses';
import TenantProfile from './components/TenantProfile';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant') ? 'tenant-profile' : 'dashboard';
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [tenantId, setTenantId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('tenant');
    return id ? parseInt(id) : null;
  });

  const navigateToTenantProfile = (id) => {
    setTenantId(id);
    setCurrentPage('tenant-profile');
  };

  const pages = {
    dashboard: <Dashboard apiUrl={API_URL} onNavigate={setCurrentPage} />,
    customers: <Customers apiUrl={API_URL} onViewProfile={navigateToTenantProfile} />,
    rooms: <Rooms apiUrl={API_URL} />,
    payments: <Payments apiUrl={API_URL} />,
    electricity: <Electricity apiUrl={API_URL} />,
    expenses: <Expenses apiUrl={API_URL} />,
    'tenant-profile': <TenantProfile apiUrl={API_URL} tenantId={tenantId} onBack={() => setCurrentPage('customers')} />,
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'customers', label: 'Tenants', icon: '👥' },
    { id: 'rooms', label: 'Rooms', icon: '🛏️' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'electricity', label: 'Electricity', icon: '⚡' },
    { id: 'expenses', label: 'Expenses', icon: '📊' },
  ];

  return (
    <div className="app">
      {/* Watermark */}
      <div className="watermark">
        <img src="/logo.png" alt="" />
      </div>

      {/* Header */}
      <header className="header">
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <img src="/logo.png" alt="Logo" className="header-logo" />
        <h1>BISMI MEN'S PLAZA</h1>
      </header>

      {/* Side Menu Overlay */}
      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
      
      {/* Side Menu */}
      <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Bismi Logo" className="sidebar-logo" />
          <h2>Bismi PG</h2>
          <p className="sidebar-subtitle">Management App</p>
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => { setCurrentPage(item.id); setMenuOpen(false); }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="sidebar-footer">
          <p>Developed by</p>
          <p className="developer-name">ASVEN Technology</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {pages[currentPage]}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
