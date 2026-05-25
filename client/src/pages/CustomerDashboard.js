import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import { Country, State, City } from "country-state-city";

export default function CustomerDashboard({ products, push, user, setActiveModule }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [customerProfile, setCustomerProfile] = useState(null);

  // Support state
  const [tickets, setTickets] = useState([]);
  const [supportStats, setSupportStats] = useState({ total_tickets: 0, open_tickets: 0, in_progress_tickets: 0, resolved_tickets: 0 });
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", category: "general", priority: "medium" });

  const [newOrder, setNewOrder] = useState({
    customer_id: user?.id || 1, // Defaulting to user's ID
    order_number: `ORD-${Math.floor(Math.random() * 1000000)}`,
    delivery_country: "",
    delivery_state: "",
    delivery_city: "",
    delivery_address: "",
    delivery_latitude: "",
    delivery_longitude: "",
    required_delivery_date: "",
    required_delivery_time: "",
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const customerId = user?.customer_id || user?.id;
      
      const [ordersRes, ticketsRes, statsRes, custRes] = await Promise.all([
        axios.get(`${API}/customer-orders`, { headers }),
        axios.get(`${API}/support?customer_id=${customerId}`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/support/stats/dashboard?customer_id=${customerId}`, { headers }).catch(() => ({ data: { total_tickets: 0, open_tickets: 0, in_progress_tickets: 0, resolved_tickets: 0 } })),
        user?.id ? axios.get(`${API}/customers/${user.id}`, { headers }).catch(() => null) : Promise.resolve(null),
      ]);

      setOrders(ordersRes.data);
      setTickets(ticketsRes.data);
      setSupportStats(statsRes.data);
      if (custRes?.data) setCustomerProfile(custRes.data);
    } catch {
      push("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [push, user]);

  const handleOpenAddModal = () => {
    const defaultCountry = customerProfile?.country || "United Kingdom";
    const countryObj = Country.getAllCountries().find(
      c => c.name === defaultCountry || c.isoCode === defaultCountry
    );
    const countryCode = countryObj?.isoCode || "GB";
    
    const countryStates = State.getStatesOfCountry(countryCode);
    setStates(countryStates);

    const defaultState = customerProfile?.state || "";
    let matchedState = countryStates.find(
      s => s.name === defaultState || s.isoCode === defaultState
    );
    
    const defaultCity = customerProfile?.city || "";
    if (!matchedState && defaultCity) {
      const allCountryCities = City.getCitiesOfCountry(countryCode) || [];
      const matchedCity = allCountryCities.find(
        c => c.name.toLowerCase() === defaultCity.toLowerCase()
      );
      if (matchedCity) {
        matchedState = countryStates.find(s => s.isoCode === matchedCity.stateCode);
      }
    }
    const stateCode = matchedState?.isoCode || "";
    
    let stateCities = [];
    if (stateCode) {
      stateCities = City.getCitiesOfState(countryCode, stateCode);
      setCities(stateCities);
    } else {
      setCities([]);
    }

    setNewOrder({
      customer_id: user?.id || 1,
      order_number: `ORD-${Math.floor(Math.random() * 1000000)}`,
      delivery_country: countryCode,
      delivery_state: stateCode,
      delivery_city: defaultCity,
      delivery_address: customerProfile?.address_line_1 || "",
      delivery_latitude: customerProfile?.latitude || "",
      delivery_longitude: customerProfile?.longitude || "",
      required_delivery_date: "",
      required_delivery_time: "",
      delivery_priority: "normal",
      items: [{ product_id: "", product_name: "", quantity: 1, weight_kg: 0 }]
    });

    setShowAddModal(true);
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/customer-orders`, newOrder, { headers });
      push("Order placed successfully! Logistics will be planned soon.", "success");
      setShowAddModal(false);
      setNewOrder({
        customer_id: user?.id || 1,
        order_number: `ORD-${Math.floor(Math.random() * 1000000)}`,
        delivery_country: "",
        delivery_state: "",
        delivery_city: "",
        delivery_address: "",
        delivery_latitude: "",
        delivery_longitude: "",
        required_delivery_date: "",
        required_delivery_time: "",
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

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) {
      push("Please fill in all required fields", "error");
      return;
    }
    setSubmittingTicket(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const customerId = user?.customer_id || user?.id;
      await axios.post(`${API}/support`, { ...newTicket, customer_id: customerId }, { headers });
      push("Support ticket created successfully!", "success");
      setShowCreateTicketModal(false);
      setNewTicket({ subject: "", description: "", category: "general", priority: "medium" });
      fetchData();
    } catch (err) {
      push(err.response?.data?.error || "Failed to create support ticket", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "#ef4444";
      case "in-progress": return "#f59e0b";
      case "resolved": return "#10b981";
      case "closed": return "#6b7280";
      case "on-hold": return "#8b5cf6";
      default: return "#6b7280";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "#dc2626";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#22c55e";
      default: return "#6b7280";
    }
  };

  const myOrders = orders
    .filter(o => String(o.customer_id) === String(user?.id))
    .sort((a, b) => b.id - a.id);
  const activeOrders = myOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
  const deliveredOrders = myOrders.filter(o => o.status === 'delivered').length;

  return (
    <div className="fade-up" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, background: 'linear-gradient(45deg, var(--accent-1), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome back, {user?.username || 'Customer'}
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '14px' }}>Here is your logistics and order overview</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          style={{ 
            background: 'linear-gradient(45deg, #6366f1, #8b5cf6)', 
            color: 'white', 
            border: 'none', 
            padding: '12px 24px', 
            borderRadius: '12px', 
            fontWeight: 700, 
            cursor: 'pointer',
            boxShadow: '0 10px 20px -10px rgba(99, 102, 241, 0.5)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          + Place New Order
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
          <div style={{ fontSize: '14px', opacity: 0.7, fontWeight: 600 }}>Active Orders</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-1)' }}>{activeOrders}</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚚</div>
          <div style={{ fontSize: '14px', opacity: 0.7, fontWeight: 600 }}>In Transit</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-2)' }}>{myOrders.filter(o => o.status === 'dispatched').length}</div>
        </div>
        <div style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
          <div style={{ fontSize: '14px', opacity: 0.7, fontWeight: 600 }}>Delivered</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981' }}>{deliveredOrders}</div>
        </div>
        <div 
          onClick={() => setActiveModule && setActiveModule("customer-support")}
          style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎫</div>
          <div style={{ fontSize: '14px', opacity: 0.7, fontWeight: 600 }}>Open Tickets</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#ef4444' }}>{supportStats.open_tickets || 0}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Recent Orders</h2>
        {setActiveModule && (
          <button 
            onClick={() => setActiveModule("customer-orders")}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-1)',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              transition: 'opacity 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.opacity = 0.8}
            onMouseOut={e => e.currentTarget.style.opacity = 1}
          >
            View All Orders →
          </button>
        )}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product Info</th>
                <th>Delivery Info</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 800 }}>{o.order_number}</td>
                  <td>
                    {o.items && o.items.map((item, idx) => (
                       <div key={idx} style={{ fontWeight: 600 }}>{item.quantity}x {item.product_name}</div>
                    ))}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{new Date(o.required_delivery_date).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', opacity: 0.6 }}>{o.delivery_city}, {o.delivery_country}</div>
                  </td>
                  <td>
                    <span className={`pill ${o.delivery_priority === 'urgent' ? 'red' : 'blue'}`} style={{ fontSize: '10px' }}>
                      {o.delivery_priority?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${o.status === 'delivered' ? 'green' : o.status === 'pending' ? 'yellow' : 'blue'}`}>
                      {o.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {myOrders.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                    No orders placed yet. Place your first order to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Support Tickets Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Recent Support Tickets</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setShowCreateTicketModal(true)}
            style={{
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            + New Ticket
          </button>
          {setActiveModule && (
            <button 
              onClick={() => setActiveModule("customer-support")}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-1)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = 0.8}
              onMouseOut={e => e.currentTarget.style.opacity = 1}
            >
              View All Tickets →
            </button>
          )}
        </div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 5).map(ticket => (
                <tr 
                  key={ticket.id} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveModule && setActiveModule("customer-support")}
                >
                  <td style={{ fontWeight: 800 }}>{ticket.ticket_number}</td>
                  <td>{ticket.subject}</td>
                  <td style={{ textTransform: 'capitalize' }}>{ticket.category}</td>
                  <td>
                    <span style={{
                      background: getPriorityColor(ticket.priority),
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}>
                      {ticket.priority?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      background: getStatusColor(ticket.status),
                      color: 'white',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}>
                      {ticket.status?.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', opacity: 0.7 }}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                    No support tickets yet. Need help? Create a ticket above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Support Ticket Modal */}
      {showCreateTicketModal && (
        <Modal title="Create Support Ticket" onClose={() => setShowCreateTicketModal(false)}>
          <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
            <div className="form-group">
              <label>Subject *</label>
              <input
                type="text"
                value={newTicket.subject}
                onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Brief subject of your issue"
                required
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={newTicket.description}
                onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Detailed description of your issue"
                required
                style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Category</label>
                <select value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}>
                  <option value="general">General</option>
                  <option value="order">Order Issue</option>
                  <option value="delivery">Delivery</option>
                  <option value="product">Product Quality</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTicketModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submittingTicket} style={{ background: 'linear-gradient(45deg, #6366f1, #8b5cf6)', border: 'none' }}>
                {submittingTicket ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAddModal && (
        <Modal title="Place New Order" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddOrder} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
            <div className="form-grid">
              
              {/* Dynamic Multiple Items Section */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ margin: 0, fontWeight: 700 }}>Order Items</label>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800 }}
                    onClick={() => {
                      setNewOrder({
                        ...newOrder,
                        items: [...newOrder.items, { product_id: "", product_name: "", quantity: 1, weight_kg: 0 }]
                      });
                    }}
                  >
                    + Add Product
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {newOrder.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <select 
                        style={{ flex: 3 }}
                        value={item.product_id} 
                        onChange={e => {
                          const prod = products?.find(p => p.id === parseInt(e.target.value));
                          const updatedItems = [...newOrder.items];
                          updatedItems[index] = {
                            ...updatedItems[index],
                            product_id: e.target.value,
                            product_name: prod ? prod.name : "",
                            weight_kg: prod ? (prod.weight_kg || 0) : 0
                          };
                          setNewOrder({ ...newOrder, items: updatedItems });
                        }} 
                        required
                      >
                        <option value="">Select Product...</option>
                        {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input 
                        type="number" 
                        min="1" 
                        placeholder="Qty" 
                        style={{ flex: 1 }}
                        value={item.quantity} 
                        onChange={e => {
                          const updatedItems = [...newOrder.items];
                          updatedItems[index].quantity = parseInt(e.target.value) || 1;
                          setNewOrder({ ...newOrder, items: updatedItems });
                        }} 
                        required 
                      />
                      {newOrder.items.length > 1 && (
                        <button 
                          type="button" 
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '38px',
                            width: '38px'
                          }}
                          onClick={() => {
                            const updatedItems = newOrder.items.filter((_, idx) => idx !== index);
                            setNewOrder({ ...newOrder, items: updatedItems });
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Date & Time (Cleanly separated) */}
              <div className="form-group">
                <label>Required Delivery Date</label>
                <input type="date" value={newOrder.required_delivery_date} onChange={e => setNewOrder({...newOrder, required_delivery_date: e.target.value})} required />
              </div>

              <div className="form-group">
                <label>Required Delivery Time</label>
                <input type="time" value={newOrder.required_delivery_time} onChange={e => setNewOrder({...newOrder, required_delivery_time: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label>Priority Level</label>
                <select value={newOrder.delivery_priority} onChange={e => setNewOrder({...newOrder, delivery_priority: e.target.value})}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Delivery Address</label>
                <input placeholder="123 Corporate Blvd, Suite 100" value={newOrder.delivery_address} onChange={e => setNewOrder({...newOrder, delivery_address: e.target.value})} required />
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: 'linear-gradient(45deg, #6366f1, #8b5cf6)', border: 'none' }}>
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
