import React, { useEffect, useMemo, useState } from "react";
import { useMockStoreSnapshot } from "../mockData/mockHooks";

const STATUS_CONFIG = {
  Pending: { color: "#f5a623", bg: "rgba(245,166,35,0.1)" },
  Accepted: { color: "#7ed321", bg: "rgba(126,211,33,0.1)" },
  Confirmed: { color: "#4a90e2", bg: "rgba(74,144,226,0.1)" },
  Rejected: { color: "#e45b5b", bg: "rgba(228,91,91,0.1)" },
  Cancelled: { color: "#6c757d", bg: "rgba(108,117,125,0.1)" },
};

const EMPTY_FORM = {
  supplier_id: "",
  product_name: "",
  quantity: 1,
  unit_price: "",
  valid_until: "",
  expected_delivery: "",
  notes: "",
  credit_days: 30,
};

function fmt(v) {
  return "£" + Number(v).toLocaleString("en-GB");
}

export default function BuyerDashboard({ push }) {
  const suppliers = useMockStoreSnapshot((s) => s?.suppliers || []);
  const inventoryProducts = useMockStoreSnapshot((s) => s?.inventory?.products || []);
  const quotations = useMockStoreSnapshot((s) => s?.buyer?.quotations || []);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detailQ, setDetailQ] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!detailQ) return;
    const updated = quotations.find((q) => q.id === detailQ.id);
    setDetailQ(updated || null);
  }, [quotations, detailQ]);

  const productsBySupplier = useMemo(() => {
    const map = {};
    for (const ip of inventoryProducts) {
      const supplierName = ip?.supplier_name;
      if (!supplierName) continue;

      const sup =
        suppliers.find((s) => s.name === supplierName || s.company_name === supplierName) ||
        null;
      if (!sup) continue;

      const sid = String(sup.id);
      map[sid] = map[sid] || [];

      const productName = ip?.name;
      if (!productName) continue;

      const exists = map[sid].some((p) => p.name === productName);
      if (exists) continue;

      map[sid].push({
        name: productName,
        unit: ip?.uom || "units",
        avg_price: Number(ip?.price || 0),
      });
    }
    return map;
  }, [inventoryProducts, suppliers]);

  const supplierProducts = productsBySupplier[String(form.supplier_id)] || [];

  const total = quotations.length;
  const pending = quotations.filter((q) => q.status === "Pending").length;
  const accepted = quotations.filter((q) => q.status === "Accepted" || q.status === "Confirmed").length;
  const rejected = quotations.filter((q) => q.status === "Rejected").length;

  const filtered = quotations.filter((q) => {
    const s = search.toLowerCase();
    const matchSearch =
      q?.id?.toLowerCase().includes(s) ||
      q?.product_name?.toLowerCase().includes(s) ||
      q?.supplier_name?.toLowerCase().includes(s);
    const matchStatus = filterStatus === "all" || q?.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id || !form.product_name || !form.quantity || !form.unit_price) {
      if (push) push("Please fill all required fields", "error");
      return;
    }

    // We already persist mutations in mockStore via mockApi routes.
    // BuyerDashboard uses the shared store directly; we "simulate" mutation by calling local store actions via axios routes.
    // However this page is store-first now; to keep behavior consistent with other pages,
    // we emulate the original actions.sendBuyerQuotation by updating the store through API mock.
    setSubmitting(true);
    try {
      // lazy-load to avoid circular import
      const { actions } = await import("../mockData/mockStore");
      const payload = {
        buyer_id: 1,
        supplier_id: Number(form.supplier_id),
        product_id: null, // serverless mock/store action will infer product from inventory by product_id if present; fallback by name is not supported
        product_name: form.product_name,
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price),
        target_price: Number(form.unit_price),
        required_delivery_date: form.expected_delivery,
        valid_until: form.valid_until,
        notes: form.notes,
        credit_days: Number(form.credit_days),
      };

      // If we can infer product_id from inventoryProducts, set it so store action can compute supplier/product fields.
      const inv = inventoryProducts.find((ip) => String(ip.supplier_name || "") === String(
        suppliers.find((s) => String(s.id) === String(form.supplier_id))?.name || ""
      ) && ip?.name === form.product_name);
      if (inv?.id) payload.product_id = Number(inv.id);

      actions.sendBuyerQuotation(payload);
      setSubmitting(false);
      setShowForm(false);
      setForm(EMPTY_FORM);
      if (push) push("RFQ sent to supplier!", "success");
    } catch (err) {
      setSubmitting(false);
      if (push) push("Failed to send RFQ", "error");
    }
  };

  const updateStatus = (id, status, notes = "") => {
    // Use store actions via dynamic import to avoid tight coupling.
    // This keeps the UI consistent with other pages that rely on store mutations.
    import("../mockData/mockStore")
      .then(({ actions }) => {
        actions.updateBuyerQuotationStatus(id, status, notes);
      })
      .catch(() => {
        if (push) push("Failed to update quotation status", "error");
      });

    if (detailQ?.id === id) setDetailQ((prev) => (prev ? { ...prev, status } : prev));
    if (push) push(`${id} marked as ${status}`, "success");
  };

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

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>📄 Quotation Requests</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Send RFQs to suppliers and track responses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
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
          + New RFQ
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total RFQs", value: total, icon: "📋", color: "#4a90e2" },
          { label: "Awaiting", value: pending, icon: "⏳", color: "#f5a623" },
          { label: "Accepted", value: accepted, icon: "✅", color: "#7ed321" },
          { label: "Rejected", value: rejected, icon: "❌", color: "#e45b5b" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "16px 20px",
              borderTop: `3px solid ${k.color}`,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by RFQ#, product, supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "auto", minWidth: 160 }}>
          <option value="all">All Statuses</option>
          {Object.keys(STATUS_CONFIG).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-base)" }}>
                {["RFQ #", "Supplier", "Product", "Qty", "Expected Price", "Total", "Date", "Valid Until", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
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
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filtered.map((q, i) => {
                  const sc = STATUS_CONFIG[q.status] || STATUS_CONFIG.Pending;
                  return (
                    <tr
                      key={q.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-base)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--accent)", cursor: "pointer" }} onClick={() => setDetailQ(q)}>
                        {q.id}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>{q.supplier_name}</td>
                      <td style={{ padding: "12px 16px" }}>{q.product_name}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{Number(q.quantity || 0).toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{fmt(q.unit_price)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>{fmt(Number(q.quantity || 0) * Number(q.unit_price || 0))}</td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {q.created_at ? new Date(q.created_at).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {q.valid_until ? new Date(q.valid_until).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {q.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setDetailQ(q)}
                            style={{
                              padding: "4px 10px",
                              background: "var(--bg-base)",
                              border: "1px solid var(--border)",
                              borderRadius: 6,
                              fontSize: 12,
                              cursor: "pointer",
                              fontFamily: "Inter",
                              color: "var(--text-primary)",
                            }}
                          >
                            View
                          </button>

                          {q.status === "Pending" && (
                            <button
                              onClick={() => updateStatus(q.id, "Cancelled")}
                              style={{
                                padding: "4px 10px",
                                background: "rgba(228,91,91,0.1)",
                                border: "1px solid #e45b5b44",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                                fontFamily: "Inter",
                                color: "#e45b5b",
                                fontWeight: 600,
                              }}
                            >
                              Cancel
                            </button>
                          )}

                          {q.status === "Accepted" && (
                            <button
                              onClick={() => updateStatus(q.id, "Confirmed")}
                              style={{
                                padding: "4px 10px",
                                background: "rgba(74,144,226,0.1)",
                                border: "1px solid #4a90e244",
                                borderRadius: 6,
                                fontSize: 12,
                                cursor: "pointer",
                                fontFamily: "Inter",
                                color: "#4a90e2",
                                fontWeight: 600,
                              }}
                            >
                              Confirm
                            </button>
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

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 540,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>New Request for Quotation</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Send a pricing request to a supplier</p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                }}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Supplier *</label>
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value, product_name: "", unit_price: "" })}
                  style={inputStyle}
                  required
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contact})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Product *</label>
                <select
                  value={form.product_name}
                  onChange={(e) => {
                    const next = e.target.value;
                    const prod = supplierProducts.find((p) => p.name === next);
                    setForm({ ...form, product_name: next, unit_price: prod?.avg_price ? String(prod.avg_price) : "" });
                  }}
                  style={inputStyle}
                  required
                  disabled={!form.supplier_id}
                >
                  <option value="">{form.supplier_id ? "-- Select Product --" : "-- Select Supplier First --"}</option>
                  {supplierProducts.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} (avg: £{p.avg_price}/{p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Quantity *</label>
                  <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>Expected Price (£) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              {form.quantity && form.unit_price && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(74,144,226,0.08)",
                    border: "1px solid #4a90e244",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#4a90e2",
                  }}
                >
                  Estimated Total: {fmt(Number(form.quantity) * Number(form.unit_price))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expected Delivery</label>
                  <input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Credit Days</label>
                  <input
                    type="number"
                    min="0"
                    value={form.credit_days}
                    onChange={(e) => setForm({ ...form, credit_days: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special requirements..."
                  style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(EMPTY_FORM);
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "Inter",
                    color: "var(--text-primary)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 24px",
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Inter",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Sending..." : "Send RFQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailQ && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{detailQ.id}</h2>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 6,
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    background: STATUS_CONFIG[detailQ.status]?.bg,
                    color: STATUS_CONFIG[detailQ.status]?.color,
                  }}
                >
                  {detailQ.status}
                </span>
              </div>
              <button
                onClick={() => setDetailQ(null)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)" }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {[
                ["Supplier", detailQ.supplier_name],
                ["Product", detailQ.product_name],
                ["Quantity", Number(detailQ.quantity || 0).toLocaleString() + " units"],
                ["Expected Price", fmt(detailQ.unit_price)],
                ["Total Value", fmt(Number(detailQ.quantity || 0) * Number(detailQ.unit_price || 0))],
                ["Sent On", detailQ.created_at ? new Date(detailQ.created_at).toLocaleDateString("en-GB") : "—"],
                ["Valid Until", detailQ.valid_until ? new Date(detailQ.valid_until).toLocaleDateString("en-GB") : "—"],
                ["Expected Delivery", detailQ.expected_delivery ? new Date(detailQ.expected_delivery).toLocaleDateString("en-GB") : "—"],
                ["Credit Days", String(detailQ.credit_days || 0) + " days"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: label === "Total Value" ? 800 : 500 }}>{val}</span>
                </div>
              ))}

              {detailQ.notes && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--bg-base)", borderRadius: 8, fontSize: 13, color: "var(--text-muted)" }}>
                  <strong>Your Notes:</strong> {detailQ.notes}
                </div>
              )}
              {detailQ.supplier_notes && (
                <div style={{ marginTop: 8, padding: 12, background: "rgba(126,211,33,0.06)", border: "1px solid #7ed32133", borderRadius: 8, fontSize: 13, color: "var(--text-primary)" }}>
                  <strong>Supplier Response:</strong> {detailQ.supplier_notes}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                {detailQ.status === "Accepted" && (
                  <button
                    onClick={() => updateStatus(detailQ.id, "Confirmed")}
                    style={{
                      padding: "10px 18px",
                      background: "#4a90e2",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "Inter",
                    }}
                  >
                    ✓ Confirm Quotation
                  </button>
                )}
                {detailQ.status === "Pending" && (
                  <button
                    onClick={() => updateStatus(detailQ.id, "Cancelled")}
                    style={{
                      padding: "10px 18px",
                      background: "rgba(228,91,91,0.1)",
                      color: "#e45b5b",
                      border: "1px solid #e45b5b44",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "Inter",
                    }}
                  >
                    ✕ Cancel RFQ
                  </button>
                )}

                <button
                  onClick={() => setDetailQ(null)}
                  style={{
                    padding: "10px 18px",
                    background: "var(--bg-base)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "Inter",
                    color: "var(--text-primary)",
                    marginLeft: "auto",
                  }}
                >
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
