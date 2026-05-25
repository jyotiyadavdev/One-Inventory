import React, { useEffect, useMemo, useState } from "react";
import { useMockStoreSnapshot } from "../mockData/mockHooks";

function formatCurrency(val) {
  const n = Number(val || 0);
  if (n >= 1000000) return "£" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "£" + (n / 1000).toFixed(0) + "K";
  return "£" + n;
}

function Stars({ rating }) {
  const r = Number(rating || 0);
  return (
    <span style={{ color: "#f5a623", letterSpacing: 1 }}>
      {"★".repeat(Math.floor(r))}
      {r % 1 >= 0.5 ? "½" : ""}
      {"☆".repeat(5 - Math.ceil(r))}
      <span style={{ color: "#999", fontSize: 11, marginLeft: 4 }}>({r})</span>
    </span>
  );
}

function pctToTrendLabel(pct) {
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return "0%";
}

export default function BuyerOverview({ push, setActiveModule }) {
  const suppliers = useMockStoreSnapshot((s) => s?.suppliers || []);
  const inventoryProducts = useMockStoreSnapshot((s) => s?.inventory?.products || []);
  const quotations = useMockStoreSnapshot((s) => s?.buyer?.quotations || []);
  const purchaseOrders = useMockStoreSnapshot((s) => s?.buyer?.purchaseOrders || []);
  const reorderHistory = useMockStoreSnapshot((s) => s?.buyer?.reorderHistory || []);

  const [animatedBars, setAnimatedBars] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedBars(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const metrics = useMemo(() => {
    const totalSpend = purchaseOrders
      .filter((p) => p && p.status !== "Cancelled")
      .reduce((sum, p) => sum + Number(p.total || 0), 0);

    const pendingQuotations = quotations.filter((q) => q.status === "Pending").length;

    const reorderAlerts = reorderHistory
      .slice()
      .sort((a, b) => Number(a.days_in_stock || 0) - Number(b.days_in_stock || 0))
      .slice(0, 5)
      .map((r) => {
        const daysLeft = Number(r.days_in_stock || 0);
        const urgency = daysLeft < 5 ? "critical" : daysLeft < 15 ? "warning" : "info";
        const supplierName = r.supplier_name || suppliers.find((s) => String(s.id) === String(r.supplier_id))?.name || "—";
        return { product: r.product_name, daysLeft, supplier: supplierName, urgency };
      });

    const topSuppliers = suppliers
      .map((s) => {
        const posForSupplier = purchaseOrders.filter((p) => String(p.supplier_id) === String(s.id));
        const spend = posForSupplier.reduce((sum, p) => sum + Number(p.total || 0), 0);
        return { name: s.name, orders: posForSupplier.length, spend, rating: s.rating, onTime: 92 + (Number(s.rating || 0) % 8) };
      })
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3);

    const categories = inventoryProducts.reduce((acc, p) => {
      const t = p.type || "General";
      const current = acc[t] || { name: t, amount: 0, count: 0 };
      current.amount += Number(p.stock || 0) * Number(p.price || 0);
      current.count += 1;
      acc[t] = current;
      return acc;
    }, {});

    const categorySpend = Object.values(categories)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c, idx) => {
        const colors = ["#4a90e2", "#f5a623", "#7ed321", "#e45b5b", "#9b59b6"];
        return { name: c.name, amount: c.amount, pct: 0, color: colors[idx % colors.length] };
      });

    const sumCat = categorySpend.reduce((s, c) => s + c.amount, 0) || 1;
    const categorySpendWithPct = categorySpend.map((c) => ({ ...c, pct: Math.round((c.amount / sumCat) * 100) }));

    const quotationsAccepted = quotations.filter((q) => q.status === "Accepted" || q.status === "Confirmed");
    const recentActivity = [
      ...purchaseOrders
        .slice()
        .sort((a, b) => String(b.order_date || "").localeCompare(String(a.order_date || "")))
        .slice(0, 2)
        .map((p) => ({
          type: "po",
          icon: "🛒",
          title: `PO ${p.id} ${p.status}`,
          detail: `${p.supplier_name} – ${p.quantity || 0} ${p.product ? "" : ""}${p.product ? p.product : ""}`.trim(),
          time: p.order_date ? new Date(p.order_date).toLocaleDateString("en-GB") : "—",
          color: "#4a90e2",
        })),
      ...quotationsAccepted
        .slice()
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
        .slice(0, 2)
        .map((q) => ({
          type: "quotation",
          icon: "📄",
          title: `Quotation ${q.id} ${q.status}`,
          detail: `${q.supplier_name} – ${q.product_name}`,
          time: q.created_at ? new Date(q.created_at).toLocaleDateString("en-GB") : "—",
          color: "#7ed321",
        })),
      ...reorderAlerts.map((r) => ({
        type: "alert",
        icon: "⚠️",
        title: "Low Stock Alert",
        detail: `${r.product} – only ${r.daysLeft} days remaining`,
        time: "Today",
        color: r.urgency === "critical" ? "#e45b5b" : r.urgency === "warning" ? "#f5a623" : "#4a90e2",
      })),
    ].slice(0, 5);

    // Month spend approximation from purchaseOrders order_date buckets (last 7 "months" labels)
    
    const monthLabels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
    const monthlySpend = monthLabels.map((label) => ({ month: label, spend: 0 }));

    const labelToMonthIndex = { Nov: 10, Dec: 11, Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4 };

    for (const p of purchaseOrders) {
      if (!p?.order_date) continue;
      const dt = new Date(p.order_date);
      const m = dt.getMonth();
      const labelIdx = monthlySpend.findIndex((x) => x.month in labelToMonthIndex ? labelToMonthIndex[x.month] === m : false);
      if (labelIdx >= 0) monthlySpend[labelIdx].spend += Number(p.total || 0);
    }

    // If everything is zero (no POs), fall back to distribution from totalSpend
    if (monthlySpend.every((m) => m.spend === 0) && totalSpend > 0) {
      const parts = [0.06, 0.08, 0.1, 0.12, 0.16, 0.2, 0.28];
      const sumParts = parts.reduce((a, b) => a + b, 0);
      monthlySpend.forEach((m, idx) => {
        m.spend = Math.round((totalSpend * parts[idx]) / sumParts);
      });
    }

    const maxSpend = Math.max(...monthlySpend.map((m) => m.spend), 1);
    const totalOrders = topSuppliers.reduce((s, x) => s + Number(x.orders || 0), 0) || purchaseOrders.length || 0;

    // Simple trend approximation
    const trendPct = (() => {
      const last = monthlySpend[monthlySpend.length - 1]?.spend || 0;
      const prev = monthlySpend[monthlySpend.length - 2]?.spend || 0;
      if (prev === 0) return last > 0 ? 100 : 0;
      return Math.round(((last - prev) / prev) * 100);
    })();

    return {
      totalSpend,
      pendingQuotations,
      reorderAlerts,
      topSuppliers,
      categorySpend: categorySpendWithPct,
      recentActivity,
      monthlySpend,
      maxSpend,
      totalOrders,
      trendPct,
    };
  }, [suppliers, inventoryProducts, quotations, purchaseOrders, reorderHistory]);

  const kpis = useMemo(() => {
    const activeSuppliers = suppliers.length;

    return [
      {
        label: "Total Spend (YTD)",
        value: formatCurrency(metrics.totalSpend),
        icon: "💰",
        trend: metrics.trendPct ? pctToTrendLabel(metrics.trendPct) : "+0%",
        up: metrics.trendPct >= 0,
        color: "#4a90e2",
        bg: "rgba(74,144,226,0.08)",
      },
      {
        label: "Purchase Orders",
        value: metrics.totalOrders,
        icon: "🛒",
        trend: `${metrics.topSuppliers[0]?.orders || 0} leader`,
        up: true,
        color: "#7ed321",
        bg: "rgba(126,211,33,0.08)",
      },
      {
        label: "Pending Quotations",
        value: metrics.pendingQuotations,
        icon: "📄",
        trend: metrics.pendingQuotations > 0 ? `${metrics.pendingQuotations} awaiting` : "All clear",
        up: metrics.pendingQuotations === 0,
        color: "#f5a623",
        bg: "rgba(245,166,35,0.08)",
      },
      {
        label: "Reorder Alerts",
        value: metrics.reorderAlerts.length,
        icon: "⚠️",
        trend: metrics.reorderAlerts.length ? `${metrics.reorderAlerts[0]?.daysLeft}d critical` : "None",
        up: false,
        color: "#e45b5b",
        bg: "rgba(228,91,91,0.08)",
      },
      {
        label: "Active Suppliers",
        value: activeSuppliers,
        icon: "🏢",
        trend: "All active",
        up: true,
        color: "#9b59b6",
        bg: "rgba(155,89,182,0.08)",
      },
    ];
  }, [metrics, suppliers.length]);

  return (
    <div className="fade-up" style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "var(--text-primary)" }}>👋 Welcome back, Buyer</h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
          Here’s your procurement overview for today — {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "18px 20px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: k.color, borderRadius: "12px 12px 0 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: k.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {k.icon}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: k.up === true ? "rgba(126,211,33,0.12)" : k.up === false ? "rgba(228,91,91,0.12)" : "rgba(245,166,35,0.12)",
                  color: k.up === true ? "#5a9e1c" : k.up === false ? "#c0392b" : "#b07800",
                }}
              >
                {k.trend}
              </span>
            </div>
            <div style={{ marginTop: 14, fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: -0.5 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Monthly Purchase Spend</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Last 7 months — Total: {formatCurrency(metrics.totalSpend)}</div>
            </div>
            <div style={{ fontSize: 12, background: "rgba(74,144,226,0.1)", color: "#4a90e2", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>
              📊 YTD View
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 180 }}>
            {metrics.monthlySpend.map((m, i) => {
              const heightPct = (m.spend / metrics.maxSpend) * 100;
              const isLatest = i === metrics.monthlySpend.length - 1;
              return (
                <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{formatCurrency(m.spend)}</div>
                  <div
                    style={{
                      width: "100%",
                      height: animatedBars ? `${heightPct}%` : "0%",
                      background: isLatest ? "#4a90e2" : "rgba(74,144,226,0.5)",
                      borderRadius: "6px 6px 0 0",
                      transition: `height 0.6s ease ${i * 0.08}s`,
                      position: "relative",
                      minHeight: 4,
                    }}
                  />
                  <div style={{ fontSize: 11, color: isLatest ? "#4a90e2" : "var(--text-muted)", fontWeight: isLatest ? 700 : 400 }}>{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>⚠️ Reorder Alerts</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {metrics.reorderAlerts.length === 0 ? (
              <div style={{ padding: 12, color: "var(--text-muted)", fontWeight: 600 }}>No reorder alerts right now.</div>
            ) : (
              metrics.reorderAlerts.map((alert) => {
                const color = alert.urgency === "critical" ? "#e45b5b" : alert.urgency === "warning" ? "#f5a623" : "#4a90e2";
                const bg =
                  alert.urgency === "critical" ? "rgba(228,91,91,0.06)" : alert.urgency === "warning" ? "rgba(245,166,35,0.06)" : "rgba(74,144,226,0.06)";
                return (
                  <div
                    key={alert.product}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: bg,
                      border: `1px solid ${color}33`,
                      borderLeft: `4px solid ${color}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{alert.product}</div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color,
                          background: bg,
                          padding: "2px 8px",
                          borderRadius: 20,
                          border: `1px solid ${color}44`,
                        }}
                      >
                        {alert.daysLeft}d left
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{alert.supplier}</div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => setActiveModule && setActiveModule("buyer-reorders")}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "10px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter",
            }}
          >
            View All Reorders →
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>🏷️ Spend by Category</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {metrics.categorySpend.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{cat.name}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {formatCurrency(cat.amount)} <strong style={{ color: cat.color }}>({cat.pct}%)</strong>
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: animatedBars ? `${cat.pct}%` : "0%", background: cat.color, borderRadius: 4, transition: "width 0.8s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🏢 Top Suppliers</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Supplier", "Orders", "Spend", "Rating", "On-Time"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.topSuppliers.map((sup, i) => (
                <tr key={sup.name} style={{ borderBottom: i < metrics.topSuppliers.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ padding: "12px 10px", fontWeight: 600, color: "var(--text-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: ["#4a90e2", "#7ed321", "#f5a623"][i] + "22",
                          color: ["#4a90e2", "#7ed321", "#f5a623"][i],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {sup.name.charAt(0)}
                      </div>
                      <span style={{ fontSize: 12 }}>{sup.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 10px", color: "var(--text-muted)" }}>{sup.orders}</td>
                  <td style={{ padding: "12px 10px", fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrency(sup.spend)}</td>
                  <td style={{ padding: "12px 10px" }}>
                    <Stars rating={sup.rating} />
                  </td>
                  <td style={{ padding: "12px 10px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: sup.onTime >= 95 ? "#5a9e1c" : sup.onTime >= 90 ? "#b07800" : "#c0392b",
                      }}
                    >
                      {sup.onTime}%
                    </span>
                  </td>
                </tr>
              ))}
              {metrics.topSuppliers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, color: "var(--text-muted)", fontWeight: 600 }}>
                    No supplier data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>🕐 Recent Activity</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {metrics.recentActivity.length === 0 ? (
              <div style={{ padding: 12, color: "var(--text-muted)", fontWeight: 600 }}>Nothing happening yet.</div>
            ) : (
              metrics.recentActivity.map((act, i) => (
                <div
                  key={`${act.type}-${i}`}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "12px 0",
                    borderBottom: i < metrics.recentActivity.length - 1 ? "1px solid var(--border)" : "none",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: act.color + "18",
                      border: `1px solid ${act.color}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      flexShrink: 0,
                    }}
                  >
                    {act.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{act.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{act.detail}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", marginTop: 2 }}>{act.time}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>⚡ Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "New Quotation Request", icon: "📄", module: "buyer-dashboard", color: "#4a90e2" },
              { label: "View Purchase Orders", icon: "🛒", module: "buyer-purchases", color: "#7ed321" },
              { label: "Reorder History", icon: "🔄", module: "buyer-reorders", color: "#f5a623" },
              { label: "My Suppliers", icon: "🏢", module: "buyer-suppliers", color: "#9b59b6" },
              { label: "My Inventory", icon: "📦", module: "buyer-inventory", color: "#e45b5b" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setActiveModule && setActiveModule(action.module)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: action.color + "10",
                  border: `1px solid ${action.color}33`,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "Inter",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: 18 }}>{action.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{action.label}</span>
                <span style={{ marginLeft: "auto", color: action.color, fontSize: 16, fontWeight: 700 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
