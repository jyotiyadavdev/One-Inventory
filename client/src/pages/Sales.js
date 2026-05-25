import React from "react";

export default function Sales({ push }) {
  const orders = [
    { id: "#SO-1042", customer: "Raj Enterprises", items: 5, value: "£12,400", date: "28 Apr 2026", status: "Dispatched" },
    { id: "#SO-1041", customer: "TechZone Pvt Ltd", items: 2, value: "£3,200",  date: "27 Apr 2026", status: "Processing" },
    { id: "#SO-1040", customer: "Mega Retail Co.",  items: 8, value: "£28,900", date: "26 Apr 2026", status: "Delivered" },
    { id: "#SO-1039", customer: "Sunrise Trading",  items: 3, value: "£6,750",  date: "25 Apr 2026", status: "On Hold" },
  ];
  const statusClass = { Dispatched: "cyan", Processing: "yellow", Delivered: "green", "On Hold": "red" };
  
  return (
    <div className="fade-up">
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { label: "Total Orders", value: "148", icon: "🛒", c: "c2 i2" },
          { label: "Delivered",    value: "120", icon: "✅", c: "c4 i4" },
          { label: "Pending",      value: "28",  icon: "⏳", c: "c3 i3" },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.c.split(" ")[0]}`}>
            <div className={`stat-icon ${s.c.split(" ")[1]}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="section-header">
            <div className="section-title">Sales Orders</div>
            <button className="btn btn-primary" onClick={() => push("Feature coming soon!", "error")}>＋ New Order</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Value</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ color: "var(--accent)", fontWeight: 700 }}>{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{o.items}</td>
                  <td style={{ fontWeight: 600 }}>{o.value}</td>
                  <td>{o.date}</td>
                  <td><span className={`pill ${statusClass[o.status]}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
