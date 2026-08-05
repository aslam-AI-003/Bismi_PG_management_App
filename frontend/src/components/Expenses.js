import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Expenses({ apiUrl }) {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({
    category: 'Maintenance', description: '', amount: '',
    vendor: '', payment_method: 'Cash',
    expense_date: new Date().toISOString().split('T')[0], notes: ''
  });

  const categories = ['Electricity', 'Water', 'Internet', 'Staff Salary', 'Housekeeping', 'Maintenance', 'Food', 'Miscellaneous'];

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/expenses`);
      setExpenses(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${apiUrl}/api/expenses`, form);
      setShowForm(false);
      setForm({
        category: 'Maintenance', description: '', amount: '',
        vendor: '', payment_method: 'Cash',
        expense_date: new Date().toISOString().split('T')[0], notes: ''
      });
      fetchExpenses();
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
  };

  const deleteExpense = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await axios.delete(`${apiUrl}/api/expenses/${id}`);
        fetchExpenses();
      } catch (err) { alert('Error deleting'); }
    }
  };

  const filteredExpenses = filter === 'All' ? expenses : expenses.filter(e => e.category === filter);
  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Category summary
  const categorySummary = {};
  expenses.forEach(e => {
    categorySummary[e.category] = (categorySummary[e.category] || 0) + e.amount;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Expenses</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add</button>
      </div>

      <div className="expense-total">
        <span>Total: </span>
        <strong>₹{totalExpense}</strong>
      </div>

      {/* Category Summary */}
      {Object.keys(categorySummary).length > 0 && (
        <div className="category-summary">
          {Object.entries(categorySummary).map(([cat, amount]) => (
            <div key={cat} className="category-chip" onClick={() => setFilter(cat)}>
              <span>{cat}</span>
              <strong>₹{amount}</strong>
            </div>
          ))}
          {filter !== 'All' && (
            <button className="category-chip active" onClick={() => setFilter('All')}>
              ✕ Clear Filter
            </button>
          )}
        </div>
      )}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category *</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What was the expense for?" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Vendor</label>
              <input type="text" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Card</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-primary btn-full">Add Expense</button>
        </form>
      )}

      <div className="list">
        {filteredExpenses.map(expense => (
          <div key={expense.id} className="list-item">
            <div className="list-item-left">
              <div className="list-avatar">📝</div>
              <div>
                <strong>{expense.description || expense.category}</strong>
                <span className="list-subtitle">{expense.category} | {expense.expense_date}</span>
                {expense.vendor && <span className="list-subtitle">Vendor: {expense.vendor}</span>}
              </div>
            </div>
            <div className="list-item-right">
              <span className="amount expense-amount">-₹{expense.amount}</span>
              <span className="list-subtitle">{expense.payment_method}</span>
              <button className="btn-sm btn-danger" onClick={() => deleteExpense(expense.id)}>🗑️</button>
            </div>
          </div>
        ))}
        {filteredExpenses.length === 0 && <p className="empty-text">No expenses found</p>}
      </div>
    </div>
  );
}

export default Expenses;
