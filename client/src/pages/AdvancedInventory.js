import React, { useState, useMemo, useRef, useEffect } from "react";
import { useMockStoreSnapshot } from "../mockData/mockHooks";
import { actions } from "../mockData/mockStore";

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function expiryColor(days) {
  if (days === null) return "var(--text-muted)";
  if (days <= 0) return "#c62828";
  if (days <= 7) return "#e65100";
  if (days <= 30) return "#f57f17";
  return "#2e7d32";
}

function expiryLabel(days) {
  if (days === null) return "N/A";
  if (days <= 0) return `EXPIRED (${Math.abs(days)}d ago)`;
  return `${days}d left`;
}

const TABS = [
  { id: "batches", label: "Batches & Lots", icon: "🏷️" },
  { id: "pick-face", label: "Pick-Face & Bins", icon: "📍" },
  { id: "cycle-counts", label: "Cycle Counting", icon: "🔄" },
  { id: "barcode", label: "Barcode / RF Scan", icon: "📱" },
  { id: "expiry", label: "Expiry Alerts", icon: "⚠️" },
];

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "Inter",
  background: "var(--bg-base)",
  color: "var(--text-primary)",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  marginBottom: 5,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "hidden",
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, color, sub }) {
  return (
    <div style={{ ...cardStyle, padding: "16px 20px", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdvancedInventory({ push }) {
  const [tab, setTab] = useState("batches");

  // Store-first data
  const batches = useMockStoreSnapshot((s) => s?.advancedInventory?.batches || []);
  const cycleCounts = useMockStoreSnapshot((s) => s?.advancedInventory?.cycleCounts || []);
  const scanHistory = useMockStoreSnapshot((s) => s?.advancedInventory?.scanHistory || []);
  const expiryAlerts = useMockStoreSnapshot((s) => s?.advancedInventory?.expiryAlerts || []);
  const warehouses = useMockStoreSnapshot((s) => s?.warehouse?.warehouses || []);
  const bins = useMockStoreSnapshot((s) => s?.warehouse?.bins || []);
  const suppliers = useMockStoreSnapshot((s) => s?.suppliers || []);
  const inventoryProducts = useMockStoreSnapshot((s) => s?.inventory?.products || []);

  // KPI metrics
  const activeBatches = batches.filter((b) => b.status === "active").length;
  const activeCycles = cycleCounts.filter((c) => c.status === "in_progress").length;
  const expiredAlerts = expiryAlerts.filter((a) => a.alert_type === "expired" && !a.acknowledged).length;
  const criticalAlerts = expiryAlerts.filter((a) => a.alert_type === "critical" && !a.acknowledged).length;
  const totalAlerts = expiryAlerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
            🏭 Advanced Inventory Management
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Batch tracking, cycle counting, barcode scanning & expiry management
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard icon="🏷️" label="Active Batches" value={activeBatches} color="#4a90e2" />
        <KpiCard icon="🔄" label="Cycle Counts In Progress" value={activeCycles} color="#f5a623" />
        <KpiCard icon="📱" label="Total Scans" value={scanHistory.length} color="#7ed321" />
        <KpiCard
          icon="⚠️"
          label="Expiry Alerts"
          value={totalAlerts}
          color={expiredAlerts > 0 ? "#c62828" : criticalAlerts > 0 ? "#e65100" : "#f57f17"}
          sub={expiredAlerts > 0 ? `${expiredAlerts} expired` : criticalAlerts > 0 ? `${criticalAlerts} critical` : null}
        />
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid var(--border)", overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 20px",
              background: "transparent",
              color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              fontFamily: "Inter",
              whiteSpace: "nowrap",
              marginBottom: -2,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "batches" && (
        <BatchesTab
          batches={batches}
          warehouses={warehouses}
          bins={bins}
          suppliers={suppliers}
          inventoryProducts={inventoryProducts}
          push={push}
        />
      )}
      {tab === "pick-face" && <PickFaceTab warehouses={warehouses} bins={bins} inventoryProducts={inventoryProducts} batches={batches} />}
      {tab === "cycle-counts" && <CycleCountsTab cycleCounts={cycleCounts} warehouses={warehouses} push={push} />}
      {tab === "barcode" && <BarcodeTab scanHistory={scanHistory} warehouses={warehouses} bins={bins} push={push} />}
      {tab === "expiry" && <ExpiryTab expiryAlerts={expiryAlerts} push={push} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: Batches & Lots
// ═══════════════════════════════════════════════════════════════════════════════
function BatchesTab({ batches, warehouses, bins, suppliers, inventoryProducts, push }) {
  const [search, setSearch] = useState("");
  const [filterWh, setFilterWh] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const EMPTY = { product_id: "", batch_number: "", lot_number: "", warehouse_id: "", bin_id: "", quantity_received: "", best_before_date: "", manufacture_date: "", supplier_id: "", notes: "" };
  const [form, setForm] = useState(EMPTY);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const s = search.toLowerCase();
      const matchSearch = !s || b.batch_number.toLowerCase().includes(s) || b.product_name.toLowerCase().includes(s) || b.lot_number.toLowerCase().includes(s);
      const matchWh = filterWh === "all" || String(b.warehouse_id) === filterWh;
      const matchStatus = filterStatus === "all" || b.status === filterStatus;
      return matchSearch && matchWh && matchStatus;
    });
  }, [batches, search, filterWh, filterStatus]);

  const totalQtyAvailable = batches.reduce((s, b) => s + b.quantity_available, 0);
  const expiredBatches = batches.filter((b) => b.best_before_date && daysUntil(b.best_before_date) <= 0 && b.status === "active").length;

  const filteredBins = useMemo(() => {
    if (!form.warehouse_id) return [];
    return bins.filter((b) => String(b.warehouse_id) === String(form.warehouse_id));
  }, [bins, form.warehouse_id]);

  const handleCreate = () => {
    if (!form.product_id || !form.batch_number || !form.quantity_received) {
      if (push) push("Fill required fields (product, batch#, qty)", "error");
      return;
    }
    actions.createAdvBatch(form);
    setForm(EMPTY);
    setShowForm(false);
    if (push) push("Batch created successfully!", "success");
  };

  return (
    <>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Total Batches", v: batches.length, c: "#4a90e2" },
          { l: "Active", v: batches.filter((b) => b.status === "active").length, c: "#7ed321" },
          { l: "Total Qty Available", v: totalQtyAvailable.toLocaleString(), c: "#4a90e2" },
          { l: "Expired Batches", v: expiredBatches, c: expiredBatches > 0 ? "#c62828" : "#7ed321" },
        ].map((s) => (
          <div key={s.l} style={{ padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, borderLeft: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input type="text" placeholder="Search batch#, product, lot#..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
        <select value={filterWh} onChange={(e) => setFilterWh(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 160 }}>
          <option value="all">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={String(w.id)}>{w.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 130 }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="depleted">Depleted</option>
          <option value="quarantine">Quarantine</option>
        </select>
        <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
          + New Batch
        </button>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base)" }}>
                {["Batch #", "Lot #", "Product", "Warehouse > Bin", "Qty Available", "Mfg Date", "Best Before", "Supplier", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No batches found.</td></tr>
              ) : (
                filtered.map((b, i) => {
                  const days = daysUntil(b.best_before_date);
                  const fillPct = b.quantity_received > 0 ? Math.round((b.quantity_available / b.quantity_received) * 100) : 0;
                  return (
                    <tr key={b.id} onClick={() => setSelectedBatch(b)} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-base)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--accent)" }}>{b.batch_number}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)" }}>{b.lot_number || "—"}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 600 }}>{b.product_name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12 }}>{b.warehouse_name} &rsaquo; {b.bin_location}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${fillPct}%`, height: "100%", background: fillPct > 50 ? "#7ed321" : fillPct > 20 ? "#f5a623" : "#e45b5b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>{b.quantity_available}/{b.quantity_received}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(b.manufacture_date)}</td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ color: expiryColor(days), fontWeight: 600, fontSize: 12 }}>
                          {b.best_before_date ? expiryLabel(days) : "N/A"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12 }}>{b.supplier_name}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: b.status === "active" ? "rgba(126,211,33,0.1)" : b.status === "depleted" ? "rgba(108,117,125,0.1)" : "rgba(245,166,35,0.1)", color: b.status === "active" ? "#7ed321" : b.status === "depleted" ? "#6c757d" : "#f5a623" }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Detail Panel */}
      {selectedBatch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{selectedBatch.batch_number}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>{selectedBatch.product_name} &middot; {selectedBatch.lot_number}</p>
              </div>
              <button onClick={() => setSelectedBatch(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}>x</button>
            </div>
            <div style={{ padding: 24 }}>
              {[
                ["Warehouse", `${selectedBatch.warehouse_name} > ${selectedBatch.bin_location}`],
                ["Supplier", selectedBatch.supplier_name],
                ["Qty Received", selectedBatch.quantity_received],
                ["Qty Available", selectedBatch.quantity_available],
                ["Qty Consumed", selectedBatch.quantity_consumed],
                ["Manufacture Date", fmtDate(selectedBatch.manufacture_date)],
                ["Best Before", selectedBatch.best_before_date ? `${fmtDate(selectedBatch.best_before_date)} (${expiryLabel(daysUntil(selectedBatch.best_before_date))})` : "N/A"],
                ["Status", selectedBatch.status],
                ["Created", fmtDate(selectedBatch.created_at)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{l}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {selectedBatch.notes && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--bg-base)", borderRadius: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  <strong>Notes:</strong> {selectedBatch.notes}
                </div>
              )}
              <div style={{ marginTop: 16, textAlign: "right" }}>
                <button onClick={() => setSelectedBatch(null)} style={{ padding: "10px 18px", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "Inter" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Create New Batch</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Register a new batch/lot entry</p>
              </div>
              <button onClick={() => { setShowForm(false); setForm(EMPTY); }} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}>x</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Product *</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} style={inputStyle} required>
                  <option value="">-- Select Product --</option>
                  {inventoryProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Batch Number *</label>
                  <input type="text" value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} placeholder="e.g. BATCH-2026-011" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Lot Number</label>
                  <input type="text" value={form.lot_number} onChange={(e) => setForm({ ...form, lot_number: e.target.value })} placeholder="Optional" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Warehouse *</label>
                  <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value, bin_id: "" })} style={inputStyle}>
                    <option value="">-- Select --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Bin</label>
                  <select value={form.bin_id} onChange={(e) => setForm({ ...form, bin_id: e.target.value })} style={inputStyle} disabled={!form.warehouse_id}>
                    <option value="">{form.warehouse_id ? "-- Select Bin --" : "Select warehouse first"}</option>
                    {filteredBins.map((b) => (
                      <option key={b.id} value={b.id}>{b.rack_code}/{b.bin_code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Quantity Received *</label>
                  <input type="number" min="1" value={form.quantity_received} onChange={(e) => setForm({ ...form, quantity_received: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Supplier</label>
                  <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} style={inputStyle}>
                    <option value="">-- Select --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Manufacture Date</label>
                  <input type="date" value={form.manufacture_date} onChange={(e) => setForm({ ...form, manufacture_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Best Before Date</label>
                  <input type="date" value={form.best_before_date} onChange={(e) => setForm({ ...form, best_before_date: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <button onClick={() => { setShowForm(false); setForm(EMPTY); }} style={{ padding: "10px 20px", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "Inter" }}>Cancel</button>
                <button onClick={handleCreate} style={{ padding: "10px 24px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>Create Batch</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: Pick-Face & Bin Management
// ═══════════════════════════════════════════════════════════════════════════════
function PickFaceTab({ warehouses, bins, inventoryProducts, batches }) {
  const [selectedWh, setSelectedWh] = useState("all");
  const [selectedBin, setSelectedBin] = useState(null);

  const displayBins = useMemo(() => {
    const filtered = selectedWh === "all" ? bins : bins.filter((b) => String(b.warehouse_id) === selectedWh);
    return filtered.map((bin) => {
      const wh = warehouses.find((w) => w.id === bin.warehouse_id);
      const products = inventoryProducts.filter((p) => p.bin_id === bin.id);
      const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
      const capacity = bin.capacity || 5000;
      const fillPct = Math.min(100, Math.round((totalStock / capacity) * 100));
      const binBatches = batches.filter((b) => b.bin_id === bin.id && b.status === "active");
      let status = "empty";
      if (totalStock > 0 && fillPct > 20) status = "active";
      else if (totalStock > 0 && fillPct <= 20) status = "replenish";
      return { ...bin, warehouse_name: wh?.name || "", products, totalStock, capacity, fillPct, status, binBatches };
    });
  }, [selectedWh, bins, warehouses, inventoryProducts, batches]);

  const racks = useMemo(() => {
    const map = {};
    for (const b of displayBins) {
      const key = `${b.warehouse_name}|${b.rack_code}`;
      if (!map[key]) map[key] = { warehouse_name: b.warehouse_name, rack_code: b.rack_code, bins: [] };
      map[key].bins.push(b);
    }
    return Object.values(map);
  }, [displayBins]);

  return (
    <>
      {/* Warehouse filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}>Warehouse:</label>
        <select value={selectedWh} onChange={(e) => { setSelectedWh(e.target.value); setSelectedBin(null); }} style={{ ...inputStyle, width: "auto", minWidth: 180 }}>
          <option value="all">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={String(w.id)}>{w.name}</option>
          ))}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 12 }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#7ed321", marginRight: 4 }} />Active</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#f5a623", marginRight: 4 }} />Replenish</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: "#cbd5e1", marginRight: 4 }} />Empty</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedBin ? "1fr 1fr" : "1fr", gap: 24 }}>
        {/* Rack/Bin Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {racks.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No bins found.</div>
          ) : (
            racks.map((rack) => (
              <div key={`${rack.warehouse_name}-${rack.rack_code}`} style={cardStyle}>
                <div style={{ padding: "12px 16px", background: "var(--bg-base)", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 13 }}>
                  {rack.warehouse_name} &rsaquo; {rack.rack_code}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, padding: 16 }}>
                  {rack.bins.map((bin) => {
                    const borderColor = bin.status === "active" ? "#7ed321" : bin.status === "replenish" ? "#f5a623" : "#cbd5e1";
                    return (
                      <div
                        key={bin.id}
                        onClick={() => setSelectedBin(bin)}
                        style={{
                          padding: 14,
                          border: `2px solid ${selectedBin?.id === bin.id ? "var(--accent)" : borderColor}`,
                          borderRadius: 10,
                          cursor: "pointer",
                          background: selectedBin?.id === bin.id ? "rgba(37,99,235,0.04)" : "var(--bg-card)",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{bin.bin_code}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: borderColor, textTransform: "uppercase" }}>{bin.status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                          {bin.products.length > 0 ? bin.products.map((p) => p.name).join(", ") : "No products assigned"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${bin.fillPct}%`, height: "100%", background: bin.fillPct > 60 ? "#7ed321" : bin.fillPct > 20 ? "#f5a623" : "#e45b5b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>{bin.fillPct}%</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{bin.totalStock.toLocaleString()} / {bin.capacity.toLocaleString()} units</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Bin Detail */}
        {selectedBin && (
          <div style={cardStyle}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedBin.rack_code} / {selectedBin.bin_code}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedBin.warehouse_name}</div>
              </div>
              <button onClick={() => setSelectedBin(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-muted)" }}>x</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 12, background: "var(--bg-base)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>FILL LEVEL</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{selectedBin.fillPct}%</div>
                </div>
                <div style={{ padding: 12, background: "var(--bg-base)", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>STOCK / CAPACITY</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{selectedBin.totalStock} / {selectedBin.capacity}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Products in Bin</div>
              {selectedBin.products.length === 0 ? (
                <div style={{ padding: 16, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No products assigned</div>
              ) : (
                selectedBin.products.map((p) => (
                  <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>{p.stock} {p.uom}</span>
                  </div>
                ))
              )}

              {selectedBin.binBatches.length > 0 && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8 }}>Active Batches</div>
                  {selectedBin.binBatches.map((b) => (
                    <div key={b.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                      <span>{b.batch_number} ({b.lot_number})</span>
                      <span style={{ color: expiryColor(daysUntil(b.best_before_date)), fontWeight: 600 }}>
                        {b.quantity_available} units &middot; {b.best_before_date ? expiryLabel(daysUntil(b.best_before_date)) : "No expiry"}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: Cycle Counting
// ═══════════════════════════════════════════════════════════════════════════════
function CycleCountsTab({ cycleCounts, warehouses, push }) {
  const [showForm, setShowForm] = useState(false);
  const EMPTY = { warehouse_id: "", cycle_type: "partial", zone_name: "", planned_date: "", notes: "" };
  const [form, setForm] = useState(EMPTY);

  const scheduled = cycleCounts.filter((c) => c.status === "planned").length;
  const inProgress = cycleCounts.filter((c) => c.status === "in_progress").length;
  const completed = cycleCounts.filter((c) => c.status === "completed").length;
  const completedCounts = cycleCounts.filter((c) => c.status === "completed");
  const totalItems = completedCounts.reduce((s, c) => s + c.items_total, 0);
  const totalVariance = completedCounts.reduce((s, c) => s + c.variance_count, 0);
  const accuracyPct = totalItems > 0 ? Math.round(((totalItems - totalVariance) / totalItems) * 100) : 100;

  const handleCreate = () => {
    if (!form.warehouse_id) { if (push) push("Select a warehouse", "error"); return; }
    actions.createAdvCycleCount(form);
    setForm(EMPTY);
    setShowForm(false);
    if (push) push("Cycle count scheduled!", "success");
  };

  const handleStart = (id) => {
    actions.startAdvCycleCount(id);
    if (push) push("Cycle count started!", "success");
  };

  const handleComplete = (id) => {
    actions.completeAdvCycleCount(id);
    if (push) push("Cycle count completed!", "success");
  };

  const statusCfg = { planned: { color: "#6c757d", bg: "rgba(108,117,125,0.1)" }, in_progress: { color: "#4a90e2", bg: "rgba(74,144,226,0.1)" }, completed: { color: "#7ed321", bg: "rgba(126,211,33,0.1)" } };

  return (
    <>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Scheduled", v: scheduled, c: "#6c757d" },
          { l: "In Progress", v: inProgress, c: "#4a90e2" },
          { l: "Completed", v: completed, c: "#7ed321" },
          { l: "Accuracy", v: `${accuracyPct}%`, c: accuracyPct >= 95 ? "#7ed321" : "#f5a623" },
        ].map((s) => (
          <div key={s.l} style={{ padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, borderLeft: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
          + New Cycle Count
        </button>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base)" }}>
                {["Cycle Code", "Type", "Warehouse", "Zone", "Status", "Planned", "Items", "Variance", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cycleCounts.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>No cycle counts.</td></tr>
              ) : (
                cycleCounts.map((c, i) => {
                  const sc = statusCfg[c.status] || statusCfg.planned;
                  const variancePct = c.items_total > 0 && c.status === "completed" ? Math.round((c.variance_count / c.items_total) * 100) : null;
                  return (
                    <tr key={c.id} style={{ borderBottom: i < cycleCounts.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--accent)" }}>{c.cycle_code}</td>
                      <td style={{ padding: "12px 14px", textTransform: "capitalize" }}>{c.cycle_type}</td>
                      <td style={{ padding: "12px 14px" }}>{c.warehouse_name}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)" }}>{c.zone_name || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{c.status.replace("_", " ")}</span>
                      </td>
                      <td style={{ padding: "12px 14px", whiteSpace: "nowrap", color: "var(--text-muted)" }}>{fmtDate(c.planned_date)}</td>
                      <td style={{ padding: "12px 14px" }}>{c.items_counted}/{c.items_total}</td>
                      <td style={{ padding: "12px 14px" }}>
                        {variancePct !== null ? (
                          <span style={{ fontWeight: 600, color: variancePct > 0 ? "#e45b5b" : "#7ed321" }}>{variancePct > 0 ? `${variancePct}% discrepancy` : "0% - perfect"}</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {c.status === "planned" && (
                            <button onClick={() => handleStart(c.id)} style={{ padding: "4px 12px", background: "rgba(74,144,226,0.1)", border: "1px solid #4a90e244", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "Inter", color: "#4a90e2", fontWeight: 600 }}>Start</button>
                          )}
                          {c.status === "in_progress" && (
                            <button onClick={() => handleComplete(c.id)} style={{ padding: "4px 12px", background: "rgba(126,211,33,0.1)", border: "1px solid #7ed32144", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "Inter", color: "#7ed321", fontWeight: 600 }}>Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>New Cycle Count</h2>
              <button onClick={() => { setShowForm(false); setForm(EMPTY); }} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}>x</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Warehouse *</label>
                <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} style={inputStyle}>
                  <option value="">-- Select --</option>
                  {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={form.cycle_type} onChange={(e) => setForm({ ...form, cycle_type: e.target.value })} style={inputStyle}>
                    <option value="partial">Partial</option>
                    <option value="full">Full</option>
                    <option value="zone">Zone-based</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Planned Date</label>
                  <input type="date" value={form.planned_date} onChange={(e) => setForm({ ...form, planned_date: e.target.value })} style={inputStyle} />
                </div>
              </div>
              {form.cycle_type === "zone" && (
                <div>
                  <label style={labelStyle}>Zone Name</label>
                  <input type="text" value={form.zone_name} onChange={(e) => setForm({ ...form, zone_name: e.target.value })} placeholder="e.g. Zone A1 - Grains" style={inputStyle} />
                </div>
              )}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional..." style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <button onClick={() => { setShowForm(false); setForm(EMPTY); }} style={{ padding: "10px 20px", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "Inter" }}>Cancel</button>
                <button onClick={handleCreate} style={{ padding: "10px 24px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>Schedule Count</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: Barcode / RF Scanning
// ═══════════════════════════════════════════════════════════════════════════════
function BarcodeTab({ scanHistory, warehouses, bins, push }) {
  const [barcode, setBarcode] = useState("");
  const [scanType, setScanType] = useState("inbound");
  const [warehouseId, setWarehouseId] = useState("");
  const [qty, setQty] = useState(1);
  const [lastResult, setLastResult] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleScan = () => {
    if (!barcode.trim()) { if (push) push("Enter or scan a barcode", "error"); return; }
    const result = actions.processAdvScan({ barcode: barcode.trim(), scan_type: scanType, warehouse_id: warehouseId, quantity_scanned: qty });
    setLastResult(result);
    setBarcode("");
    if (result.valid) {
      if (push) push(`Scan OK: ${result.product_name || result.barcode}`, "success");
    } else {
      if (push) push(result.error_message || "Invalid barcode", "error");
    }
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleScan();
  };

  const validScans = scanHistory.filter((s) => s.valid).length;
  const invalidScans = scanHistory.filter((s) => !s.valid).length;

  return (
    <>
      {/* Scanner Area */}
      <div style={{ ...cardStyle, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📱 Barcode Scanner</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Type or scan a barcode. Press Enter to process.</div>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
            <span style={{ color: "#7ed321", fontWeight: 600 }}>{validScans} valid</span>
            <span style={{ color: "#e45b5b", fontWeight: 600 }}>{invalidScans} invalid</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode here... (e.g. SKU-WHEAT-ATTA)"
            style={{ ...inputStyle, flex: 2, minWidth: 250, fontSize: 15, padding: "12px 16px", fontWeight: 600 }}
          />
          <select value={scanType} onChange={(e) => setScanType(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 140 }}>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
            <option value="transfer">Transfer</option>
            <option value="cycle_count">Cycle Count</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 150 }}>
            <option value="">Any Warehouse</option>
            {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
          </select>
          <input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ ...inputStyle, width: 80 }} />
          <button onClick={handleScan} style={{ padding: "10px 24px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
            Scan
          </button>
        </div>

        {/* Last scan result card */}
        {lastResult && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: `2px solid ${lastResult.valid ? "#7ed321" : "#e45b5b"}`, background: lastResult.valid ? "rgba(126,211,33,0.05)" : "rgba(228,91,91,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{lastResult.valid ? "Valid Scan" : "Invalid Scan"}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  Barcode: <strong>{lastResult.barcode}</strong>
                  {lastResult.product_name && <> &middot; {lastResult.product_name}</>}
                  {lastResult.bin_location && <> &middot; {lastResult.bin_location}</>}
                </div>
              </div>
              <span style={{ fontSize: 24 }}>{lastResult.valid ? "✅" : "❌"}</span>
            </div>
            {lastResult.error_message && <div style={{ marginTop: 8, fontSize: 12, color: "#e45b5b", fontWeight: 600 }}>{lastResult.error_message}</div>}
          </div>
        )}
      </div>

      {/* Recent Scans Table */}
      <div style={cardStyle}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 14 }}>Recent Scans ({scanHistory.length})</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base)" }}>
                {["Timestamp", "Barcode", "Product", "Type", "Qty", "Warehouse", "Location", "Result"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scanHistory.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No scans yet. Use the scanner above.</td></tr>
              ) : (
                scanHistory.slice(0, 50).map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < scanHistory.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "var(--text-muted)", fontSize: 12 }}>{new Date(s.timestamp).toLocaleString("en-GB")}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "monospace" }}>{s.barcode}</td>
                    <td style={{ padding: "10px 14px" }}>{s.product_name || "—"}</td>
                    <td style={{ padding: "10px 14px", textTransform: "capitalize" }}>{s.scan_type.replace("_", " ")}</td>
                    <td style={{ padding: "10px 14px" }}>{s.quantity_scanned}</td>
                    <td style={{ padding: "10px 14px" }}>{s.warehouse_name || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>{s.bin_location || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.valid ? "rgba(126,211,33,0.1)" : "rgba(228,91,91,0.1)", color: s.valid ? "#7ed321" : "#e45b5b" }}>
                        {s.valid ? "Valid" : "Invalid"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5: Expiry & Best-Before Alerts
// ═══════════════════════════════════════════════════════════════════════════════
function ExpiryTab({ expiryAlerts, push }) {
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const expired = expiryAlerts.filter((a) => a.alert_type === "expired" && !a.acknowledged).length;
  const critical = expiryAlerts.filter((a) => a.alert_type === "critical" && !a.acknowledged).length;
  const warning = expiryAlerts.filter((a) => a.alert_type === "warning" && !a.acknowledged).length;
  const acknowledged = expiryAlerts.filter((a) => a.acknowledged);

  const active = useMemo(() => {
    return expiryAlerts.filter((a) => {
      if (a.acknowledged) return false;
      if (filterSeverity === "all") return true;
      return a.alert_type === filterSeverity;
    });
  }, [expiryAlerts, filterSeverity]);

  const handleAcknowledge = (id, action) => {
    actions.acknowledgeAdvExpiryAlert(id, action);
    if (push) push(`Alert acknowledged (${action})`, "success");
  };

  const severityCfg = {
    expired: { color: "#c62828", bg: "rgba(198,40,40,0.08)", border: "#c62828", label: "EXPIRED", icon: "🔴" },
    critical: { color: "#e65100", bg: "rgba(230,81,0,0.08)", border: "#e65100", label: "CRITICAL", icon: "🟠" },
    warning: { color: "#f57f17", bg: "rgba(245,127,23,0.08)", border: "#f57f17", label: "WARNING", icon: "🟡" },
  };

  return (
    <>
      {/* Summary Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Expired", v: expired, c: "#c62828", icon: "🔴" },
          { l: "Critical (<7d)", v: critical, c: "#e65100", icon: "🟠" },
          { l: "Warning (<30d)", v: warning, c: "#f57f17", icon: "🟡" },
          { l: "Acknowledged", v: acknowledged.length, c: "#7ed321", icon: "✅" },
        ].map((s) => (
          <div key={s.l} style={{ padding: "14px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, borderLeft: `3px solid ${s.c}` }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>{s.icon} {s.l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.v > 0 ? s.c : "var(--text-primary)" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 160 }}>
          <option value="all">All Severities</option>
          <option value="expired">Expired</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {/* Active Alerts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {active.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
            No active alerts{filterSeverity !== "all" ? ` for "${filterSeverity}"` : ""}.
          </div>
        ) : (
          active.map((a) => {
            const cfg = severityCfg[a.alert_type] || severityCfg.warning;
            return (
              <div key={a.id} style={{ padding: 20, background: cfg.bg, border: `1px solid ${cfg.border}33`, borderLeft: `4px solid ${cfg.border}`, borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${cfg.color}22`, color: cfg.color }}>{cfg.label}</span>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{a.product_name}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
                      Batch: <strong>{a.batch_number}</strong> &middot; {a.warehouse_name}
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
                      <span>Best Before: <strong>{fmtDate(a.best_before_date)}</strong></span>
                      <span style={{ color: cfg.color, fontWeight: 700 }}>
                        {a.days_remaining <= 0 ? `EXPIRED (${Math.abs(a.days_remaining)}d ago)` : `${a.days_remaining}d remaining`}
                      </span>
                      <span>Qty at Risk: <strong>{a.quantity_at_risk}</strong></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["reviewed", "discounted", "disposed", "returned"].map((action) => (
                      <button
                        key={action}
                        onClick={() => handleAcknowledge(a.id, action)}
                        style={{ padding: "6px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "Inter", textTransform: "capitalize", fontWeight: 500 }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Acknowledged Section */}
      {acknowledged.length > 0 && (
        <div>
          <button onClick={() => setShowAcknowledged(!showAcknowledged)} style={{ background: "none", border: "none", fontSize: 13, color: "var(--text-muted)", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, padding: "8px 0" }}>
            {showAcknowledged ? "▼" : "▶"} Acknowledged ({acknowledged.length})
          </button>
          {showAcknowledged && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {acknowledged.map((a) => (
                <div key={a.id} style={{ padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, opacity: 0.7, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{a.product_name} &middot; {a.batch_number} &middot; {fmtDate(a.best_before_date)}</span>
                  <span style={{ fontSize: 11, color: "#7ed321", fontWeight: 600, textTransform: "capitalize" }}>
                    {a.action_taken || "reviewed"} &middot; {fmtDate(a.acknowledged_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
