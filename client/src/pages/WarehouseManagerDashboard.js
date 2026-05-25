import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Grid, PerspectiveCamera, PivotControls } from "@react-three/drei";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { API } from "../config";
import Modal from "../components/Modal";

/* ---------------------- Map helpers ---------------------- */

function warehouseIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">🏢</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function vehicleIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🚛</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    // Filter out any positions with invalid coordinates
    const valid = positions.filter(p => p && p.length === 2 && isFinite(p[0]) && isFinite(p[1]));
    if (valid.length >= 2) {
      map.fitBounds(valid, { padding: [50, 50], maxZoom: 12 });
    } else if (valid.length === 1) {
      map.setView(valid[0], 11);
    }
  }, [map, positions]);
  return null;
}

/* ---------------------- Helpers ---------------------- */

const getStatusColor = (ratio) => {
  if (ratio <= 0) return "#94a3b8"; 
  if (ratio <= 0.25) return "#ef4444"; 
  if (ratio <= 0.5) return "#f59e0b"; 
  return "#22c55e"; 
};

const calculateGeo = (baseLat, baseLng, offset) => {
  if (!baseLat || !baseLng) return { lat: "-", lng: "-" };
  const latMeters = 111111;
  const lngMeters = 111111 * Math.cos(baseLat * Math.PI / 180);
  const newLat = baseLat - (offset[2] / latMeters);
  const newLng = baseLng + (offset[0] / lngMeters);
  return { lat: newLat.toFixed(7), lng: newLng.toFixed(7) };
};

/* ---------------------- 2D Floor Plan Component ---------------------- */

function WarehouseFloorPlan({ warehouseName, targetBinIds = new Set(["R-B1", "R-B2"]) }) {
  const OFFSET_X = 100;
  const OFFSET_Y = 100;

  const warehouseLayout = useMemo(() => {
    const racks = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const code = `R-${String.fromCharCode(65 + r)}${c + 1}`;
        const isTarget = targetBinIds.has(code);
        racks.push({ code, x: c * 100 + OFFSET_X, y: r * 70 + OFFSET_Y, isTarget });
      }
    }
    return racks;
  }, [targetBinIds]);

  const walkingPath = useMemo(() => {
    const points = [[50, 420]]; 
    ["R-B1", "R-B2"].forEach(code => {
      const rack = warehouseLayout.find(r => r.code === code);
      if (rack) points.push([rack.x + 25, rack.y + 35]);
    });
    points.push([550, 50]);
    return points;
  }, [warehouseLayout]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>📍 Spatial Logistics — {warehouseName}</h4>
        <div style={{ display: "flex", gap: 12 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700 }}><span style={{ width: 10, height: 10, background: "#2563eb", borderRadius: 2 }}></span> TARGET</div>
           <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700 }}><span style={{ width: 10, height: 10, background: "#e2e8f0", borderRadius: 2 }}></span> STORAGE</div>
        </div>
      </div>

      <div style={{ background: "#f8fafc", height: 500, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 16, right: 16, width: 220, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", padding: 18, borderRadius: 20, border: "1px solid rgba(0,0,0,0.05)", zIndex: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
           <div style={{ fontSize: 11, fontWeight: 800, color: "#6366f1", marginBottom: 8, letterSpacing: 0.5 }}>OPERATIONAL GUIDANCE</div>
           <div style={{ fontSize: 12, lineHeight: 1.5, color: "#475569" }}>
             Follow the <strong style={{ color: "#f97316" }}>orange path</strong>. Pick items sequentially from highlighted racks.
           </div>
           <div style={{ marginTop: 12, pt: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#94a3b8" }}>EST. TIME</div><div style={{ fontSize: 13, fontWeight: 700 }}>4.5m</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#94a3b8" }}>DISTANCE</div><div style={{ fontSize: 13, fontWeight: 700 }}>120m</div></div>
           </div>
        </div>

        <svg width="100%" height="100%" viewBox="0 0 600 500">
          <defs>
            <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.02)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#floor-grid)" />
          <rect x="20" y="20" width="560" height="460" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 4" opacity="0.2" />

          <g>
             <circle cx="50" cy="420" r="14" fill="#22c55e" stroke="white" strokeWidth="3" />
             <text x="50" y="445" textAnchor="middle" fontSize="9" fontWeight="800" fill="#166534">LOADING DOCK</text>
          </g>

          {walkingPath.length > 1 && (
            <polyline points={walkingPath.map(p => p.join(",")).join(" ")} fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="10 6" strokeLinecap="round" />
          )}

          {warehouseLayout.map((rack) => (
            <g key={rack.code}>
              <rect x={rack.x} y={rack.y} width="55" height="38" rx="8" fill={rack.isTarget ? "#2563eb" : "#ffffff"} stroke={rack.isTarget ? "#1d4ed8" : "#e2e8f0"} strokeWidth={rack.isTarget ? "2" : "1"} style={{ filter: rack.isTarget ? "drop-shadow(0 6px 12px rgba(37,99,235,0.4))" : "none" }} />
              <text x={rack.x + 27} y={rack.y + 24} textAnchor="middle" fontSize="9" fontWeight="900" fill={rack.isTarget ? "white" : "#94a3b8"}>{rack.code}</text>
              {rack.isTarget && (
                <circle cx={rack.x + 55} cy={rack.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ---------------------- 3D Components ---------------------- */

function Bin3D({ bin, position, onSelect, selected, hideLabels, selectedBin }) {
  const stock = bin.stock || 0;
  const capacity = bin.capacity || 5000;
  const fillRatio = Math.max(0, Math.min(stock / capacity, 1));
  const fillHeight = Math.max(fillRatio * 1.5, stock > 0 ? 0.05 : 0);
  const statusColor = getStatusColor(fillRatio);
  const isLow = fillRatio > 0 && fillRatio <= 0.25;

  const contentRef = React.useRef();
  useFrame((state) => {
    if (isLow && contentRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      contentRef.current.scale.set(s, s, s);
    }
  });

  const isDimmed = selectedBin && selectedBin.id !== bin.id;

  return (
    <group position={position}>
      {/* Bin Outer Shell */}
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(bin); }} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.2, 1.6]} />
        <meshStandardMaterial color={selected ? "#2563eb" : "#cbd5e1"} metalness={0.2} roughness={0.5} transparent opacity={isDimmed ? 0.4 : 0.9} />
      </mesh>
      {/* Stock Fill */}
      {stock > 0 && (
        <mesh ref={contentRef} position={[0, -0.55 + fillHeight / 2, 0]} castShadow>
          <boxGeometry args={[1.4, fillHeight, 1.4]} />
          <meshStandardMaterial color={statusColor} emissive={isLow ? statusColor : "#000000"} emissiveIntensity={isLow ? 0.5 : 0} transparent opacity={isDimmed ? 0.3 : 1} />
        </mesh>
      )}
      {selected && !hideLabels && (
        <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ background: isLow ? "#ef4444" : "rgba(255,255,255,0.95)", color: isLow ? "white" : "#1e293b", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 900, whiteSpace: "nowrap", border: "2px solid #2563eb", boxShadow: "0 6px 15px rgba(0,0,0,0.2)" }}>
            {bin.bin_code}
          </div>
        </Html>
      )}
    </group>
  );
}

function Rack3D({ rackCode, bins, position, onSelectBin, selectedBin, hideLabels, onMove }) {
  const columns = 2;
  const levels = 4;
  const colGap = 2.5;
  const rowHeight = 2.8;
  const rackRef = React.useRef();

  const isRackFocused = !selectedBin || bins.some(b => b.id === selectedBin.id);
  const dimOpacity = 0.4;

  return (
    <group position={position}>
      <PivotControls anchor={[0, -1, 0]} depthTest={false} scale={2} lineWidth={2} fixed={true} 
        onDragEnd={() => {
          if (rackRef.current) {
            const worldPos = new THREE.Vector3();
            rackRef.current.getWorldPosition(worldPos);
            onMove(rackCode, [worldPos.x, 0, worldPos.z]);
          }
        }}
      >
        <group ref={rackRef}>
          {/* Vertical Pillars - Dim if not focused */}
          <mesh position={[-1.2, 4.3, 0]} castShadow><boxGeometry args={[0.2, 11.5, 0.2]} /><meshStandardMaterial color="#1e293b" transparent opacity={isRackFocused ? 1 : dimOpacity} /></mesh>
          <mesh position={[2.8, 4.3, 0]} castShadow><boxGeometry args={[0.2, 11.5, 0.2]} /><meshStandardMaterial color="#1e293b" transparent opacity={isRackFocused ? 1 : dimOpacity} /></mesh>
          <mesh position={[-1.2, 4.3, 2.8]} castShadow><boxGeometry args={[0.2, 11.5, 0.2]} /><meshStandardMaterial color="#1e293b" transparent opacity={isRackFocused ? 1 : dimOpacity} /></mesh>
          <mesh position={[2.8, 4.3, 2.8]} castShadow><boxGeometry args={[0.2, 11.5, 0.2]} /><meshStandardMaterial color="#1e293b" transparent opacity={isRackFocused ? 1 : dimOpacity} /></mesh>

          {/* Horizontal Beams */}
          {[0, 1, 2, 3, 4].map(l => (
            <group key={l} position={[0, l * rowHeight - 1, 1.4]}>
               <mesh position={[0.8, 0, -1.4]} castShadow><boxGeometry args={[4.2, 0.15, 0.2]} /><meshStandardMaterial color="#334155" transparent opacity={isRackFocused ? 1 : dimOpacity} /></mesh>
               <mesh position={[0.8, 0, 1.4]} castShadow><boxGeometry args={[4.2, 0.15, 0.2]} /><meshStandardMaterial color="#334155" transparent opacity={isRackFocused ? 1 : dimOpacity} /></mesh>
               <mesh position={[0.8, -0.05, 0]} receiveShadow><boxGeometry args={[4, 0.05, 2.8]} /><meshStandardMaterial color="#475569" transparent opacity={isRackFocused ? 0.5 : dimOpacity} /></mesh>
            </group>
          ))}

          {isRackFocused && !hideLabels && (
            <Html position={[0.8, 11.2, 1.4]} center style={{ pointerEvents: 'none' }}>
              <div style={{ background: "#ffffff", color: "#2563eb", padding: "4px 14px", borderRadius: 10, fontSize: 13, fontWeight: 900, boxShadow: "0 8px 20px rgba(0,0,0,0.2)", border: "2px solid #2563eb", whiteSpace: "nowrap" }}>
                RACK {rackCode}
              </div>
            </Html>
          )}

          {bins.map((bin, index) => {
            const level = Math.floor(index / columns);
            const col = index % columns;
            // Limit to 2 levels for visual clarity in this layout
            if (level >= levels) return null;
            
            return <Bin3D 
              key={bin.id} 
              bin={bin} 
              position={[col * colGap - 0.4, level * rowHeight - 0.4, 1.4]} 
              onSelect={onSelectBin} 
              selected={selectedBin?.id === bin.id} 
              hideLabels={hideLabels} 
              selectedBin={selectedBin}
            />;
          })}
        </group>
      </PivotControls>
    </group>
  );
}

function WarehouseFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.21, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.05} roughness={0.7} />
      </mesh>
      {/* Decorative Floor Markings */}
      <Grid position={[0, -1.2, 0]} args={[200, 200]} cellSize={2} sectionSize={10} cellColor="#e2e8f0" sectionColor="#cbd5e1" fadeDistance={150} />
    </group>
  );
}

function WarehouseStructure() {
  return (
    <group>
      {/* Back Wall */}
      <mesh position={[0, 15, -100]} receiveShadow>
        <boxGeometry args={[200, 35, 2]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.15} />
      </mesh>
      {/* Side Walls */}
      <mesh position={[-100, 15, 0]} receiveShadow>
        <boxGeometry args={[2, 35, 200]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.15} />
      </mesh>
      <mesh position={[100, 15, 0]} receiveShadow>
        <boxGeometry args={[2, 35, 200]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

/* ---------------------- Main Dashboard Page ---------------------- */

export default function WarehouseManagerDashboard({ products: allProducts, push, user }) {
  const [activeTab, setActiveTab] = useState("3d-view");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedBin, setSelectedBin] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRackModal, setShowRackModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  
  const [warehouses, setWarehouses] = useState([]);
  const [bins, setBins] = useState([]);
  const [rackPositions, setRackPositions] = useState({});
  const [cityPresets, setCityPresets] = useState({});
  const [fleet, setFleet] = useState([]);

  // Barcode Scanning
  const [scanQuery, setScanQuery] = useState("");
  const [scanResult, setScanResult] = useState(null);

  // Forms
  const [prodForm, setProdForm] = useState({ name: "", price: "", barcode: "", stock: 0, warehouse_id: "", bin_id: "" });
  const [rackForm, setRackForm] = useState({ warehouse_id: "", rack_code: "", bin_count: 4 });
  const [warehouseForm, setWarehouseForm] = useState({ name: "", city: "London" });

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const [wRes, bRes, pRes, cRes, fRes] = await Promise.all([
        axios.get(`${API}/warehouse`, { headers }),
        axios.get(`${API}/warehouse/bins`, { headers }),
        axios.get(`${API}/warehouse/rack-positions`, { headers }),
        axios.get(`${API}/warehouse/city-presets`, { headers }),
        axios.get(`${API}/transport/vehicles`, { headers })
      ]);
      setWarehouses(wRes.data);
      setBins(bRes.data);
      setRackPositions(pRes.data);
      setCityPresets(cRes.data);
      setFleet(fRes.data);
      if (wRes.data.length > 0 && !selectedWarehouseId) setSelectedWarehouseId(wRes.data[0].id);
    } catch (err) { console.error("Data fetch failed", err); }
  }, [selectedWarehouseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentWarehouse = useMemo(() => warehouses.find(w => String(w.id) === String(selectedWarehouseId)), [warehouses, selectedWarehouseId]);

  const rackGroups = useMemo(() => {
    const groups = {};
    const filteredBins = bins.filter(b => String(b.warehouse_id) === String(selectedWarehouseId));
    filteredBins.forEach(bin => {
      if (!groups[bin.rack_code]) groups[bin.rack_code] = [];
      const product = allProducts.find(p => p.bin_id === bin.id);
      const rackPos = rackPositions[bin.rack_code] || [0, 0, 0];
      const geo = currentWarehouse ? calculateGeo(currentWarehouse.lat, currentWarehouse.lng, rackPos) : { lat: "-", lng: "-" };
      
      // FIX: Use bin's own seeded data if no linked product is found in the global list
      const finalName = product?.name || bin.product_name || "Assorted Goods";
      const finalStock = product?.stock !== undefined ? product.stock : (bin.stock || 0);

      groups[bin.rack_code].push({ 
        ...bin, 
        product_name: finalName, 
        stock: finalStock, 
        capacity: bin.capacity || 5000, 
        geo_lat: geo.lat, 
        geo_lng: geo.lng 
      });
    });
    return groups;
  }, [bins, allProducts, rackPositions, currentWarehouse, selectedWarehouseId]);

  const handleBarcodeScan = async (e) => {
    if (e && e.key !== "Enter") return;
    if (!scanQuery) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.get(`${API}/inventory/lookup`, { params: { barcode: scanQuery }, headers });
      if (res.data) {
        setScanResult(res.data);
        setShowScanModal(true);
        if (res.data.type === "bin") {
          setSelectedWarehouseId(res.data.warehouse_id || selectedWarehouseId);
          const binObj = bins.find(b => b.id === res.data.id);
          if (binObj) setSelectedBin(binObj);
        }
      } else push("No data found", "error");
    } catch { push("Scan failed", "error"); } finally { setLoading(false); setScanQuery(""); }
  };

  const handleUpdateRackPosition = async (rackCode, position) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/warehouse/rack-positions`, { rackCode, position }, { headers });
      setRackPositions(prev => ({ ...prev, [rackCode]: position }));
    } catch (err) { console.error("Failed to save rack position", err); }
  };

  const handleAddWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.city) return push("Missing fields", "error");
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.post(`${API}/warehouse`, warehouseForm, { headers });
      push(`Warehouse ${warehouseForm.name} created!`);
      setShowWarehouseModal(false);
      fetchData();
      setSelectedWarehouseId(res.data.id);
    } catch { push("Failed", "error"); } finally { setLoading(false); }
  };

  const handleSaveProduct = async () => {
    if (!prodForm.name || !prodForm.price) return push("Missing fields", "error");
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/inventory/products`, prodForm, { headers });
      push("Inventory updated!");
      setShowAddModal(false);
      fetchData();
    } catch { push("Failed", "error"); } finally { setLoading(false); }
  };

  const handleAddRack = async () => {
    if (!rackForm.warehouse_id || !rackForm.rack_code) return push("Missing fields", "error");
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/warehouse/bins/bulk`, rackForm, { headers });
      push(`Rack ${rackForm.rack_code} created!`);
      setShowRackModal(false);
      fetchData();
    } catch { push("Error", "error"); } finally { setLoading(false); }
  };

  const handleBinSelect = (bin) => {
    setSelectedBin(bin);
    setProdForm(prev => ({ ...prev, bin_id: bin.id, warehouse_id: bin.warehouse_id, name: bin.product_name || prev.name, stock: bin.stock || 0 }));
  };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div><div className="section-title">Warehouse Manager Command Center</div><div style={{ fontSize: 12, opacity: 0.6 }}>Manage real-time inventory and spatial logistics</div></div>
          <div style={{ background: "white", padding: "6px 12px", borderRadius: 12, border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
             <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>📍 SITE:</span>
             <select value={selectedWarehouseId} onChange={(e) => { setSelectedWarehouseId(e.target.value); setSelectedBin(null); }} style={{ border: "none", outline: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", background: "transparent" }}>
               {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
             </select>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", width: 240 }}>
             <span style={{ position: "absolute", left: 12, fontSize: 16 }}>🔍</span>
             <input value={scanQuery} onChange={(e) => setScanQuery(e.target.value)} onKeyDown={handleBarcodeScan} placeholder="Scan Barcode (Enter)..." style={{ width: "100%", padding: "10px 12px 10px 40px", borderRadius: 12, border: "1px solid var(--border)", fontSize: 13, background: "#f8fafc" }} />
             <div style={{ position: "absolute", right: 10, fontSize: 10, opacity: 0.4, border: "1px solid #cbd5e1", padding: "2px 4px", borderRadius: 4 }}>SCANNER</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
           <button className="btn btn-secondary" onClick={() => { if(window.confirm("Reset mock data?")) { localStorage.removeItem("prototype_mock_state_v1"); window.location.reload(); } }}>🔄 Reset</button>
           <button className="btn btn-secondary" onClick={() => setShowWarehouseModal(true)}>🏢 Add Warehouse</button>
           <button className="btn btn-secondary" onClick={() => setShowRackModal(true)}>🏗️ New Rack</button>
           <button className="btn btn-primary" onClick={() => { setProdForm({ name: "", price: "", barcode: "", stock: 0, warehouse_id: selectedWarehouseId, bin_id: "" }); setShowAddModal(true); }}>＋ Add Product</button>
        </div>
      </div>

      <div className="login-tab-row" style={{ marginBottom: 20, justifyContent: "flex-start", gap: 10 }}>
        <button className={`login-tab ${activeTab === "3d-view" ? "active" : ""}`} onClick={() => setActiveTab("3d-view")}>3D Spatial View</button>
        <button className={`login-tab ${activeTab === "layout-map" ? "active" : ""}`} onClick={() => setActiveTab("layout-map")}>Top View</button>
        <button className={`login-tab ${activeTab === "geo-sync" ? "active" : ""}`} onClick={() => setActiveTab("geo-sync")}>Geo-Sync Tracking</button>
        <button className={`login-tab ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>Inventory List</button>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {activeTab === "3d-view" && (
          <div style={{ display: "flex", height: "100%", gap: 20 }}>
            <div style={{ flex: 1, background: "#f8fafc", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", position: "relative" }}>
              <Canvas shadows camera={{ position: [50, 50, 70], fov: 45 }}>
                <fog attach="fog" args={["#f8fafc", 60, 180]} />
                <PerspectiveCamera makeDefault position={[50, 50, 70]} />
                <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.1} minDistance={10} maxDistance={200} />
                <ambientLight intensity={0.8} />
                <pointLight position={[0, 50, 0]} intensity={1.2} />
                <directionalLight position={[50, 50, 50]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
                
                <WarehouseFloor />
                <WarehouseStructure />

                {Object.keys(rackGroups).map((code, idx) => {
                  const savedPos = rackPositions[code] || [(idx % 5) * 15 - 30, 0, Math.floor(idx / 5) * 12 - 20];
                  return <Rack3D key={code} rackCode={code} bins={rackGroups[code]} position={savedPos} onSelectBin={handleBinSelect} selectedBin={selectedBin} hideLabels={showAddModal || showRackModal || showWarehouseModal || showScanModal} onMove={handleUpdateRackPosition} />;
                })}
              </Canvas>
              <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(255,255,255,0.8)", padding: "10px 15px", borderRadius: 12, fontSize: 11, pointerEvents: "none", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>📍 Site Geolocation</div>
                <div>{currentWarehouse?.name}: {currentWarehouse?.lat}, {currentWarehouse?.lng}</div>
              </div>
            </div>
            <div style={{ width: 320, background: "white", borderRadius: 20, border: "1px solid var(--border)", padding: 20, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "var(--accent)" }}>Spatial Intelligence</div>
              {selectedBin ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  <div className="stat-card c2" style={{ padding: 12 }}><div style={{ fontSize: 10, opacity: 0.6 }}>LOCATOR</div><div style={{ fontWeight: 700 }}>{selectedBin.rack_code} / {selectedBin.bin_code}</div></div>
                  <div style={{ background: "#f8fafc", padding: 15, borderRadius: 16, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                       <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b" }}>STOCK LEVEL</div>
                       <div style={{ fontSize: 10, fontWeight: 800, color: getStatusColor(selectedBin.stock / (selectedBin.capacity || 5000)) }}>{Math.round((selectedBin.stock / (selectedBin.capacity || 5000)) * 100)}% {selectedBin.stock / (selectedBin.capacity || 5000) <= 0.25 ? "🚨 LOW" : "✅ STABLE"}</div>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${(selectedBin.stock / (selectedBin.capacity || 5000)) * 100}%`, height: "100%", background: getStatusColor(selectedBin.stock / (selectedBin.capacity || 5000)), transition: "width 0.5s ease" }} /></div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, border: "1px solid #f1f5f9" }}><div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>🛰️ GPS Coordinates</div><div style={{ fontSize: 12, fontFamily: "monospace" }}>Lat: {selectedBin.geo_lat || selectedBin.lat}</div><div style={{ fontSize: 12, fontFamily: "monospace" }}>Lng: {selectedBin.geo_lng || selectedBin.lng}</div></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><div style={{ background: "#f1f5f9", padding: 10, borderRadius: 10 }}><div style={{ fontSize: 9, opacity: 0.6 }}>ITEM</div><div style={{ fontWeight: 600, fontSize: 12 }}>{selectedBin.product_name || "Assorted Goods"}</div></div><div style={{ background: "#f1f5f9", padding: 10, borderRadius: 10 }}><div style={{ fontSize: 9, opacity: 0.6 }}>STOCK</div><div style={{ fontWeight: 600, fontSize: 12 }}>{selectedBin.stock} units</div></div></div>
                  <button className="btn btn-secondary" style={{ marginTop: 10, width: "100%" }} onClick={() => setShowAddModal(true)}>Modify Stock</button>
                </div>
              ) : (<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", color: "#94a3b8" }}><div style={{ fontSize: 40, marginBottom: 10 }}>🛰️</div><div style={{ fontSize: 12 }}>Select a bin to see its precise global GPS coordinates</div></div>)}
            </div>
          </div>
        )}

        {activeTab === "layout-map" && (
          <div className="fade-up" style={{ height: "100%" }}>
            <WarehouseFloorPlan warehouseName={currentWarehouse?.name} />
          </div>
        )}

        {activeTab === "geo-sync" && (() => {
          // Only work with warehouses that have valid GPS coordinates
          const validWarehouses = warehouses.filter(w => w && isFinite(Number(w.lat)) && isFinite(Number(w.lng)));

          // Compute warehouse stats for map popups
          const whStats = validWarehouses.map(wh => {
            const whBins = bins.filter(b => String(b.warehouse_id) === String(wh.id));
            const whProducts = (allProducts || []).filter(p => String(p.warehouse_id) === String(wh.id));
            const totalStock = whProducts.reduce((s, p) => s + (p.stock || 0), 0);
            const totalCapacity = whBins.reduce((s, b) => s + (b.capacity || 5000), 0);
            const fillPct = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
            const productCount = whProducts.length;
            const rackCount = [...new Set(whBins.map(b => b.rack_code))].length;
            const lowStockItems = whProducts.filter(p => { const bin = whBins.find(b => b.id === p.bin_id); return bin && p.stock / (bin.capacity || 5000) <= 0.25; }).length;
            return { ...wh, lat: Number(wh.lat), lng: Number(wh.lng), totalStock, totalCapacity, fillPct, productCount, rackCount, binCount: whBins.length, lowStockItems };
          });

          // Simulate fleet vehicle positions (midpoint between warehouses)
          const activeVehicles = fleet.filter(v => v.status === "On Trip");
          const vehiclePositions = activeVehicles.map((v, i) => {
            if (validWarehouses.length >= 2) {
              const from = validWarehouses[i % validWarehouses.length];
              const to = validWarehouses[(i + 1) % validWarehouses.length];
              const progress = 0.3 + Math.random() * 0.4;
              return { ...v, lat: Number(from.lat) + (Number(to.lat) - Number(from.lat)) * progress, lng: Number(from.lng) + (Number(to.lng) - Number(from.lng)) * progress, from: from.name, to: to.name };
            }
            const wh = validWarehouses[0];
            return { ...v, lat: (Number(wh?.lat) || 18.52) + 0.02, lng: (Number(wh?.lng) || 73.86) + 0.02, from: wh?.name || "—", to: wh?.name || "—" };
          });

          // Route lines between all warehouse pairs
          const routeLines = [];
          for (let i = 0; i < validWarehouses.length; i++) {
            for (let j = i + 1; j < validWarehouses.length; j++) {
              routeLines.push({ from: validWarehouses[i], to: validWarehouses[j], key: `${validWarehouses[i].id}-${validWarehouses[j].id}` });
            }
          }

          const mapPositions = whStats.map(w => [w.lat, w.lng]);

          return (
          <div className="card fade-up" style={{ height: "100%", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <div>
                 <div style={{ fontWeight: 700, fontSize: 16 }}>Live GPS Tracking</div>
                 <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Real-time warehouse locations, fleet tracking & transfer routes</div>
               </div>
               <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#22c55e", marginRight: 4, verticalAlign: "middle" }} />Warehouse</span>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", marginRight: 4, verticalAlign: "middle" }} />Vehicle</span>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#94a3b8", marginRight: 4, verticalAlign: "middle" }} />Route</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", padding: "4px 12px", borderRadius: 20, border: "1px solid #dcfce7" }}>
                     <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse 2s infinite" }} />
                     <span style={{ fontSize: 10, fontWeight: 700, color: "#166534" }}>LIVE</span>
                  </div>
               </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", flex: 1, minHeight: 0 }}>
              {/* Left panel */}
              <div style={{ borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 12 }}>
                  <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 10, border: "1px solid #dcfce7" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Sites</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{warehouses.length}</div>
                  </div>
                  <div style={{ padding: 12, background: "#eff6ff", borderRadius: 10, border: "1px solid #dbeafe" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>En-Route</div>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{activeVehicles.length}</div>
                  </div>
                </div>

                {/* Warehouse list */}
                <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Warehouse Sites</div>
                  {whStats.map(wh => (
                    <div key={wh.id} style={{ padding: 12, marginBottom: 8, background: String(wh.id) === String(selectedWarehouseId) ? "rgba(37,99,235,0.06)" : "var(--bg-base)", border: `1px solid ${String(wh.id) === String(selectedWarehouseId) ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, cursor: "pointer" }} onClick={() => setSelectedWarehouseId(wh.id)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>🏢 {wh.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: wh.fillPct > 60 ? "#22c55e" : wh.fillPct > 25 ? "#f59e0b" : "#ef4444" }}>{wh.fillPct}%</span>
                      </div>
                      <div style={{ width: "100%", height: 4, background: "#e2e8f0", borderRadius: 2, marginBottom: 6 }}>
                        <div style={{ width: `${wh.fillPct}%`, height: "100%", background: wh.fillPct > 60 ? "#22c55e" : wh.fillPct > 25 ? "#f59e0b" : "#ef4444", borderRadius: 2 }} />
                      </div>
                      <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--text-muted)" }}>
                        <span>{wh.rackCount} racks</span>
                        <span>{wh.binCount} bins</span>
                        <span>{wh.productCount} items</span>
                        {wh.lowStockItems > 0 && <span style={{ color: "#ef4444", fontWeight: 600 }}>{wh.lowStockItems} low</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, fontFamily: "monospace" }}>
                        {Number(wh.lat).toFixed(4)}, {Number(wh.lng).toFixed(4)}
                      </div>
                    </div>
                  ))}

                  {/* Fleet section */}
                  {activeVehicles.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginTop: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Active Fleet</div>
                      {vehiclePositions.map(v => (
                        <div key={v.id} style={{ padding: 10, marginBottom: 6, background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 8, fontSize: 11 }}>
                          <div style={{ fontWeight: 700 }}>🚛 {v.number}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: 10 }}>Driver: {v.driver_name}</div>
                          <div style={{ color: "#2563eb", fontSize: 10, marginTop: 2 }}>{v.from} → {v.to}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Map */}
              <div style={{ position: "relative" }}>
                {whStats.length > 0 ? (
                  <MapContainer center={[whStats[0].lat, whStats[0].lng]} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                    {mapPositions.length >= 1 && <FitBounds positions={mapPositions} />}

                    {/* Route lines between warehouses */}
                    {routeLines.map(r => (
                      <Polyline key={r.key} positions={[[Number(r.from.lat), Number(r.from.lng)], [Number(r.to.lat), Number(r.to.lng)]]} pathOptions={{ color: "#94a3b8", weight: 2, dashArray: "8 6", opacity: 0.7 }} />
                    ))}

                    {/* Warehouse markers */}
                    {whStats.map(wh => (
                      <Marker key={wh.id} position={[wh.lat, wh.lng]} icon={warehouseIcon(wh.fillPct > 60 ? "#22c55e" : wh.fillPct > 25 ? "#f59e0b" : "#ef4444")}>
                        <Popup maxWidth={280} minWidth={220}>
                          <div style={{ fontFamily: "Inter, sans-serif" }}>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>🏢 {wh.name}</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                              <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: 6 }}>
                                <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>STOCK</div>
                                <div style={{ fontSize: 14, fontWeight: 800 }}>{wh.totalStock.toLocaleString()}</div>
                              </div>
                              <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: 6 }}>
                                <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>FILL</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: wh.fillPct > 60 ? "#22c55e" : wh.fillPct > 25 ? "#f59e0b" : "#ef4444" }}>{wh.fillPct}%</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                              <div>{wh.rackCount} racks &middot; {wh.binCount} bins &middot; {wh.productCount} products</div>
                              {wh.lowStockItems > 0 && <div style={{ color: "#ef4444", fontWeight: 600 }}>⚠ {wh.lowStockItems} low-stock items</div>}
                              <div style={{ fontFamily: "monospace", fontSize: 10, marginTop: 4 }}>GPS: {Number(wh.lat).toFixed(6)}, {Number(wh.lng).toFixed(6)}</div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Vehicle markers */}
                    {vehiclePositions.map(v => (
                      <Marker key={`v-${v.id}`} position={[v.lat, v.lng]} icon={vehicleIcon()}>
                        <Popup>
                          <div style={{ fontFamily: "Inter, sans-serif" }}>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🚛 {v.number}</div>
                            <div style={{ fontSize: 11, color: "#475569" }}>Driver: {v.driver_name}</div>
                            <div style={{ fontSize: 11, color: "#2563eb", marginTop: 4, fontWeight: 600 }}>{v.from} → {v.to}</div>
                            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#64748b", marginTop: 4 }}>GPS: {v.lat.toFixed(6)}, {v.lng.toFixed(6)}</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Vehicle route lines to destination */}
                    {vehiclePositions.map(v => {
                      const destWh = validWarehouses.find(w => w.name === v.to);
                      if (!destWh || !isFinite(v.lat) || !isFinite(v.lng)) return null;
                      return <Polyline key={`vr-${v.id}`} positions={[[v.lat, v.lng], [Number(destWh.lat), Number(destWh.lng)]]} pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.8 }} />;
                    })}
                  </MapContainer>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
                      <div>No warehouses registered. Add a warehouse to see the map.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {activeTab === "inventory" && (
          <div className="card fade-up"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Warehouse</th><th>Bin</th><th>Level</th><th>Status</th></tr></thead><tbody>{allProducts.filter(p => String(p.warehouse_id) === String(selectedWarehouseId)).map((p) => {
            const bin = bins.find(b => b.id === p.bin_id);
            const ratio = bin ? p.stock / bin.capacity : 0;
            return (
              <tr key={p.id}>
                <td><div style={{ fontWeight: 600 }}>{p.name}</div></td>
                <td>{p.warehouse_name}</td>
                <td><span className="pill blue">{p.locations}</span></td>
                <td><div style={{ width: 60, height: 4, background: "#e2e8f0", borderRadius: 2, marginTop: 8 }}><div style={{ width: `${Math.min(ratio * 100, 100)}%`, height: "100%", background: getStatusColor(ratio), borderRadius: 2 }} /></div><div style={{ fontSize: 9, marginTop: 4, fontWeight: 700 }}>{Math.round(ratio * 100)}%</div></td>
                <td><span className={`pill ${ratio <= 0.25 ? 'red' : 'green'}`}>{ratio <= 0.25 ? '🚨 LOW STOCK' : 'STABLE'}</span></td>
              </tr>
            )})}</tbody></table></div></div>
        )}
      </div>

      {/* Modals omitted for brevity */}
      {showScanModal && scanResult && (
        <Modal title={scanResult.type === "bin" ? `Asset Found: ${scanResult.rack_code}/${scanResult.bin_code}` : `Product Found: ${scanResult.name}`} onClose={() => { setShowScanModal(false); setScanResult(null); }} hideConfirm>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
               <div style={{ background: "#f8fafc", padding: 15, borderRadius: 12 }}><div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>SITE LOCATION</div><div style={{ fontWeight: 700, fontSize: 16 }}>{scanResult.warehouse_name}</div></div>
               <div style={{ background: "#f8fafc", padding: 15, borderRadius: 12 }}><div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>BARCODE ID</div><div style={{ fontWeight: 700, fontSize: 16 }}>{scanResult.barcode}</div></div>
            </div>
            {scanResult.type === "bin" && (
              <div style={{ background: "#eff6ff", padding: 20, borderRadius: 16, border: "1px solid #dbeafe" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1e40af", marginBottom: 12 }}>CURRENT OCCUPANCY</div>
                {scanResult.product ? (<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: 700, fontSize: 18 }}>{scanResult.product.name}</div><div style={{ fontSize: 12, opacity: 0.6 }}>SKU: {scanResult.product.barcode}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#1e40af" }}>{scanResult.product.stock}</div><div style={{ fontSize: 10, fontWeight: 700 }}>UNITS</div></div></div>) : (<div style={{ color: "#1e40af", opacity: 0.6, fontStyle: "italic" }}>No product assigned.</div>)}
              </div>
            )}
            <button className="btn btn-primary" onClick={() => setShowScanModal(false)} style={{ width: "100%" }}>Done</button>
          </div>
        </Modal>
      )}

      {showWarehouseModal && (
        <Modal title="Register New Warehouse Site" onClose={() => setShowWarehouseModal(false)} onConfirm={handleAddWarehouse} loading={loading}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}><div className="form-group"><label>Warehouse Name</label><input value={warehouseForm.name} onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})} /></div><div className="form-group"><label>Select City</label><select value={warehouseForm.city} onChange={e => setWarehouseForm({...warehouseForm, city: e.target.value})}>{Object.keys(cityPresets).map(city => <option key={city} value={city}>{city}</option>)}</select></div></div>
        </Modal>
      )}

      {showAddModal && (
        <Modal title={selectedBin ? `Manage Stock: ${selectedBin.rack_code}/${selectedBin.bin_code}` : "Add Product"} onClose={() => setShowAddModal(false)} onConfirm={handleSaveProduct} loading={loading}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}><div className="form-group"><label>Name</label><input value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} /></div><div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}><div className="form-group"><label>Quantity</label><input type="number" value={prodForm.stock} onChange={e => setProdForm({...prodForm, stock: e.target.value})} /></div><div className="form-group"><label>Price</label><input type="number" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} /></div></div><div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}><div className="form-group"><label>Warehouse</label><select value={prodForm.warehouse_id} onChange={e => setProdForm({...prodForm, warehouse_id: e.target.value})}>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div><div className="form-group"><label>Bin ID</label><input value={prodForm.bin_id} disabled /></div></div></div>
        </Modal>
      )}

      {showRackModal && (
        <Modal title="Create Rack" onClose={() => setShowRackModal(false)} onConfirm={handleAddRack} loading={loading}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}><div className="form-group"><label>Warehouse</label><select value={rackForm.warehouse_id} onChange={e => setRackForm({...rackForm, warehouse_id: e.target.value})}>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div><div className="form-group"><label>Rack Code</label><input value={rackForm.rack_code} onChange={e => setRackForm({...rackForm, rack_code: e.target.value})} /></div><div className="form-group"><label>Bins</label><input type="number" value={rackForm.bin_count} onChange={e => setRackForm({...rackForm, bin_count: e.target.value})} /></div></div>
        </Modal>
      )}
    </div>
  );
}
