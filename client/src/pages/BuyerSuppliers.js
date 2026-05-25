import React, { useMemo, useState } from "react";
import { useMockStoreSnapshot } from "../mockData/mockHooks";

function formatCurrency(val) {
  return "£" + Number(val || 0).toLocaleString("en-IN");
}

function renderStars(rating) {
  const r = Number(rating || 0);
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  let stars = "";
  for (let i = 0; i < full; i++) stars += "★";
  if (half) stars += "½";
  return stars;
}

export default function BuyerSuppliers() {
  const suppliers = useMockStoreSnapshot((s) => s?.suppliers || []);
  const inventoryProducts = useMockStoreSnapshot((s) => s?.inventory?.products || []);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [search, setSearch] = useState("");

  const derivedSuppliers = useMemo(() => {
    // Build "purchased items" out of inventory products by supplier_name.
    // Inventory slice already has price/stock; we map those to the UI fields.
    const bySupplierName = new Map();

    for (const p of inventoryProducts) {
      const supplierName = p?.supplier_name;
      if (!supplierName) continue;

      if (!bySupplierName.has(supplierName)) bySupplierName.set(supplierName, []);
      bySupplierName.get(supplierName).push(p);
    }

    return suppliers.map((s) => {
      const items = (bySupplierName.get(s?.name) || []).map((p, idx) => {
        const qtyPurchased = Number(p?.stock || 0);
        const avgPrice = Number(p?.price || 0);
        const lastPrice = avgPrice; // prototype: keep stable
        const lastOrder = new Date().toISOString().split("T")[0]; // prototype
        return {
          id: String(p?.id ?? idx),
          name: p?.name || "Unknown Item",
          category: p?.type || "General",
          qty_purchased: qtyPurchased,
          unit: p?.uom || "units",
          avg_price: avgPrice,
          last_price: lastPrice,
          last_order: lastOrder,
        };
      });

      const totalOrders = items.length; // prototype metric
      const totalSpent = items.reduce((sum, i) => sum + Number(i.qty_purchased || 0) * Number(i.avg_price || 0), 0);

      return {
        id: s.id,
        name: s.name,
        contact_person: s.contact || s.company_name || "",
        phone: "—",
        email: "—",
        location: "—",
        rating: s.rating,
        total_orders: totalOrders,
        total_spent: totalSpent,
        items,
      };
    });
  }, [inventoryProducts, suppliers]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return derivedSuppliers;
    return derivedSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        String(s.location || "").toLowerCase().includes(term) ||
        (s.items || []).some((i) => i.name.toLowerCase().includes(term))
    );
  }, [derivedSuppliers, search]);

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="section-title">My Suppliers</div>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>View your suppliers, their product catalog, and purchase history.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Total Suppliers</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{derivedSuppliers.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Total Orders</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{derivedSuppliers.reduce((a, s) => a + (s.total_orders || 0), 0)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Total Spent</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-4)" }}>
            {formatCurrency(derivedSuppliers.reduce((a, s) => a + (s.total_spent || 0), 0))}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Unique Items</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>
            {derivedSuppliers.reduce((a, s) => a + (s.items?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search suppliers, items, or locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Main content: supplier list + detail */}
      <div style={{ display: "grid", gridTemplateColumns: selectedSupplier ? "1fr 2fr" : "1fr", gap: 24 }}>
        {/* Supplier List */}
        <div className="card">
          <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Suppliers ({filtered.length})</div>
          </div>

          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {filtered.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSupplier(s)}
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: selectedSupplier?.id === s.id ? "var(--bg-hover, rgba(99,102,241,0.06))" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <span style={{ fontSize: 13, color: "#f59e0b" }}>
                    {renderStars(s.rating)} {s.rating}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
                  {s.contact_person} · {s.location || "—"}
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                  <span>{s.total_orders} orders</span>
                  <span>{s.items?.length || 0} items</span>
                  <span style={{ color: "var(--accent-4)", fontWeight: 600 }}>{formatCurrency(s.total_spent)}</span>
                </div>
              </div>
            ))}

            {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>No suppliers found.</div>}
          </div>
        </div>

        {/* Supplier Detail Panel */}
        {selectedSupplier && (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{selectedSupplier.name}</h2>
                    <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
                      {selectedSupplier.contact_person} · {selectedSupplier.location || "—"}
                    </p>
                  </div>
                  <span className="pill green" style={{ fontSize: 13 }}>
                    {renderStars(selectedSupplier.rating)} {selectedSupplier.rating}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 20 }}>
                  <div style={{ padding: "12px 16px", background: "var(--bg-base)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Phone</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedSupplier.phone || "—"}</div>
                  </div>
                  <div style={{ padding: "12px 16px", background: "var(--bg-base)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Email</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedSupplier.email || "—"}</div>
                  </div>
                  <div style={{ padding: "12px 16px", background: "var(--bg-base)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Total Orders</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedSupplier.total_orders}</div>
                  </div>
                  <div style={{ padding: "12px 16px", background: "var(--bg-base)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Total Spent</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-4)" }}>{formatCurrency(selectedSupplier.total_spent)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Items Purchased ({selectedSupplier.items?.length || 0})</div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Qty Purchased</th>
                      <th>Avg Price</th>
                      <th>Last Price</th>
                      <th>Price Trend</th>
                      <th>Total Cost</th>
                      <th>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSupplier.items || []).map((item) => {
                      const trend = Number(item.last_price || 0) - Number(item.avg_price || 0);
                      const trendPct = item.avg_price ? ((trend / item.avg_price) * 100).toFixed(1) : "0.0";
                      const totalCost = Number(item.qty_purchased || 0) * Number(item.avg_price || 0);
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>
                            <span className="pill blue" style={{ fontSize: 11 }}>{item.category}</span>
                          </td>
                          <td>
                            {Number(item.qty_purchased || 0).toLocaleString("en-IN")} {item.unit}
                          </td>
                          <td>
                            {formatCurrency(item.avg_price)}/{item.unit}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {formatCurrency(item.last_price)}/{item.unit}
                          </td>
                          <td>
                            <span
                              style={{
                                color: trend > 0 ? "#ef4444" : trend < 0 ? "#22c55e" : "var(--text-muted)",
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {trend !== 0 ? `${Math.abs(trendPct)}%` : ""}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--accent-4)" }}>{formatCurrency(totalCost)}</td>
                          <td>{new Date(item.last_order).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!selectedSupplier && filtered.length > 0 && (
          <div className="card" style={{ display: "none" }} />
        )}
      </div>
    </div>
  );
}
