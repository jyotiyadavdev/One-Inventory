import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import generateMockData from "../mockData/financeData";

export default function FinanceTransportCosts({ push }) {
  const [transportCosts, setTransportCosts] = useState([]);
  const [stats, setStats] = useState({
    totalCost: "£0",
    monthlyAvg: "£0",
    shipments: 0,
    costPerShipment: "£0"
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    shipment_id: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    vehicle_id: "",
    driver: ""
  });
  const [loading, setLoading] = useState(false);

  const fetchTransportCosts = useCallback(async () => {
    try {
      setLoading(true);
      const { ledgerEntries } = generateMockData();
      
      // Filter transport costs
      const costs = ledgerEntries.filter(item => item.category === 'Transport Cost / Fuel');
      
      setTransportCosts(costs);

      // Calculate stats
      const totalCost = costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
      const shipmentCount = costs.length;

      setStats({
        totalCost: `£${totalCost.toLocaleString('en-GB')}`,
        monthlyAvg: `£${(totalCost / 12).toLocaleString('en-GB')}`,
        shipments: shipmentCount,
        costPerShipment: `£${(shipmentCount > 0 ? totalCost / shipmentCount : 0).toLocaleString('en-GB')}`
      });
    } catch (err) {
      console.error('Error fetching transport costs:', err);
      push("Using demo data", "info");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchTransportCosts();
  }, [fetchTransportCosts]);

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
        category: "Transport Cost / Fuel"
      }, { headers });

      push("Transport cost recorded successfully", "success");
      setShowModal(false);
      setForm({ shipment_id: "", date: new Date().toISOString().split('T')[0], description: "", amount: "", vehicle_id: "", driver: "" });
      fetchTransportCosts();
    } catch (err) {
      push("Failed to record transport cost", "error");
    }
  };

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">🚛 Transport & Logistics Costs</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Record Transport Cost</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 24 }}>
        <div className="stat-card c1 i1">
          <div className="stat-icon">💷</div>
          <div className="stat-value">{stats.totalCost}</div>
          <div className="stat-label">Total Transport Cost</div>
        </div>
        <div className="stat-card c2 i2">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.monthlyAvg}</div>
          <div className="stat-label">Monthly Average</div>
        </div>
        <div className="stat-card c5 i5">
          <div className="stat-icon">🚚</div>
          <div className="stat-value">{stats.shipments}</div>
          <div className="stat-label">Shipments</div>
        </div>
        <div className="stat-card c4 i4">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats.costPerShipment}</div>
          <div className="stat-label">Cost Per Shipment</div>
        </div>
      </div>

      {/* Transport Costs Table */}
      <div className="card">
        <div className="card-header">
          <h3>Transport Cost Transactions</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Vehicle / Driver</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transportCosts.map((cost) => (
                <tr key={`${cost.id}-transport`}>
                  <td>{new Date(cost.date).toLocaleDateString()}</td>
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
              {transportCosts.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>No transport costs recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal 
          title="Record Transport Cost" 
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
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Description</label>
              <input placeholder="e.g., Fuel, Tolls, Maintenance" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Vehicle ID (Optional)</label>
              <input placeholder="Vehicle plate number" value={form.vehicle_id} onChange={e => setForm({...form, vehicle_id: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Driver Name (Optional)</label>
              <input placeholder="Driver name" value={form.driver} onChange={e => setForm({...form, driver: e.target.value})} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}