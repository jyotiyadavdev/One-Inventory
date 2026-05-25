import React, { useState, useEffect, useCallback, Fragment } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";

export default function Purchases({ products, onRefreshProducts, push }) {
  const [tab, setTab] = useState("orders");
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [quotations, setQuotations] = useState([]);

  // Quick Add Product Form
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qaForm, setQaForm] = useState({ name: "", price: "", type: "raw_material", barcode: "", uom: "units", warehouse_id: "", bin_id: "" });
  const [warehouses, setWarehouses] = useState([]);
  const [bins, setBins] = useState([]);

  // Supplier Form
  const [sForm, setSForm] = useState({ name: "", contact_person: "", email: "", phone: "", address: "" });
  const [editSId, setEditSId] = useState(null);
  const [showSModal, setShowSModal] = useState(false);
  const [showSDeleteModal, setShowSDeleteModal] = useState(false);
  const [sDeleteId, setSDeleteId] = useState(null);

  // PO Form
  const [poForm, setPoForm] = useState({ supplier_id: "", order_date: new Date().toISOString().split('T')[0], expected_delivery: "", items: [] });
  const [newItem, setNewItem] = useState({ product_id: "", quantity: 1, unit_price: 0 });

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/purchases/suppliers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setSuppliers(res.data);
    } catch { push("Failed to fetch suppliers", "error"); }
  }, [push]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/purchases/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setOrders(res.data);
    } catch { push("Failed to fetch orders", "error"); }
  }, [push]);

  const fetchQuotations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/quotations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setQuotations(res.data);
    } catch { push("Failed to fetch quotations", "error"); }
  }, [push]);

  const fetchLocations = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const [wRes, bRes] = await Promise.all([
        axios.get(`${API}/warehouse`, { headers }),
        axios.get(`${API}/warehouse/bins`, { headers })
      ]);
      setWarehouses(wRes.data);
      setBins(bRes.data);
    } catch { push("Failed to fetch locations", "error"); }
  }, [push]);

  useEffect(() => {
    fetchSuppliers();
    fetchLocations();
    fetchOrders();
    fetchQuotations();
  }, [fetchSuppliers, fetchLocations, fetchOrders, fetchQuotations]);

  const saveSupplier = async () => {
    if (!sForm.name?.trim()) return push("Supplier name is required", "error");
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      if (editSId) {
        await axios.put(`${API}/purchases/suppliers/${editSId}`, sForm, { headers });
        push("✓ Supplier updated successfully", "success");
      } else {
        await axios.post(`${API}/purchases/suppliers`, sForm, { headers });
        push("✓ Supplier added successfully", "success");
      }
      setSForm({ name: "", contact_person: "", email: "", phone: "", address: "" });
      setEditSId(null);
      setShowSModal(false);
      fetchSuppliers();
    } catch (err) { 
      const errorMsg = err.response?.data?.error || err.message;
      console.error("Supplier save error:", errorMsg);
      push(`❌ Failed to save supplier: ${errorMsg}`, "error");
    }
    finally { setLoading(false); }
  };

  const confirmSDelete = (id) => {
    setSDeleteId(id);
    setShowSDeleteModal(true);
  };

  const deleteSupplier = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.delete(`${API}/purchases/suppliers/${sDeleteId}`, { headers });
      push("✓ Supplier deleted successfully", "success");
      setShowSDeleteModal(false);
      fetchSuppliers();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      console.error("Supplier delete error:", errorMsg);
      push(`❌ Failed to delete supplier: ${errorMsg}`, "error");
    }
    finally { setLoading(false); }
  };

  const createOrder = async () => {
    if (!poForm.supplier_id || poForm.items.length === 0) return push("Supplier and items are required", "error");
    setLoading(true);
    try {
      await axios.post(`${API}/purchases/orders`, poForm);
      push("Purchase Order created!");
      setPoForm({ supplier_id: "", order_date: new Date().toISOString().split('T')[0], expected_delivery: "", items: [] });
      fetchOrders();
    } catch { push("Error creating order", "error"); }
    finally { setLoading(false); }
  };

  const addItemToPo = () => {
    if (!newItem.product_id || newItem.quantity <= 0) return;
    const prod = products.find(p => p.id === parseInt(newItem.product_id));
    setPoForm(p => ({
      ...p,
      items: [...p.items, { ...newItem, product_name: prod.name, uom: prod.uom }]
    }));
    setNewItem({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await axios.put(`${API}/purchases/orders/${id}/status`, { status });
      push(`Order marked as ${status}`);
      fetchOrders();
      if (status === 'Received') onRefreshProducts();
    } catch (err) {
      push(err.response?.data?.error || "Error updating status", "error");
    }
  };

  const updateQuotationStatus = async (id, status) => {
    try {
      await axios.put(`${API}/quotations/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      push(`Quotation ${status}`);
      fetchQuotations();
    } catch (err) {
      push(err.response?.data?.error || "Error updating quotation", "error");
    }
  };

  const toggleExpand = async (id) => {
    if (expandedOrder === id) {
      setExpandedOrder(null);
      setOrderItems([]);
    } else {
      setExpandedOrder(id);
      try {
        const res = await axios.get(`${API}/purchases/orders/${id}/items`);
        setOrderItems(res.data);
      } catch { push("Failed to fetch order items", "error"); }
    }
  };

  const handleQuickAdd = async () => {
    if (!qaForm.name || !qaForm.price) return push("Name and Price are required", "error");
    try {
      await axios.post(`${API}/inventory/products`, qaForm);
      push("New item added to inventory!");
      setQaForm({ name: "", price: "", type: "raw_material", barcode: "", uom: "units", warehouse_id: "", bin_id: "" });
      setShowQuickAdd(false);
      onRefreshProducts();
    } catch { push("Failed to add item", "error"); }
  };

  const getTimeLeft = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due - now;
    
    if (diff <= 0) return <span className="pill red">Overdue</span>;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return <span className="pill green">{days}d {hours}h left</span>;
    return <span className="pill yellow">{hours}h left</span>;
  };

  return (
    <div className="fade-up">
      <div className="login-tab-row" style={{ marginBottom: 24, justifyContent: "flex-start", gap: 10 }}>
        <button className={`login-tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>Purchase Orders</button>
        <button className={`login-tab ${tab === "quotations" ? "active" : ""}`} onClick={() => setTab("quotations")}>Quotations</button>
        <button className={`login-tab ${tab === "suppliers" ? "active" : ""}`} onClick={() => setTab("suppliers")}>Suppliers</button>
      </div>

      {tab === "suppliers" && (
        <>
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div className="section-title">Suppliers Directory</div>
            <button className="btn btn-primary" onClick={() => { setEditSId(null); setSForm({ name: "", contact_person: "", email: "", phone: "", address: "" }); setShowSModal(true); }}>＋ Add New Supplier</button>
          </div>

          {showSModal && (
            <Modal
              title={editSId ? "Edit Supplier" : "Add New Supplier"}
              onClose={() => setShowSModal(false)}
              onConfirm={saveSupplier}
              loading={loading}
              confirmText={editSId ? "Update Supplier" : "Save Supplier"}
            >
              <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input 
                    value={sForm.name} 
                    onChange={e => setSForm({...sForm, name: e.target.value})} 
                    placeholder="e.g. ABC Trading Company"
                    required
                  />
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input 
                      value={sForm.contact_person} 
                      onChange={e => setSForm({...sForm, contact_person: e.target.value})} 
                      placeholder="Full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      value={sForm.phone} 
                      onChange={e => setSForm({...sForm, phone: e.target.value})} 
                      placeholder="Phone number"
                      type="tel"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    value={sForm.email} 
                    onChange={e => setSForm({...sForm, email: e.target.value})} 
                    placeholder="supplier@example.com"
                    type="email"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea 
                    value={sForm.address} 
                    onChange={e => setSForm({...sForm, address: e.target.value})} 
                    placeholder="Complete business address"
                    style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, color: 'var(--text-main)', minHeight: 80, fontFamily: 'inherit' }} 
                  />
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 6, fontSize: 12, borderLeft: '3px solid var(--accent)' }}>
                * Required field
              </div>
            </Modal>
          )}

          {showSDeleteModal && (
            <Modal
              title="Delete Supplier"
              type="danger"
              confirmText="Delete Anyway"
              onClose={() => setShowSDeleteModal(false)}
              onConfirm={deleteSupplier}
              loading={loading}
            >
              <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this supplier? This will NOT delete their past purchase orders but may affect reporting.</p>
            </Modal>
          )}

          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td><td>{s.contact_person}</td><td>{s.email}</td><td>{s.phone}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditSId(s.id); setSForm(s); setShowSModal(true); }} style={{ marginRight: 5 }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => confirmSDelete(s.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "orders" && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div className="section-title">Create Purchase Order</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Supplier</label>
                  <select value={poForm.supplier_id} onChange={e => setPoForm({...poForm, supplier_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Expected Delivery</label><input type="date" value={poForm.expected_delivery} onChange={e => setPoForm({...poForm, expected_delivery: e.target.value})} /></div>
              </div>

              <div className="section-subtitle" style={{ marginTop: 20, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Add Items to Order</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowQuickAdd(!showQuickAdd)}>
                  {showQuickAdd ? "✕ Cancel Quick Add" : "＋ Create New Item"}
                </button>
              </div>

              {showQuickAdd && (
                <Modal 
                  title="Create New Product (Full Details)" 
                  onClose={() => setShowQuickAdd(false)} 
                  onConfirm={handleQuickAdd}
                  loading={loading}
                  confirmText="Save Item"
                >
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="form-group">
                      <label>Item Name</label>
                      <input placeholder="e.g. Black Pepper" value={qaForm.name} onChange={e => setQaForm({...qaForm, name: e.target.value})} />
                    </div>
                    
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group">
                        <label>Standard Price (£)</label>
                        <input type="number" placeholder="Price" value={qaForm.price} onChange={e => setQaForm({...qaForm, price: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Barcode / SKU</label>
                        <input placeholder="Optional" value={qaForm.barcode} onChange={e => setQaForm({...qaForm, barcode: e.target.value})} />
                      </div>
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group">
                        <label>Category</label>
                        <select value={qaForm.type} onChange={e => setQaForm({...qaForm, type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                          <option value="raw_material">Raw Material</option>
                          <option value="finished_good">Finished Good</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Measure Unit (UOM)</label>
                        <select value={qaForm.uom} onChange={e => setQaForm({...qaForm, uom: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                          <option value="units">Units</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="metre">Metres (m)</option>
                          <option value="litre">Litres (L)</option>
                          <option value="box">Box</option>
                          <option value="pkt">Packet</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div className="form-group">
                        <label>Default Warehouse</label>
                        <select value={qaForm.warehouse_id} onChange={e => setQaForm({...qaForm, warehouse_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                          <option value="">Select Warehouse</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Default Bin</label>
                        <select disabled={!qaForm.warehouse_id} value={qaForm.bin_id} onChange={e => setQaForm({...qaForm, bin_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                          <option value="">Select Bin</option>
                          {bins.filter(b => b.warehouse_id === parseInt(qaForm.warehouse_id)).map(b => (
                            <option key={b.id} value={b.id}>{b.rack_code} · {b.bin_code}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </Modal>
              )}

              <div className="form-grid" style={{ gridTemplateColumns: '2fr 0.8fr 1fr 1.2fr auto' }}>
                <div className="form-group">
                  <label>Product / Raw Material</label>
                  <select
                    value={newItem.product_id}
                    onChange={e => {
                      const prod = products.find(p => p.id === parseInt(e.target.value));
                      setNewItem({
                        ...newItem,
                        product_id: e.target.value,
                        unit_price: prod?.price || 0,
                        uom: prod?.uom || 'units'
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 8,
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <option value="">Select Item</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.type === 'raw_material' ? 'RM' : 'FG'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Measure (UOM)</label>
                  <select 
                    value={newItem.uom || 'units'} 
                    onChange={e => setNewItem({ ...newItem, uom: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                  >
                    <option value="units">Units</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="metre">Metres (m)</option>
                    <option value="litre">Litres (L)</option>
                    <option value="box">Box</option>
                    <option value="pkt">Packet</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Unit Price (£)</label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={newItem.unit_price}
                    onChange={e => setNewItem({ ...newItem, unit_price: e.target.value })}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={addItemToPo}
                  style={{ height: 42, marginTop: 'auto', padding: '0 25px' }}
                >
                  Add to List
                </button>
              </div>

              <div className="po-items-list" style={{ marginTop: 15 }}>
                {poForm.items.map((item, i) => (
                  <div key={i} className="pill blue" style={{ marginRight: 10, marginBottom: 10, padding: '8px 15px' }}>
                    {item.product_name} x {item.quantity} · £{item.unit_price * item.quantity}
                    <span style={{ marginLeft: 10, cursor: 'pointer', opacity: 0.6 }} onClick={() => setPoForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}>✕</span>
                  </div>
                ))}
              </div>

              {poForm.items.length > 0 && (
                <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Total: £{poForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}</div>
                  <button className="btn btn-primary" onClick={createOrder} disabled={loading}>{loading ? "Creating..." : "Create Purchase Order"}</button>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>PO #</th><th>Supplier</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <Fragment key={o.id}>
                      <tr>
                        <td style={{ color: "#a5b4fc", fontWeight: 600 }}>#PO-{o.id}</td>
                        <td>{o.supplier_name}</td>
                        <td>{new Date(o.order_date).toLocaleDateString()}</td>
                        <td style={{ color: "#10b981", fontWeight: 600 }}>£{Number(o.total_amount).toLocaleString()}</td>
                        <td><span className={`pill ${o.status === 'Draft' ? 'yellow' : o.status === 'Received' ? 'green' : 'cyan'}`}>{o.status}</span></td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => toggleExpand(o.id)} style={{ marginRight: 5 }}>
                            {expandedOrder === o.id ? "Hide Items" : "View Items"}
                          </button>
                          {o.status === 'Draft' && <button className="btn btn-secondary btn-sm" onClick={() => updateOrderStatus(o.id, 'Sent')}>Mark Sent</button>}
                          {o.status === 'Sent' && <button className="btn btn-primary btn-sm" onClick={() => updateOrderStatus(o.id, 'Received')}>Mark Received</button>}
                        </td>
                      </tr>
                      {expandedOrder === o.id && (
                        <tr>
                          <td colSpan="6" style={{ background: 'rgba(255,255,255,0.03)', padding: '15px' }}>
                            <div style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: 8 }}>
                              <strong style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>Order Items:</strong>
                              {orderItems.length > 0 ? (
                                <table style={{ background: 'transparent' }}>
                                  <thead>
                                    <tr style={{ background: 'transparent' }}><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                                  </thead>
                                  <tbody>
                                    {orderItems.map(item => (
                                      <tr key={item.id} style={{ background: 'transparent' }}>
                                        <td>{item.product_name}</td>
                                        <td>{item.quantity} <span style={{ fontSize: 10, opacity: 0.7 }}>{item.uom || ''}</span></td>
                                        <td>£{item.unit_price}</td>
                                        <td>£{item.quantity * item.unit_price}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : <p>Loading items...</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "quotations" && (
        <>
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div className="section-title">Supplier Quotations & Automated Allocation</div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Quotation</th>
                    <th>Supplier</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price (£)</th>
                    <th>Total (£)</th>
                    <th>Allocation (W-R-B)</th>
                    <th>Barcode</th>
                    <th>Due Date</th>
                    <th>Time Left</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map(q => (
                    <tr key={q.id}>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>#QT-{q.id}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(q.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{q.supplier_name}</td>
                      <td>{q.product_name}</td>
                      <td>{q.quantity}</td>
                      <td style={{ fontWeight: 600 }}>£{q.unit_price}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-4)' }}>£{q.total_amount?.toLocaleString()}</td>
                      <td>
                        {q.allocations && q.allocations.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {q.allocations.map((al, idx) => (
                              <div key={idx} style={{ fontSize: 11, background: 'rgba(99, 102, 241, 0.05)', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{al.warehouse_name}</div>
                                <div>{al.rack_code} · {al.bin_code} <span style={{ fontWeight: 700, marginLeft: 4 }}>({al.quantity})</span></div>
                              </div>
                            ))}
                          </div>
                        ) : <span style={{ opacity: 0.5 }}>Pending</span>}
                      </td>
                      <td>
                        {q.allocations && q.allocations.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {q.allocations.map((al, idx) => (
                              <code key={idx} style={{ background: 'var(--bg-base)', padding: '2px 6px', borderRadius: 4, fontSize: 10, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                                {al.barcode_id}
                              </code>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        {q.delivery_due_at ? (
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{new Date(q.delivery_due_at).toLocaleDateString()}</div>
                        ) : '—'}
                      </td>
                      <td>{getTimeLeft(q.delivery_due_at)}</td>
                      <td>
                        <span className={`pill ${q.status === 'Accepted' ? 'green' : q.status === 'Rejected' ? 'red' : 'blue'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td>
                        {q.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => updateQuotationStatus(q.id, 'Accepted')}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateQuotationStatus(q.id, 'Rejected')}>Reject</button>
                          </div>
                        )}
                        {q.status === 'Accepted' && (
                          <button className="btn btn-secondary btn-sm" disabled>Allocated</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {quotations.length === 0 && (
                    <tr><td colSpan="12" style={{ textAlign: 'center', padding: 40 }}>No quotations received yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
