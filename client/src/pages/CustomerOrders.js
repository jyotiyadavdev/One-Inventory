import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import { Country, State, City } from "country-state-city";

export default function CustomerOrders({ products, push, user }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [newOrder, setNewOrder] = useState({
    customer_id: "",
    order_number: `ORD-${Math.floor(Math.random() * 1000000)}`,
    delivery_country: "",
    delivery_state: "",
    delivery_city: "",
    delivery_address: "",
    delivery_latitude: "",
    delivery_longitude: "",
    required_delivery_date: "",
    delivery_priority: "normal",
    items: [{ product_id: "", product_name: "", quantity: 1, weight_kg: 0 }]
  });

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setNewOrder({ ...newOrder, delivery_country: code, delivery_state: "", delivery_city: "", delivery_latitude: "", delivery_longitude: "" });
    setStates(State.getStatesOfCountry(code));
    setCities([]);
  };

  const handleStateChange = (e) => {
    const code = e.target.value;
    setNewOrder({ ...newOrder, delivery_state: code, delivery_city: "", delivery_latitude: "", delivery_longitude: "" });
    setCities(City.getCitiesOfState(newOrder.delivery_country, code));
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    const city = cities.find(c => c.name === cityName);
    setNewOrder({ 
      ...newOrder, 
      delivery_city: cityName,
      delivery_latitude: city?.latitude || "",
      delivery_longitude: city?.longitude || ""
    });
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const [oRes, cRes] = await Promise.all([
        axios.get(`${API}/customer-orders`, { headers }),
        isAdmin ? axios.get(`${API}/customers`, { headers }) : Promise.resolve({ data: [] })
      ]);
      setOrders(oRes.data);
      setCustomers(cRes.data);
    } catch { push("Failed to load orders", "error"); }
    finally { setLoading(false); }
  }, [isAdmin, push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id) => {
    setCalcLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      // Approval now triggers AUTOMATIC LOGISTICS in the backend
      const res = await axios.put(`${API}/customer-orders/${id}`, { status: 'approved' }, { headers });
      const data = res.data;
      push(`Order Approved & Logistics Automated: WH: ${data.warehouse}, Driver: ${data.vehicle}`, "success");
      fetchData();
    } catch (err) {
      push(err.response?.data?.error || "Automation failed", "error");
    } finally {
      setCalcLoading(false);
    }
  };

  const handleManualTrigger = async (id) => {
    setCalcLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.post(`${API}/customer-orders/${id}/select-warehouse`, {}, { headers });
      push(`Logistics Re-Optimized: WH: ${res.data.warehouse}, Driver: ${res.data.vehicle}`, "success");
      fetchData();
    } catch (err) { push(err.response?.data?.error || "Failed", "error"); }
    finally { setCalcLoading(false); }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm("Are you sure you want to withdraw this order?")) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.delete(`${API}/customer-orders/${id}`, { headers });
      push("Order withdrawn successfully", "success");
      fetchData();
    } catch (err) {
      push(err.response?.data?.error || "Failed to withdraw order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!newOrder.customer_id && isAdmin) {
       return push("Please select a customer", "error");
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/customer-orders`, newOrder, { headers });
      push("Order created successfully", "success");
      setShowAddModal(false);
      setNewOrder({
        customer_id: "",
        order_number: `ORD-${Math.floor(Math.random() * 1000000)}`,
        delivery_country: "",
        delivery_state: "",
        delivery_city: "",
        delivery_address: "",
        delivery_latitude: "",
        delivery_longitude: "",
        required_delivery_date: "",
        delivery_priority: "normal",
        items: [{ product_id: "", product_name: "", quantity: 1, weight_kg: 0 }]
      });
      setStates([]);
      setCities([]);
      fetchData();
    } catch (err) {
      push(err.response?.data?.error || "Failed to create order", "error");
    } finally {
      setLoading(false);
    }
  };

  const myOrders = isAdmin ? orders : orders.filter(o => String(o.customer_id) === String(user?.id));
  
  const filteredOrders = myOrders.filter(o => 
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusPillClass = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'warehouse_selected': return 'blue';
      case 'dispatched': return 'orange';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="fade-up" style={{ position: 'relative' }}>
      {calcLoading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="loading-spinner" style={{ width: 80, height: 80, border: '6px solid var(--accent-1)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}></div>
          <div style={{ marginTop: 24, color: 'white', fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase' }}>Executing AI Dispatch</div>
          <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500 }}>Syncing Warehouse, Allocating Stock & Routing Vehicle...</div>
        </div>
      )}

      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">Logistics & Order Management</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '8px 20px', fontWeight: 800 }}>+ Add Order</button>
          )}
          <input className="btn btn-secondary" style={{ width: 300, background: 'var(--bg-surface)' }} placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Delivery Date</th>
                <th>Source WH</th>
                <th>Fleet / Driver</th>
                <th>Route Info</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>{isAdmin ? 'Logistics Action' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <React.Fragment key={o.id}>
                  <tr style={{ borderBottom: expandedOrderId === o.id ? 'none' : '1px solid var(--border)' }}>
                    <td 
                      style={{ fontWeight: 800, color: 'var(--accent-1)', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                    >
                      {o.order_number}
                      <span style={{ fontSize: '9px', opacity: 0.5 }}>{expandedOrderId === o.id ? '▲' : '▼'}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{o.customer_name}</div>
                      <div style={{ fontSize: 10, opacity: 0.5 }}>{o.company_name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{new Date(o.required_delivery_date).toLocaleDateString()}</div>
                      <div className={`pill ${o.delivery_priority === 'urgent' ? 'red' : 'blue'}`} style={{ fontSize: 8, padding: '2px 5px' }}>{o.delivery_priority.toUpperCase()}</div>
                    </td>
                    <td>
                      {o.selected_warehouse_name ? (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--accent-1)' }}>{o.selected_warehouse_name}</div>
                          <div style={{ fontSize: 9, opacity: 0.6 }}>{parseFloat(o.warehouse_distance_km || 0).toFixed(1)}km from origin</div>
                        </div>
                      ) : <span style={{ opacity: 0.3, fontStyle: 'italic' }}>Pending Auto-Select</span>}
                    </td>
                    <td>
                      {o.driver_name ? (
                        <div>
                          <div style={{ fontWeight: 700 }}>👤 {o.driver_name}</div>
                          <div style={{ fontSize: 10, opacity: 0.7 }}>{o.vehicle_type} ({o.vehicle_plate})</div>
                        </div>
                      ) : (
                        o.status === 'warehouse_selected' ? <span style={{ color: 'var(--accent-4)', fontWeight: 800, fontSize: 11 }}>⚠️ Manual Fleet Required</span> : <span style={{ opacity: 0.3 }}>—</span>
                      )}
                    </td>
                    <td>
                      {o.delivery_sequence ? (
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--accent)', display: 'inline-block' }}>
                          <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--accent)' }}>STOP #{o.delivery_sequence}</div>
                          <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.8 }}>Optimized Route</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td><span className={`pill ${getStatusPillClass(o.status)}`}>{o.status.replace('_', ' ').toUpperCase()}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {isAdmin ? (
                        o.status === 'pending' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(o.id)} style={{ padding: '8px 20px', fontWeight: 800 }}>APPROVE & DISPATCH</button>
                        ) : (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleManualTrigger(o.id)} style={{ padding: '6px 12px', fontSize: 10 }}>RE-OPTIMIZE</button>
                        )
                      ) : (
                        o.status === 'pending' ? (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleWithdraw(o.id)} style={{ padding: '6px 12px', fontSize: 10, color: 'var(--accent-4)', borderColor: 'var(--accent-4)' }}>WITHDRAW</button>
                        ) : (
                          <span style={{ opacity: 0.3 }}>—</span>
                        )
                      )}
                    </td>
                  </tr>
                  {expandedOrderId === o.id && (
                    <tr style={{ background: 'rgba(0, 0, 0, 0.015)' }}>
                      <td colSpan={8} style={{ padding: '16px 24px', borderTop: 'none' }}>
                        <div className="fade-down" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--accent-1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Order Items & Negotiated Price Offers
                            </h4>
                            <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6 }}>
                              Total Weight: {o.items?.reduce((acc, curr) => acc + (curr.weight_kg || 0), 0)} kg
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                            {(o.items || []).map((item, idx) => (
                              <div key={idx} style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '12.5px' }}>{item.product_name}</div>
                                  <div style={{ fontSize: '11px', opacity: 0.6 }}>Quantity: {item.quantity} units</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                                    Offered: £{item.offered_price_per_unit || item.unit_price || 0}
                                  </div>
                                  {(item.catalog_price_per_unit || item.unit_price) && (
                                    <div style={{ fontSize: '10px', opacity: 0.5, textDecoration: item.offered_price_per_unit && item.offered_price_per_unit !== item.catalog_price_per_unit ? 'line-through' : 'none' }}>
                                      Catalog: £{item.catalog_price_per_unit || item.unit_price}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '5px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, opacity: 0.7 }}>Consolidated B2B Valuation:</span>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-1)' }}>
                              £{(o.total_amount || o.items?.reduce((acc, curr) => acc + ((curr.offered_price_per_unit || curr.unit_price || 0) * curr.quantity), 0) || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Modal title="Create Customer Order" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddOrder} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '10px 0' }}>
            
            <div className="form-grid">
              {isAdmin && (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Customer</label>
                  <select value={newOrder.customer_id} onChange={(e) => setNewOrder({...newOrder, customer_id: e.target.value})} required>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name} ({c.company_name})</option>)}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label>Order Number</label>
                <input value={newOrder.order_number} onChange={e => setNewOrder({...newOrder, order_number: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Required Delivery Date</label>
                <input type="date" value={newOrder.required_delivery_date} onChange={e => setNewOrder({...newOrder, required_delivery_date: e.target.value})} required />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Delivery Address</label>
                <input placeholder="123 Main St, Apt 4B" value={newOrder.delivery_address} onChange={e => setNewOrder({...newOrder, delivery_address: e.target.value})} required />
              </div>

              <div className="form-group">
                <label>Country</label>
                <select value={newOrder.delivery_country} onChange={handleCountryChange} required>
                  <option value="">Select Country</option>
                  {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>State</label>
                <select value={newOrder.delivery_state} onChange={handleStateChange} required disabled={!newOrder.delivery_country}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>City</label>
                <select value={newOrder.delivery_city} onChange={handleCityChange} required disabled={!newOrder.delivery_state}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={newOrder.delivery_priority} onChange={e => setNewOrder({...newOrder, delivery_priority: e.target.value})}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Order Items</div>
              <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Product Item</label>
                  <select value={newOrder.items[0].product_id} onChange={e => {
                    const prod = products?.find(p => p.id === parseInt(e.target.value));
                    setNewOrder({
                      ...newOrder,
                      items: [{
                        ...newOrder.items[0],
                        product_id: e.target.value,
                        product_name: prod ? prod.name : "",
                        weight_kg: prod ? (prod.weight_kg || 0) : 0
                      }]
                    });
                  }} required>
                    <option value="">Select Product</option>
                    {products?.filter((p, index, self) => index === self.findIndex((t) => t.name === p.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" min="1" placeholder="Qty" value={newOrder.items[0].quantity} onChange={e => setNewOrder({
                    ...newOrder,
                    items: [{ ...newOrder.items[0], quantity: parseInt(e.target.value) }]
                  })} required />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="any" placeholder="Weight (kg)" value={newOrder.items[0].weight_kg} onChange={e => setNewOrder({
                    ...newOrder,
                    items: [{ ...newOrder.items[0], weight_kg: parseFloat(e.target.value) }]
                  })} required />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Order'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
