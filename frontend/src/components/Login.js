import React, { useState } from 'react';
import axios from 'axios';

function Login({ apiUrl, onLogin }) {
  const [loginType, setLoginType] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (loginType === 'admin') {
        const res = await axios.post(`${apiUrl}/api/admin/login`, { username, password });
        if (res.data.success) {
          localStorage.setItem('bismi_role', 'admin');
          localStorage.setItem('bismi_token', res.data.token);
          onLogin('admin', null);
        }
      } else {
        const res = await axios.post(`${apiUrl}/api/tenant/login`, { username, password });
        if (res.data.success) {
          localStorage.setItem('bismi_role', 'tenant');
          localStorage.setItem('bismi_tenant', JSON.stringify(res.data.tenant));
          onLogin('tenant', res.data.tenant);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  if (!loginType) {
    return (
      <div className="login-page">
        <div className="login-container">
          <img src="/logo.png" alt="Bismi" className="login-logo-img" />
          <h1 className="login-title">BISMI MEN'S PLAZA</h1>
          <p className="login-subtitle">PG Management System</p>
          <div className="login-roles">
            <button className="role-btn admin-role" onClick={() => setLoginType('admin')}>
              <span className="role-icon">🔐</span>
              <span className="role-name">Admin Login</span>
              <span className="role-desc">Manage rooms, tenants & payments</span>
            </button>
            <button className="role-btn tenant-role" onClick={() => setLoginType('tenant')}>
              <span className="role-icon">👤</span>
              <span className="role-name">Tenant Login</span>
              <span className="role-desc">View profile, rent & raise issues</span>
            </button>
          </div>
          <div className="login-footer"><p>Developed by <strong>ASVEN Technology</strong></p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <img src="/logo.png" alt="Bismi" className="login-logo-img" />
        <h1 className="login-title">BISMI MEN'S PLAZA</h1>
        <h2 className="login-role-title">{loginType === 'admin' ? '🔐 Admin Login' : '👤 Tenant Login'}</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label>{loginType === 'admin' ? 'Username' : 'Your Name'}</label>
            <input type="text" placeholder={loginType === 'admin' ? 'Enter username' : 'Enter your name'} value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="login-field">
            <label>{loginType === 'admin' ? 'Password' : 'Phone Number'}</label>
            <input type={loginType === 'admin' ? 'password' : 'tel'} placeholder={loginType === 'admin' ? 'Enter password' : 'Enter phone number'} value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <button className="login-back" onClick={() => { setLoginType(null); setError(''); }}>← Back</button>
        {loginType === 'tenant' && <div className="login-help"><p>💡 Name = registered name | Password = phone number</p></div>}
        <div className="login-footer"><p>Developed by <strong>ASVEN Technology</strong></p></div>
      </div>
    </div>
  );
}

export default Login;
