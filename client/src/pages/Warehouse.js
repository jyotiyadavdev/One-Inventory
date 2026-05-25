// import React, { useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import { API } from "../config";
// import Modal from "../components/Modal";

// export default function Warehouse({ products, push }) {
//   const [tab, setTab] = useState("locations");
//   const [warehouses, setWarehouses] = useState([]);
//   const [bins, setBins] = useState([]);
//   const [movements, setMovements] = useState([]);
//   const [selectedWhId, setSelectedWhId] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // Warehouse Form
//   const [showWModal, setShowWModal] = useState(false);
//   const [wForm, setWForm] = useState({ 
//     name: "", 
//     location: "", 
//     capacity_sqft: "", 
//     manager_name: "",
//     latitude: "",
//     longitude: "",
//     status: "active"
//   });

//   // Transfer Form
//   const [showTModal, setShowTModal] = useState(false);
//   const [tForm, setTForm] = useState({ product_id: "", from_warehouse_id: "", to_warehouse_id: "", to_bin_id: "", quantity: "", reason: "" });

//   // Rack Form
//   const [showRModal, setShowRModal] = useState(false);
//   const [rForm, setRForm] = useState({ warehouse_id: "", rack_code: "", bin_count: 5 });
//   const [rackActionData, setRackActionData] = useState(null);
//   const [showRackEditModal, setShowRackEditModal] = useState(false);
//   const [showRackDeleteModal, setShowRackDeleteModal] = useState(false);
//   const [newRackName, setNewRackName] = useState("");
//   const [newBinCount, setNewBinCount] = useState(0);

//   const fetchData = useCallback(async () => {
//     try {
//       const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
//       const [wRes, mRes, bRes] = await Promise.all([
//         axios.get(`${API}/warehouse`, { headers }),
//         axios.get(`${API}/warehouse/movements`, { headers }),
//         axios.get(`${API}/warehouse/bins`, { headers })
//       ]);
//       setWarehouses(wRes.data);
//       if (wRes.data.length > 0 && !selectedWhId) setSelectedWhId(wRes.data[0].id);
//       setMovements(mRes.data);
//       setBins(bRes.data);
//     } catch { push("Failed to load warehouse data", "error"); }
//   }, [push, selectedWhId]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   const addWarehouse = async () => {
//     if (!wForm.name) return push("Warehouse name is required", "error");
//     setLoading(true);
//     try {
//       const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
//       await axios.post(`${API}/warehouse`, wForm, { headers });
//       push("Warehouse added successfully");
//       setWForm({ name: "", location: "", capacity_sqft: "", manager_name: "", latitude: "", longitude: "", status: "active" });
//       setShowWModal(false);
//       fetchData();
//     } catch { push("Error adding warehouse", "error"); }
//     finally { setLoading(false); }
//   };

//   const createTransfer = async () => {
//     if (!tForm.product_id || !tForm.to_warehouse_id || !tForm.quantity) return push("Missing required fields", "error");
//     setLoading(true);
//     try {
//       const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
//       await axios.post(`${API}/warehouse/movements`, tForm, { headers });
//       push("Stock transfer completed!");
//       setTForm({ product_id: "", from_warehouse_id: "", to_warehouse_id: "", to_bin_id: "", quantity: "", reason: "" });
//       setShowTModal(false);
//       fetchData();
//     } catch { push("Error transferring stock", "error"); }
//     finally { setLoading(false); }
//   };

//   const saveRack = async () => {
//     if (!rForm.warehouse_id || !rForm.rack_code) return push("Warehouse and Rack Code are required", "error");
//     setLoading(true);
//     try {
//       const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
//       await axios.post(`${API}/warehouse/bins/bulk`, rForm, { headers });
//       push(`Rack ${rForm.rack_code} added successfully!`);
//       setShowRModal(false);
//       setRForm({ warehouse_id: "", rack_code: "", bin_count: 5 });
//       fetchData();
//     } catch { push("Error adding rack", "error"); }
//     finally { setLoading(false); }
//   };

//   const handleRackUpdate = async () => {
//     if (!newRackName) return;
//     setLoading(true);
//     try {
//       const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
//       await axios.put(`${API}/warehouse/bins/rack/${rackActionData.warehouse_id}/${rackActionData.rack_code}`, { 
//         new_code: newRackName,
//         bin_count: newBinCount
//       }, { headers });
//       push(`Rack ${newRackName} updated successfully`);
//       setShowRackEditModal(false);
//       fetchData();
//     } catch (err) { 
//       push(err.response?.data?.error || "Error updating rack", "error"); 
//     } finally { setLoading(false); }
//   };

//   const handleRackDelete = async () => {
//     setLoading(true);
//     try {
//       const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
//       await axios.delete(`${API}/warehouse/bins/rack/${rackActionData.warehouse_id}/${rackActionData.rack_code}`, { headers });
//       push("Rack deleted successfully");
//       setShowRackDeleteModal(false);
//       fetchData();
//     } catch (err) { 
//       push(err.response?.data?.error || "Error deleting rack", "error"); 
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="fade-up">
//       <div className="login-tab-row" style={{ marginBottom: 24, justifyContent: "flex-start", gap: 10 }}>
//         <button className={`login-tab ${tab === "locations" ? "active" : ""}`} onClick={() => setTab("locations")}>Warehouses</button>
//         <button className={`login-tab ${tab === "bins" ? "active" : ""}`} onClick={() => setTab("bins")}>Bins & Racks</button>
//         <button className={`login-tab ${tab === "movements" ? "active" : ""}`} onClick={() => setTab("movements")}>Stock Movements</button>
//       </div>

//       {tab === "locations" && (
//         <>
//           <div className="section-header" style={{ marginBottom: 24 }}>
//             <div className="section-title">Warehouse Management</div>
//             <button className="btn btn-primary" onClick={() => setShowWModal(true)}>＋ New Warehouse</button>
//           </div>

//           {showWModal && (
//             <Modal title="Add New Warehouse" onClose={() => setShowWModal(false)} onConfirm={addWarehouse} loading={loading}>
//               <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
//                 <div className="form-group"><label>Warehouse Name</label><input value={wForm.name} onChange={e => setWForm({...wForm, name: e.target.value})} placeholder="e.g. South Zone Hub" /></div>
//                 <div className="form-group"><label>Location / Address</label><input value={wForm.location} onChange={e => setWForm({...wForm, location: e.target.value})} /></div>
                
//                 <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
//                    <div className="form-group"><label>Latitude</label><input type="number" step="any" value={wForm.latitude} onChange={e => setWForm({...wForm, latitude: e.target.value})} placeholder="e.g. 19.0760" /></div>
//                    <div className="form-group"><label>Longitude</label><input type="number" step="any" value={wForm.longitude} onChange={e => setWForm({...wForm, longitude: e.target.value})} placeholder="e.g. 72.8777" /></div>
//                 </div>

//                 <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
//                   <div className="form-group"><label>Capacity (Sqft)</label><input type="number" value={wForm.capacity_sqft} onChange={e => setWForm({...wForm, capacity_sqft: e.target.value})} /></div>
//                   <div className="form-group"><label>Manager Name</label><input value={wForm.manager_name} onChange={e => setWForm({...wForm, manager_name: e.target.value})} /></div>
//                 </div>
//               </div>
//             </Modal>
//           )}

//           <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
//             {warehouses.map(w => (
//               <div 
//                 key={w.id} 
//                 className="stat-card c2 clickable-card" 
//                 onClick={() => {
//                   setSelectedWhId(w.id);
//                   setTab("bins");
//                 }}
//                 style={{ 
//                   cursor: 'pointer', 
//                   transition: 'transform 0.2s, box-shadow 0.2s',
//                   position: 'relative',
//                   overflow: 'hidden'
//                 }}
//               >
//                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
//                   <div className="stat-icon i2">🏠</div>
//                   <span className={`pill ${w.status === 'Active' ? 'green' : 'red'}`}>{w.status.toUpperCase()}</span>
//                 </div>
//                 <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>{w.name}</div>
//                 <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 5 }}>{w.location}</div>
//                 <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 15 }}>GPS: {parseFloat(w.latitude || 0).toFixed(4)}, {parseFloat(w.longitude || 0).toFixed(4)}</div>
                
//                 <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 10 }}>
//                   <span>Manager: {w.manager_name}</span>
//                   <span>Cap: {w.capacity_sqft}sqft</span>
//                 </div>

//                 <div style={{ display: 'flex', gap: 5, fontSize: 10, fontWeight: 600 }}>
//                   <span className="pill blue" style={{ padding: '2px 8px' }}>
//                     {bins.filter(b => b.warehouse_id === w.id).length} Bins
//                   </span>
//                   <span className="pill purple" style={{ padding: '2px 8px' }}>
//                     {bins.filter(b => b.warehouse_id === w.id && b.status === 'Occupied').length} Occupied
//                   </span>
//                 </div>
                
//                 <div className="card-hover-hint" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--accent-1)', color: 'white', fontSize: 10, textAlign: 'center', padding: '2px 0', opacity: 0, transition: 'opacity 0.2s' }}>
//                   Click to view layout
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}

//       {tab === "bins" && (
//         <>
//           <div className="section-header" style={{ marginBottom: 24 }}>
//             <div className="section-title">Warehouse Layout & Occupancy</div>
//             <div style={{ display: 'flex', gap: 10 }}>
//               <div className="pill blue" style={{ padding: '8px 15px' }}>
//                 Total Bins: {bins.filter(b => !selectedWhId || b.warehouse_id === selectedWhId).length}
//               </div>
//               <div className="pill green" style={{ padding: '8px 15px' }}>
//                 Available: {bins.filter(b => (!selectedWhId || b.warehouse_id === selectedWhId) && b.status === 'Empty').length}
//               </div>
//               <div className="pill yellow" style={{ padding: '8px 15px' }}>
//                 Allocated/Reserved: {bins.filter(b => (!selectedWhId || b.warehouse_id === selectedWhId) && b.status === 'Reserved').length}
//               </div>
//               <div className="pill purple" style={{ padding: '8px 15px' }}>
//                 Occupied: {bins.filter(b => (!selectedWhId || b.warehouse_id === selectedWhId) && b.status === 'Occupied').length}
//               </div>
//             </div>
//             <div style={{ display: 'flex', gap: 10 }}>
//               <select 
//                 className="btn btn-secondary" 
//                 style={{ width: 200, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
//                 value={selectedWhId || ""}
//                 onChange={(e) => setSelectedWhId(parseInt(e.target.value))}
//               >
//                 <option value="">All Warehouses</option>
//                 {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//               </select>
//               <button className="btn btn-primary" onClick={() => { setRForm({ ...rForm, warehouse_id: selectedWhId || "" }); setShowRModal(true); }}>＋ Add New Rack</button>
//             </div>
//           </div>

//           {showRModal && (
//             <Modal
//               title="Add New Storage Rack"
//               onClose={() => setShowRModal(false)}
//               onConfirm={saveRack}
//               loading={loading}
//               confirmText="Generate Rack"
//             >
//               <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
//                 <div className="form-group">
//                   <label>Select Warehouse</label>
//                   <select value={rForm.warehouse_id} onChange={e => setRForm({...rForm, warehouse_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
//                     <option value="">Select Warehouse</option>
//                     {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//                   </select>
//                 </div>
//                 <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
//                   <div className="form-group">
//                     <label>Rack Code (e.g. R-10)</label>
//                     <input placeholder="e.g. R-5" value={rForm.rack_code} onChange={e => setRForm({...rForm, rack_code: e.target.value})} />
//                   </div>
//                   <div className="form-group">
//                     <label>Prototype Category</label>
//                     <select value={rForm.category} onChange={e => setRForm({...rForm, category: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
//                       <option value="">No Category</option>
//                       <option value="cocacola">Coca-Cola</option>
//                       <option value="chips">Chips</option>
//                       <option value="spices">Spices</option>
//                       <option value="biscuits">Biscuits</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
//                   <div className="form-group">
//                     <label>Bins to Create</label>
//                     <input type="number" min="1" max="50" value={rForm.bin_count} onChange={e => setRForm({...rForm, bin_count: parseInt(e.target.value)})} />
//                   </div>
//                   <div className="form-group">
//                     <label>Bin Capacity (kg/units)</label>
//                     <input type="number" placeholder="e.g. 5000" value={rForm.capacity} onChange={e => setRForm({...rForm, capacity: parseInt(e.target.value)})} />
//                   </div>
//                 </div>
//                 <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>Each bin will be named automatically (B-01, B-02, etc.)</div>
//               </div>
//             </Modal>
//           )}

//           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30 }}>
//             {Array.from(new Set(bins
//               .filter(b => !selectedWhId || b.warehouse_id === selectedWhId)
//               .map(b => b.rack_code)
//             )).map(rack => {
//               const firstBin = bins.find(b => b.rack_code === rack && (!selectedWhId || b.warehouse_id === selectedWhId));
//               return (
//                 <div key={rack} style={{ flex: '1 1 350px', minWidth: 350, background: 'var(--bg-surface)', padding: 20, borderRadius: 16, border: '1px solid var(--border)' }}>
//                   <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
//                     <span className="pill purple" style={{ padding: '4px 12px' }}>Rack: {rack}</span>
//                     {firstBin?.category && <span className="pill blue" style={{ padding: '4px 12px', fontSize: 10 }}>{firstBin.category.toUpperCase()}</span>}
//                     <span className="pill green" style={{ padding: '4px 12px', fontSize: 10 }}>
//                       Total: {bins.filter(b => b.rack_code === rack && (!selectedWhId || b.warehouse_id === selectedWhId)).reduce((acc, b) => acc + Number(b.product_stock || 0), 0)}
//                     </span>
//                     <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
//                     <div style={{ display: 'flex', gap: 5 }}>
//                       <button 
//                         onClick={() => { 
//                           setRackActionData(firstBin); 
//                           setNewRackName(rack); 
//                           setNewBinCount(bins.filter(b => b.rack_code === rack && (!selectedWhId || b.warehouse_id === selectedWhId)).length);
//                           setShowRackEditModal(true); 
//                         }}
//                         style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6 }}
//                       >✏️</button>
//                       <button 
//                         onClick={() => { setRackActionData(firstBin); setShowRackDeleteModal(true); }}
//                         style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6 }}
//                       >🗑️</button>
//                     </div>
//                   </div>
                
//                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
//                     {bins
//                       .filter(b => b.rack_code === rack && (!selectedWhId || b.warehouse_id === selectedWhId))
//                       .map(bin => (
//                       <div 
//                         key={bin.id} 
//                         className={`card ${bin.status === 'Occupied' ? 'occupied' : 'empty'} ${bin.status === 'Occupied' && bin.product_stock <= 5 ? 'low-stock-blink' : ''}`}
//                         style={{ 
//                           padding: 12, 
//                           border: '1px solid var(--border)', 
//                           background: bin.status === 'Occupied' ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-surface)',
//                           cursor: 'pointer',
//                           transition: 'all 0.2s',
//                           borderRadius: 12,
//                           position: 'relative'
//                         }}
//                         onClick={() => {
//                           setTForm({ ...tForm, to_bin_id: bin.id, to_warehouse_id: bin.warehouse_id });
//                           setShowTModal(true);
//                         }}
//                       >
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
//                           <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{bin.bin_code}</div>
//                           <div 
//                             className={`status-dot ${bin.status !== 'Empty' ? 'active' : ''}`} 
//                             style={{ 
//                               width: 8, 
//                               height: 8, 
//                               borderRadius: '50%', 
//                               background: bin.status === 'Occupied' ? '#10b981' : bin.status === 'Reserved' ? '#f59e0b' : '#cbd5e1' 
//                             }}
//                           ></div>
//                         </div>
                        
//                         {bin.status !== 'Empty' ? (
//                           <>
//                             <div style={{ fontSize: 13, fontWeight: 700, color: bin.status === 'Occupied' ? 'var(--accent-1)' : '#f59e0b', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                               {bin.product_name || "Reserved Item"}
//                             </div>
//                             <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>
//                               {bin.status === 'Reserved' ? `Allocated: ${bin.product_stock}` : `Stock: ${bin.product_stock}`}
//                               <span style={{ opacity: 0.5, fontWeight: 400, marginLeft: 4 }}>/ {bin.capacity} {bin.uom || ''}</span>
//                             </div>
//                             <div style={{ fontSize: 9, marginTop: 4, color: 'var(--text-muted)', fontWeight: 600 }}>{bin.status.toUpperCase()}</div>
//                           </>
//                         ) : (
//                           <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
//                             <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty - Assign Item</div>
//                             <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>Cap: {bin.capacity} units</div>
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           {showRackEditModal && (
//             <Modal title="Configure Rack" onClose={() => setShowRackEditModal(false)} onConfirm={handleRackUpdate} loading={loading} confirmText="Save Changes">
//               <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
//                 <div className="form-group">
//                   <label>Rack Code / Name</label>
//                   <input value={newRackName} onChange={e => setNewRackName(e.target.value)} />
//                 </div>
//                 <div className="form-group">
//                   <label>Total Bins in Rack</label>
//                   <input type="number" min="1" max="50" value={newBinCount} onChange={e => setNewBinCount(parseInt(e.target.value))} />
//                   <p style={{ fontSize: 10, marginTop: 5, color: 'var(--text-muted)' }}>Increasing the count will add new bins. Decreasing will remove empty trailing bins.</p>
//                 </div>
//               </div>
//             </Modal>
//           )}

//           {showRackDeleteModal && (
//             <Modal title="Delete Rack" type="danger" onClose={() => setShowRackDeleteModal(false)} onConfirm={handleRackDelete} loading={loading} confirmText="Delete Rack">
//               <p>Are you sure you want to delete <strong>Rack {rackActionData?.rack_code}</strong>?</p>
//               <p style={{ fontSize: 12, marginTop: 10, opacity: 0.7 }}>This will remove all bins in this rack. You can only delete empty racks.</p>
//             </Modal>
//           )}
//         </>
//       )}

//       {tab === "movements" && (
//         <>
//           <div className="section-header" style={{ marginBottom: 24 }}>
//             <div className="section-title">Internal Stock Transfers</div>
//             <button className="btn btn-primary" onClick={() => setShowTModal(true)}>＋ Record Movement</button>
//           </div>

//           {showTModal && (
//             <Modal title="Record Stock Movement" onClose={() => setShowTModal(false)} onConfirm={createTransfer} loading={loading}>
//               <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
//                 <div className="form-group">
//                   <label>Product</label>
//                   <select value={tForm.product_id} onChange={e => setTForm({...tForm, product_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
//                     <option value="">Select Item</option>
//                     {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.stock})</option>)}
//                   </select>
//                 </div>
//                 <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
//                   <div className="form-group">
//                     <label>From Warehouse</label>
//                     <select value={tForm.from_warehouse_id} onChange={e => setTForm({...tForm, from_warehouse_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
//                       <option value="">Select Origin</option>
//                       {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//                     </select>
//                   </div>
//                   <div className="form-group">
//                     <label>To Warehouse</label>
//                     <select value={tForm.to_warehouse_id} onChange={e => setTForm({...tForm, to_warehouse_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
//                       <option value="">Select Destination</option>
//                       {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
//                   <div className="form-group">
//                     <label>Target Rack / Bin</label>
//                     <select disabled={!tForm.to_warehouse_id} value={tForm.to_bin_id} onChange={e => setTForm({...tForm, to_bin_id: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
//                       <option value="">Select Bin</option>
//                       {bins.filter(b => b.warehouse_id === parseInt(tForm.to_warehouse_id)).map(b => (
//                         <option key={b.id} value={b.id}>{b.rack_code} · {b.bin_code} ({b.status})</option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="form-group">
//                     <label>Quantity</label>
//                     <input type="number" value={tForm.quantity} onChange={e => setTForm({...tForm, quantity: e.target.value})} />
//                   </div>
//                 </div>

//                 <div className="form-group">
//                   <label>Reason</label>
//                   <input value={tForm.reason} onChange={e => setTForm({...tForm, reason: e.target.value})} placeholder="e.g. Weekly replenishment" />
//                 </div>
//               </div>
//             </Modal>
//           )}

//           <div className="card">
//             <div className="table-wrap">
//               <table>
//                 <thead><tr><th>Date</th><th>Item</th><th>From</th><th>To (WH / Bin)</th><th>Qty</th><th>Reason</th></tr></thead>
//                 <tbody>
//                   {movements.map(m => (
//                     <tr key={m.id}>
//                       <td>{new Date(m.movement_date).toLocaleDateString()}</td>
//                       <td style={{ fontWeight: 600 }}>{m.product_name}</td>
//                       <td><span className="pill yellow">{m.from_warehouse || "External"}</span></td>
//                       <td>
//                         <div style={{ fontWeight: 600 }}>{m.to_warehouse}</div>
//                         {m.to_rack && <div style={{ fontSize: 10, opacity: 0.6 }}>Rack: {m.to_rack} · Bin: {m.to_bin}</div>}
//                       </td>
//                       <td style={{ fontWeight: 700 }}>{m.quantity}</td>
//                       <td style={{ fontSize: 12, opacity: 0.7 }}>{m.reason}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }



import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  Grid,
  PerspectiveCamera,
} from "@react-three/drei";

/* ---------------------- dummy warehouse data ---------------------- */

const warehouseData = [
  {
    rackId: "R-BISCUITS",
    name: "Rack R-BISCUITS",
    position: [-10, 0, -4],
    colorTag: "#2563eb",
    bins: [
      { id: "B-01", item: "Biscuits", capacity: 5000, quantity: 4500, status: "full" },
      { id: "B-02", item: "Biscuits", capacity: 5000, quantity: 700, status: "low" },
      { id: "B-03", item: "", capacity: 5000, quantity: 0, status: "empty" },
      { id: "B-04", item: "Biscuits", capacity: 5000, quantity: 1300, status: "new" },
      { id: "B-05", item: "", capacity: 5000, quantity: 0, status: "empty" },
    ],
  },
  {
    rackId: "R-CHIPS",
    name: "Rack R-CHIPS",
    position: [-3, 0, -4],
    colorTag: "#22c55e",
    bins: [
      { id: "B-01", item: "Chips", capacity: 5000, quantity: 0, status: "empty" },
      { id: "B-02", item: "Chips", capacity: 5000, quantity: 5000, status: "full" },
      { id: "B-03", item: "Chips", capacity: 5000, quantity: 1200, status: "new" },
      { id: "B-04", item: "Chips", capacity: 5000, quantity: 300, status: "low" },
      { id: "B-05", item: "", capacity: 5000, quantity: 0, status: "empty" },
    ],
  },
  {
    rackId: "R-COCACOLA",
    name: "Rack R-COCACOLA",
    position: [4, 0, -4],
    colorTag: "#f97316",
    bins: [
      { id: "B-01", item: "CocaCola", capacity: 5000, quantity: 2300, status: "reserved" },
      { id: "B-02", item: "", capacity: 5000, quantity: 0, status: "empty" },
      { id: "B-03", item: "CocaCola", capacity: 5000, quantity: 1700, status: "normal" },
      { id: "B-04", item: "CocaCola", capacity: 5000, quantity: 4900, status: "full" },
      { id: "B-05", item: "", capacity: 5000, quantity: 0, status: "empty" },
    ],
  },
  {
    rackId: "R-SPICES",
    name: "Rack R-SPICES",
    position: [11, 0, -4],
    colorTag: "#8b5cf6",
    bins: [
      { id: "B-01", item: "Spices", capacity: 5000, quantity: 1300, status: "reserved" },
      { id: "B-02", item: "", capacity: 5000, quantity: 0, status: "empty" },
      { id: "B-03", item: "Spices", capacity: 5000, quantity: 600, status: "low" },
      { id: "B-04", item: "Spices", capacity: 5000, quantity: 3600, status: "normal" },
      { id: "B-05", item: "", capacity: 5000, quantity: 0, status: "empty" },
    ],
  },
];

/* ---------------------- helpers ---------------------- */

const getStatusColor = (status) => {
  switch (status) {
    case "new":
      return "#3b82f6"; // blue
    case "low":
      return "#f59e0b"; // orange
    case "empty":
      return "#d1d5db"; // gray
    case "reserved":
      return "#a855f7"; // purple
    case "full":
      return "#16a34a"; // green
    case "normal":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
};

const getFillRatio = (quantity, capacity) => {
  if (!capacity) return 0;
  return Math.max(0, Math.min(quantity / capacity, 1));
};

const formatQty = (num) => {
  return Number(num || 0).toLocaleString("en-IN");
};

/* ---------------------- 3d bin ---------------------- */

function Bin3D({ bin, position, onSelect, selected }) {
  const fillRatio = getFillRatio(bin.quantity, bin.capacity);
  const fillHeight = Math.max(fillRatio * 1.8, bin.quantity > 0 ? 0.08 : 0);
  const statusColor = getStatusColor(bin.status);

  return (
    <group position={position}>
      {/* outer slot */}
      <mesh
        onClick={() => onSelect(bin)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.8, 2, 1.8]} />
        <meshStandardMaterial
          color={selected ? "#0f172a" : "#e5e7eb"}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* stock fill */}
      {bin.quantity > 0 ? (
        <mesh position={[0, -1 + fillHeight / 2, 0]} castShadow>
          <boxGeometry args={[1.5, fillHeight, 1.5]} />
          <meshStandardMaterial color={statusColor} />
        </mesh>
      ) : null}

      {/* top marker */}
      <mesh position={[0.65, 0.8, 0.65]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={statusColor} />
      </mesh>

      {/* label */}
    <Html position={[0, 1.35, 0]} center>
  <div
    style={{
      background: "rgba(255,255,255,0.9)",
      color: "#111827",
      padding: "2px 6px",
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 800,
      whiteSpace: "nowrap",
      border: "1px solid #e5e7eb",
    }}
  >
    {bin.id}
  </div>
</Html>
    </group>
  );
}

/* ---------------------- 3d rack ---------------------- */

function Rack3D({ rack, onSelectBin, selectedBin }) {
  const columns = 2;
  const rowGap = 2.5;
  const colGap = 2.4;

  return (
    <group position={rack.position}>
      {/* rack base */}
      <mesh position={[0.8, -1.2, 2.5]} receiveShadow>
        <boxGeometry args={[6.2, 0.2, 8.2]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* rack pillars */}
      {[
        [-2.2, 1, -1],
        [3.8, 1, -1],
        [-2.2, 1, 6],
        [3.8, 1, 6],
      ].map((pillar, idx) => (
        <mesh key={idx} position={pillar} castShadow>
          <boxGeometry args={[0.15, 4.5, 0.15]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}

      {/* rack title */}
      <Html position={[0.8, 4.2, 2.5]} center>
  <div
    style={{
      background: "#ffffff",
      color: rack.colorTag,
      padding: "4px 10px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap",
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      border: "1px solid #e5e7eb",
    }}
  >
    {rack.name}
  </div>
</Html>

      {/* bins */}
      {rack.bins.map((bin, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;

        const x = col * colGap - 1.2;
        const z = row * rowGap;
        const y = 0;

        const isSelected = selectedBin?.id === bin.id && selectedBin?.rackId === rack.rackId;

        return (
          <Bin3D
            key={bin.id}
            bin={{ ...bin, rackId: rack.rackId, rackName: rack.name }}
            position={[x, y, z]}
            onSelect={onSelectBin}
            selected={isSelected}
          />
        );
      })}
    </group>
  );
}

/* ---------------------- scene extras ---------------------- */

function WarehouseFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 25]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      <Grid
        position={[0, 0.01, 0]}
        args={[40, 25]}
        cellSize={1}
        cellThickness={0.6}
        sectionSize={5}
        sectionThickness={1}
        fadeDistance={50}
        fadeStrength={1}
        cellColor="#d1d5db"
        sectionColor="#94a3b8"
      />
    </group>
  );
}

function WarehouseLights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[12, 16, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 8, -5]} intensity={0.5} />
      <pointLight position={[10, 8, 5]} intensity={0.5} />
    </>
  );
}

/* ---------------------- info panel ---------------------- */

function InfoPanel({ selectedBin }) {
  return (
    <div
      style={{
        width: 320,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 14, fontSize: 18 }}>Selected Bin Info</h3>

      {selectedBin ? (
        <div style={{ display: "grid", gap: 10 }}>
          <InfoRow label="Rack" value={selectedBin.rackName} />
          <InfoRow label="Bin" value={selectedBin.id} />
          <InfoRow label="Item" value={selectedBin.item || "Empty"} />
          <InfoRow label="Quantity" value={formatQty(selectedBin.quantity)} />
          <InfoRow label="Capacity" value={formatQty(selectedBin.capacity)} />
          <InfoRow label="Status" value={selectedBin.status} />
          <InfoRow
            label="Fill %"
            value={`${Math.round(
              getFillRatio(selectedBin.quantity, selectedBin.capacity) * 100
            )}%`}
          />
        </div>
      ) : (
        <p style={{ margin: 0, color: "#6b7280" }}>
          Click any 3D bin to see details.
        </p>
      )}

      <div style={{ marginTop: 18 }}>
        <h4 style={{ margin: "0 0 10px", fontSize: 14 }}>Legend</h4>
        <LegendItem color="#3b82f6" label="New Stock" />
        <LegendItem color="#f59e0b" label="Low Stock" />
        <LegendItem color="#d1d5db" label="Empty Stock" />
        <LegendItem color="#a855f7" label="Reserved Stock" />
        <LegendItem color="#16a34a" label="Full Stock" />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: "#6b7280", fontSize: 14 }}>{label}</span>
      <strong style={{ color: "#111827", fontSize: 14 }}>{value}</strong>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
    </div>
  );
}

/* ---------------------- main component ---------------------- */

export default function Warehouse3DView() {
  const [selectedBin, setSelectedBin] = useState(null);

  const stats = useMemo(() => {
    const allBins = warehouseData.flatMap((rack) => rack.bins);

    return {
      totalBins: allBins.length,
      empty: allBins.filter((b) => b.status === "empty").length,
      low: allBins.filter((b) => b.status === "low").length,
      newStock: allBins.filter((b) => b.status === "new").length,
      reserved: allBins.filter((b) => b.status === "reserved").length,
    };
  }, []);

  return (
    <div style={{ padding: 20, background: "#f1f5f9", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 28, color: "#111827" }}>
            Warehouse 3D Layout
          </h2>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>
            View rack positions, item placement, and live stock status in 3D.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <StatPill label="Total Bins" value={stats.totalBins} color="#2563eb" />
          <StatPill label="Low Stock" value={stats.low} color="#f59e0b" />
          <StatPill label="Empty" value={stats.empty} color="#64748b" />
          <StatPill label="New Stock" value={stats.newStock} color="#3b82f6" />
          <StatPill label="Reserved" value={stats.reserved} color="#a855f7" />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            minHeight: 700,
          }}
        >
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={45} />
            <WarehouseLights />
            <WarehouseFloor />

            {warehouseData.map((rack) => (
              <Rack3D
                key={rack.rackId}
                rack={rack}
                onSelectBin={setSelectedBin}
                selectedBin={selectedBin}
              />
            ))}

            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={8}
              maxDistance={45}
              maxPolarAngle={Math.PI / 2.1}
            />
          </Canvas>
        </div>

        <InfoPanel selectedBin={selectedBin} />
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 999,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ color: "#64748b" }}>{label}:</span>
      <strong style={{ color: "#111827" }}>{value}</strong>
    </div>
  );
}
