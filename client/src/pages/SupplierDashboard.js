import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../config";

export default function SupplierDashboard({ user, products, push, setActiveModule }) {
  const [stats, setStats] = useState({
    totalQuotes: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    activeOrders: 0
  });
  const [loading, setLoading] = useState(true);

  const [recentQuotes, setRecentQuotes] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/quotations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
        });
        const quotes = res.data;
        setStats({
          totalQuotes: quotes.length,
          pendingQuotes: quotes.filter(q => q.status === 'Pending').length,
          acceptedQuotes: quotes.filter(q => q.status === 'Accepted').length,
          activeOrders: 0 // Placeholder for now
        });
        setRecentQuotes(quotes.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch supplier stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusPill = (status) => {
    switch (status) {
      case 'Accepted': return <span className="pill green">Accepted</span>;
      case 'Rejected': return <span className="pill red">Rejected</span>;
      default: return <span className="pill blue">Pending</span>;
    }
  };

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title">Supplier Dashboard</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Welcome back, {user.username}. Here is your activity overview.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>📄</div>
          <div className="stat-details">
            <div className="stat-value">{stats.totalQuotes}</div>
            <div className="stat-label">Total Quotations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⏳</div>
          <div className="stat-details">
            <div className="stat-value">{stats.pendingQuotes}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>✅</div>
          <div className="stat-details">
            <div className="stat-value">{stats.acceptedQuotes}</div>
            <div className="stat-label">Accepted Quotes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>📦</div>
          <div className="stat-details">
            <div className="stat-value">{stats.activeOrders}</div>
            <div className="stat-label">Active Orders</div>
          </div>
        </div>
      </div>

      <div className="grid-2-1" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="section-title">Recent Quotations</div>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : stats.totalQuotes === 0 ? (
              <div className="empty-state">No quotations submitted yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotes.map(q => (
                    <tr key={q.id}>
                      <td>{q.product_name}</td>
                      <td>{q.quantity}</td>
                      <td>£{Number(q.unit_price).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>£{Number(q.total_amount).toLocaleString()}</td>
                      <td>{getStatusPill(q.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="section-title">Quick Actions</div>
          </div>
          <div className="card-body">
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => setActiveModule('supplier-quotations')}>＋ Submit New Quote</button>
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setActiveModule('inventory')}>📦 View Products List</button>
          </div>
        </div>
      </div>
    </div>
  );
}
