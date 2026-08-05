import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Reports({ apiUrl }) {
  const [report, setReport] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { fetchReport(); }, [month, year]);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/reports/monthly/${year}/${month}`);
      setReport(res.data);
    } catch (err) { console.error(err); }
  };

  const downloadReport = () => {
    if (!report) return;
    let content = `BISMI MEN'S PLAZA - Monthly Report\n`;
    content += `${report.month} ${report.year}\n`;
    content += `================================\n\n`;
    content += `INCOME:\n  Rent Collected: ₹${report.rentCollected}\n  Rent Pending: ₹${report.rentPending}\n\n`;
    content += `EXPENSES:\n`;
    report.expenses.forEach(e => { content += `  ${e.category}: ₹${e.total}\n`; });
    content += `  Total Expenses: ₹${report.totalExpense}\n\n`;
    content += `NET INCOME: ₹${report.netIncome}\n\n`;
    content += `OCCUPANCY:\n  Total Beds: ${report.occupancy.total}\n  Occupied: ${report.occupancy.occupied}\n  Vacant: ${report.occupancy.vacant}\n`;
    content += `  Active Tenants: ${report.activeCustomers}\n\n`;
    content += `PAYMENT DETAILS:\n`;
    report.payments.forEach(p => { content += `  ${p.customer_name} (${p.room_number}) - ₹${p.amount} [${p.status}]\n`; });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${report.month}_${report.year}.txt`;
    a.click();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">📊 Monthly Report</h2>
      </div>

      <div className="form-row" style={{marginBottom:'16px'}}>
        <div className="form-group">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} />
        </div>
      </div>

      {report && (
        <>
          <div className="stats-grid">
            <div className="stat-card income">
              <span className="stat-icon">💰</span>
              <div className="stat-info"><span className="stat-number">₹{report.rentCollected}</span><span className="stat-label">Collected</span></div>
            </div>
            <div className="stat-card pending">
              <span className="stat-icon">⏳</span>
              <div className="stat-info"><span className="stat-number">₹{report.rentPending}</span><span className="stat-label">Pending</span></div>
            </div>
            <div className="stat-card expense">
              <span className="stat-icon">📤</span>
              <div className="stat-info"><span className="stat-number">₹{report.totalExpense}</span><span className="stat-label">Expenses</span></div>
            </div>
            <div className="stat-card rate">
              <span className="stat-icon">📈</span>
              <div className="stat-info"><span className="stat-number">₹{report.netIncome}</span><span className="stat-label">Net Income</span></div>
            </div>
          </div>

          <div className="detail-card">
            <h3 className="section-title">🏠 Occupancy</h3>
            <p>Total Beds: {report.occupancy.total} | Occupied: {report.occupancy.occupied} | Vacant: {report.occupancy.vacant}</p>
            <p>Active Tenants: {report.activeCustomers}</p>
          </div>

          {report.expenses.length > 0 && (
            <div className="detail-card">
              <h3 className="section-title">💸 Expense Breakdown</h3>
              {report.expenses.map((e, i) => (
                <p key={i}><strong>{e.category}:</strong> ₹{e.total}</p>
              ))}
            </div>
          )}

          <div className="detail-card">
            <h3 className="section-title">📋 Payment List ({report.payments.length})</h3>
            <div className="list">
              {report.payments.map(p => (
                <div key={p.id} className="list-item">
                  <div className="list-item-left">
                    <div className="list-avatar">{p.status === 'Paid' ? '✅' : '⏳'}</div>
                    <div>
                      <strong>{p.customer_name}</strong>
                      <span className="list-subtitle">{p.room_number}</span>
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className="amount">₹{p.amount}</span>
                    <span className={`badge ${p.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={downloadReport}>📥 Download Report</button>
        </>
      )}
    </div>
  );
}

export default Reports;
