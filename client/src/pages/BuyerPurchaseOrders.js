import React, { useMemo, useState } from "react";
import { useMockStoreSnapshot } from "../mockData/mockHooks";
import { actions } from "../mockData/mockStore";

const STATUS_CFG = {
  Draft: { color: "#6c757d", bg: "rgba(108,117,125,0.1)" },
  Pending: { color: "#f5a623", bg: "rgba(245,166,35,0.1)" },
  Confirmed: { color: "#4a90e2", bg: "rgba(74,144,226,0.1)" },
  Received: { color: "#7ed321", bg: "rgba(126,211,33,0.1)" },
  Cancelled: { color: "#e45b5b", bg: "rgba(228,91,91,0.1)" },
};

const TABS = ["All", "Active", "Received", "Reorders"];

function fmt(v) {
  return "£" + Number(v || 0).toLocaleString("en-GB");
}

const EMPTY_FORM = {
  supplier_id: "",
  product: "",
  quantity: 1,
  unit_price: "",
  expected_delivery: "",
  delivery_address: "Warehouse A, Industrial Area",
  payment_terms: "Net 30",
  notes: "",
  is_reorder: false,
  reorder_of: "",
};

export default function BuyerPurchaseOrders({ push }) {
  const suppliers = useMockStoreSnapshot((s) => s?.suppliers || []);
  const inventoryProducts = useMockStoreSnapshot((s) => s?.inventory?.products || []);
  const pos = useMockStoreSnapshot((s) => s?.buyer?.purchaseOrders || []);

  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailPO, setDetailPO] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const productsBySupplier = useMemo(() => {
    const map = {};
    for (const p of inventoryProducts) {
      const supplierName = p?.supplier_name;
      if (!supplierName) continue;
      const sup = suppliers.find((s) => s.name === supplierName || s.company_name === supplierName);
      if (!sup) continue;
      const sid = String(sup.id);
      map[sid] = map[sid] || [];
      if (!map[sid].includes(p.name)) map[sid].push(p.name);
    }
    return map;
  }, [inventoryProducts, suppliers]);

  const derivedFormProductList = productsBySupplier[String(form.supplier_id)] || [];

  const byTab = pos.filter((p) => {
    if (tab === "Active") return ["Pending", "Confirmed", "Draft"].includes(p.status);
    if (tab === "Received") return p.status === "Received";
    if (tab === "Reorders") return Boolean(p.is_reorder);
    return true;
  });

  const filtered = byTab.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      String(p.product || "").toLowerCase().includes(search.toLowerCase()) ||
      p.supplier_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpend = pos.filter((p) => p.status !== "Cancelled").reduce((s, p) => s + Number(p.total || 0), 0);
  const active = pos.filter((p) => ["Pending", "Confirmed"].includes(p.status)).length;
  const received = pos.filter((p) => p.status === "Received").length;
  const reorders = pos.filter((p) => p.is_reorder).length;

  const handleReorder = (po) => {
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 7);
    const deliveryStr = delivery.toISOString().split("T")[0];

    setForm({
      supplier_id: po.supplier_id,
      product: po.product,
      quantity: po.quantity,
      unit_price: po.unit_price,
      expected_delivery: deliveryStr,
      delivery_address: po.delivery_address,
      payment_terms: po.payment_terms,
      notes: `Reorder of ${po.id}`,
      is_reorder: true,
      reorder_of: po.id,
    });
    setDetailPO(null);
    setShowForm(true);
  };

  const handleCreate = async () => {
    const { supplier_id, product, quantity, unit_price, expected_delivery } = form;
    if (!supplier_id || !product || !quantity || !unit_price || !expected_delivery) {
      if (push) push("Please fill all required fields", "error");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));

    const supplier = suppliers.find((s) => String(s.id) === String(supplier_id));
    const invMatch = inventoryProducts.find(
      (ip) => String(ip.supplier_name || "") === String(supplier?.name || "") && ip.name === product
    );

    actions.upsertBuyerPurchaseOrder({
      supplier_id: Number(supplier_id),
      supplier_name: supplier?.name || "",
      product,
      quantity: Number(quantity),
      unit_price: Number(unit_price),
      expected_delivery,
      delivery_address: form.delivery_address,
      payment_terms: form.payment_terms,
      notes: form.notes,
      is_reorder: Boolean(form.is_reorder),
      reorder_of: form.reorder_of || "",
      // allow action to derive total/optional fields
      unit_uom: invMatch?.uom,
    });

    setSubmitting(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
    if (push) push(form.is_reorder ? "Reorder created!" : "Purchase Order created!", "success");
  };

  const updateStatus = (id, status) => {
    actions.updateBuyerPurchaseOrderStatus(id, status);
    if (detailPO?.id === id) setDetailPO((prev) => (prev ? { ...prev, status } : prev));
    if (push) push(`${id} → ${status}`, "success");
  };

  const btnBase = {
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "Inter",
    fontWeight: 600,
    padding: "4px 10px",
  };

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>🛒 Purchase Orders</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Create orders, track deliveries, and reorder in one place
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          style={{
            padding: "10px 20px",
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "Inter",
          }}
        >
          + New Purchase Order
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total POs", value: pos.length, icon: "📋", color: "#4a90e2", onClick: () => setTab("All") },
          { label: "Active", value: active, icon: "⏳", color: "#f5a623", onClick: () => setTab("Active") },
          { label: "Received", value: received, icon: "✅", color: "#7ed321", onClick: () => setTab("Received") },
          { label: "Reorders", value: reorders, icon: "🔄", color: "#9b59b6", onClick: () => setTab("Reorders") },
          { label: "Total Spend", value: fmt(totalSpend), icon: "💰", color: "#e45b5b", onClick: () => {} },
        ].map((k) => (
          <div
            key={k.label}
            onClick={k.onClick}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "16px 20px",
              borderTop: `3px solid ${k.color}`,
              cursor: k.onClick ? "pointer" : "default",
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-base)", borderRadius: 10, padding: 4, border: "1px solid var(--border)" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "6px 16px",
                borderRadius: 7,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter",
                background: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "white" : "var(--text-muted)",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search PO#, product, supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: 220,
            flex: 1,
            minWidth: 200,
            padding: "9px 12px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "Inter",
            background: "var(--bg-base)",
            color: "var(--text-primary)",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base)" }}>
                {["PO #", "Type", "Supplier", "Product", "Qty", "Total", "Order Date", "Delivery", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((po, i) => {
                  const sc = STATUS_CFG[po.status] || STATUS_CFG.Draft;
                  return (
                    <tr
                      key={po.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "var(--accent)", cursor: "pointer" }} onClick={() => setDetailPO(po)}>
                        {po.id}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {po.is_reorder ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "rgba(155,89,182,0.12)", color: "#9b59b6" }}>
                            🔄 Reorder
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "rgba(74,144,226,0.1)", color: "#4a90e2" }}>
                            🆕 New
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{po.supplier_name}</td>
                      <td style={{ padding: "12px 14px" }}>{po.product}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)" }}>{Number(po.quantity || 0).toLocaleString()}</td>
                      <td style={{ padding: "12px 14px", fontWeight: 700 }}>{fmt(po.total)}</td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {po.order_date ? new Date(po.order_date).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {po.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <button
                            onClick={() => setDetailPO(po)}
                            style={{ ...btnBase, background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 500 }}
                          >
                            View
                          </button>
                          {po.status === "Pending" && (
                            <button onClick={() => updateStatus(po.id, "Confirmed")} style={{ ...btnBase, background: "rgba(74,144,226,0.1)", color: "#4a90e2" }}>
                              Confirm
                            </button>
                          )}
                          {po.status === "Confirmed" && (
                            <button onClick={() => updateStatus(po.id, "Received")} style={{ ...btnBase, background: "rgba(126,211,33,0.1)", color: "#5a9e1c" }}>
                              Receive
                            </button>
                          )}
                          {po.status === "Received" && <button onClick={() => handleReorder(po)} style={{ ...btnBase, background: "rgba(155,89,182,0.1)", color: "#9b59b6" }}>🔄 Reorder</button>}
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

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{form.is_reorder ? "🔄 Create Reorder" : "🛒 New Purchase Order"}</h2>
                {form.is_reorder && form.reorder_of && (
                  <div style={{ marginTop: 6, padding: "4px 10px", display: "inline-block", background: "rgba(155,89,182,0.1)", borderRadius: 20, fontSize: 12, color: "#9b59b6", fontWeight: 600 }}>
                    Based on {form.reorder_of} — pre-filled for you
                  </div>
                )}
              </div>
              <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}>
                ×
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Supplier *
                </label>
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value, product: "" })} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box" }}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Product *
                </label>
                <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box" }} disabled={!form.supplier_id}>
                  <option value="">{form.supplier_id ? "-- Select Product --" : "-- Select Supplier First --"}</option>
                  {derivedFormProductList.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Quantity *
                  </label>
                  <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Unit Price (£) *
                  </label>
                  <input type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box" }} />
                </div>
              </div>

              {form.quantity && form.unit_price && (
                <div style={{ padding: "10px 14px", background: "rgba(74,144,226,0.08)", border: "1px solid #4a90e244", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "#4a90e2" }}>
                  Order Total: {fmt(Number(form.quantity) * Number(form.unit_price))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Expected Delivery *
                  </label>
                  <input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                    Payment Terms
                  </label>
                  <select value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box" }}>
                    {["Net 15", "Net 30", "Net 45", "Advance", "COD"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Delivery Address
                </label>
                <input type="text" value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Notes
                </label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special instructions..." style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "Inter", background: "var(--bg-base)", color: "var(--text-primary)", boxSizing: "border-box", minHeight: 60, resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} style={{ padding: "10px 20px", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "Inter", color: "var(--text-primary)" }}>
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={submitting} style={{ padding: "10px 24px", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Creating..." : form.is_reorder ? "Place Reorder" : "Create PO"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailPO && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{detailPO.id}</h2>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_CFG[detailPO.status]?.bg, color: STATUS_CFG[detailPO.status]?.color }}>
                    {detailPO.status}
                  </span>
                  {detailPO.is_reorder && <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "rgba(155,89,182,0.1)", color: "#9b59b6" }}>🔄 Reorder of {detailPO.reorder_of}</span>}
                </div>
              </div>
              <button onClick={() => setDetailPO(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}>
                ×
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {[
                ["Supplier", detailPO.supplier_name],
                ["Product", detailPO.product],
                ["Quantity", Number(detailPO.quantity || 0).toLocaleString() + " units"],
                ["Unit Price", fmt(detailPO.unit_price)],
                ["Total Amount", fmt(detailPO.total)],
                ["Order Date", detailPO.order_date ? new Date(detailPO.order_date).toLocaleDateString("en-GB") : "—"],
                ["Expected Delivery", detailPO.expected_delivery ? new Date(detailPO.expected_delivery).toLocaleDateString("en-GB") : "—"],
                ["Payment Terms", detailPO.payment_terms],
                ["Delivery Address", detailPO.delivery_address],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: label === "Total Amount" ? 800 : 500, textAlign: "right", maxWidth: "60%" }}>{val}</span>
                </div>
              ))}

              {detailPO.notes && (
                <div style={{ marginTop: 14, padding: 12, background: "var(--bg-base)", borderRadius: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  <strong>Notes:</strong> {detailPO.notes}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                {detailPO.status === "Pending" && (
                  <button onClick={() => updateStatus(detailPO.id, "Confirmed")} style={{ padding: "10px 18px", background: "#4a90e2", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
                    ✓ Confirm
                  </button>
                )}
                {detailPO.status === "Confirmed" && (
                  <button onClick={() => updateStatus(detailPO.id, "Received")} style={{ padding: "10px 18px", background: "#7ed321", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
                    📦 Mark Received
                  </button>
                )}
                {detailPO.status === "Received" && (
                  <button onClick={() => handleReorder(detailPO)} style={{ padding: "10px 18px", background: "#9b59b6", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
                    🔄 Reorder This
                  </button>
                )}
                {["Draft", "Pending"].includes(detailPO.status) && (
                  <button onClick={() => updateStatus(detailPO.id, "Cancelled")} style={{ padding: "10px 18px", background: "rgba(228,91,91,0.1)", color: "#e45b5b", border: "1px solid #e45b5b44", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter" }}>
                    ✕ Cancel
                  </button>
                )}
                <button onClick={() => setDetailPO(null)} style={{ padding: "10px 18px", background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "Inter", color: "var(--text-primary)", marginLeft: "auto" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
