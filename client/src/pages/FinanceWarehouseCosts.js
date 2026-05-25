import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import generateMockData from "../mockData/financeData";

export default function FinanceWarehouseCosts({ push }) {
  const [warehouseCosts, setWarehouseCosts] = useState([]);
  const [stats, setStats] = useState({
    totalCosts: "£0",
    monthlyRent: "£0",
    utilities: "£0",
    maintenance: "£0"
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    category: "Warehouse Rent",
    warehouse: ""
  });
  const [loading, setLoading] = useState(false);

  const fetchWarehouseCosts = useCallback(async () => {
    try {
      setLoading(true);
      const { ledgerEntries } = generateMockData();
      
      // Filter warehouse costs
      const costs = ledgerEntries.filter(item => 
        item.category === 'Warehouse Rent' || 
        item.category === 'Utilities' || 
        item.category === 'Equipment Maintenance'
      );
      
      setWarehouseCosts(costs);

      // Calculate stats by category
      const rent = costs.filter(c => c.category === 'Warehouse Rent').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
      const utilities = costs.filter(c => c.category === 'Utilities').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
      const maintenance = costs.filter(c => c.category === 'Equipment Maintenance').reduce((s, c) => s + parseFloat(c.amount || 0), 0);
      const total = rent + utilities + maintenance;

      setStats({
        totalCosts: `£${total.toLocaleString('en-GB')}`,
        monthlyRent: `£${rent.toLocaleString('en-GB')}`,
        utilities: `£${utilities.toLocaleString('en-GB')}`,
        maintenance: `£${maintenance.toLocaleString('en-GB')}`
      });
    } catch (err) {
      console.error('Error fetching warehouse costs:', err);
      push("Using demo data", "info");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchWarehouseCosts();
  }, [fetchWarehouseCosts]);

  const handleAddCost = async () => {
    if (!form.description || !form.amount) {
      return push("Description and Amount are required", "error");
    }

    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/finance/ledger`, {
        date: form.date,
        description: form.description,
        type: "Debit",
        amount: form.amount,
        status: "Completed",
        category: form.category
      }, { headers });

      push("Warehouse cost recorded successfully", "success");
      setShowModal(false);
      setForm({ date: new Date().toISOString().split('T')[0], description: "", amount: "", category: "Warehouse Rent", warehouse: "" });
      fetchWarehouseCosts();
    } catch (err) {
      push("Failed to record warehouse cost", "error");
    }
  };

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">🏭 Warehouse & Facility Costs</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Record Warehouse Cost</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 24 }}>
        <div className="stat-card c1 i1">
          <div className="stat-icon">💷</div>
          <div className="stat-value">{stats.totalCosts}</div>
          <div className="stat-label">Total Warehouse Costs</div>
        </div>
        <div className="stat-card c2 i2">
          <div className="stat-icon">🏠</div>
          <div className="stat-value">{stats.monthlyRent}</div>
          <div className="stat-label">Rent</div>
        </div>
        <div className="stat-card c5 i5">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{stats.utilities}</div>
          <div className="stat-label">Utilities</div>
        </div>
        <div className="stat-card c4 i4">
          <div className="stat-icon">🔧</div>
          <div className="stat-value">{stats.maintenance}</div>
          <div className="stat-label">Maintenance</div>
        </div>
      </div>

      {/* Warehouse Costs Table */}
      <div className="card">
        <div className="card-header">
          <h3>Warehouse Cost Transactions</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Warehouse</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {warehouseCosts.map((cost) => (
                <tr key={`${cost.id}-warehouse`}>
                  <td>{new Date(cost.date).toLocaleDateString()}</td>
                  <td>
                    <span className="pill gray">{cost.category}</span>
                  </td>
                  <td>{cost.description}</td>
                  <td>-</td>
                  <td style={{ fontWeight: 700 }}>£{parseFloat(cost.amount).toLocaleString('en-GB')}</td>
                  <td>
                    <span className={`pill ${cost.status === 'Completed' ? 'green' : 'yellow'}`}>
                      {cost.status}
                    </span>
                  </td>
                </tr>
              ))}
              {warehouseCosts.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>No warehouse costs recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal 
          title="Record Warehouse Cost" 
          onClose={() => setShowModal(false)} 
          onConfirm={handleAddCost} 
          loading={loading}
        >
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Amount (£)</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Cost Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <option value="Warehouse Rent">Warehouse Rent</option>
                <option value="Utilities">Utilities (Electricity, Water)</option>
                <option value="Equipment Maintenance">Equipment Maintenance</option>
              </select>
            </div>
            <div className="form-group">
              <label>Warehouse Location</label>
              <input placeholder="Main Warehouse, Branch 1, etc." value={form.warehouse} onChange={e => setForm({...form, warehouse: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <input placeholder="e.g., Monthly Rent, Monthly Electricity Bill" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}