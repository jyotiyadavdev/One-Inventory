import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";

export default function SupportAgentDashboard({ push, user }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total_tickets: 0, open_tickets: 0, in_progress_tickets: 0,
    resolved_tickets: 0, closed_tickets: 0, on_hold_tickets: 0,
    urgent_tickets: 0, avg_resolution_hours: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");

  // Detail view state
  const [newMessage, setNewMessage] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");

  // Inline edit state
  const [editField, setEditField] = useState(null); // "status"|"priority"|"assigned_to"
  const [editValue, setEditValue] = useState("");

  const agents = ["Agent Sarah", "Dispatcher Admin", "Finance Team", "Warehouse Manager", "Quality Assurance", "Sales Team"];

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const [ticketsRes, statsRes] = await Promise.all([
        axios.get(`${API}/support`, { headers }),
        axios.get(`${API}/support/stats/dashboard`, { headers }),
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    } catch {
      push("Failed to load support data", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchTicketDetail = async (ticketId) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.get(`${API}/support/${ticketId}`, { headers });
      setSelectedTicket(res.data);
      setNewMessage("");
      setEditField(null);
    } catch {
      push("Failed to load ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/support/${selectedTicket.id}/messages`, { message: newMessage }, { headers });
      setNewMessage("");
      await fetchTicketDetail(selectedTicket.id);
      push("Reply sent", "success");
    } catch {
      push("Failed to send reply", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.put(`${API}/support/${selectedTicket.id}`, { [field]: value }, { headers });
      setSelectedTicket(prev => ({
        ...prev,
        [field]: value,
        updated_at: new Date().toISOString(),
        ...(value === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
      }));
      setEditField(null);
      push(`${field.replace("_", " ")} updated`, "success");
      fetchData();
    } catch {
      push(`Failed to update ${field}`, "error");
    }
  };

  const handleResolveTicket = async () => {
    if (!resolutionSummary.trim()) { push("Resolution summary is required", "error"); return; }
    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.put(`${API}/support/${selectedTicket.id}`, {
        status: "resolved", resolution_summary: resolutionSummary,
      }, { headers });
      setSelectedTicket(prev => ({
        ...prev, status: "resolved", resolution_summary: resolutionSummary,
        resolved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }));
      setShowResolveModal(false);
      setResolutionSummary("");
      push("Ticket resolved", "success");
      fetchData();
    } catch {
      push("Failed to resolve ticket", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/support/${selectedTicket.id}/close`, {
        resolution_summary: selectedTicket.resolution_summary || "Closed by agent",
      }, { headers });
      setSelectedTicket(prev => ({ ...prev, status: "closed", updated_at: new Date().toISOString() }));
      push("Ticket closed", "success");
      fetchData();
    } catch {
      push("Failed to close ticket", "error");
    }
  };

  const handleReopenTicket = async () => {
    await handleUpdateField("status", "open");
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const statusColor = (s) => ({ "open": "#ef4444", "in-progress": "#f59e0b", "resolved": "#10b981", "closed": "#6b7280", "on-hold": "#8b5cf6" }[s] || "#6b7280");
  const priorityColor = (p) => ({ "urgent": "#dc2626", "high": "#f97316", "medium": "#eab308", "low": "#22c55e" }[p] || "#6b7280");
  const categoryIcon = (c) => ({ "delivery": "🚚", "product": "📦", "order": "🛒", "billing": "💳", "general": "💬", "other": "📋" }[c] || "📋");

  const timeAgo = (d) => {
    if (!d) return "—";
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString();
  };

  const slaInfo = (t) => {
    if (!t.sla_due_at || t.status === "resolved" || t.status === "closed") return null;
    const h = Math.floor((new Date(t.sla_due_at).getTime() - Date.now()) / 3600000);
    if (h < 0) return { label: "BREACHED", color: "#dc2626", bg: "rgba(220,38,38,0.12)" };
    if (h < 12) return { label: `${h}h left`, color: "#f97316", bg: "rgba(249,115,22,0.12)" };
    if (h < 48) return { label: `${h}h left`, color: "#eab308", bg: "rgba(234,179,8,0.1)" };
    return { label: `${Math.floor(h / 24)}d left`, color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  };

  const badge = (bg) => ({ background: bg, color: "#fff", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" });

  // ── Filtering ────────────────────────────────────────────────────────────
  const uniqueAssignees = [...new Set(tickets.map(t => t.assigned_to).filter(Boolean))];

  const filtered = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterAssignee === "unassigned" && t.assigned_to && t.assigned_to !== "Unassigned") return false;
    if (filterAssignee !== "all" && filterAssignee !== "unassigned" && t.assigned_to !== filterAssignee) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return [t.ticket_number, t.subject, t.description, t.order_number, t.customer_name]
        .some(f => (f || "").toLowerCase().includes(q));
    }
    return true;
  });

  const sCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    "in-progress": tickets.filter(t => t.status === "in-progress").length,
    "on-hold": tickets.filter(t => t.status === "on-hold").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="fade-up" style={{ padding: "20px" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, background: "linear-gradient(45deg, var(--accent-1), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {selectedTicket ? `${selectedTicket.ticket_number}` : "Support Desk"}
          </h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
            {selectedTicket ? selectedTicket.subject : "Triage, assign, and resolve customer tickets"}
          </p>
        </div>
        {selectedTicket && (
          <button className="btn btn-secondary" onClick={() => { setSelectedTicket(null); fetchData(); }}>
            ← Back to Queue
          </button>
        )}
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      {!selectedTicket && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "22px" }}>
          {[
            { label: "Total", val: stats.total_tickets, color: "var(--accent-1)", icon: "📊" },
            { label: "Open", val: stats.open_tickets, color: "#ef4444", icon: "🔴" },
            { label: "In Progress", val: stats.in_progress_tickets, color: "#f59e0b", icon: "🔄" },
            { label: "On Hold", val: stats.on_hold_tickets || 0, color: "#8b5cf6", icon: "⏸️" },
            { label: "Resolved", val: stats.resolved_tickets, color: "#10b981", icon: "✅" },
            { label: "Urgent", val: stats.urgent_tickets || 0, color: "#dc2626", icon: "🚨" },
            { label: "Avg Resolution", val: stats.avg_resolution_hours ? `${stats.avg_resolution_hours}h` : "—", color: "var(--accent-2)", icon: "⏱️" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--bg-surface)", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", opacity: 0.5, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>{s.label}</span>
                <span style={{ fontSize: "16px" }}>{s.icon}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "24px", fontWeight: 800, color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      {!selectedTicket && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" placeholder="Search tickets, customers, orders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: "1 1 220px", minWidth: "180px" }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: "135px" }}>
            <option value="all">All Status ({sCounts.all})</option>
            <option value="open">Open ({sCounts.open})</option>
            <option value="in-progress">In Progress ({sCounts["in-progress"]})</option>
            <option value="on-hold">On Hold ({sCounts["on-hold"]})</option>
            <option value="resolved">Resolved ({sCounts.resolved})</option>
            <option value="closed">Closed ({sCounts.closed})</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ minWidth: "110px" }}>
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ minWidth: "120px" }}>
            <option value="all">All Categories</option>
            <option value="delivery">Delivery</option>
            <option value="product">Product</option>
            <option value="order">Order</option>
            <option value="billing">Billing</option>
            <option value="general">General</option>
            <option value="other">Other</option>
          </select>
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ minWidth: "140px" }}>
            <option value="all">All Agents</option>
            <option value="unassigned">Unassigned</option>
            {uniqueAssignees.filter(a => a !== "Unassigned").map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {(searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all" || filterAssignee !== "all") && (
            <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "7px 12px" }} onClick={() => { setSearchQuery(""); setFilterStatus("all"); setFilterPriority("all"); setFilterCategory("all"); setFilterAssignee("all"); }}>Clear</button>
          )}
        </div>
      )}

      {/* ── Ticket Queue Table ─────────────────────────────────────────── */}
      {!selectedTicket && (
        <div className="card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", opacity: 0.5 }}>Loading ticket queue...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🎧</div>
              <p style={{ opacity: 0.6 }}>{tickets.length === 0 ? "No tickets in the system." : "No tickets match the current filters."}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>SLA</th>
                    <th>Assigned To</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const sla = slaInfo(t);
                    return (
                      <tr key={t.id} onClick={() => fetchTicketDetail(t.id)}
                        style={{ cursor: "pointer", transition: "background 0.15s" }}
                        onMouseOver={e => e.currentTarget.style.background = "var(--bg-surface)"}
                        onMouseOut={e => e.currentTarget.style.background = ""}>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: "13px" }}>{t.ticket_number}</div>
                          {t.order_number && <div style={{ fontSize: "11px", opacity: 0.45 }}>{t.order_number}</div>}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: "13px" }}>{t.customer_name || "—"}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{t.subject}</div>
                          <div style={{ fontSize: "11px", opacity: 0.45, marginTop: "2px" }}>{(t.description || "").substring(0, 55)}{(t.description || "").length > 55 ? "..." : ""}</div>
                        </td>
                        <td><span style={{ display: "flex", alignItems: "center", gap: "4px", textTransform: "capitalize", fontSize: "13px" }}>{categoryIcon(t.category)} {t.category}</span></td>
                        <td><span style={badge(priorityColor(t.priority))}>{(t.priority || "").toUpperCase()}</span></td>
                        <td><span style={badge(statusColor(t.status))}>{(t.status || "").replace("-", " ").toUpperCase()}</span></td>
                        <td>{sla ? <span style={{ fontSize: "12px", fontWeight: 700, color: sla.color, background: sla.bg, padding: "2px 8px", borderRadius: "12px" }}>{sla.label}</span> : <span style={{ opacity: 0.3, fontSize: "12px" }}>—</span>}</td>
                        <td style={{ fontSize: "13px" }}>{t.assigned_to && t.assigned_to !== "Unassigned" ? t.assigned_to : <span style={{ opacity: 0.4, fontStyle: "italic" }}>Unassigned</span>}</td>
                        <td style={{ fontSize: "12px", opacity: 0.55 }}>{timeAgo(t.updated_at || t.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", fontSize: "12px", opacity: 0.45, display: "flex", justifyContent: "space-between" }}>
              <span>Showing {filtered.length} of {tickets.length} tickets</span>
              <span>{sCounts.open} open · {stats.urgent_tickets || 0} urgent</span>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TICKET DETAIL VIEW                                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {selectedTicket && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
          {/* ── Left: Conversation ─────────────────────────────────────── */}
          <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Ticket header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={badge(statusColor(selectedTicket.status))}>{(selectedTicket.status || "").replace("-", " ").toUpperCase()}</span>
                <span style={badge(priorityColor(selectedTicket.priority))}>{(selectedTicket.priority || "").toUpperCase()}</span>
                <span style={{ fontSize: "13px", opacity: 0.6, textTransform: "capitalize" }}>{categoryIcon(selectedTicket.category)} {selectedTicket.category}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <button className="btn btn-primary" style={{ fontSize: "12px", padding: "6px 14px", background: "#10b981", border: "none" }}
                    onClick={() => { setResolutionSummary(""); setShowResolveModal(true); }}>
                    Resolve
                  </button>
                )}
                {selectedTicket.status === "resolved" && (
                  <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "6px 14px" }} onClick={handleCloseTicket}>Close Ticket</button>
                )}
                {selectedTicket.status === "closed" && (
                  <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "6px 14px" }} onClick={handleReopenTicket}>Reopen</button>
                )}
              </div>
            </div>

            {/* Customer info bar */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
              <div>
                <span style={{ opacity: 0.5 }}>Customer: </span>
                <strong>{selectedTicket.customer_name || "Unknown"}</strong>
                {selectedTicket.order_number && <><span style={{ opacity: 0.3, margin: "0 8px" }}>|</span><span style={{ opacity: 0.5 }}>Order: </span><strong style={{ color: "var(--accent-1)" }}>{selectedTicket.order_number}</strong></>}
              </div>
              <span style={{ opacity: 0.4 }}>Created {timeAgo(selectedTicket.created_at)}</span>
            </div>

            {/* Description */}
            {selectedTicket.description && (
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", opacity: 0.4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Issue Description</p>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6 }}>{selectedTicket.description}</p>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px" }}>
              {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                <p style={{ opacity: 0.4, textAlign: "center", padding: "40px 0" }}>No messages yet. Reply below to start the conversation.</p>
              ) : selectedTicket.messages.map((msg, idx) => {
                const isAgent = msg.user_id === user?.id;
                const isSystem = msg.user_id === 0 || (msg.username || "").toLowerCase() === "system";
                const isCustomer = !isAgent && !isSystem;
                return (
                  <div key={msg.id || idx} style={{
                    padding: "12px 16px", borderRadius: "10px",
                    background: isSystem ? "var(--bg-surface)" : isAgent ? "rgba(16, 185, 129, 0.06)" : "rgba(99, 102, 241, 0.06)",
                    borderLeft: isSystem ? "3px solid #6b7280" : isAgent ? "3px solid #10b981" : "3px solid var(--accent-1)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: isSystem ? "#6b7280" : isAgent ? "#10b981" : "var(--accent-1)" }}>
                        {isSystem ? "System" : msg.username || "Unknown"}
                        {isAgent && " (You)"}
                        {isCustomer && <span style={{ opacity: 0.4, fontWeight: 400 }}> — Customer</span>}
                      </span>
                      <span style={{ fontSize: "11px", opacity: 0.4 }}>{timeAgo(msg.created_at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.55 }}>{msg.message || msg.text || ""}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply */}
            {selectedTicket.status !== "closed" ? (
              <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
                <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                  <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    placeholder="Reply to customer..."
                    style={{ flex: 1, minHeight: "55px", resize: "vertical", fontFamily: "inherit", fontSize: "14px" }} />
                  <button type="submit" className="btn btn-primary" disabled={submitting || !newMessage.trim()}
                    style={{ background: "linear-gradient(45deg, #6366f1, #8b5cf6)", border: "none", height: "55px", padding: "0 20px" }}>
                    {submitting ? "..." : "Send"}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", textAlign: "center", opacity: 0.45, fontSize: "13px" }}>
                Ticket is closed. Click "Reopen" to resume the conversation.
              </div>
            )}
          </div>

          {/* ── Right: Sidebar ─────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Actions card */}
            <div className="card" style={{ padding: "18px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.5 }}>Ticket Actions</h3>

              {/* Status */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</p>
                {editField === "status" ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={editValue} onChange={e => setEditValue(e.target.value)} style={{ flex: 1, fontSize: "12px" }}>
                      {["open", "in-progress", "on-hold", "resolved", "closed"].map(s => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                    </select>
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => handleUpdateField("status", editValue)}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditField(null)}>X</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={badge(statusColor(selectedTicket.status))}>{(selectedTicket.status || "").replace("-", " ").toUpperCase()}</span>
                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--accent-1)", fontWeight: 700, padding: 0 }} onClick={() => { setEditValue(selectedTicket.status); setEditField("status"); }}>Change</button>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</p>
                {editField === "priority" ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={editValue} onChange={e => setEditValue(e.target.value)} style={{ flex: 1, fontSize: "12px" }}>
                      {["low", "medium", "high", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => handleUpdateField("priority", editValue)}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditField(null)}>X</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={badge(priorityColor(selectedTicket.priority))}>{(selectedTicket.priority || "").toUpperCase()}</span>
                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--accent-1)", fontWeight: 700, padding: 0 }} onClick={() => { setEditValue(selectedTicket.priority); setEditField("priority"); }}>Change</button>
                  </div>
                )}
              </div>

              {/* Assigned To */}
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "11px", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assign To</p>
                {editField === "assigned_to" ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={editValue} onChange={e => setEditValue(e.target.value)} style={{ flex: 1, fontSize: "12px" }}>
                      <option value="Unassigned">Unassigned</option>
                      {agents.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => handleUpdateField("assigned_to", editValue)}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditField(null)}>X</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{selectedTicket.assigned_to || "Unassigned"}</p>
                    <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--accent-1)", fontWeight: 700, padding: 0 }} onClick={() => { setEditValue(selectedTicket.assigned_to || "Unassigned"); setEditField("assigned_to"); }}>Change</button>
                  </div>
                )}
              </div>
            </div>

            {/* Details card */}
            <div className="card" style={{ padding: "18px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.5 }}>Details</h3>
              {[
                { label: "Ticket #", value: selectedTicket.ticket_number },
                { label: "Customer", value: selectedTicket.customer_name },
                { label: "Created", value: selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                { label: "Last Updated", value: timeAgo(selectedTicket.updated_at || selectedTicket.created_at) },
                { label: "Linked Order", value: selectedTicket.order_number || "None" },
                { label: "Messages", value: String(selectedTicket.messages?.length || 0) },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: i < 5 ? "12px" : 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: "11px", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* SLA card */}
            {(() => {
              const sla = slaInfo(selectedTicket);
              if (!sla) return null;
              return (
                <div className="card" style={{ padding: "14px 18px", borderLeft: `3px solid ${sla.color}` }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.5px" }}>SLA</p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: sla.color }}>{sla.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "11px", opacity: 0.4 }}>Due: {new Date(selectedTicket.sla_due_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              );
            })()}

            {/* Resolution card */}
            {selectedTicket.resolution_summary && (
              <div className="card" style={{ padding: "14px 18px", borderLeft: "3px solid #10b981" }}>
                <p style={{ margin: "0 0 6px", fontSize: "11px", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Resolution</p>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5 }}>{selectedTicket.resolution_summary}</p>
                {selectedTicket.resolved_at && <p style={{ margin: "6px 0 0", fontSize: "11px", opacity: 0.4 }}>Resolved: {new Date(selectedTicket.resolved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Resolve Modal ──────────────────────────────────────────────── */}
      {showResolveModal && (
        <Modal title="Resolve Ticket" onClose={() => setShowResolveModal(false)}>
          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label>Resolution Summary *</label>
            <textarea
              value={resolutionSummary}
              onChange={e => setResolutionSummary(e.target.value)}
              placeholder="Describe how the issue was resolved, any credits applied, actions taken..."
              required
              style={{ minHeight: "120px", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "15px", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting || !resolutionSummary.trim()} onClick={handleResolveTicket}
              style={{ background: "#10b981", border: "none" }}>
              {submitting ? "Resolving..." : "Resolve Ticket"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
