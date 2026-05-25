import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Finance({ push }) {
  const [stats, setStats] = useState({ cashOnHand: "£0", receivables: "£0", payables: "£0", netProfit: "£0" });
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    type: "Debit",
    amount: "",
    status: "Completed",
    category: "Other",
    reference_id: ""
  });

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.get(`${API}/finance/data`, { headers });
      const { purchaseOrders, salesOrders, ledgerEntries } = res.data;
      
      // Calculate stats from mock data
      const completedSales = (salesOrders || []).filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const completedPurchases = (purchaseOrders || []).filter(o => o.status === 'Received').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const pendingPurchases = (purchaseOrders || []).filter(o => o.status !== 'Received' && o.status !== 'Cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const pendingSales = (salesOrders || []).filter(o => o.status !== 'delivered' && o.status !== 'cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      
      const cashOnHand = completedSales - completedPurchases;
      
      setStats({
        cashOnHand: `£${cashOnHand.toLocaleString('en-GB')}`,
        receivables: `£${pendingSales.toLocaleString('en-GB')}`,
        payables: `£${pendingPurchases.toLocaleString('en-GB')}`,
        netProfit: `£${cashOnHand.toLocaleString('en-GB')}`
      });

      setLedger(ledgerEntries || []);
      
      // Process chart data
      const monthlyData = {};
      const categoryTotals = {};
      
      (ledgerEntries || []).forEach(item => {
        const month = new Date(item.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { month, income: 0, expenses: 0 };
        
        if (item.type === 'Credit') {
          monthlyData[month].income += parseFloat(item.amount);
        } else {
          monthlyData[month].expenses += parseFloat(item.amount);
        }
        
        if (!categoryTotals[item.category]) categoryTotals[item.category] = 0;
        categoryTotals[item.category] += parseFloat(item.amount);
      });
      
      const chartDataArray = Object.values(monthlyData).slice(-6); // Last 6 months
      setChartData(chartDataArray);
      
      const categoryArray = Object.entries(categoryTotals).map(([category, amount]) => ({ name: category, value: amount })).slice(0, 5);
      setCategoryData(categoryArray);
      
    } catch {
      push("Using demo data", "info");
    }
  }, [push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddTransaction = async () => {
    if (!form.description || !form.amount) return push("Description and Amount are required", "error");
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/finance/ledger`, form, { headers });
      push("Transaction added successfully", "success");
      setShowModal(false);
      setForm({ date: new Date().toISOString().split('T')[0], description: "", type: "Debit", amount: "", status: "Completed", category: "Other", reference_id: "" });
      fetchData();
    } catch {
      push("Failed to add transaction", "error");
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (id) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.put(`${API}/finance/ledger/${id}/status`, { status: 'Completed' }, { headers });
      push("Transaction marked as completed", "success");
      fetchData();
    } catch {
      push("Failed to update status", "error");
    }
  };

  const statCards = [
    { label: "Cash on Hand", value: stats.cashOnHand, icon: "🏦", c: "c1 i1" },
    { label: "Receivables (Sales)",  value: stats.receivables, icon: "📩", c: "c2 i2" },
    { label: "Payables (Purchases)", value: stats.payables, icon: "📤", c: "c5 i5" },
    { label: "Net Profit",   value: stats.netProfit, icon: "📈", c: "c4 i4" },
  ];

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">Finance & Automated Accounts</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowModal(true)}>＋ Record Transaction</button>
          <button className="btn btn-outline">📊 Generate Report</button>
          <button className="btn btn-outline">💳 Manage Payments</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {statCards.map((s) => (
          <div key={s.label} className={`stat-card ${s.c.split(" ")[0]}`}>
            <div className={`stat-icon ${s.c.split(" ")[1]}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Financial Overview</h3>
        </div>
        <div style={{ height: 300, padding: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`£${value.toLocaleString('en-GB')}`, '']} />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <h3>Expense Categories</h3>
          </div>
          <div style={{ height: 250, padding: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`£${value.toLocaleString('en-GB')}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {ledger.slice(0, 5).map((l) => (
              <div key={l.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(l.date).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: l.type === "Credit" ? "var(--accent-4)" : "var(--accent-5)" }}>
                    {l.type === "Credit" ? "+" : "-"}£{parseFloat(l.amount).toLocaleString('en-GB')}
                  </div>
                  <span className={`pill ${l.status === "Completed" ? "green" : "yellow"}`} style={{ fontSize: 10 }}>{l.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Transaction Ledger</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={`${l.id}-${l.source}`}>
                  <td style={{ fontWeight: 600 }}>{new Date(l.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                  <td>
                    <span className="pill gray" style={{ fontSize: 10, background: l.source === 'auto' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)', color: l.source === 'auto' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {l.source === 'auto' ? '⚡ ' : '📝 '}{l.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{l.description}</div>
                  </td>
                  <td style={{ color: l.type === "Credit" ? "var(--accent-4)" : "var(--accent-5)", fontWeight: 700 }}>{l.type.toUpperCase()}</td>
                  <td style={{ fontWeight: 800, fontSize: 15 }}>£{parseFloat(l.amount).toLocaleString('en-GB')}</td>
                  <td><span className={`pill ${l.status === "Completed" ? "green" : "yellow"}`}>{l.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {l.status === "Pending" && l.source === "manual" ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => markCompleted(l.id)}>Mark Paid</button>
                    ) : <span style={{ opacity: 0.3 }}>—</span>}
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Record Manual Transaction" onClose={() => setShowModal(false)} onConfirm={handleAddTransaction} loading={loading}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div className="form-group">
              <label>Transaction Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="Debit">Debit (Money Out)</option>
                <option value="Credit">Credit (Money In)</option>
              </select>
            </div>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Expense / Income Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="Driver Salary">Driver Salary</option>
                <option value="Transport Cost">Transport Cost / Fuel</option>
                <option value="Utilities">Utilities (Electricity, Water)</option>
                <option value="Warehouse Rent">Warehouse Rent</option>
                <option value="Equipment Maintenance">Equipment Maintenance</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Description / Notes</label><input placeholder="e.g. David Monthly Salary" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            
            <div className="form-group"><label>Amount (£)</label><input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} /></div>
            <div className="form-group">
              <label>Payment Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="Completed">Completed / Paid</option>
                <option value="Pending">Pending / Unpaid</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
