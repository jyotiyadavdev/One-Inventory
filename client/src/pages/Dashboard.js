import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../config";

export default function Dashboard({ products = [] }) {
  const [notifications, setNotifications] = useState([]);
  const [, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
        const res = await axios.get(`${API}/notifications`, { headers });
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const stats = [
    { label: "Total Revenue", value: "£4.8M", icon: "💰", trend: "+12.5%", up: true, c: "c1 i1" },
    { label: "Active Orders", value: "142", icon: "🛒", trend: "+8.2%", up: true, c: "c2 i2" },
    { label: "Products", value: products.length, icon: "📦", trend: "Inventory", up: true, c: "c3 i3" },
    { label: "Customers", value: "892", icon: "👥", trend: "+14.1%", up: true, c: "c4 i4" },
    { label: "Alerts", value: notifications.filter(n => !n.is_read).length, icon: "⚠️", trend: "Pending", up: false, c: "c5 i5" },
  ];

  return (
    <div className="fade-up">
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card ${s.c.split(" ")[0]}`}>
            <div className="stat-header">
              <div className={`stat-icon ${s.c.split(" ")[1]}`}>{s.icon}</div>
              <div className={`stat-trend ${s.up ? "up" : "down"}`}>{s.trend}</div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-body">
            <div className="section-title">Operational Efficiency</div>
            <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "10px", padding: "20px 0" }}>
              {[60, 80, 45, 90, 70, 85, 95].map((h, i) => (
                <div key={i} style={{ flex: 1, height: `${h}%`, background: "var(--accent-glow)", borderRadius: "4px", position: "relative" }}>
                  <div style={{ position: "absolute", bottom: 0, width: "100%", height: "40%", background: "var(--accent)", borderRadius: "4px" }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="section-title">Notifications & Recent Activity</div>
            <div className="activity-list" style={{ marginTop: "15px", maxHeight: "300px", overflowY: "auto" }}>
              {notifications.length > 0 ? (
                notifications.map((n, i) => (
                  <div key={n.id} style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none", opacity: n.is_read ? 0.6 : 1 }}>
                    <div style={{ 
                      width: "36px", 
                      height: "36px", 
                      borderRadius: "50%", 
                      background: n.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-base)', 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontSize: "14px",
                      border: `1px solid ${n.type === 'danger' ? '#ef4444' : 'var(--border)'}`
                    }}>
                      {n.type === 'danger' ? '⚠️' : '🔔'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700 }}>{n.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 2 }}>{n.message}</div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", marginTop: 5 }}></div>}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px", opacity: 0.5, fontSize: "13px" }}>No recent notifications.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
