import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";

const getStockPill = (stock) => {
  if (stock <= 5) return <span className="pill red">Low Stock</span>;
  if (stock <= 20) return <span className="pill yellow">Medium</span>;
  return <span className="pill green">Healthy</span>;
};

export default function Inventory({ products, onRefresh, push, user }) {
  const [form, setForm] = useState({ name: "", price: "", barcode: "", stock: 0, weight_kg: 0, type: "finished_good", uom: "units", warehouse_id: "", bin_id: "", supplier_id: "" });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [bins, setBins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const [wRes, bRes] = await Promise.all([
        axios.get(`${API}/warehouse`, { headers }),
        axios.get(`${API}/warehouse/bins`, { headers })
      ]);
      setWarehouses(wRes.data);
      setBins(bRes.data);
    } catch (err) { console.error("Failed to fetch data", err); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm({ name: "", price: "", barcode: "", stock: 0, weight_kg: 0, type: "finished_good", uom: "units", warehouse_id: "", bin_id: "", supplier_id: "" });
    setEditId(null);
    setShowModal(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      push("Name and Price are required", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("erp_token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editId) {
        await axios.put(`${API}/inventory/products/${editId}`, form, config);
        push("Product updated successfully!");
      } else {
        await axios.post(`${API}/inventory/products`, form, config);
        push("Product added successfully!");
      }
      resetForm();
      await onRefresh();
    } catch (error) {
      push(`Failed to ${editId ? "update" : "add"} product`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ 
        name: p.name, 
        price: p.price, 
        barcode: p.barcode || "", 
        stock: p.stock || 0, 
        type: p.type || "finished_good", 
        uom: p.uom || "units",
        warehouse_id: p.warehouse_id || "",
        bin_id: p.bin_id || "",
        supplier_id: p.supplier_id || "",
        weight_kg: p.weight_kg || 0
    });
    setShowModal(true);
  };



  if (!user) return null;

  // Group products by name for Multi-Warehouse Management
  const groupedProducts = products.reduce((acc, p) => {
    if (!acc[p.name]) {
      acc[p.name] = {
        name: p.name,
        type: p.type,
        uom: p.uom,
        barcode: p.barcode,
        price: p.price,
        supplier_name: p.supplier_name,
        totalStock: 0,
        warehouses: []
      };
    }
    acc[p.name].totalStock += Number(p.stock || 0);
    acc[p.name].warehouses.push({
      id: p.id,
      warehouse_name: p.warehouse_name || "Unassigned",
      stock: p.stock,
      locations: p.locations,
      original: p
    });
    return acc;
  }, {});

  const productList = Object.values(groupedProducts).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">Multi-Warehouse Inventory</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="topbar-search" style={{ margin: 0, width: 300, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search products across warehouses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>＋ Add Inventory</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        <div className="stat-card c1">
          <div className="stat-label">Unique Products</div>
          <div className="stat-value">{Object.keys(groupedProducts).length}</div>
        </div>
        <div className="stat-card c2">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{products.reduce((acc, p) => acc + Number(p.stock || 0), 0)}</div>
        </div>
        <div className="stat-card c4">
          <div className="stat-label">Stock Value</div>
          <div className="stat-value">£{products.reduce((acc, p) => acc + (Number(p.price) * Number(p.stock || 0)), 0).toLocaleString()}</div>
        </div>
      </div>

      {showModal && (
        <Modal title={editId ? "Edit Stock Entry" : "Add Stock to Warehouse"} onClose={resetForm} onConfirm={handleSave} loading={loading}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>Product Name *</label>
              <input placeholder="e.g. Wireless Keyboard" value={form.name} onChange={set("name")} />
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group"><label>Price (£)</label><input type="number" value={form.price} onChange={set("price")} /></div>
              <div className="form-group"><label>Barcode / SKU</label><input value={form.barcode} onChange={set("barcode")} /></div>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group"><label>Quantity to Add</label><input type="number" value={form.stock} onChange={set("stock")} /></div>
              <div className="form-group"><label>Warehouse</label>
                <select value={form.warehouse_id} onChange={set("warehouse_id")}>
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Assign Bin</label>
              <select disabled={!form.warehouse_id} value={form.bin_id} onChange={set("bin_id")}>
                <option value="">Select Bin</option>
                {bins.filter(b => b.warehouse_id === parseInt(form.warehouse_id)).map(b => (
                  <option key={b.id} value={b.id} disabled={b.status === 'Occupied' && b.id !== form.bin_id}>
                    {b.rack_code} - {b.bin_code} ({b.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Product</th>
                <th>Total Stock</th>
                <th>Status</th>
                <th>Avg. Price</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((p, i) => (
                <React.Fragment key={p.name}>
                  <tr style={{ background: expandedProduct === p.name ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                    <td>
                      <button 
                        onClick={() => setExpandedProduct(expandedProduct === p.name ? null : p.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}
                      >
                        {expandedProduct === p.name ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 10, opacity: 0.6 }}>SKU: {p.barcode || 'N/A'}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.totalStock} {p.uom}</td>
                    <td>{getStockPill(p.totalStock)}</td>
                    <td style={{ color: 'var(--accent)' }}>£{Number(p.price).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(true)}>＋ Add More</button>
                    </td>
                  </tr>
                  {expandedProduct === p.name && p.warehouses.map(wh => (
                    <tr key={wh.id} style={{ background: 'rgba(255,255,255,0.02)', fontSize: 12 }}>
                      <td></td>
                      <td style={{ paddingLeft: 30 }}>
                        <div style={{ fontWeight: 600 }}>📍 {wh.warehouse_name}</div>
                        <div style={{ fontSize: 10, opacity: 0.5 }}>Bins: {wh.locations || 'Floor'}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{wh.stock} {p.uom}</td>
                      <td><span className="pill blue" style={{ fontSize: 9 }}>LOCAL STOCK</span></td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-xs" onClick={() => handleEdit(wh.original)} style={{ padding: '2px 8px', fontSize: 10 }}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
