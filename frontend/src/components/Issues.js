import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Issues({ apiUrl }) {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('All');
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => { fetchIssues(); }, []);

  const fetchIssues = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/issues`);
      setIssues(res.data);
    } catch (err) { console.error(err); }
  };

  const updateIssue = async (id, status, response) => {
    try {
      const payload = { status };
      if (response && response.trim() !== '') {
        payload.admin_response = response;
      }
      await axios.put(`${apiUrl}/api/issues/${id}`, payload);
      fetchIssues();
      setRespondingTo(null);
      setResponseText('');
      alert('Issue updated successfully!');
    } catch (err) { 
      console.error('Issue update error:', err);
      alert('Error updating issue: ' + (err.response?.data?.error || err.message)); 
    }
  };

  const deleteIssue = async (id) => {
    if (window.confirm('Delete this issue?')) {
      try { await axios.delete(`${apiUrl}/api/issues/${id}`); fetchIssues(); } catch (err) { alert('Error'); }
    }
  };

  const filtered = issues.filter(i => filter === 'All' || i.status === filter);
  const openCount = issues.filter(i => i.status === 'Open').length;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">🎫 Issues ({openCount} open)</h2>
      </div>

      <div className="filter-tabs">
        {['All', 'Open', 'In Progress', 'Resolved'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="list">
        {filtered.map(issue => (
          <div key={issue.id} className="issue-card">
            <div className="issue-header">
              <span className="issue-status-dot">
                {issue.status === 'Open' ? '🔴' : issue.status === 'In Progress' ? '🟡' : '🟢'}
              </span>
              <div>
                <strong>{issue.title}</strong>
                <span className="list-subtitle">{issue.customer_name} | {issue.room_number} | {issue.category}</span>
                <span className="list-subtitle">Priority: {issue.priority} | {new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {issue.description && <p className="issue-desc">{issue.description}</p>}
            {issue.admin_response && <p className="issue-response">💬 Response: {issue.admin_response}</p>}
            
            {respondingTo === issue.id ? (
              <div className="issue-respond">
                <input type="text" placeholder="Type response..." value={responseText} onChange={e => setResponseText(e.target.value)} />
                <div className="action-buttons">
                  <button className="btn-sm btn-green" onClick={() => updateIssue(issue.id, 'Resolved', responseText)}>✓ Resolve</button>
                  <button className="btn-sm btn-whatsapp" onClick={() => updateIssue(issue.id, 'In Progress', responseText)}>⏳ In Progress</button>
                  <button className="btn-sm btn-danger" onClick={() => setRespondingTo(null)}>✕</button>
                </div>
              </div>
            ) : (
              <div className="action-buttons" style={{marginTop:'8px'}}>
                {issue.status !== 'Resolved' && (
                  <button className="btn-sm btn-green" onClick={() => setRespondingTo(issue.id)}>💬 Respond</button>
                )}
                {issue.status === 'Open' && (
                  <button className="btn-sm btn-whatsapp" onClick={() => updateIssue(issue.id, 'In Progress', '')}>⏳ In Progress</button>
                )}
                <button className="btn-sm btn-danger" onClick={() => deleteIssue(issue.id)}>🗑️</button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-text">No issues found</p>}
      </div>
    </div>
  );
}

export default Issues;
