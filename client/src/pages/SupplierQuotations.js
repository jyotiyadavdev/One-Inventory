import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";

export default function SupplierQuotations({ products, push }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    quantity: "",
    unit_price: "",
    valid_until: "",
    expected_delivery: "",
    notes: ""
  });

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/quotations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setQuotations(res.data);
    } catch (err) {
      push("Failed to load quotations", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleSave = async () => {
    if (!form.product_id || !form.quantity || !form.unit_price) {
      push("Please fill all required fields", "error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/quotations`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      push("Quotation submitted successfully!");
      setShowModal(false);
      setForm({ product_id: "", quantity: "", unit_price: "", valid_until: "", expected_delivery: "", notes: "", credit_days: "" });
      fetchQuotations();
    } catch (err) {
      push("Failed to submit quotation", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'Accepted': return <span className="pill green">Accepted</span>;
      case 'Rejected': return <span className="pill red">Rejected</span>;
      case 'Expired': return <span className="pill yellow">Expired</span>;
      default: return <span className="pill blue">Pending</span>;
    }
  };

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">My Quotations</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ New Quotation</button>
      </div>

      {showModal && (
        <Modal 
          title="Submit New Quotation" 
          onClose={() => setShowModal(false)} 
          onConfirm={handleSave}
          loading={loading}
          confirmText="Submit Quote"
        >
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>Select Product</label>
              <select value={form.product_id} onChange={(e) => setForm({...form, product_id: e.target.value})}>
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Unit Price (£)</label>
                <input type="number" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: e.target.value})} />
              </div>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Valid Until</label>
                <input type="date" value={form.valid_until} onChange={(e) => setForm({...form, valid_until: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Expected Delivery Date</label>
                <input type="date" value={form.expected_delivery} onChange={(e) => setForm({...form, expected_delivery: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Credit Days (Post-acceptance)</label>
              <input type="number" placeholder="e.g. 7" value={form.credit_days} onChange={(e) => setForm({...form, credit_days: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Notes / Terms</label>
              <textarea rows="3" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}></textarea>
            </div>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Credit Days</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id}>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{q.product_name}</div>
                  </td>
                  <td>{q.quantity}</td>
                  <td>£{Number(q.unit_price).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>£{Number(q.total_amount).toLocaleString()}</td>
                  <td>{q.credit_days} days</td>
                  <td>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{q.expected_delivery ? new Date(q.expected_delivery).toLocaleDateString() : '—'}</div>
                    <div style={{ fontSize: 9, opacity: 0.6 }}>Valid: {q.valid_until ? new Date(q.valid_until).toLocaleDateString() : '—'}</div>
                  </td>
                  <td>{getStatusPill(q.status)}</td>
                  <td style={{ fontSize: 11, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={q.notes}>
                    {q.notes || '—'}
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && !loading && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 40 }}>
                    No quotations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
