import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";

export default function CustomerSupportPanel({ push, user, isAdmin }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total_tickets: 0, open_tickets: 0, in_progress_tickets: 0,
    resolved_tickets: 0, closed_tickets: 0, on_hold_tickets: 0,
    urgent_tickets: 0, avg_resolution_hours: 0,
  });

  // Search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [newMessage, setNewMessage] = useState("");
  const [newTicket, setNewTicket] = useState({
    subject: "", description: "", category: "general", priority: "medium", order_number: "",
  });

  // Admin actions
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [tempStatus, setTempStatus] = useState("");
  const [tempPriority, setTempPriority] = useState("");
  const [tempAssignee, setTempAssignee] = useState("");

  const agents = ["Agent Sarah", "Dispatcher Admin", "Finance Team", "Warehouse Manager", "Quality Assurance", "Sales Team"];

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      // Admin sees all tickets, customer sees only theirs
      const customerId = user?.customer_id || user?.id;
      const ticketUrl = isAdmin ? `${API}/support` : `${API}/support?customer_id=${customerId}`;
      const statsUrl = isAdmin ? `${API}/support/stats/dashboard` : `${API}/support/stats/dashboard?customer_id=${customerId}`;

      const [ticketsRes, statsRes] = await Promise.all([
        axios.get(ticketUrl, { headers }),
        axios.get(statsUrl, { headers }),
      ]);

      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      push("Failed to load support tickets", "error");
    } finally {
      setLoading(false);
    }
  }, [user, push, isAdmin]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) {
      push("Please fill in all required fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const customerId = user?.customer_id || user?.id;
      await axios.post(`${API}/support`, { ...newTicket, customer_id: customerId }, { headers });
      push("Ticket created successfully", "success");
      setShowCreateModal(false);
      setNewTicket({ subject: "", description: "", category: "general", priority: "medium", order_number: "" });
      fetchTickets();
    } catch (err) {
      push(err.response?.data?.error || "Failed to create ticket", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFetchTicketDetails = async (ticketId) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.get(`${API}/support/${ticketId}`, { headers });
      setSelectedTicket(res.data);
      setNewMessage("");
      setEditingStatus(false);
      setEditingPriority(false);
      setEditingAssignee(false);
    } catch (err) {
      push("Failed to load ticket details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.post(`${API}/support/${selectedTicket.id}/messages`, { message: newMessage }, { headers });
      setNewMessage("");
      await handleFetchTicketDetails(selectedTicket.id);
      push("Message sent", "success");
    } catch (err) {
      push(err.response?.data?.error || "Failed to send message", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicket = async (field, value) => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.put(`${API}/support/${selectedTicket.id}`, { [field]: value }, { headers });
      // Optimistic update
      setSelectedTicket(prev => ({ ...prev, [field]: value, updated_at: new Date().toISOString() }));
      setEditingStatus(false);
      setEditingPriority(false);
      setEditingAssignee(false);
      push(`Ticket ${field.replace("_", " ")} updated`, "success");
      fetchTickets();
    } catch (err) {
      push(`Failed to update ${field}`, "error");
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getStatusColor = (s) => ({ "open": "#ef4444", "in-progress": "#f59e0b", "resolved": "#10b981", "closed": "#6b7280", "on-hold": "#8b5cf6" }[s] || "#6b7280");
  const getPriorityColor = (p) => ({ "urgent": "#dc2626", "high": "#f97316", "medium": "#eab308", "low": "#22c55e" }[p] || "#6b7280");
  const getCategoryIcon = (c) => ({ "delivery": "🚚", "product": "📦", "order": "🛒", "billing": "💳", "general": "💬", "other": "📋" }[c] || "📋");

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getSlaStatus = (ticket) => {
    if (!ticket.sla_due_at || ticket.status === "resolved" || ticket.status === "closed") return null;
    const hoursLeft = Math.floor((new Date(ticket.sla_due_at).getTime() - Date.now()) / (1000 * 60 * 60));
    if (hoursLeft < 0) return { label: "SLA Breached", color: "#dc2626", icon: "🔴" };
    if (hoursLeft < 12) return { label: `${hoursLeft}h left`, color: "#f97316", icon: "🟠" };
    if (hoursLeft < 48) return { label: `${hoursLeft}h left`, color: "#eab308", icon: "🟡" };
    return { label: `${Math.floor(hoursLeft / 24)}d left`, color: "#22c55e", icon: "🟢" };
  };

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (t.ticket_number || "").toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.order_number || "").toLowerCase().includes(q) ||
        (t.customer_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    "in-progress": tickets.filter(t => t.status === "in-progress").length,
    "on-hold": tickets.filter(t => t.status === "on-hold").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  const badge = (bg) => ({ background: bg, color: "white", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap", display: "inline-block" });

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="fade-up" style={{ padding: "20px" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, background: "linear-gradient(45deg, var(--accent-1), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {selectedTicket ? "Ticket Detail" : "Customer Support Dashboard"}
          </h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
            {selectedTicket
              ? `${selectedTicket.ticket_number} — ${selectedTicket.subject}`
              : isAdmin
                ? "Monitor, triage, and resolve customer support tickets"
                : "Track and manage your support requests"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {selectedTicket && (
            <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>← Back to Queue</button>
          )}
          {!selectedTicket && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ background: "linear-gradient(45deg, #6366f1, #8b5cf6)", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 20px -10px rgba(99, 102, 241, 0.5)", transition: "transform 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              + New Ticket
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      {!selectedTicket && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "25px" }}>
          {[
            { label: "Total", value: stats.total_tickets, color: "var(--accent-1)", icon: "📊" },
            { label: "Open", value: stats.open_tickets, color: "#ef4444", icon: "🔴" },
            { label: "In Progress", value: stats.in_progress_tickets, color: "#f59e0b", icon: "🔄" },
            { label: "On Hold", value: stats.on_hold_tickets || 0, color: "#8b5cf6", icon: "⏸️" },
            { label: "Resolved", value: stats.resolved_tickets, color: "#10b981", icon: "✅" },
            { label: "Avg Resolution", value: stats.avg_resolution_hours ? `${stats.avg_resolution_hours}h` : "—", color: "var(--accent-2)", icon: "⏱️" },
          ].map((stat, idx) => (
            <div key={idx} style={{ background: "var(--bg-surface)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "11px", opacity: 0.6, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>{stat.label}</p>
                <span style={{ fontSize: "18px" }}>{stat.icon}</span>
              </div>
              <p style={{ margin: "8px 0 0 0", fontSize: "26px", fontWeight: 800, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Search & Filters ───────────────────────────────────────────── */}
      {!selectedTicket && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" placeholder={isAdmin ? "Search tickets, customers, orders..." : "Search tickets, orders, subjects..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: "1 1 250px", minWidth: "200px" }} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ minWidth: "140px" }}>
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="open">Open ({statusCounts.open})</option>
            <option value="in-progress">In Progress ({statusCounts["in-progress"]})</option>
            <option value="on-hold">On Hold ({statusCounts["on-hold"]})</option>
            <option value="resolved">Resolved ({statusCounts.resolved})</option>
            <option value="closed">Closed ({statusCounts.closed})</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={{ minWidth: "120px" }}>
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ minWidth: "130px" }}>
            <option value="all">All Categories</option>
            <option value="delivery">Delivery</option>
            <option value="product">Product Quality</option>
            <option value="order">Order Issue</option>
            <option value="billing">Billing</option>
            <option value="general">General</option>
            <option value="other">Other</option>
          </select>
          {(searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all") && (
            <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "8px 12px" }} onClick={() => { setSearchQuery(""); setFilterStatus("all"); setFilterPriority("all"); setFilterCategory("all"); }}>Clear</button>
          )}
        </div>
      )}

      {/* ── Ticket Queue ───────────────────────────────────────────────── */}
      {!selectedTicket && (
        <div className="card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", opacity: 0.6 }}>Loading ticket queue...</div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>🎧</div>
              <p style={{ fontSize: "16px", opacity: 0.7 }}>
                {tickets.length === 0 ? "No tickets in the queue." : "No tickets match the current filters."}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    {isAdmin && <th>Customer</th>}
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
                  {filteredTickets.map((ticket) => {
                    const sla = getSlaStatus(ticket);
                    return (
                      <tr key={ticket.id} onClick={() => handleFetchTicketDetails(ticket.id)} style={{ cursor: "pointer", transition: "background 0.15s" }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td>
                          <div style={{ fontWeight: 800, fontSize: "13px" }}>{ticket.ticket_number}</div>
                          {ticket.order_number && <div style={{ fontSize: "11px", opacity: 0.5 }}>{ticket.order_number}</div>}
                        </td>
                        {isAdmin && (
                          <td style={{ fontWeight: 600, fontSize: "13px" }}>{ticket.customer_name || "—"}</td>
                        )}
                        <td>
                          <div style={{ fontWeight: 600 }}>{ticket.subject}</div>
                          <div style={{ fontSize: "11px", opacity: 0.5, marginTop: "2px" }}>
                            {(ticket.description || "").substring(0, 60)}{(ticket.description || "").length > 60 ? "..." : ""}
                          </div>
                        </td>
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", textTransform: "capitalize", fontSize: "13px" }}>
                            {getCategoryIcon(ticket.category)} {ticket.category}
                          </span>
                        </td>
                        <td><span style={badge(getPriorityColor(ticket.priority))}>{(ticket.priority || "").toUpperCase()}</span></td>
                        <td><span style={badge(getStatusColor(ticket.status))}>{(ticket.status || "").replace("-", " ").toUpperCase()}</span></td>
                        <td>
                          {sla ? <span style={{ fontSize: "12px", color: sla.color, fontWeight: 600 }}>{sla.icon} {sla.label}</span>
                            : <span style={{ fontSize: "12px", opacity: 0.4 }}>—</span>}
                        </td>
                        <td style={{ fontSize: "13px" }}>{ticket.assigned_to || <span style={{ opacity: 0.4 }}>Unassigned</span>}</td>
                        <td style={{ fontSize: "12px", opacity: 0.6 }}>{formatTimeAgo(ticket.updated_at || ticket.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filteredTickets.length > 0 && (
            <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", fontSize: "12px", opacity: 0.5 }}>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </div>
          )}
        </div>
      )}

      {/* ── Ticket Detail ──────────────────────────────────────────────── */}
      {selectedTicket && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", minHeight: "500px" }}>
          {/* Left: Conversation */}
          <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {/* Header bar */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={badge(getStatusColor(selectedTicket.status))}>{(selectedTicket.status || "").replace("-", " ").toUpperCase()}</span>
                <span style={badge(getPriorityColor(selectedTicket.priority))}>{(selectedTicket.priority || "").toUpperCase()}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", opacity: 0.7, textTransform: "capitalize" }}>
                  {getCategoryIcon(selectedTicket.category)} {selectedTicket.category}
                </span>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "12px", opacity: 0.6 }}>
                {isAdmin && selectedTicket.customer_name && <span>Customer: <strong style={{ opacity: 1 }}>{selectedTicket.customer_name}</strong></span>}
                {selectedTicket.order_number && <span>Order: <strong style={{ opacity: 1 }}>{selectedTicket.order_number}</strong></span>}
              </div>
            </div>

            {/* Description */}
            {selectedTicket.description && (
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>{selectedTicket.description}</p>
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px" }}>
              {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                <p style={{ opacity: 0.5, textAlign: "center", padding: "40px 0" }}>No messages yet.</p>
              ) : (
                selectedTicket.messages.map((msg, idx) => {
                  const isMe = msg.user_id === user?.id;
                  const isSystem = msg.user_id === 0 || (msg.username || "").toLowerCase() === "system";
                  const isCustomerMsg = !isAdmin && isMe;
                  const isAgentMsg = isAdmin && isMe;
                  return (
                    <div key={msg.id || idx} style={{
                      padding: "12px 16px", borderRadius: "10px",
                      background: isSystem ? "var(--bg-surface)" : (isCustomerMsg || isAgentMsg) ? "rgba(99, 102, 241, 0.08)" : "var(--bg-surface)",
                      borderLeft: isSystem ? "3px solid #6b7280" : (isCustomerMsg || isAgentMsg) ? "3px solid var(--accent-1)" : "3px solid #10b981",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: isSystem ? "#6b7280" : (isCustomerMsg || isAgentMsg) ? "var(--accent-1)" : "#10b981" }}>
                          {isSystem ? "System" : msg.username || "Unknown"}
                          {(isCustomerMsg || isAgentMsg) && !isSystem && <span style={{ opacity: 0.5, fontWeight: 400 }}> (You)</span>}
                        </span>
                        <span style={{ fontSize: "11px", opacity: 0.5 }}>{formatTimeAgo(msg.created_at)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>{msg.message || msg.text || ""}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply */}
            {selectedTicket.status !== "closed" ? (
              <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
                <form onSubmit={handleAddMessage} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                  <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isAdmin ? "Reply to customer..." : "Type your reply..."}
                    style={{ flex: 1, minHeight: "60px", resize: "vertical", fontFamily: "inherit", fontSize: "14px" }} />
                  <button type="submit" className="btn btn-primary" disabled={submitting || !newMessage.trim()}
                    style={{ background: "linear-gradient(45deg, #6366f1, #8b5cf6)", border: "none", height: "60px", padding: "0 20px", whiteSpace: "nowrap" }}>
                    {submitting ? "Sending..." : "Send"}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", textAlign: "center", opacity: 0.5, fontSize: "13px" }}>
                This ticket is closed. {isAdmin ? "Reopen by changing status above." : "Create a new ticket if you need further help."}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Ticket info */}
            <div className="card" style={{ padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: 700 }}>Ticket Information</h3>

              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Ticket #</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{selectedTicket.ticket_number}</p>
              </div>

              {isAdmin && selectedTicket.customer_name && (
                <div style={{ marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{selectedTicket.customer_name}</p>
                </div>
              )}

              {/* Status - editable for admin */}
              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</p>
                {isAdmin && editingStatus ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={tempStatus} onChange={(e) => setTempStatus(e.target.value)} style={{ flex: 1, fontSize: "12px" }}>
                      {["open", "in-progress", "on-hold", "resolved", "closed"].map(s => <option key={s} value={s}>{s.replace("-", " ")}</option>)}
                    </select>
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => handleUpdateTicket("status", tempStatus)}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditingStatus(false)}>X</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={badge(getStatusColor(selectedTicket.status))}>{(selectedTicket.status || "").replace("-", " ").toUpperCase()}</span>
                    {isAdmin && <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--accent-1)", fontWeight: 600, padding: 0 }} onClick={() => { setTempStatus(selectedTicket.status); setEditingStatus(true); }}>Edit</button>}
                  </div>
                )}
              </div>

              {/* Priority - editable for admin */}
              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Priority</p>
                {isAdmin && editingPriority ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={tempPriority} onChange={(e) => setTempPriority(e.target.value)} style={{ flex: 1, fontSize: "12px" }}>
                      {["low", "medium", "high", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => handleUpdateTicket("priority", tempPriority)}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditingPriority(false)}>X</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={badge(getPriorityColor(selectedTicket.priority))}>{(selectedTicket.priority || "").toUpperCase()}</span>
                    {isAdmin && <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--accent-1)", fontWeight: 600, padding: 0 }} onClick={() => { setTempPriority(selectedTicket.priority); setEditingPriority(true); }}>Edit</button>}
                  </div>
                )}
              </div>

              {/* Assigned To - editable for admin */}
              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Assigned To</p>
                {isAdmin && editingAssignee ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <select value={tempAssignee} onChange={(e) => setTempAssignee(e.target.value)} style={{ flex: 1, fontSize: "12px" }}>
                      <option value="Unassigned">Unassigned</option>
                      {agents.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => handleUpdateTicket("assigned_to", tempAssignee)}>Save</button>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditingAssignee(false)}>X</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{selectedTicket.assigned_to || "Unassigned"}</p>
                    {isAdmin && <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "var(--accent-1)", fontWeight: 600, padding: 0 }} onClick={() => { setTempAssignee(selectedTicket.assigned_to || "Unassigned"); setEditingAssignee(true); }}>Edit</button>}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Created</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Updated</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{formatTimeAgo(selectedTicket.updated_at || selectedTicket.created_at)}</p>
              </div>

              {selectedTicket.order_number && (
                <div style={{ marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Linked Order</p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--accent-1)" }}>{selectedTicket.order_number}</p>
                </div>
              )}

              <div>
                <p style={{ margin: "0 0 3px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Messages</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{selectedTicket.messages?.length || 0}</p>
              </div>
            </div>

            {/* SLA */}
            {(() => {
              const sla = getSlaStatus(selectedTicket);
              if (!sla) return null;
              return (
                <div className="card" style={{ padding: "16px 20px", borderLeft: `3px solid ${sla.color}` }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>SLA Status</p>
                  <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: sla.color }}>{sla.icon} {sla.label}</p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "11px", opacity: 0.5 }}>Due: {new Date(selectedTicket.sla_due_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              );
            })()}

            {/* Resolution */}
            {selectedTicket.resolution_summary && (
              <div className="card" style={{ padding: "16px 20px", borderLeft: "3px solid #10b981" }}>
                <p style={{ margin: "0 0 6px 0", fontSize: "11px", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.5px" }}>Resolution Summary</p>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5" }}>{selectedTicket.resolution_summary}</p>
                {selectedTicket.resolved_at && (
                  <p style={{ margin: "8px 0 0 0", fontSize: "11px", opacity: 0.5 }}>Resolved: {new Date(selectedTicket.resolved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Ticket Modal ────────────────────────────────────────── */}
      {showCreateModal && (
        <Modal title="Create Support Ticket" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateTicket}>
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label>Subject *</label>
              <input type="text" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="Brief summary of the issue" required />
            </div>
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label>Description *</label>
              <textarea value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Provide full details including order numbers, quantities, or relevant information..."
                required style={{ minHeight: "120px", resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div className="form-grid" style={{ marginBottom: "15px" }}>
              <div className="form-group">
                <label>Category</label>
                <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}>
                  <option value="general">General</option>
                  <option value="order">Order Issue</option>
                  <option value="delivery">Delivery</option>
                  <option value="product">Product Quality</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                  <option value="low">Low — General inquiry</option>
                  <option value="medium">Medium — Needs attention</option>
                  <option value="high">High — Business impact</option>
                  <option value="urgent">Urgent — Critical issue</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label>Related Order # (optional)</label>
              <input type="text" value={newTicket.order_number} onChange={(e) => setNewTicket({ ...newTicket, order_number: e.target.value })} placeholder="e.g. ORD-2026-001" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid var(--border)" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ background: "linear-gradient(45deg, #6366f1, #8b5cf6)", border: "none" }}>
                {submitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
