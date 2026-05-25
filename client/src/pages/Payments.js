import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  },
  {
    id: 1002,
    type: "invoice",
    counterparty_name: "Global Retail Mart",
    counterparty_id: "CUST-002",
    issue_date: "2026-04-20",
    due_date: "2026-05-20",
    status: "Partially Paid",
    currency: "GBP",
    vat_rate: 20,
    taxable_amount: 50000,
    vat_amount: 10000,
    total_amount: 60000,
    amount_paid: 30000,
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
  },
  {
    id: 2001,
    type: "bill",
    counterparty_name: "Cloud Hosting UK",
    counterparty_id: "VEND-001",
    issue_date: "2026-05-01",
    due_date: "2026-05-12",
    status: "Draft",
    currency: "GBP",
    vat_rate: 20,
    taxable_amount: 6000,
    vat_amount: 1200,
    total_amount: 7200,
    amount_paid: 0,
  },
  {
    id: 2002,
    type: "bill",
    counterparty_name: "Software Solutions Ltd",
    counterparty_id: "VEND-002",
    issue_date: "2026-05-03",
    due_date: "2026-05-18",
    status: "Partially Paid",
    currency: "GBP",
    vat_rate: 20,
    taxable_amount: 12000,
    vat_amount: 2400,
    total_amount: 14400,
    amount_paid: 5000,
  },
];

const DUMMY_PAYMENTS = [
  {
    id: 501,
    invoice_id: 1002,
    invoice_type: "invoice",
    counterparty_name: "Global Retail Mart",
    payment_date: "2026-05-05",
    method: "Bank Transfer",
    amount: 30000,
    currency: "GBP",
    status: "Completed",
    reference_id: "TXN-GLOBAL-001",
    notes: "Partial payment received.",
  },
  {
    id: 502,
    invoice_id: 1003,
    invoice_type: "invoice",
    counterparty_name: "Metro Logistics Group",
    payment_date: "2026-04-08",
    method: "Bank Transfer",
    amount: 18000,
    currency: "GBP",
    status: "Completed",
    reference_id: "TXN-METRO-003",
    notes: "Full payment received.",
  },
  {
    id: 503,
    invoice_id: 2002,
    invoice_type: "bill",
    counterparty_name: "Software Solutions Ltd",
    payment_date: "2026-05-06",
    method: "Bank Transfer",
    amount: 5000,
    currency: "GBP",
    status: "Completed",
    reference_id: "BILL-SOFT-002",
    notes: "Partial bill payment.",
  },
];

/* ─────────────────────────── helpers ─────────────────────────── */

const todayISO = () => new Date().toISOString().split("T")[0];

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

const paymentStatusColor = (status) => {
  const normalized = normalizeStatus(status);

  if (normalized === "completed") {
    return {
      bg: "#f0fdf4",
      color: "#16a34a",
      dot: "#22c55e",
      label: "Completed",
    };
  }

  if (normalized === "pending") {
    return {
      bg: "#fffbeb",
      color: "#d97706",
      dot: "#f59e0b",
      label: "Pending",
    };
  }

  if (normalized === "failed") {
    return {
      bg: "#fef2f2",
      color: "#dc2626",
      dot: "#ef4444",
      label: "Failed",
    };
  }

  return {
    bg: "#f3f4f6",
    color: "#6b7280",
    dot: "#9ca3af",
    label: status || "Completed",
  };
};

const getInvoiceBalance = (invoice) => {
  const total = Number(invoice?.total_amount || 0);
  const paid = Number(invoice?.amount_paid || invoice?.amount_paid_total || 0);
  const balance = total - paid;

  return balance > 0 ? balance : 0;
};

const getNextStatusAfterPayment = (invoice, nextPaidAmount) => {
  const total = Number(invoice?.total_amount || 0);

  if (nextPaidAmount >= total) return "Paid";
  if (nextPaidAmount > 0) return "Partially Paid";

  return invoice?.status || "Draft";
};

const getApiArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

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

      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
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

const StatusBadge = ({ status }) => {
  const meta = paymentStatusColor(status);

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
      {meta.label}
    </span>
  );
};

const SummaryRow = ({ label, value, strong }) => {
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
      <strong style={{ color: strong ? "#2563eb" : "#111827" }}>{value}</strong>
    </div>
  );
};

/* ─────────────────────────── main component ─────────────────────────── */

const Payments = ({ push }) => {
  const [loading, setLoading] = useState(false);

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const [form, setForm] = useState({
    payment_date: todayISO(),
    method: "Bank Transfer",
    amount: "",
    notes: "",
    reference_id: "",
    status: "Completed",
  });

  const authHeaders = useMemo(() => {
    return {
      Authorization: `Bearer ${localStorage.getItem("erp_token") || ""}`,
    };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      if (USE_DUMMY_DATA) {
        setInvoices(DUMMY_INVOICES);
        setPayments(DUMMY_PAYMENTS);
        return;
      }

      const [invoiceRes, paymentRes] = await Promise.all([
        axios.get(`${API}/invoices`, { headers: authHeaders }),
        axios.get(`${API}/payments`, { headers: authHeaders }),
      ]);

      setInvoices(getApiArray(invoiceRes.data));
      setPayments(getApiArray(paymentRes.data));
    } catch (error) {
      console.error(error);

      setInvoices(DUMMY_INVOICES);
      setPayments(DUMMY_PAYMENTS);

      push?.("Using dummy payments/invoices data", "info");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, push]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectedInvoice = useMemo(() => {
    return (
      invoices.find((invoice) => String(invoice.id) === String(selectedInvoiceId)) ||
      null
    );
  }, [invoices, selectedInvoiceId]);

  const remainingAmount = useMemo(() => {
    return getInvoiceBalance(selectedInvoice);
  }, [selectedInvoice]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        if (filterType === "all") return true;

        return normalizeStatus(payment.invoice_type || payment.type) === filterType;
      })
      .filter((payment) => {
        if (filterStatus === "all") return true;

        return normalizeStatus(payment.status) === normalizeStatus(filterStatus);
      });
  }, [payments, filterType, filterStatus]);

  const stats = useMemo(() => {
    const totalPayments = payments.length;

    const totalReceived = payments
      .filter((payment) => normalizeStatus(payment.invoice_type) === "invoice")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const totalPaid = payments
      .filter((payment) => normalizeStatus(payment.invoice_type) === "bill")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const pendingAmount = invoices.reduce((sum, invoice) => {
      return sum + getInvoiceBalance(invoice);
    }, 0);

    const currency = payments[0]?.currency || invoices[0]?.currency || "GBP";

    return {
      totalPayments,
      totalReceived,
      totalPaid,
      pendingAmount,
      currency,
    };
  }, [payments, invoices]);

  const invoiceOptions = useMemo(() => {
    return invoices
      .filter((invoice) => getInvoiceBalance(invoice) > 0)
      .map((invoice) => {
        const balance = getInvoiceBalance(invoice);

        return {
          id: String(invoice.id),
          label: `${invoice.type === "bill" ? "BILL" : "INV"}-${invoice.id} • ${
            invoice.counterparty_name || "N/A"
          } • Balance ${formatMoney(balance, invoice.currency || "GBP")}`,
          type: invoice.type,
        };
      });
  }, [invoices]);

  const resetForm = () => {
    setSelectedInvoiceId("");
    setForm({
      payment_date: todayISO(),
      method: "Bank Transfer",
      amount: "",
      notes: "",
      reference_id: "",
      status: "Completed",
    });
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fillFullBalance = () => {
    if (!selectedInvoice) return;

    updateForm("amount", String(remainingAmount));
  };

  const onRecordPayment = async () => {
    if (!selectedInvoiceId) {
      push?.("Select invoice/bill", "error");
      return;
    }

    const amountNum = Number(form.amount);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      push?.("Enter a valid payment amount", "error");
      return;
    }

    if (amountNum > remainingAmount) {
      push?.("Payment amount exceeds remaining balance", "error");
      return;
    }

    const selected = selectedInvoice;

    const newPayment = {
      id: Date.now(),
      invoice_id: selected.id,
      invoice_type: selected.type,
      counterparty_name: selected.counterparty_name || "N/A",
      payment_date: form.payment_date,
      method: form.method,
      amount: amountNum,
      currency: selected.currency || "GBP",
      status: form.status,
      reference_id: form.reference_id,
      notes: form.notes,
    };

    const currentPaid = Number(selected.amount_paid || 0);
    const nextPaid = currentPaid + amountNum;

    try {
      setLoading(true);

      if (!USE_DUMMY_DATA) {
        await axios.post(
          `${API}/payments`,
          {
            invoice_id: selectedInvoiceId,
            payment_date: form.payment_date,
            method: form.method,
            amount: amountNum,
            notes: form.notes,
            reference_id: form.reference_id,
            status: form.status,
          },
          { headers: authHeaders }
        );

        await fetchAll();
      } else {
        setPayments((prev) => [newPayment, ...prev]);

        setInvoices((prev) =>
          prev.map((invoice) => {
            if (String(invoice.id) !== String(selected.id)) return invoice;

            return {
              ...invoice,
              amount_paid: nextPaid,
              status: getNextStatusAfterPayment(invoice, nextPaid),
            };
          })
        );
      }

      push?.("Payment recorded successfully", "success");
      closeModal();
    } catch (error) {
      console.error(error);

      setPayments((prev) => [newPayment, ...prev]);

      setInvoices((prev) =>
        prev.map((invoice) => {
          if (String(invoice.id) !== String(selected.id)) return invoice;

          return {
            ...invoice,
            amount_paid: nextPaid,
            status: getNextStatusAfterPayment(invoice, nextPaid),
          };
        })
      );

      push?.("Payment recorded locally using dummy data", "info");
      closeModal();
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
            💳 Payments
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Record payments against invoices and bills, and track balances.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={openModal}
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
            + Record Payment
          </button>

          <button
            type="button"
            onClick={fetchAll}
            disabled={loading}
            style={{
              padding: "9px 18px",
              background: "#fff",
              color: "#374151",
              border: "1.5px solid #d1d5db",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <StatCard
          icon="🧾"
          label="Total Payments"
          value={stats.totalPayments}
          accent="#6366f1"
        />

        <StatCard
          icon="📥"
          label="Received"
          value={formatMoney(stats.totalReceived, stats.currency)}
          accent="#22c55e"
        />

        <StatCard
          icon="📤"
          label="Paid Out"
          value={formatMoney(stats.totalPaid, stats.currency)}
          accent="#3b82f6"
        />

        <StatCard
          icon="⏳"
          label="Pending Balance"
          value={formatMoney(stats.pendingAmount, stats.currency)}
          accent="#f59e0b"
        />
      </div>

      {/* Filters */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 18,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "end",
          }}
        >
          <Field label="Invoice Type">
            <select
              className="input"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="all">All</option>
              <option value="invoice">Invoice</option>
              <option value="bill">Bill</option>
            </select>
          </Field>

          <Field label="Payment Status">
            <select
              className="input"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Payments table */}
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
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Payment Records
          </h3>

          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 600,
            }}
          >
            Showing {filteredPayments.length} record
            {filteredPayments.length === 1 ? "" : "s"}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 900,
            }}
          >
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {[
                  "Payment #",
                  "Date",
                  "Type",
                  "Invoice/Bill",
                  "Counterparty",
                  "Method",
                  "Reference",
                  "Amount",
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
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "#9ca3af",
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    style={{
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 800,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      PAY-{payment.id}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 700,
                        color:
                          payment.invoice_type === "bill" ? "#2563eb" : "#16a34a",
                      }}
                    >
                      {payment.invoice_type === "bill" ? "Bill" : "Invoice"}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 700,
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {payment.invoice_type === "bill" ? "BILL" : "INV"}-
                      {payment.invoice_id || payment.reference_invoice_id || "—"}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 600,
                      }}
                    >
                      {payment.counterparty_name || "N/A"}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {payment.method || "—"}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {payment.reference_id || "—"}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 800,
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatMoney(payment.amount, payment.currency || "GBP")}
                    </td>

                    <td style={{ padding: "13px 16px" }}>
                      <StatusBadge status={payment.status || "Completed"} />
                    </td>

                    <td style={{ padding: "13px 16px" }}>
                      <button
                        type="button"
                        onClick={() => setViewPayment(payment)}
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: "48px 0",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#374151",
                      }}
                    >
                      No payments found
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#9ca3af",
                        marginTop: 4,
                      }}
                    >
                      Record a payment or change the filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
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
              maxWidth: 820,
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
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                💳 Record Payment
              </h3>

              <button
                type="button"
                onClick={closeModal}
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

            <div
              style={{
                padding: "20px 24px",
                overflowY: "auto",
                flex: 1,
              }}
            >
              <div className="invoice-modal-grid" style={{ marginBottom: 18 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Invoice/Bill *">
                    <select
                      className="input"
                      value={selectedInvoiceId}
                      onChange={(event) => {
                        const invoiceId = event.target.value;
                        setSelectedInvoiceId(invoiceId);

                        const invoice = invoices.find(
                          (item) => String(item.id) === String(invoiceId)
                        );

                        if (invoice) {
                          updateForm("amount", String(getInvoiceBalance(invoice)));
                        }
                      }}
                    >
                      <option value="">Select invoice or bill...</option>

                      {invoiceOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Payment Date *">
                  <input
                    className="input"
                    type="date"
                    value={form.payment_date}
                    onChange={(event) =>
                      updateForm("payment_date", event.target.value)
                    }
                  />
                </Field>

                <Field label="Payment Method">
                  <select
                    className="input"
                    value={form.method}
                    onChange={(event) => updateForm("method", event.target.value)}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Amount *">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={form.amount}
                      onChange={(event) => updateForm("amount", event.target.value)}
                      placeholder="Enter amount"
                    />

                    <button
                      type="button"
                      onClick={fillFullBalance}
                      disabled={!selectedInvoice}
                      style={{
                        padding: "0 12px",
                        border: "1.5px solid #bfdbfe",
                        background: selectedInvoice ? "#eff6ff" : "#f3f4f6",
                        color: selectedInvoice ? "#2563eb" : "#9ca3af",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: selectedInvoice ? "pointer" : "not-allowed",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Full
                    </button>
                  </div>

                  {selectedInvoice ? (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      Remaining:{" "}
                      <strong>
                        {formatMoney(
                          remainingAmount,
                          selectedInvoice.currency || "GBP"
                        )}
                      </strong>
                    </div>
                  ) : null}
                </Field>

                <Field label="Status">
                  <select
                    className="input"
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value)}
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </Field>

                <Field label="Reference ID">
                  <input
                    className="input"
                    value={form.reference_id}
                    onChange={(event) =>
                      updateForm("reference_id", event.target.value)
                    }
                    placeholder="Example: TXN-12345"
                  />
                </Field>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Notes">
                    <textarea
                      className="input"
                      rows={4}
                      value={form.notes}
                      onChange={(event) => updateForm("notes", event.target.value)}
                      placeholder="Payment notes..."
                    />
                  </Field>
                </div>
              </div>

              {selectedInvoice ? (
                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#111827",
                      marginBottom: 14,
                    }}
                  >
                    Selected {selectedInvoice.type === "bill" ? "Bill" : "Invoice"}{" "}
                    Summary
                  </div>

                  <SummaryRow
                    label="Counterparty"
                    value={selectedInvoice.counterparty_name || "N/A"}
                  />

                  <SummaryRow
                    label="Total Amount"
                    value={formatMoney(
                      selectedInvoice.total_amount,
                      selectedInvoice.currency || "INR"
                    )}
                  />

                  <SummaryRow
                    label="Already Paid"
                    value={formatMoney(
                      selectedInvoice.amount_paid,
                      selectedInvoice.currency || "INR"
                    )}
                  />

                  <SummaryRow
                    label="Remaining Balance"
                    value={formatMoney(
                      remainingAmount,
                      selectedInvoice.currency || "INR"
                    )}
                    strong
                  />
                </div>
              ) : null}
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
                onClick={closeModal}
                disabled={loading}
                style={{
                  padding: "9px 20px",
                  background: "#fff",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onRecordPayment}
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
                {loading ? "Saving…" : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* View Payment Modal */}
      {viewPayment ? (
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
              maxWidth: 620,
              overflow: "hidden",
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
                gap: 12,
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  PAY-{viewPayment.id}
                </h3>

                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  {viewPayment.counterparty_name || "N/A"}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={viewPayment.status || "Completed"} />

                <button
                  type="button"
                  onClick={() => setViewPayment(null)}
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
            </div>

            <div style={{ padding: 24 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {[
                  [
                    "Payment Date",
                    viewPayment.payment_date
                      ? new Date(viewPayment.payment_date).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "—",
                  ],
                  ["Method", viewPayment.method || "—"],
                  [
                    "Linked To",
                    `${viewPayment.invoice_type === "bill" ? "BILL" : "INV"}-${
                      viewPayment.invoice_id || viewPayment.reference_invoice_id || "—"
                    }`,
                  ],
                  ["Reference ID", viewPayment.reference_id || "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      background: "#f9fafb",
                      padding: "10px 14px",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#111827",
                        marginTop: 3,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <SummaryRow
                  label="Payment Type"
                  value={viewPayment.invoice_type === "bill" ? "Bill Payment" : "Invoice Payment"}
                />

                <SummaryRow
                  label="Amount"
                  value={formatMoney(viewPayment.amount, viewPayment.currency || "GBP")}
                  strong
                />

                <SummaryRow
                  label="Status"
                  value={viewPayment.status || "Completed"}
                />
              </div>

              {viewPayment.notes ? (
                <div
                  style={{
                    marginTop: 14,
                    background: "#fffbeb",
                    border: "1px solid #fef3c7",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#92400e",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    Notes
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#78350f",
                    }}
                  >
                    {viewPayment.notes}
                  </div>
                </div>
              ) : null}
            </div>

            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                background: "#f9fafb",
              }}
            >
              <button
                type="button"
                onClick={() => setViewPayment(null)}
                style={{
                  padding: "9px 20px",
                  background: "#fff",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Payments;