import React, { useState, useMemo, useEffect } from "react";
import { useMockStoreSnapshot } from "../mockData/mockHooks";
import { actions } from "../mockData/mockStore";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Barcode Generator (SVG) ──────────────────────────────────────────────────

const BarcodeUI = ({ value }) => {
  const bars = useMemo(() => {
    const seed = String(value).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const arr = [];
    let x = 0;
    for (let i = 0; i < 40; i++) {
      const pseudoRand = Math.abs(Math.sin(seed + i));
      const width = pseudoRand > 0.5 ? 2 : 1;
      const opacity = pseudoRand > 0.1 ? 1 : 0;
      arr.push({ x, width, opacity });
      x += width + 1;
    }
    return arr;
  }, [value]);

  return (
    <div style={{ background: "white", padding: "8px 12px", borderRadius: 4, display: "inline-block", border: "1px solid #e2e8f0" }}>
      <svg width="120" height="30">
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y="0" width={b.width} height="30" fill="black" opacity={b.opacity} />
        ))}
      </svg>
      <div style={{ fontSize: 10, textAlign: "center", fontWeight: 700, marginTop: 4, letterSpacing: 2, color: "#1e293b" }}>{value}</div>
    </div>
  );
};

function warehouseMapIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;">🏢</div>`,
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20],
  });
}

function deliveryMapIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;">📍</div>`,
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20],
  });
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    const valid = positions.filter((p) => p && p.length === 2 && isFinite(p[0]) && isFinite(p[1]));
    if (valid.length >= 2) map.fitBounds(valid, { padding: [50, 50], maxZoom: 14 });
    else if (valid.length === 1) map.setView(valid[0], 14);
  }, [map, positions]);
  return null;
}

const STATUS_CFG = {
  assigned: { color: "#f5a623", bg: "rgba(245,166,35,0.1)", label: "Assigned" },
  picking: { color: "#4a90e2", bg: "rgba(74,144,226,0.1)", label: "Picking" },
  in_transit: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", label: "In Transit" },
  delivered: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Delivered" },
};

const cardStyle = {
  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden",
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function DispatcherDashboard({ push, user }) {
  const [tab, setTab] = useState("dashboard");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  const assignments = useMockStoreSnapshot((s) => s?.dispatcher?.assignments || []);
  const notifications = useMockStoreSnapshot((s) => s?.dispatcher?.notifications || []);
  const allBins = useMockStoreSnapshot((s) => s?.warehouse?.bins || []);
  const rackPositions = useMockStoreSnapshot((s) => s?.warehouse?.rack_positions || {});
  const inventoryProducts = useMockStoreSnapshot((s) => s?.inventory?.products || []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const activeAssignment = assignments.find((a) => a.status === "assigned" || a.status === "picking" || a.status === "in_transit");
  const completedToday = assignments.filter((a) => a.status === "delivered").length;

  // Derive the current assignment from the live snapshot using the selected ID
  const currentAssignment = useMemo(() => {
    const id = selectedAssignmentId || activeAssignment?.id;
    return assignments.find(a => a.id === id);
  }, [assignments, selectedAssignmentId, activeAssignment]);

  const openNavigation = (assignment) => {
    setSelectedAssignmentId(assignment.id);
    setTab("navigate");
  };

  const openDelivery = (assignment) => {
    setSelectedAssignmentId(assignment.id);
    setTab("delivery");
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    user?.role === 'dispatcher' && { id: "dispatch", label: "Dispatch Center", icon: "📦" },
    user?.role === 'dispatcher' && { id: "navigate", label: "Warehouse Navigation", icon: "🗺️" },
    user?.role === 'driver' && { id: "delivery", label: "Delivery Route", icon: "📍" },
  ].filter(Boolean);

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
            {user?.role === 'dispatcher' ? "🕹️ Dispatcher Control" : "🚛 Driver Dashboard"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            {user?.role === 'dispatcher' ? "Manage shipments, assign drivers & monitor logistics" : "Your assignments, pick lists & delivery routes"}
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 20px", background: "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
              border: "none", borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 500, fontFamily: "Inter",
              whiteSpace: "nowrap", marginBottom: -2,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <DashboardTab
          assignments={assignments}
          notifications={notifications}
          unreadCount={unreadCount}
          activeAssignment={activeAssignment}
          completedToday={completedToday}
          onNavigate={openNavigation}
          onDeliver={openDelivery}
          push={push}
          user={user}
        />
      )}
      {tab === "dispatch" && (
        <DispatchCenterTab push={push} assignments={assignments} />
      )}
      {tab === "navigate" && (
        <NavigateTab
          assignment={currentAssignment}
          allBins={allBins}
          rackPositions={rackPositions}
          inventoryProducts={inventoryProducts}
          push={push}
        />
      )}
      {tab === "delivery" && (
        <DeliveryTab
          assignment={currentAssignment}
          push={push}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardTab({ assignments, notifications, unreadCount, activeAssignment, completedToday, onNavigate, onDeliver, push, user }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSimulateAssignment = () => {
    actions.assignOrderToDispatcher({
      warehouse_id: 1,
      warehouse_name: "London Distribution Center",
      warehouse_lat: 51.5284,
      warehouse_lng: -0.2662,
      delivery_address: "New Customer Site, Oxford Street, London",
      delivery_lat: 51.5145,
      delivery_lng: -0.1444,
      total_distance_km: 15.2,
      items: [
        { product_id: 1001, product_name: "Red Chilli Powder", quantity: 50, unit: "kg", bin_id: 1, rack_code: "R-B1", bin_code: "B-201", bin_location: "R-B1/B-201", barcode: "SKU-CHILLI-RED" },
        { product_id: 1002, product_name: "Corrugated Boxes", quantity: 200, unit: "pcs", bin_id: 2, rack_code: "R-B1", bin_code: "B-201", bin_location: "R-B1/B-201", barcode: "SKU-BOX-CORR" }
      ]
    });
    if (push) push("🔔 New order assigned! Check notifications.", "success");
  };

  const handleMarkAllRead = () => {
    actions.markAllDispatcherNotificationsRead();
    if (push) push("All notifications marked as read", "success");
  };

  return (
    <>
      {/* Simulation Trigger (For Demo) */}
      <div style={{ marginBottom: 20, textAlign: "right" }}>
        <button 
          onClick={handleSimulateAssignment}
          style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px dashed #6366f1", color: "#6366f1", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          ➕ Simulate New Assignment
        </button>
      </div>

      {/* Role-Specific Focus Card */}
      {user?.role === 'driver' && activeAssignment ? (
        <div style={{ ...cardStyle, padding: 0, marginBottom: 24, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
             <div style={{ flex: 1, padding: 24, minWidth: 300 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                   <div>
                      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6366f1" }}>Current Shipment</div>
                      <h2 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800 }}>{activeAssignment.shipment_id}</h2>
                   </div>
                   <BarcodeUI value={activeAssignment.shipment_id} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                   <div style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>ORIGIN</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{activeAssignment.warehouse_name}</div>
                   </div>
                   <div style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>DESTINATION</div>
                      <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeAssignment.delivery_address}</div>
                   </div>
                </div>

                <button 
                  onClick={() => onDeliver(activeAssignment)}
                  style={{ width: "100%", padding: "14px", background: "#6366f1", color: "white", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14, boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
                >
                  Start Delivery Route →
                </button>
             </div>
             <div style={{ width: 200, background: "rgba(99,102,241,0.1)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🚛</div>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>STATUS</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#6366f1" }}>{STATUS_CFG[activeAssignment.status].label}</div>
             </div>
          </div>
        </div>
      ) : user?.role === 'driver' && !activeAssignment ? (
        <div style={{ ...cardStyle, padding: 30, marginBottom: 24, textAlign: "center", border: "2px dashed var(--border)", background: "transparent" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚛</div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>No Active Shipments</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>You're all caught up! New assignments will appear here.</p>
        </div>
      ) : null}

      {/* Notification Banner */}
      {unreadCount > 0 && (
        <div
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            padding: "14px 20px", marginBottom: 20, borderRadius: 12, cursor: "pointer",
            background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{unreadCount} unread notification{unreadCount > 1 ? "s" : ""}</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{showNotifications ? "Hide" : "Show"} ▾</span>
        </div>
      )}

      {/* Notification List */}
      {showNotifications && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            <button onClick={handleMarkAllRead} style={{ background: "none", border: "none", fontSize: 12, color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontFamily: "Inter" }}>Mark all read</button>
          </div>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) actions.markDispatcherNotificationRead(n.id); }}
              style={{
                padding: "16px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer",
                background: n.is_read ? "transparent" : "rgba(37,99,235,0.03)",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 16, marginTop: 2 }}>{n.type === "assignment" ? "📋" : n.type === "reminder" ? "⏰" : "ℹ️"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 13 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{n.message}</div>
                
                {/* Rich Details for Driver */}
                {n.details && (
                  <div style={{ marginTop: 12, background: "rgba(0,0,0,0.05)", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                      <div><span style={{ opacity: 0.6 }}>Route:</span> <strong style={{ color: "var(--accent)" }}>{n.details.route}</strong></div>
                      <div><span style={{ opacity: 0.6 }}>Date:</span> <strong>{n.details.delivery_date}</strong></div>
                      <div><span style={{ opacity: 0.6 }}>Estimated:</span> <strong>{n.details.estimated_time}</strong></div>
                      <div><span style={{ opacity: 0.6 }}>Navigation:</span> <a href={n.details.navigation_url} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700 }}>Open Maps ↗</a></div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{timeAgo(n.created_at)}</div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", marginTop: 6, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
        {(user?.role === 'driver' ? [
          { icon: "📦", label: "Today's Load", value: assignments.length, color: "#4a90e2" },
          { icon: "✅", label: "Completed", value: completedToday, color: "#22c55e" },
          { icon: "⛽", label: "Fuel Est.", value: "85%", color: "#f5a623" },
          { icon: "📏", label: "Total Km", value: assignments.reduce((s, a) => s + (a.total_distance_km || 0), 0).toFixed(1), color: "#7c3aed" },
        ] : [
          { icon: "📊", label: "Total Orders", value: assignments.length, color: "#6366f1" },
          { icon: "🚚", label: "Active Drivers", value: "12", color: "#10b981" },
          { icon: "🕒", label: "Avg. Dispatch", value: "14m", color: "#f59e0b" },
          { icon: "📈", label: "Efficiency", value: "98.2%", color: "#8b5cf6" },
        ]).map((k) => (
          <div key={k.label} style={{ ...cardStyle, padding: "16px 20px", borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Assignment List */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 14 }}>
          {user?.role === 'dispatcher' ? "All Active Assignments" : "My Assignments"}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base)" }}>
                {["Shipment", "Warehouse", "Vehicle", "Items", "Delivery To", "Distance", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => {
                const sc = STATUS_CFG[a.status] || STATUS_CFG.assigned;
                const pickedCount = a.items.filter((it) => it.picked).length;
                return (
                  <tr key={a.id} style={{ borderBottom: i < assignments.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--accent)" }}>{a.shipment_id}</td>
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{a.warehouse_name}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12 }}>{a.vehicle_number}</td>
                    <td style={{ padding: "12px 14px" }}>{pickedCount}/{a.items.length} picked</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.delivery_address}</td>
                    <td style={{ padding: "12px 14px" }}>{a.total_distance_km} km</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {user?.role === 'dispatcher' ? (
                           <button onClick={() => onNavigate(a)} style={{ padding: "4px 12px", background: "rgba(74,144,226,0.1)", border: "1px solid #4a90e244", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Inter", color: "#4a90e2", fontWeight: 600 }}>Pick Map</button>
                        ) : (
                           <button onClick={() => onDeliver(a)} style={{ padding: "4px 12px", background: "rgba(124,58,237,0.1)", border: "1px solid #7c3aed44", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Inter", color: "#7c3aed", fontWeight: 600 }}>Navigate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Warehouse Navigation (FOR DISPATCHER TO OVERSEE OR MANAGER)
// ═══════════════════════════════════════════════════════════════════════════════

function NavigateTab({ assignment, allBins, rackPositions, inventoryProducts, push }) {
  const [showScanner, setShowScanner] = useState(false);
  const [scanningItem, setScanningItem] = useState(null);
  const [scanError, setScanError] = useState("");

  // const warehouseBins = useMemo(() => {
  //   if (!assignment) return [];
  //   return allBins.filter((b) => String(b.warehouse_id) === String(assignment.warehouse_id));
  // }, [allBins, assignment]);

  const pickSequence = useMemo(() => {
    if (!assignment) return [];
    const rackMap = {};
    for (const item of assignment.items) {
      const key = item.rack_code;
      const invProd = inventoryProducts.find(p => p.id === item.product_id);
      const itemWithBarcode = { ...item, barcode: invProd?.barcode || String(item.product_id) };
      
      if (!rackMap[key]) {
        rackMap[key] = {
          rack_code: key,
          bin_code: item.bin_code,
          bin_location: item.bin_location,
          items: []
        };
      }
      rackMap[key].items.push(itemWithBarcode);
    }
    return Object.values(rackMap);
  }, [assignment, inventoryProducts]);

  if (!assignment) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>No active assignment selected</div>
      </div>
    );
  }

  const pickedCount = assignment.items.filter((it) => it.picked).length;
  const allPicked = pickedCount === assignment.items.length;

  const handleOpenScanner = (item) => {
    setScanningItem(item);
    setScanError("");
    setShowScanner(true);
  };

  const handleScan = (code) => {
    if (!scanningItem) return;
    if (code === scanningItem.barcode || code === String(scanningItem.product_id)) {
      actions.markDispatcherItemPicked(assignment.id, scanningItem.product_id);
      if (push) push(`✓ Successfully picked ${scanningItem.product_name}`, "success");
      setShowScanner(false);
      setScanningItem(null);
    } else {
      setScanError(`Invalid barcode`);
    }
  };

  const targetBinIds = new Set(assignment.items.filter(i => !i.picked).map((it) => it.rack_code));

  return (
    <>
      <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>🏢 {assignment.warehouse_name} Picking Oversight</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Monitor indoor pick sequence for {assignment.shipment_id}</div>
          </div>
          <div style={{ padding: "8px 16px", background: allPicked ? "rgba(34,197,94,0.1)" : "rgba(245,166,35,0.1)", borderRadius: 20, fontSize: 13, fontWeight: 700, color: allPicked ? "#22c55e" : "#f5a623" }}>
            {pickedCount}/{assignment.items.length} picked
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={cardStyle}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 14 }}>
            📋 Sequential Pick List
          </div>
          <div style={{ padding: 16 }}>
            {pickSequence.map((stop, idx) => (
              <div key={stop.rack_code} style={{ marginBottom: idx < pickSequence.length - 1 ? 16 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{idx + 1}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{stop.bin_location}</div>
                </div>
                {stop.items.map((item) => (
                  <div key={item.product_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginLeft: 38, background: item.picked ? "rgba(34,197,94,0.05)" : "var(--bg-base)", borderRadius: 8, marginBottom: 4, border: `1px solid ${item.picked ? "#22c55e33" : "var(--border)"}` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.product_name}</div>
                      <div style={{ fontSize: 10, opacity: 0.6 }}>SKU: {item.barcode}</div>
                    </div>
                    {item.picked ? (
                       <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>✓ Picked</span>
                    ) : (
                       <button onClick={() => handleOpenScanner(item)} style={{ padding: "5px 14px", background: "var(--accent)", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Verify Scan</button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <WarehouseFloorPlan targetBinIds={targetBinIds} pickSequence={pickSequence} warehouseName={assignment.warehouse_name} />
        </div>
      </div>
      {showScanner && <ScannerModal item={scanningItem} onScan={handleScan} onClose={() => setShowScanner(false)} error={scanError} />}
    </>
  );
}

function WarehouseFloorPlan({ pickSequence, warehouseName, targetBinIds }) {
  const OFFSET_X = 100;
  const OFFSET_Y = 100;

  // Generate a "Full Warehouse" feel with static racks
  const warehouseLayout = useMemo(() => {
    const racks = [];
    // Static filler racks to make it look like a real warehouse
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const code = `R-${String.fromCharCode(65 + r)}${c + 1}`;
        const isTarget = targetBinIds.has(code);
        racks.push({
          code,
          x: c * 100 + OFFSET_X,
          y: r * 70 + OFFSET_Y,
          isTarget
        });
      }
    }
    return racks;
  }, [targetBinIds]);

  const walkingPath = useMemo(() => {
    // Start at Loading Dock
    const points = [[50, 420]]; 
    pickSequence.forEach(stop => {
      const rack = warehouseLayout.find(r => r.code === stop.rack_code);
      if (rack) points.push([rack.x + 25, rack.y + 35]);
    });
    // End at Dispatch Area
    points.push([550, 50]);
    return points;
  }, [pickSequence, warehouseLayout]);

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>📍 Spatial Logistics — {warehouseName}</h4>
        <div style={{ display: "flex", gap: 12 }}>
           <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700 }}><span style={{ width: 8, height: 8, background: "#2563eb", borderRadius: 2 }}></span> TARGET</div>
           <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700 }}><span style={{ width: 8, height: 8, background: "#e2e8f0", borderRadius: 2 }}></span> STORAGE</div>
        </div>
      </div>

      <div style={{ background: "#f8fafc", height: 450, position: "relative", overflow: "hidden" }}>
        {/* Guidance Overlay */}
        <div style={{ position: "absolute", top: 16, right: 16, width: 190, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", padding: 14, borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)", zIndex: 10, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
           <div style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", marginBottom: 6, letterSpacing: 0.5 }}>OPERATIONAL GUIDANCE</div>
           <div style={{ fontSize: 11, lineHeight: 1.5, color: "#475569" }}>
             Follow the <strong style={{ color: "#f97316" }}>orange path</strong>. Pick items sequentially from highlighted racks.
           </div>
           <div style={{ marginTop: 10, pt: 10, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#94a3b8" }}>EST. TIME</div><div style={{ fontSize: 12, fontWeight: 700 }}>4.5m</div></div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 9, color: "#94a3b8" }}>DISTANCE</div><div style={{ fontSize: 12, fontWeight: 700 }}>120m</div></div>
           </div>
        </div>

        <svg width="100%" height="100%" viewBox="0 0 600 500">
          {/* Floor Grid */}
          <defs>
            <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.02)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#floor-grid)" />

          {/* Boundaries */}
          <rect x="20" y="20" width="560" height="460" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 4" opacity="0.2" />

          {/* Waypoints */}
          <g>
             <circle cx="50" cy="420" r="14" fill="#22c55e" stroke="white" strokeWidth="3" style={{ filter: "drop-shadow(0 4px 6px rgba(34,197,94,0.3))" }} />
             <text x="50" y="445" textAnchor="middle" fontSize="9" fontWeight="800" fill="#166534">LOADING DOCK</text>
             
             <circle cx="550" cy="50" r="14" fill="#ef4444" stroke="white" strokeWidth="3" style={{ filter: "drop-shadow(0 4px 6px rgba(239,68,68,0.3))" }} />
             <text x="550" y="75" textAnchor="middle" fontSize="9" fontWeight="800" fill="#991b1b">DISPATCH HUB</text>
          </g>

          {/* Walking Path */}
          {walkingPath.length > 1 && (
            <polyline 
              points={walkingPath.map(p => p.join(",")).join(" ")} 
              fill="none" 
              stroke="#f97316" 
              strokeWidth="3" 
              strokeDasharray="10 6" 
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 4px 8px rgba(249,115,22,0.2))" }}
            />
          )}

          {/* Racks */}
          {warehouseLayout.map((rack) => (
            <g key={rack.code} style={{ cursor: "default" }}>
              <rect 
                x={rack.x} y={rack.y} width="50" height="35" rx="6" 
                fill={rack.isTarget ? "#2563eb" : "#ffffff"} 
                stroke={rack.isTarget ? "#1d4ed8" : "#e2e8f0"} 
                strokeWidth={rack.isTarget ? "2" : "1"}
                style={{ filter: rack.isTarget ? "drop-shadow(0 6px 12px rgba(37,99,235,0.4))" : "none" }}
              />
              <text 
                x={rack.x + 25} y={rack.y + 22} 
                textAnchor="middle" 
                fontSize="8" 
                fontWeight="900" 
                fill={rack.isTarget ? "white" : "#94a3b8"}
              >
                {rack.code}
              </text>
              {rack.isTarget && (
                <circle cx={rack.x + 50} cy={rack.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2">
                   <animate attributeName="r" values="5;8;5" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: Delivery Route (DRIVER ONLY)
// ═══════════════════════════════════════════════════════════════════════════════

function DeliveryTab({ assignment, push }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [truckPos, setTruckPos] = useState(null);
  const whLat = Number(assignment?.warehouse_lat), whLng = Number(assignment?.warehouse_lng);
  const delLat = Number(assignment?.delivery_lat), delLng = Number(assignment?.delivery_lng);
  const hasValidCoords = [whLat, whLng, delLat, delLng].every(isFinite);
  
  useEffect(() => {
    if (isNavigating && hasValidCoords) {
      let p = 0;
      const int = setInterval(() => {
        p += 0.01;
        if (p >= 1) { clearInterval(int); setIsNavigating(false); push("Arrived!"); }
        else setTruckPos([whLat + (delLat-whLat)*p, whLng + (delLng-whLng)*p]);
      }, 100);
      return () => clearInterval(int);
    }
  }, [isNavigating, whLat, whLng, delLat, delLng, push, hasValidCoords]);

  if (!assignment) return <div style={{ textAlign: "center", padding: 60 }}>No active delivery.</div>;

  return (
    <>
      <div style={{ ...cardStyle, height: 450, marginBottom: 20, position: "relative" }}>
        <MapContainer center={[whLat, whLng]} zoom={12} style={{ height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds positions={truckPos ? [truckPos, [delLat, delLng]] : [[whLat, whLng], [delLat, delLng]]} />
          <Marker position={[whLat, whLng]} icon={warehouseMapIcon()} />
          <Marker position={[delLat, delLng]} icon={deliveryMapIcon()} />
          {truckPos && (
             <Marker position={truckPos} icon={L.divIcon({
               html: `<div style="width:40px;height:40px;border-radius:50%;background:#6366f1;border:3px solid white;box-shadow:0 5px 15px rgba(99,102,241,0.5);display:flex;align-items:center;justify-content:center;font-size:20px;animation: pulse 2s infinite;">🚛</div>`,
               iconSize: [40, 40], iconAnchor: [20, 20]
             })} />
          )}
          <Polyline positions={[[whLat, whLng], [delLat, delLng]]} pathOptions={{ color: "#6366f1", weight: 4, dashArray: "10 6", opacity: 0.5 }} />
        </MapContainer>
        {!isNavigating && (
          <button onClick={() => setIsNavigating(true)} style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000, padding: "14px 32px", background: "#6366f1", color: "white", borderRadius: 30, border: "none", fontWeight: 800, fontSize: 15, boxShadow: "0 10px 20px rgba(0,0,0,0.2)", cursor: "pointer" }}>▶ Start Real-time Navigation</button>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        {assignment.status === "in_transit" && <button onClick={() => actions.updateDispatcherAssignmentStatus(assignment.id, "delivered")} style={{ padding: "14px 32px", background: "#22c55e", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>✓ Mark as Delivered</button>}
      </div>
      <style>{`@keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); } 70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); } }`}</style>
    </>
  );
}

function DispatchCenterTab({ assignments, push }) {
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState(null);
  const handleScan = () => {
    const f = assignments.find(a => a.shipment_id === input);
    if (f) setSelected(f); else push("Shipment not found in system", "error");
  };
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 40, textAlign: "center" }}>
      <div style={{ ...cardStyle, padding: 40, background: "white" }}>
         <h2 style={{ marginBottom: 8 }}>Dispatch Scanning Hub</h2>
         <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>Scan the waybill barcode to assign a driver</p>
         <div style={{ position: "relative", marginBottom: 12 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter" && handleScan()} placeholder="Scan Shipment ID (e.g. SHP-2026-001)" style={{ padding: "14px 16px", borderRadius: 10, width: "100%", border: "2px solid var(--border)", fontSize: 16, textAlign: "center", fontWeight: 700 }} />
         </div>
         <button onClick={handleScan} style={{ width: "100%", padding: 14, background: "var(--accent)", color: "white", borderRadius: 10, border: "none", fontWeight: 700, cursor: "pointer" }}>🔍 Lookup Shipment</button>
      </div>
      {selected && (
        <div style={{ ...cardStyle, marginTop: 20, padding: 24, textAlign: "left", background: "#f8fafc", border: "1px solid #6366f1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
             <h3 style={{ margin: 0 }}>Assign Driver: {selected.shipment_id}</h3>
             <BarcodeUI value={selected.shipment_id} />
          </div>
          <div style={{ marginBottom: 20, fontSize: 14 }}>
             <div>Destination: <strong>{selected.delivery_address}</strong></div>
             <div>Items: <strong>{selected.items.length} units</strong></div>
          </div>
          <button onClick={() => { actions.assignDriverAfterScan(selected.id, { driver_name: "David Smith", vehicle_number: "BV62 XYZ" }); setSelected(null); setInput(""); push("Driver Assigned Successfully!"); }} style={{ width: "100%", padding: 16, background: "#1e293b", color: "white", borderRadius: 10, border: "none", fontWeight: 800, cursor: "pointer" }}>🚀 Confirm Dispatch</button>
        </div>
      )}
    </div>
  );
}

function ScannerModal({ item, onScan, onClose, error }) {
  const [v, setV] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)" }}>
      <div style={{ background: "white", padding: 40, borderRadius: 24, width: 400, textAlign: "center", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📷</div>
        <h3 style={{ marginBottom: 4 }}>Barcode Scanner</h3>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>Align barcode for <strong>{item.product_name}</strong> in the frame</p>
        
        <div style={{ width: "100%", height: 120, background: "#f1f5f9", borderRadius: 12, marginBottom: 24, position: "relative", border: "2px solid #e2e8f0", overflow: "hidden" }}>
           <div style={{ position: "absolute", inset: 0, border: "2px solid #6366f1", margin: 20, borderRadius: 8, opacity: 0.5 }}></div>
           <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#ef4444", boxShadow: "0 0 10px #ef4444", animation: "scanLine 2s infinite" }}></div>
        </div>

        <input autoFocus value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==="Enter" && onScan(v)} placeholder="Scan Barcode ID..." style={{ width: "100%", padding: 14, marginBottom: 12, border: "2px solid #6366f1", borderRadius: 10, textAlign: "center", fontWeight: 700, fontSize: 16 }} />
        {error && <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>❌ {error}</div>}
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
           <button onClick={onClose} style={{ padding: 14, background: "#f1f5f9", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
           <button onClick={()=>onScan(v)} style={{ padding: 14, background: "#6366f1", color: "white", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer" }}>Verify</button>
        </div>
      </div>
      <style>{`
        @keyframes scanLine {
          0% { top: 20%; }
          50% { top: 80%; }
          100% { top: 20%; }
        }
      `}</style>
    </div>
  );
}
