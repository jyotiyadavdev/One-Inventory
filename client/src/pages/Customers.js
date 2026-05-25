import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import { Country, State, City } from "country-state-city";

export default function Customers({ push }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Customer Form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [form, setForm] = useState({
    customer_name: "",
    company_name: "",
    email: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    country: "IN", // ISO Code
    state: "",     // ISO Code
    city: "",      // Name
    pincode: "",
    delivery_priority: "normal",
    status: "active"
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.get(`${API}/customers`, { headers });
      setCustomers(res.data);
    } catch {
      push("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.customer_name || !form.phone || !form.address_line_1 || !form.city || !form.state || !form.pincode) {
      return push("Please fill all required fields", "error");
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      
      // Map ISO codes back to names for the backend if needed, 
      // or just send names if that's what the backend expects.
      // Current backend expects names for city/state/country.
      const countryData = Country.getCountryByCode(form.country);
      const stateData = State.getStateByCodeAndCountry(form.state, form.country);
      
      const payload = {
        ...form,
        country: countryData ? countryData.name : form.country,
        state: stateData ? stateData.name : form.state,
        // city is already the name in our form logic
      };

      if (isEditing) {
        await axios.put(`${API}/customers/${currentId}`, payload, { headers });
        push("Customer updated successfully");
      } else {
        await axios.post(`${API}/customers`, payload, { headers });
        push("Customer added successfully. Coordinates fetched automatically.");
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      push(err.response?.data?.error || "Error saving customer", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    // Find ISO codes for edit mode
    const country = Country.getAllCountries().find(c => c.name === customer.country)?.isoCode || "IN";
    const state = State.getStatesOfCountry(country).find(s => s.name === customer.state)?.isoCode || "";
    
    setForm({ 
      ...customer,
      country,
      state
    });
    setCurrentId(customer.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.delete(`${API}/customers/${id}`, { headers });
      push("Customer deleted successfully");
      fetchData();
    } catch (err) {
      push("Error deleting customer", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      customer_name: "",
      company_name: "",
      email: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      country: "IN",
      state: "",
      city: "",
      pincode: "",
      delivery_priority: "normal",
      status: "active"
    });
    setIsEditing(false);
    setCurrentId(null);
  };

  const filteredCustomers = customers.filter(c => 
    c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company_name && c.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(form.country);
  const cities = City.getCitiesOfState(form.country, form.state);

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">Customer Management</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input 
            className="btn btn-secondary" 
            style={{ width: 250, textAlign: 'left', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>＋ New Customer</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Coordinates (Auto)</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.customer_name}</div>
                    <div style={{ fontSize: 10, opacity: 0.6 }}>ID: #CUST-{c.id}</div>
                  </td>
                  <td>{c.company_name || "-"}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.phone}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{c.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{c.city}, {c.state}</div>
                    <div style={{ fontSize: 10, opacity: 0.5 }}>{c.country} - {c.pincode}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-1)' }}>
                      {parseFloat(c.latitude).toFixed(4)}, {parseFloat(c.longitude).toFixed(4)}
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${c.delivery_priority === 'urgent' ? 'red' : c.delivery_priority === 'scheduled' ? 'yellow' : 'blue'}`}>
                      {c.delivery_priority.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`pill ${c.status === 'active' ? 'green' : 'gray'}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal 
          title={isEditing ? "Edit Customer" : "Add New Customer"} 
          onClose={() => setShowModal(false)} 
          onConfirm={handleSubmit} 
          loading={loading}
        >
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Customer Name *</label>
              <input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} placeholder="Full Name" />
            </div>
            <div className="form-group">
              <label>Company Name</label>
              <input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Business Entity" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91..." />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 15 }}>
            <label>Address Line 1 *</label>
            <input value={form.address_line_1} onChange={e => setForm({...form, address_line_1: e.target.value})} placeholder="Street address, P.O. box" />
          </div>
          <div className="form-group" style={{ marginTop: 10 }}>
            <label>Address Line 2</label>
            <input value={form.address_line_2} onChange={e => setForm({...form, address_line_2: e.target.value})} placeholder="Apartment, suite, unit, building, floor, etc." />
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 15 }}>
            <div className="form-group">
              <label>Country *</label>
              <select 
                value={form.country} 
                onChange={e => setForm({...form, country: e.target.value, state: "", city: ""})}
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>State *</label>
              <select 
                disabled={!states.length}
                value={form.state} 
                onChange={e => setForm({...form, state: e.target.value, city: ""})}
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">Select State</option>
                {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>City *</label>
              <select 
                disabled={!cities.length}
                value={form.city} 
                onChange={e => setForm({...form, city: e.target.value})}
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">Select City</option>
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 15 }}>
            <div className="form-group">
              <label>Pincode *</label>
              <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Delivery Priority</label>
              <select 
                value={form.delivery_priority} 
                onChange={e => setForm({...form, delivery_priority: e.target.value})}
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select 
                value={form.status} 
                onChange={e => setForm({...form, status: e.target.value})}
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: 15, padding: 12, borderRadius: 8, background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--accent-1)', fontSize: 11 }}>
            <strong>Note:</strong> Latitude and Longitude will be automatically fetched on the server based on the provided address for transport optimization.
          </div>
        </Modal>
      )}
    </div>
  );
}
