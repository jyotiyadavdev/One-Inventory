import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API } from "../config";

/* ─────────────────────────── dummy mode ─────────────────────────── */

const USE_DUMMY_DATA = true;

const DUMMY_INVOICES = [
  {
    id: 1001,
    type: "invoice",
    counterparty_name: "James Smith",
    counterparty_id: "CUST-001",
    issue_date: "2026-05-01",
    due_date: "2026-05-15",
    status: "Sent",
    currency: "GBP",
    vat_rate: 20,
    taxable_amount: 25000,
    vat_amount: 5000,
    total_amount: 30000,
    amount_paid: 0,
    notes: "Payment due within 14 days.",
    items: [
      {
        description: "Logistics consulting service",
        quantity: 1,
        unit_price: 25000,
        line_total: 25000,
      },
    ],
  },
  {
    id: 1002,
    type: "invoice",
    counterparty_name: "Global Retail Mart",
    counterparty_id: "CUST-002",
    issue_date: "2026-04-20",
    due_date: "2026-05-02",
    status: "Partially Paid",
    currency: "GBP",
    vat_rate: 20,
    taxable_amount: 50000,
    vat_amount: 10000,
    total_amount: 60000,
    amount_paid: 30000,
    notes: "Remaining payment pending.",
    items: [
      {
        description: "Warehouse management package",
        quantity: 1,
        unit_price: 50000,
        line_total: 50000,
      },
    ],
  },
  {
    id: 1003,
    type: "invoice",
    counterparty_name: "Metro Logistics Group",
    counterparty_id: "CUST-003",
    issue_date: "2026-04-01",
    due_date: "2026-04-10",
    status: "Paid",
    currency: "GBP",
    vat_rate: 20,
    taxable_amount: 15000,
    vat_amount: 3000,
    total_amount: 18000,
    amount_paid: 18000,
    notes: "Paid successfully.",
    items: [
      {
        description: "Route optimization service",
        quantity: 1,
        unit_price: 15000,
        line_total: 15000,
      },
    ],
  },
  {
    id: 2001,
    type: "bill",
    counterparty_name: "Cloud Hosting UK",
    counterparty_id: "VEND-001",
    issue_date: "2026-05-01",
    due_date: "2026-05-08",
    status: "Draft",
    currency: "GBP",
    vat_rate: 20,
    taxable_amount: 6000,
    vat_amount: 1200,
    total_amount: 7200,
    amount_paid: 0,
    notes: "Monthly hosting bill.",
    items: [
      {
        description: "Cloud server charges",
        quantity: 1,
        unit_price: 6000,
        line_total: 6000,
      },
    ],
  },
];

/* ─────────────────────────── helpers ─────────────────────────── */

const todayISO = () => new Date().toISOString().split("T")[0];

const createLineItemId = () => `${Date.now()}-${Math.random()}`;

const formatMoney = (value, currency = "GBP") => {
  const amount = Number(value || 0);

  const symbolMap = {
    INR: "₹",
    GBP: "£",
    USD: "$",
    EUR: "€",
  };

  const symbol = symbolMap[currency] || `${currency} `;

  if (!Number.isFinite(amount)) return `${symbol}0`;

  return `${symbol}${amount.toLocaleString("en-GB", {
    maximumFractionDigits: 2,
  })}`;
};

const normalizeStatus = (status = "") => {
  return String(status).toLowerCase().replace(/\s+/g, "_").trim();
};

const isOverdue = (item) => {
  const status = normalizeStatus(item?.status);

  if (status === "paid") return false;
  if (!item?.due_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(item.due_date);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "partially_paid", label: "Partially Paid" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

const STATUS_COLOR = {
  draft: { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
  sent: { bg: "#eff6ff", color: "#3b82f6", dot: "#3b82f6" },
  partially_paid: { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
  paid: { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  overdue: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
};

const getStatusKey = (item) => {
  const status = normalizeStatus(item?.status);

  if (isOverdue(item)) return "overdue";
  if (status === "paid") return "paid";
  if (status.includes("partial")) return "partially_paid";
  if (status === "sent") return "sent";
  if (status === "draft") return "draft";

  return "draft";
};

const getStatusLabel = (item) => {
  const key = getStatusKey(item);

  const labelMap = {
    draft: "Draft",
    sent: "Sent",
    partially_paid: "Partially Paid",
    paid: "Paid",
    overdue: "Overdue",
  };

  return labelMap[key] || item?.status || "Draft";
};

const buildInitialForm = () => ({
  counterparty_name: "",
  counterparty_id: "",
  issue_date: todayISO(),
  due_date: todayISO(),
  status: "Draft",
  currency: "GBP",
  vat_rate: 0,
  taxable_amount: "0",
  vat_amount: "0",
  total_amount: "0",
  notes: "",
});

const buildInitialLineItems = () => [
  {
    id: createLineItemId(),
    description: "",
    quantity: 1,
    unit_price: "0",
  },
];

/* ─────────────────────────── small components ─────────────────────────── */

const StatCard = ({ icon, label, value, accent }) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "20px 24px",
        flex: 1,
        minWidth: 180,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
        }}
      />

      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>

      <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>
        {value}
      </div>

      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
};

const StatusBadge = ({ item }) => {
  const key = getStatusKey(item);
  const meta = STATUS_COLOR[key] || STATUS_COLOR.draft;
  const label = getStatusLabel(item);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: meta.bg,
        color: meta.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: meta.dot,
        }}
      />
      {label}
    </span>
  );
};

const Field = ({ label, children }) => {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
};

/* ─────────────────────────── main component ─────────────────────────── */

const Invoices = ({ push }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [filterType, setFilterType] = useState("invoice");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState("invoice");
  const [viewItem, setViewItem] = useState(null);

  const [form, setForm] = useState(buildInitialForm);
  const [lineItems, setLineItems] = useState(buildInitialLineItems);

  const authHeaders = useMemo(() => {
    return {
      Authorization: `Bearer ${localStorage.getItem("erp_token") || ""}`,
    };
  }, []);

  const computeTotals = (lines, vatRateValue) => {
    const subtotal = lines.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.unit_price || 0);
    }, 0);

    const vatRate = Number(vatRateValue || 0);
    const vat = subtotal * (vatRate / 100);
    const total = subtotal + vat;

    return { subtotal, vat, total };
  };

  const applyTotalsToForm = (nextLines, nextVatRate) => {
    const totals = computeTotals(nextLines, nextVatRate);

    setForm((prev) => ({
      ...prev,
      vat_rate: nextVatRate,
      taxable_amount: String(totals.subtotal),
      vat_amount: String(totals.vat),
      total_amount: String(totals.total),
    }));
  };

  const fetchItems = async () => {
    setLoading(true);

    try {
      if (USE_DUMMY_DATA) {
        setItems(DUMMY_INVOICES);
        return;
      }

      const res = await axios.get(`${API}/invoices`, {
        headers: authHeaders,
      });

      if (Array.isArray(res.data)) {
        setItems(res.data);
      } else if (Array.isArray(res.data?.data)) {
        setItems(res.data.data);
      } else if (Array.isArray(res.data?.items)) {
        setItems(res.data.items);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error(error);

      setItems(DUMMY_INVOICES);
      push?.("Using dummy invoices/bills data", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((item) => item.type === filterType)
      .filter((item) => {
        if (filterStatus === "all") return true;

        const status = normalizeStatus(item.status);

        if (filterStatus === "overdue") return isOverdue(item);
        if (filterStatus === "partially_paid") return status.includes("partial");

        return status === filterStatus;
      });
  }, [items, filterType, filterStatus]);

  const stats = useMemo(() => {
    const itemsOfType = items.filter((item) => item.type === filterType);

    const total = itemsOfType.length;

    const totalVal = itemsOfType.reduce((sum, item) => {
      return sum + Number(item.total_amount || 0);
    }, 0);

    const outstanding = itemsOfType.reduce((sum, item) => {
      const status = normalizeStatus(item.status);

      if (status === "paid") return sum;

      const totalAmount = Number(item.total_amount || 0);
      const amountPaid = Number(item.amount_paid || 0);

      return sum + Math.max(totalAmount - amountPaid, 0);
    }, 0);

    const paid = itemsOfType.reduce((sum, item) => {
      const status = normalizeStatus(item.status);

      if (status !== "paid") return sum;

      return sum + Number(item.total_amount || 0);
    }, 0);

    const currency = itemsOfType[0]?.currency || "GBP";

    return { total, totalVal, outstanding, paid, currency };
  }, [items, filterType]);

  const statusCounts = useMemo(() => {
    const itemsOfType = items.filter((item) => item.type === filterType);

    return STATUS_TABS.reduce((acc, tab) => {
      if (tab.key === "all") {
        acc[tab.key] = itemsOfType.length;
        return acc;
      }

      acc[tab.key] = itemsOfType.filter((item) => {
        const status = normalizeStatus(item.status);

        if (tab.key === "overdue") return isOverdue(item);
        if (tab.key === "partially_paid") return status.includes("partial");

        return status === tab.key;
      }).length;

      return acc;
    }, {});
  }, [items, filterType]);

  const resetModal = () => {
    setForm(buildInitialForm());
    setLineItems(buildInitialLineItems());
  };

  const openCreateModal = (type) => {
    resetModal();
    setFormType(type);
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    resetModal();
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const nextForm = {
        ...prev,
        [field]: value,
      };

      if (field === "vat_rate") {
        const totals = computeTotals(lineItems, value);

        return {
          ...nextForm,
          taxable_amount: String(totals.subtotal),
          vat_amount: String(totals.vat),
          total_amount: String(totals.total),
        };
      }

      return nextForm;
    });
  };

  const updateLineItem = (id, field, value) => {
    const nextLineItems = lineItems.map((item) => {
      if (item.id !== id) return item;

      return {
        ...item,
        [field]: value,
      };
    });

    setLineItems(nextLineItems);
    applyTotalsToForm(nextLineItems, form.vat_rate);
  };

  const addLineItem = () => {
    const nextLineItems = [
      ...lineItems,
      {
        id: createLineItemId(),
        description: "",
        quantity: 1,
        unit_price: "0",
      },
    ];

    setLineItems(nextLineItems);
    applyTotalsToForm(nextLineItems, form.vat_rate);
  };

  const removeLineItem = (id) => {
    if (lineItems.length === 1) {
      push?.("At least one line item is required", "error");
      return;
    }

    const nextLineItems = lineItems.filter((item) => item.id !== id);

    setLineItems(nextLineItems);
    applyTotalsToForm(nextLineItems, form.vat_rate);
  };

  const onCreate = async () => {
    if (!form.counterparty_name.trim()) {
      push?.("Counterparty name is required", "error");
      return;
    }

    if (!form.issue_date) {
      push?.("Issue date is required", "error");
      return;
    }

    if (!form.due_date) {
      push?.("Due date is required", "error");
      return;
    }

    const hasValidLineItem = lineItems.some((item) => {
      return (
        item.description.trim() &&
        Number(item.quantity || 0) > 0 &&
        Number(item.unit_price || 0) >= 0
      );
    });

    if (!hasValidLineItem) {
      push?.("Add at least one valid line item", "error");
      return;
    }

    const totals = computeTotals(lineItems, form.vat_rate);

    const newItem = {
      id: Date.now(),
      type: formType,
      counterparty_name: form.counterparty_name.trim(),
      counterparty_id: form.counterparty_id || null,
      issue_date: form.issue_date,
      due_date: form.due_date,
      status: form.status,
      currency: form.currency,
      vat_rate: Number(form.vat_rate || 0),
      taxable_amount: totals.subtotal,
      vat_amount: totals.vat,
      total_amount: totals.total,
      amount_paid: normalizeStatus(form.status) === "paid" ? totals.total : 0,
      notes: form.notes,
      items: lineItems.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        line_total: Number(item.quantity || 0) * Number(item.unit_price || 0),
      })),
    };

    try {
      setLoading(true);

      if (!USE_DUMMY_DATA) {
        await axios.post(`${API}/invoices`, newItem, {
          headers: authHeaders,
        });

        await fetchItems();
      } else {
        setItems((prev) => [newItem, ...prev]);
      }

      push?.(
        `${formType === "invoice" ? "Invoice" : "Bill"} created successfully`,
        "success"
      );

      closeCreateModal();
    } catch (error) {
      console.error(error);

      setItems((prev) => [newItem, ...prev]);
      push?.("Created locally using dummy data", "info");
      closeCreateModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🧾 Invoices &amp; Bills
          </h2>

          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Manage your{" "}
            {filterType === "invoice" ? "customer invoices" : "vendor bills"}{" "}
            and track payments
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => openCreateModal("invoice")}
            style={{
              padding: "9px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Create Invoice
          </button>

          <button
            type="button"
            onClick={() => openCreateModal("bill")}
            style={{
              padding: "9px 18px",
              background: "#fff",
              color: "#374151",
              border: "1.5px solid #d1d5db",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Create Bill
          </button>
        </div>
      </div>

      {/* Type toggle */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 20,
          background: "#f3f4f6",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
        }}
      >
        {["invoice", "bill"].map((type) => (
          <button
            type="button"
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: "7px 22px",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              background: filterType === type ? "#fff" : "transparent",
              color: filterType === type ? "#111827" : "#6b7280",
              boxShadow:
                filterType === type ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {type === "invoice" ? "📤 Invoices" : "📥 Bills"}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard
          icon="🗂️"
          label={`Total ${filterType === "invoice" ? "Invoices" : "Bills"}`}
          value={stats.total}
          accent="#6366f1"
        />

        <StatCard
          icon="💰"
          label="Total Value"
          value={formatMoney(stats.totalVal, stats.currency)}
          accent="#3b82f6"
        />

        <StatCard
          icon="⏳"
          label="Outstanding"
          value={formatMoney(stats.outstanding, stats.currency)}
          accent="#f59e0b"
        />

        <StatCard
          icon="✅"
          label="Paid"
          value={formatMoney(stats.paid, stats.currency)}
          accent="#22c55e"
        />
      </div>

      {/* Status tabs + table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e5e7eb",
            padding: "0 20px",
            gap: 4,
            overflowX: "auto",
          }}
        >
          {STATUS_TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              style={{
                padding: "14px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontWeight: filterStatus === tab.key ? 700 : 500,
                fontSize: 13,
                color: filterStatus === tab.key ? "#2563eb" : "#6b7280",
                borderBottom:
                  filterStatus === tab.key
                    ? "2px solid #2563eb"
                    : "2px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              {tab.key !== "all" ? (
                <span
                  style={{
                    marginLeft: 6,
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontSize: 11,
                    background:
                      filterStatus === tab.key ? "#eff6ff" : "#f3f4f6",
                    color: filterStatus === tab.key ? "#2563eb" : "#9ca3af",
                    fontWeight: 700,
                  }}
                >
                  {statusCounts[tab.key] || 0}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[
                  "#",
                  filterType === "invoice" ? "Customer" : "Vendor",
                  "Issue Date",
                  "Due Date",
                  "Total Amount",
                  "Paid",
                  "Balance",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "11px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 40 }}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => {
                  const balance =
                    Number(item.total_amount || 0) -
                    Number(item.amount_paid || 0);

                  const statusKey = getStatusKey(item);

                  return (
                    <tr key={`${item.type}-${item.id}`} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "13px 16px", fontWeight: 800 }}>
                        {item.type === "bill" ? "BILL" : "INV"}-{item.id}
                      </td>

                      <td style={{ padding: "13px 16px", fontWeight: 600 }}>
                        {item.counterparty_name || "N/A"}
                      </td>

                      <td style={{ padding: "13px 16px", color: "#6b7280" }}>
                        {item.issue_date
                          ? new Date(item.issue_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td
                        style={{
                          padding: "13px 16px",
                          color: statusKey === "overdue" ? "#dc2626" : "#6b7280",
                          fontWeight: statusKey === "overdue" ? 700 : 400,
                        }}
                      >
                        {item.due_date
                          ? new Date(item.due_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td style={{ padding: "13px 16px", fontWeight: 700 }}>
                        {formatMoney(item.total_amount, item.currency || "INR")}
                      </td>

                      <td style={{ padding: "13px 16px", color: "#16a34a", fontWeight: 600 }}>
                        {formatMoney(item.amount_paid, item.currency || "INR")}
                      </td>

                      <td
                        style={{
                          padding: "13px 16px",
                          color: balance > 0 ? "#d97706" : "#16a34a",
                          fontWeight: 600,
                        }}
                      >
                        {formatMoney(balance, item.currency || "GBP")}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <StatusBadge item={item} />
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <button
                          type="button"
                          onClick={() => setViewItem(item)}
                          style={{
                            padding: "5px 14px",
                            background: "#fff",
                            border: "1.5px solid #d1d5db",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px 0" }}>
                    No {filterType === "invoice" ? "invoices" : "bills"} found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="invoice-modal-content"
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 920,
              maxHeight: "92vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                {formType === "invoice" ? "📤 Create Invoice" : "📥 Create Bill"}
              </h3>

              <button
                type="button"
                onClick={closeCreateModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              <div className="invoice-modal-grid" style={{ marginBottom: 18 }}>
                <Field label="Type">
                  <select
                    className="input"
                    value={formType}
                    onChange={(event) => setFormType(event.target.value)}
                  >
                    <option value="invoice">Invoice</option>
                    <option value="bill">Bill</option>
                  </select>
                </Field>

                <Field label="Status">
                  <select
                    className="input"
                    value={form.status}
                    onChange={(event) =>
                      handleFormChange("status", event.target.value)
                    }
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </Field>
              </div>

              <div className="invoice-modal-grid" style={{ marginBottom: 18 }}>
                <Field
                  label={
                    formType === "invoice"
                      ? "Customer Name *"
                      : "Vendor Name *"
                  }
                >
                  <input
                    className="input"
                    value={form.counterparty_name}
                    onChange={(event) =>
                      handleFormChange("counterparty_name", event.target.value)
                    }
                    placeholder={
                      formType === "invoice"
                        ? "Enter customer name"
                        : "Enter vendor name"
                    }
                  />
                </Field>

                <Field label="Counterparty ID">
                  <input
                    className="input"
                    value={form.counterparty_id}
                    onChange={(event) =>
                      handleFormChange("counterparty_id", event.target.value)
                    }
                    placeholder="Optional"
                  />
                </Field>

                <Field label="Issue Date *">
                  <input
                    className="input"
                    type="date"
                    value={form.issue_date}
                    onChange={(event) =>
                      handleFormChange("issue_date", event.target.value)
                    }
                  />
                </Field>

                <Field label="Due Date *">
                  <input
                    className="input"
                    type="date"
                    value={form.due_date}
                    onChange={(event) =>
                      handleFormChange("due_date", event.target.value)
                    }
                  />
                </Field>

                <Field label="VAT Rate (%)">
                  <input
                    type="number"
                    className="input"
                    value={form.vat_rate}
                    onChange={(event) =>
                      handleFormChange("vat_rate", event.target.value)
                    }
                  />
                </Field>

                <Field label="Currency">
                  <select
                    className="input"
                    value={form.currency}
                    onChange={(event) =>
                      handleFormChange("currency", event.target.value)
                    }
                  >
                    <option value="GBP">GBP — £</option>
                    <option value="USD">USD — $</option>
                  </select>
                </Field>

              </div>

              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <strong>Line Items</strong>

                  <button
                    type="button"
                    onClick={addLineItem}
                    style={{
                      padding: "5px 12px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    + Add Item
                  </button>
                </div>

                <div
                  className="invoice-line-table"
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    overflow: "auto",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
                    <thead>
                      <tr>
                        {["Description", "Qty", "Unit Price", "Total", ""].map(
                          (heading) => (
                            <th
                              key={heading || "action"}
                              style={{
                                padding: "9px 12px",
                                textAlign: "left",
                                fontSize: 11,
                                color: "#6b7280",
                                textTransform: "uppercase",
                              }}
                            >
                              {heading}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {lineItems.map((item) => {
                        const lineTotal =
                          Number(item.quantity || 0) *
                          Number(item.unit_price || 0);

                        return (
                          <tr key={item.id}>
                            <td style={{ padding: "8px 12px" }}>
                              <input
                                className="input"
                                value={item.description}
                                onChange={(event) =>
                                  updateLineItem(
                                    item.id,
                                    "description",
                                    event.target.value
                                  )
                                }
                                placeholder="Item description"
                              />
                            </td>

                            <td style={{ padding: "8px 12px" }}>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateLineItem(
                                    item.id,
                                    "quantity",
                                    event.target.value
                                  )
                                }
                              />
                            </td>

                            <td style={{ padding: "8px 12px" }}>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                value={item.unit_price}
                                onChange={(event) =>
                                  updateLineItem(
                                    item.id,
                                    "unit_price",
                                    event.target.value
                                  )
                                }
                              />
                            </td>

                            <td style={{ padding: "8px 12px", fontWeight: 700 }}>
                              {formatMoney(lineTotal, form.currency)}
                            </td>

                            <td style={{ padding: "8px 12px" }}>
                              <button
                                type="button"
                                onClick={() => removeLineItem(item.id)}
                                style={{
                                  padding: "4px 10px",
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1px solid #fecaca",
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="invoice-modal-grid">
                <Field label="Notes">
                  <textarea
                    className="input"
                    rows={4}
                    value={form.notes}
                    onChange={(event) =>
                      handleFormChange("notes", event.target.value)
                    }
                    placeholder="Add notes or payment terms…"
                  />
                </Field>

                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <strong>Summary</strong>

                  <div style={{ marginTop: 14 }}>
                    <SummaryRow
                      label="Taxable Amount"
                      value={formatMoney(form.taxable_amount, form.currency)}
                    />
                    <SummaryRow
                      label={`VAT (${form.vat_rate}%)`}
                      value={formatMoney(form.vat_amount, form.currency)}
                    />

                    <div
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        paddingTop: 12,
                        marginTop: 8,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <strong>Total</strong>
                      <strong style={{ color: "#2563eb", fontSize: 16 }}>
                        {formatMoney(form.total_amount, form.currency)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "#f9fafb",
              }}
            >
              <button
                type="button"
                onClick={closeCreateModal}
                style={{
                  padding: "9px 20px",
                  background: "#fff",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onCreate}
                disabled={loading}
                style={{
                  padding: "9px 24px",
                  background: loading ? "#93c5fd" : "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Saving…"
                  : `Create ${formType === "invoice" ? "Invoice" : "Bill"}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* View Modal */}
      {viewItem ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 640,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {viewItem.type === "bill" ? "BILL" : "INV"}-{viewItem.id}
                </h3>
                <p style={{ color: "#6b7280" }}>
                  {viewItem.counterparty_name || "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewItem(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <StatusBadge item={viewItem} />

            <div style={{ marginTop: 20 }}>
              <SummaryRow
                label="Total Amount"
                value={formatMoney(viewItem.total_amount, viewItem.currency)}
              />
              <SummaryRow
                label="Amount Paid"
                value={formatMoney(viewItem.amount_paid, viewItem.currency)}
              />
              <SummaryRow
                label="Balance"
                value={formatMoney(
                  Number(viewItem.total_amount || 0) -
                    Number(viewItem.amount_paid || 0),
                  viewItem.currency
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => setViewItem(null)}
              style={{
                marginTop: 20,
                padding: "9px 20px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SummaryRow = ({ label, value }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10,
        fontSize: 13,
      }}
    >
      <span style={{ color: "#6b7280" }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
};

export default Invoices;