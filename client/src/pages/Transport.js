import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import RouteViewer from "../components/RouteViewer";

export default function Transport({ push }) {
  const [tab, setTab] = useState("shipments");
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedShipment, setSelectedShipment] = useState(null);

  // Vehicle Form State
  const [showVModal, setShowVModal] = useState(false);
  const [isEditingV, setIsEditingV] = useState(false);
  const [currentVId, setCurrentVId] = useState(null);
  const [vForm, setVForm] = useState({ vehicle_number: "", vehicle_type: "Truck", capacity_kg: "", capacity_volume: "", driver_name: "", driver_phone: "", current_latitude: "", current_longitude: "", assigned_warehouse_id: "", status: "available" });

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const [vRes, sRes, wRes] = await Promise.all([
        axios.get(`${API}/transport/vehicles`, { headers }),
        axios.get(`${API}/transport/shipments`, { headers }),
        axios.get(`${API}/warehouse`, { headers })
      ]);
      setVehicles(vRes.data);
      setShipments(sRes.data);
      setWarehouses(wRes.data);
    } catch { push("Failed to load transport data", "error"); }
  }, [push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveVehicle = async () => {
    // Validate required fields
    if (!vForm.vehicle_number?.trim()) {
      return push("Please enter a vehicle number (plate/registration)", "error");
    }
    if (!vForm.driver_name?.trim()) {
      return push("Please enter the driver's name", "error");
    }
    if (!vForm.capacity_kg || parseFloat(vForm.capacity_kg) <= 0) {
      return push("Please enter a valid capacity in kg", "error");
    }
    
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const payload = {
        vehicle_number: vForm.vehicle_number.trim(),
        vehicle_type: vForm.vehicle_type,
        capacity_kg: parseFloat(vForm.capacity_kg),
        capacity_volume: vForm.capacity_volume ? parseFloat(vForm.capacity_volume) : 0,
        driver_name: vForm.driver_name.trim(),
        driver_phone: vForm.driver_phone?.trim() || "",
        current_latitude: vForm.current_latitude || 0,
        current_longitude: vForm.current_longitude || 0,
        assigned_warehouse_id: vForm.assigned_warehouse_id || null,
        status: vForm.status
      };
      
      if (isEditingV) {
        await axios.put(`${API}/transport/vehicles/${currentVId}`, payload, { headers });
      } else {
        await axios.post(`${API}/transport/vehicles`, payload, { headers });
      }
      
      setShowVModal(false); 
      resetVForm(); 
      fetchData();
      push(isEditingV ? "✓ Vehicle updated successfully" : "✓ Vehicle created successfully", "success");
    } catch (err) { 
      const errorMsg = err.response?.data?.error || err.message;
      console.error("Vehicle save error:", errorMsg);
      
      // Handle specific error cases
      if (errorMsg.includes("duplicate") || errorMsg.includes("unique")) {
        push("❌ This vehicle number already exists. Please use a different plate/registration number.", "error");
      } else {
        push(`❌ Failed to save vehicle: ${errorMsg}`, "error");
      }
    }
    finally { setLoading(false); }
  };

  const resetVForm = () => { setVForm({ vehicle_number: "", vehicle_type: "Truck", capacity_kg: "", capacity_volume: "", driver_name: "", driver_phone: "", current_latitude: "", current_longitude: "", assigned_warehouse_id: "", status: "available" }); setIsEditingV(false); setCurrentVId(null); };

  const updateShipmentStatus = async (id, status) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.put(`${API}/transport/shipments/${id}/status`, { status }, { headers });
      push(`Shipment marked as ${status}`);
      fetchData();
    } catch { push("Error", "error"); }
  };

  return (
    <div className="fade-up">
      <div className="login-tab-row" style={{ marginBottom: 24, justifyContent: "flex-start", gap: 10 }}>
        <button className={`login-tab ${tab === "shipments" ? "active" : ""}`} onClick={() => setTab("shipments")}>Active Shipments</button>
        <button className={`login-tab ${tab === "vehicles" ? "active" : ""}`} onClick={() => setTab("vehicles")}>Fleet Management</button>
      </div>

      {tab === "vehicles" && (
        <>
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div className="section-title">Fleet Directory</div>
            <button className="btn btn-primary" onClick={() => { resetVForm(); setShowVModal(true); }}>＋ Register Vehicle</button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Vehicle #</th><th>Type</th><th>Payload (kg)</th><th>Driver</th><th>Warehouse</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {vehicles.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 700 }}>{v.vehicle_number}</td>
                      <td>{v.vehicle_type}</td>
                      <td>{v.capacity_kg} kg</td>
                      <td>{v.driver_name}</td>
                      <td>{v.warehouse_name || "-"}</td>
                      <td><span className={`pill ${v.status === 'available' ? 'green' : 'blue'}`}>{v.status.toUpperCase()}</span></td>
                      <td><button className="btn btn-secondary btn-sm" onClick={() => { setVForm({...v}); setCurrentVId(v.id); setIsEditingV(true); setShowVModal(true); }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {showVModal && (
            <Modal title={isEditingV ? "Edit Vehicle" : "Register New Vehicle"} onClose={() => setShowVModal(false)} onConfirm={saveVehicle} confirmText={isEditingV ? "Update Vehicle" : "Create Fleet"} loading={loading}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Vehicle Plate Number *</label>
                  <input 
                    value={vForm.vehicle_number} 
                    onChange={e => setVForm({...vForm, vehicle_number: e.target.value})} 
                    placeholder="e.g. MH-1234-AB56" 
                    required 
                  />
                  <small style={{opacity: 0.6}}>Must be unique</small>
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={vForm.vehicle_type} onChange={e => setVForm({...vForm, vehicle_type: e.target.value})}>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Lorry">Lorry</option>
                    <option value="Tempo">Tempo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Capacity (kg) *</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={vForm.capacity_kg} 
                    onChange={e => setVForm({...vForm, capacity_kg: e.target.value})} 
                    placeholder="e.g. 5000" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Volume (m³)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={vForm.capacity_volume} 
                    onChange={e => setVForm({...vForm, capacity_volume: e.target.value})} 
                    placeholder="e.g. 50" 
                  />
                </div>
                <div className="form-group">
                  <label>Driver Name *</label>
                  <input 
                    value={vForm.driver_name} 
                    onChange={e => setVForm({...vForm, driver_name: e.target.value})} 
                    placeholder="Full name" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Driver Phone</label>
                  <input 
                    value={vForm.driver_phone} 
                    onChange={e => setVForm({...vForm, driver_phone: e.target.value})} 
                    placeholder="Contact number" 
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Warehouse</label>
                  <select value={vForm.assigned_warehouse_id} onChange={e => setVForm({...vForm, assigned_warehouse_id: e.target.value})}>
                    <option value="">Not Assigned</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={vForm.status} onChange={e => setVForm({...vForm, status: e.target.value})}>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 20, padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', fontSize: 12, borderLeft: '3px solid var(--accent)' }}>
                <strong>* Required fields</strong> — Fill in vehicle plate number, capacity, and driver name to continue.
              </div>
            </Modal>
          )}
        </>
      )}

      {tab === "shipments" && (
        <>
          <div className="section-header" style={{ marginBottom: 24 }}>
            <div className="section-title">Logistics Routes & Shipments</div>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Shipment ID</th><th>Driver / Vehicle</th><th>Source</th><th>Destination</th><th>Distance</th><th>Status</th><th style={{ textAlign: 'right' }}>Navigation</th></tr></thead>
                <tbody>
                  {shipments.map(s => (
                    <tr key={s.id}>
                      <td style={{ color: "var(--accent)", fontWeight: 800 }}>#SHP-{s.id}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>👤 {s.driver_name}</div>
                        <div style={{ fontSize: 10, opacity: 0.6 }}>{s.vehicle_number}</div>
                      </td>
                      <td>{s.origin_name}</td>
                      <td>{s.dest_name}</td>
                      <td>{parseFloat(s.distance_km || 0).toFixed(1)} km</td>
                      <td><span className={`pill ${s.status === 'Pending' ? 'yellow' : 'green'}`}>{s.status.toUpperCase()}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setSelectedShipment(s)}>📍 Map Route</button>
                          {s.status === 'Pending' && <button className="btn btn-secondary btn-sm" onClick={() => updateShipmentStatus(s.id, 'Delivered')}>Mark Done</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {shipments.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No active shipments. Automatic logistics will create them.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          {selectedShipment && (
            <Modal title={`Navigation: Shipment #SHP-${selectedShipment.id}`} onClose={() => setSelectedShipment(null)} hideConfirm>
              <RouteViewer shipment={selectedShipment} />
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <div><strong>From:</strong> {selectedShipment.origin_name}</div>
                <div><strong>To:</strong> {selectedShipment.dest_name}</div>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
