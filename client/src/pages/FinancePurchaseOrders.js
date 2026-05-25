import React, { useState, useEffect, useCallback } from "react";
import generateMockData from "../mockData/financeData";

export default function FinancePurchaseOrders({ push }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stats, setStats] = useState({ total: "£0", pending: "£0", received: "£0", count: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { purchaseOrders } = generateMockData();
      
      setPurchaseOrders(purchaseOrders);

      // Calculate stats
      const totalAmount = purchaseOrders.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);
      const pendingAmount = purchaseOrders.filter(p => p.status !== 'Received' && p.status !== 'Cancelled')
        .reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);
      const receivedAmount = purchaseOrders.filter(p => p.status === 'Received')
        .reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);

      setStats({
        total: `£${totalAmount.toLocaleString('en-GB')}`,
        pending: `£${pendingAmount.toLocaleString('en-GB')}`,
        received: `£${receivedAmount.toLocaleString('en-GB')}`,
        count: purchaseOrders.length
      });
    } catch (err) {
      console.error('Error fetching POs:', err);
      push("Using demo data", "info");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const filteredPOs = purchaseOrders.filter(po => {
    if (filter === 'all') return true;
    return po.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">📦 Purchase Orders</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary">＋ Create PO</button>
          <button className="btn btn-outline">📊 PO Analytics</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 24 }}>
        <div className="stat-card c1 i1">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.count}</div>
          <div className="stat-label">Total POs</div>
        </div>
        <div className="stat-card c2 i2">
          <div className="stat-icon">💷</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Value</div>
        </div>
        <div className="stat-card c5 i5">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card c4 i4">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.received}</div>
          <div className="stat-label">Received</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {['all', 'draft', 'sent', 'received', 'cancelled'].map(status => (
          <button
            key={status}
            className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(status)}
            style={{ textTransform: 'capitalize' }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Purchase Orders Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Items</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.map((po) => (
                <tr key={po.id}>
                  <td style={{ fontWeight: 600 }}>PO-{po.id}</td>
                  <td>{po.supplier_name || 'N/A'}</td>
                  <td>{new Date(po.order_date).toLocaleDateString()}</td>
                  <td>{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : '-'}</td>
                  <td style={{ fontWeight: 700 }}>£{parseFloat(po.total_amount).toLocaleString('en-GB')}</td>
                  <td>
                    <span className={`pill ${
                      po.status === 'Received' ? 'green' :
                      po.status === 'Sent' ? 'blue' :
                      po.status === 'Draft' ? 'gray' :
                      'red'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td>{po.item_count || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>}
    </div>
  );
}