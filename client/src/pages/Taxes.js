import React, { useMemo, useState } from "react";

/* ─────────────────────────── dummy data ─────────────────────────── */

const DUMMY_TAX_PERIODS = [
  {
    id: 1,
    period: "Jan 2026",
    sales: 185000,
    purchases: 92000,
    output_vat: 33300,
    input_vat: 16560,
    net_tax: 16740,
    status: "Filed",
    due_date: "2026-02-20",
    filed_date: "2026-02-17",
    return_type: "VAT100",
  },
  {
    id: 2,
    period: "Feb 2026",
    sales: 210000,
    purchases: 108000,
    output_vat: 37800,
    input_vat: 19440,
    net_tax: 18360,
    status: "Filed",
    due_date: "2026-03-20",
    filed_date: "2026-03-19",
    return_type: "VAT100",
  },
  {
    id: 3,
    period: "Mar 2026",
    sales: 175000,
    purchases: 88000,
    output_vat: 31500,
    input_vat: 15840,
    net_tax: 15660,
    status: "Filed",
    due_date: "2026-04-20",
    filed_date: "2026-04-18",
    return_type: "VAT100",
  },
  {
    id: 4,
    period: "Apr 2026",
    sales: 260000,
    purchases: 134000,
    output_vat: 46800,
    input_vat: 24120,
    net_tax: 22680,
    status: "Pending",
    due_date: "2026-05-20",
    filed_date: "",
    return_type: "VAT100",
  },
  {
    id: 5,
    period: "May 2026",
    sales: 312000,
    purchases: 158000,
    output_vat: 56160,
    input_vat: 28440,
    net_tax: 27720,
    status: "Not Filed",
    due_date: "2026-06-20",
    filed_date: "",
    return_type: "VAT100",
  },
];

const DUMMY_DOCUMENTS = [
  {
    id: 1,
    name: "Sales Invoices",
    status: "Completed",
    count: 31,
    required: true,
  },
  {
    id: 2,
    name: "Purchase Bills",
    status: "Completed",
    count: 18,
    required: true,
  },
  {
    id: 3,
    name: "Bank Statements",
    status: "Pending",
    count: 2,
    required: true,
  },
  {
    id: 4,
    name: "Expense Receipts",
    status: "Completed",
    count: 42,
    required: true,
  },
  {
    id: 5,
    name: "TDS Certificates",
    status: "Missing",
    count: 0,
    required: false,
  },
];

const DUMMY_TAX_CATEGORIES = [
  {
    label: "Output VAT",
    value: 205560,
    color: "#2563eb",
  },
  {
    label: "Input VAT",
    value: 104400,
    color: "#22c55e",
  },
  {
    label: "Net VAT Payable",
    value: 101160,
    color: "#f59e0b",
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
    maximumFractionDigits: 0,
  })}`;
};

const normalizeStatus = (status = "") => {
  return String(status).toLowerCase().replace(/\s+/g, "_").trim();
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isOverdue = (date, status) => {
  if (!date) return false;
  if (normalizeStatus(status) === "filed") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(date);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

const getStatusMeta = (status, dueDate) => {
  if (isOverdue(dueDate, status)) {
    return {
      label: "Overdue",
      bg: "#fef2f2",
      color: "#dc2626",
      dot: "#ef4444",
    };
  }

  const key = normalizeStatus(status);

  if (key === "filed" || key === "completed") {
    return {
      label: status || "Completed",
      bg: "#f0fdf4",
      color: "#16a34a",
      dot: "#22c55e",
    };
  }

  if (key === "pending") {
    return {
      label: "Pending",
      bg: "#fffbeb",
      color: "#d97706",
      dot: "#f59e0b",
    };
  }

  if (key === "missing" || key === "not_filed") {
    return {
      label: status || "Not Filed",
      bg: "#fef2f2",
      color: "#dc2626",
      dot: "#ef4444",
    };
  }

  return {
    label: status || "Draft",
    bg: "#f3f4f6",
    color: "#6b7280",
    dot: "#9ca3af",
  };
};

/* ─────────────────────────── small components ─────────────────────────── */

const StatCard = ({ icon, label, value, accent, description }) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "20px 22px",
        flex: 1,
        minWidth: 210,
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 850,
              color: "#111827",
              letterSpacing: -0.5,
            }}
          >
            {value}
          </div>

          {description ? (
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 5,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            fontSize: 28,
            background: "#f9fafb",
            width: 48,
            height: 48,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
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
          fontWeight: 700,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
};

const StatusBadge = ({ status, dueDate }) => {
  const meta = getStatusMeta(status, dueDate);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
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

const SummaryRow = ({ label, value, color, bold }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
        fontSize: 14,
      }}
    >
      <span
        style={{
          color: "#6b7280",
          fontWeight: bold ? 800 : 500,
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: color || "#111827",
          fontWeight: bold ? 850 : 700,
        }}
      >
        {value}
      </span>
    </div>
  );
};

const TaxBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div style={{ paddingTop: 10 }}>
      {data.map((item) => {
        const width = Math.max((item.value / maxValue) * 100, 4);

        return (
          <div key={item.label} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 7,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 750,
                  color: "#374151",
                }}
              >
                {item.label}
              </span>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 850,
                  color: "#111827",
                }}
              >
                {formatMoney(item.value)}
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: 11,
                background: "#f3f4f6",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${width}%`,
                  height: "100%",
                  background: item.color,
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MonthlyTaxChart = ({ data }) => {
  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.output_vat, item.input_vat, item.net_tax)),
    1
  );

  return (
    <div
      style={{
        height: 300,
        display: "flex",
        alignItems: "flex-end",
        gap: 18,
        padding: "20px 12px 10px",
        borderTop: "1px solid #f3f4f6",
      }}
    >
      {data.map((item) => {
        const outputHeight = Math.max((item.output_vat / maxValue) * 100, 2);
        const inputHeight = Math.max((item.input_vat / maxValue) * 100, 2);
        const netHeight = Math.max((item.net_tax / maxValue) * 100, 2);

        return (
          <div
            key={item.period}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 5,
                height: 220,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <div
                title={`Output VAT: ${formatMoney(item.output_vat)}`}
                style={{
                  width: 13,
                  height: `${outputHeight}%`,
                  background: "#2563eb",
                  borderRadius: "6px 6px 0 0",
                }}
              />

              <div
                title={`Input VAT: ${formatMoney(item.input_vat)}`}
                style={{
                  width: 13,
                  height: `${inputHeight}%`,
                  background: "#22c55e",
                  borderRadius: "6px 6px 0 0",
                }}
              />

              <div
                title={`Net Tax: ${formatMoney(item.net_tax)}`}
                style={{
                  width: 13,
                  height: `${netHeight}%`,
                  background: "#f59e0b",
                  borderRadius: "6px 6px 0 0",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
              }}
            >
              {item.period.split(" ")[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────── main component ─────────────────────────── */

const Taxes = ({ push }) => {
  const [taxPeriods, setTaxPeriods] = useState(DUMMY_TAX_PERIODS);
  const [documents, setDocuments] = useState(DUMMY_DOCUMENTS);

  const [filterStatus, setFilterStatus] = useState("all");
  const [taxType, setTaxType] = useState("vat");
  const [period, setPeriod] = useState("all");

  const [showModal, setShowModal] = useState(false);

  const [filingForm, setFilingForm] = useState({
    return_type: "VAT100",
    tax_period_id: "",
    filing_date: todayISO(),
    payment_reference: "",
    notes: "",
  });

  const filteredTaxPeriods = useMemo(() => {
    return taxPeriods.filter((item) => {
      if (filterStatus === "all") return true;

      if (filterStatus === "overdue") {
        return isOverdue(item.due_date, item.status);
      }

      return normalizeStatus(item.status) === normalizeStatus(filterStatus);
    });
  }, [taxPeriods, filterStatus]);

  const analytics = useMemo(() => {
    const totalSales = taxPeriods.reduce((sum, item) => {
      return sum + Number(item.sales || 0);
    }, 0);

    const totalPurchases = taxPeriods.reduce((sum, item) => {
      return sum + Number(item.purchases || 0);
    }, 0);

    const outputVat = taxPeriods.reduce((sum, item) => {
      return sum + Number(item.output_vat || 0);
    }, 0);

    const inputVat = taxPeriods.reduce((sum, item) => {
      return sum + Number(item.input_vat || 0);
    }, 0);

    const netTax = taxPeriods.reduce((sum, item) => {
      return sum + Number(item.net_tax || 0);
    }, 0);

    const pendingTax = taxPeriods
      .filter((item) => normalizeStatus(item.status) !== "filed")
      .reduce((sum, item) => sum + Number(item.net_tax || 0), 0);

    const filedReturns = taxPeriods.filter((item) => {
      return normalizeStatus(item.status) === "filed";
    }).length;

    const pendingReturns = taxPeriods.length - filedReturns;

    return {
      totalSales,
      totalPurchases,
      outputVat,
      inputVat,
      netTax,
      pendingTax,
      filedReturns,
      pendingReturns,
    };
  }, [taxPeriods]);

  const selectedTaxPeriod = useMemo(() => {
    return (
      taxPeriods.find((item) => String(item.id) === String(filingForm.tax_period_id)) ||
      null
    );
  }, [taxPeriods, filingForm.tax_period_id]);

  const complianceScore = useMemo(() => {
    if (!taxPeriods.length) return 0;

    const filed = taxPeriods.filter((item) => {
      return normalizeStatus(item.status) === "filed";
    }).length;

    return Math.round((filed / taxPeriods.length) * 100);
  }, [taxPeriods]);

  const openFileTaxModal = () => {
    const firstPending = taxPeriods.find((item) => {
      return normalizeStatus(item.status) !== "filed";
    });

    setFilingForm({
      return_type: firstPending?.return_type || "GSTR-3B",
      tax_period_id: firstPending ? String(firstPending.id) : "",
      filing_date: todayISO(),
      payment_reference: "",
      notes: "",
    });

    setShowModal(true);
  };

  const closeFileTaxModal = () => {
    setShowModal(false);
  };

  const updateFilingForm = (field, value) => {
    setFilingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateTaxSummary = () => {
    push?.("Tax summary generated successfully using dummy data", "success");
  };

  const handleDownloadReport = () => {
    push?.("Tax report export prepared using dummy data", "info");
  };

  const handleUploadDocument = (docId) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        return {
          ...doc,
          status: "Completed",
          count: doc.count || 1,
        };
      })
    );

    push?.("Document marked as completed", "success");
  };

  const handleFileTax = () => {
    if (!filingForm.tax_period_id) {
      push?.("Please select a tax period", "error");
      return;
    }

    if (!filingForm.filing_date) {
      push?.("Please select filing date", "error");
      return;
    }

    setTaxPeriods((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(filingForm.tax_period_id)) return item;

        return {
          ...item,
          status: "Filed",
          filed_date: filingForm.filing_date,
          return_type: filingForm.return_type,
        };
      })
    );

    push?.("Tax return filed successfully", "success");
    closeFileTaxModal();
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
              fontWeight: 850,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            🧾 Tax Management
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Manage VAT filing, tax liability, compliance status, and tax documents.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleDownloadReport}
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
            ⬇ Export
          </button>

          <button
            type="button"
            onClick={handleGenerateTaxSummary}
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
            📊 Generate Summary
          </button>

          <button
            type="button"
            onClick={openFileTaxModal}
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
            📝 File Taxes
          </button>
        </div>
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
          <Field label="Tax Type">
            <select
              className="input"
              value={taxType}
              onChange={(event) => setTaxType(event.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="vat">VAT</option>
              <option value="tds">TDS</option>
              <option value="income_tax">Income Tax</option>
            </select>
          </Field>

          <Field label="Period">
            <select
              className="input"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="all">All Periods</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="financial_year">Financial Year</option>
            </select>
          </Field>

          <Field label="Filing Status">
            <select
              className="input"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="all">All</option>
              <option value="filed">Filed</option>
              <option value="pending">Pending</option>
              <option value="not_filed">Not Filed</option>
              <option value="overdue">Overdue</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <StatCard
          icon="📤"
          label="Output VAT"
          value={formatMoney(analytics.outputVat)}
          accent="#2563eb"
          description="Tax collected on sales"
        />

        <StatCard
          icon="📥"
          label="Input VAT"
          value={formatMoney(analytics.inputVat)}
          accent="#22c55e"
          description="Tax paid on purchases"
        />

        <StatCard
          icon="🧾"
          label="Net VAT Payable"
          value={formatMoney(analytics.netTax)}
          accent="#f59e0b"
          description="Output VAT minus input VAT"
        />

        <StatCard
          icon="✅"
          label="Compliance Score"
          value={`${complianceScore}%`}
          accent="#8b5cf6"
          description={`${analytics.filedReturns} filed, ${analytics.pendingReturns} pending`}
        />
      </div>

      {/* Main Analytics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
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
              padding: "18px 20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 850,
                  color: "#111827",
                }}
              >
                Monthly VAT Overview
              </h3>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#6b7280",
                }}
              >
                Output VAT, input VAT and net tax payable
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
              }}
            >
              <span>🔵 Output</span>
              <span>🟢 Input</span>
              <span>🟠 Net</span>
            </div>
          </div>

          <MonthlyTaxChart data={taxPeriods} />
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 850,
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Tax Liability Summary
          </h3>

          <TaxBarChart data={DUMMY_TAX_CATEGORIES} />

          <div
            style={{
              marginTop: 18,
              padding: 14,
              background:
                analytics.pendingTax > 0 ? "#fffbeb" : "#f0fdf4",
              border:
                analytics.pendingTax > 0
                  ? "1px solid #fde68a"
                  : "1px solid #bbf7d0",
              borderRadius: 10,
              color: analytics.pendingTax > 0 ? "#92400e" : "#166534",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {analytics.pendingTax > 0 ? (
              <>
                ⚠ Pending tax liability:{" "}
                <strong>{formatMoney(analytics.pendingTax)}</strong>
              </>
            ) : (
              <>✅ No pending tax liability.</>
            )}
          </div>
        </div>
      </div>

      {/* Tax Returns Table */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 24,
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
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 850,
                color: "#111827",
              }}
            >
              Tax Returns
            </h3>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Filing status and tax payable by period
            </p>
          </div>

          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 700,
            }}
          >
            Showing {filteredTaxPeriods.length} return
            {filteredTaxPeriods.length === 1 ? "" : "s"}
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
                  "Period",
                  "Return Type",
                  "Sales",
                  "Purchases",
                  "Output GST",
                  "Input GST",
                  "Net Tax",
                  "Due Date",
                  "Filed Date",
                  "Status",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "11px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 800,
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
              {filteredTaxPeriods.length > 0 ? (
                filteredTaxPeriods.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderTop: "1px solid #f3f4f6",
                    }}
                  >
                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 850,
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.period}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 700,
                        color: "#374151",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.return_type}
                    </td>

                    <td style={{ padding: "13px 16px", fontWeight: 700 }}>
                      {formatMoney(item.sales)}
                    </td>

                    <td style={{ padding: "13px 16px", fontWeight: 700 }}>
                      {formatMoney(item.purchases)}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 800,
                        color: "#2563eb",
                      }}
                    >
                      {formatMoney(item.output_gst)}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 800,
                        color: "#16a34a",
                      }}
                    >
                      {formatMoney(item.input_gst)}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        fontWeight: 850,
                        color: "#d97706",
                      }}
                    >
                      {formatMoney(item.net_tax)}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        color: isOverdue(item.due_date, item.status)
                          ? "#dc2626"
                          : "#6b7280",
                        fontWeight: isOverdue(item.due_date, item.status)
                          ? 800
                          : 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(item.due_date)}
                    </td>

                    <td
                      style={{
                        padding: "13px 16px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(item.filed_date)}
                    </td>

                    <td style={{ padding: "13px 16px" }}>
                      <StatusBadge status={item.status} dueDate={item.due_date} />
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
                      color: "#6b7280",
                    }}
                  >
                    No tax returns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {/* Document Checklist */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 850,
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Tax Document Checklist
          </h3>

          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "13px 0",
                borderBottom: "1px solid #f3f4f6",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  {doc.name}{" "}
                  {doc.required ? (
                    <span style={{ color: "#dc2626" }}>*</span>
                  ) : null}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 3,
                  }}
                >
                  {doc.count} document{doc.count === 1 ? "" : "s"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <StatusBadge status={doc.status} />

                {normalizeStatus(doc.status) !== "completed" ? (
                  <button
                    type="button"
                    onClick={() => handleUploadDocument(doc.id)}
                    style={{
                      padding: "5px 10px",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#2563eb",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Mark Done
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Summary */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 850,
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Compliance Summary
          </h3>

          <SummaryRow
            label="Total Sales"
            value={formatMoney(analytics.totalSales)}
          />

          <SummaryRow
            label="Total Purchases"
            value={formatMoney(analytics.totalPurchases)}
          />

          <SummaryRow
            label="Filed Returns"
            value={analytics.filedReturns}
            color="#16a34a"
          />

          <SummaryRow
            label="Pending Returns"
            value={analytics.pendingReturns}
            color={analytics.pendingReturns > 0 ? "#d97706" : "#16a34a"}
          />

          <SummaryRow
            label="Pending Tax"
            value={formatMoney(analytics.pendingTax)}
            color={analytics.pendingTax > 0 ? "#dc2626" : "#16a34a"}
            bold
          />

          <div
            style={{
              marginTop: 18,
              padding: 14,
              background: complianceScore >= 80 ? "#f0fdf4" : "#fffbeb",
              border:
                complianceScore >= 80
                  ? "1px solid #bbf7d0"
                  : "1px solid #fde68a",
              borderRadius: 10,
              color: complianceScore >= 80 ? "#166534" : "#92400e",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {complianceScore >= 80 ? (
              <>
                ✅ Compliance looks good. Current score is{" "}
                <strong>{complianceScore}%</strong>.
              </>
            ) : (
              <>
                ⚠ Compliance needs attention. Current score is{" "}
                <strong>{complianceScore}%</strong>.
              </>
            )}
          </div>
        </div>
      </div>

      {/* File Taxes Modal */}
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
              maxWidth: 760,
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
                gap: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 850,
                  color: "#111827",
                }}
              >
                📝 File Tax Return
              </h3>

              <button
                type="button"
                onClick={closeFileTaxModal}
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
                <Field label="Return Type">
                  <select
                    className="input"
                    value={filingForm.return_type}
                    onChange={(event) =>
                      updateFilingForm("return_type", event.target.value)
                    }
                  >
                    <option value="GSTR-3B">GSTR-3B</option>
                    <option value="GSTR-1">GSTR-1</option>
                    <option value="TDS Return">TDS Return</option>
                    <option value="Income Tax">Income Tax</option>
                  </select>
                </Field>

                <Field label="Tax Period *">
                  <select
                    className="input"
                    value={filingForm.tax_period_id}
                    onChange={(event) =>
                      updateFilingForm("tax_period_id", event.target.value)
                    }
                  >
                    <option value="">Select tax period...</option>

                    {taxPeriods
                      .filter((item) => normalizeStatus(item.status) !== "filed")
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.period} — Payable {formatMoney(item.net_tax)}
                        </option>
                      ))}
                  </select>
                </Field>

                <Field label="Filing Date *">
                  <input
                    className="input"
                    type="date"
                    value={filingForm.filing_date}
                    onChange={(event) =>
                      updateFilingForm("filing_date", event.target.value)
                    }
                  />
                </Field>

                <Field label="Payment Reference">
                  <input
                    className="input"
                    value={filingForm.payment_reference}
                    onChange={(event) =>
                      updateFilingForm("payment_reference", event.target.value)
                    }
                    placeholder="Example: GST-PAY-12345"
                  />
                </Field>

                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Notes">
                    <textarea
                      className="input"
                      rows={4}
                      value={filingForm.notes}
                      onChange={(event) =>
                        updateFilingForm("notes", event.target.value)
                      }
                      placeholder="Add filing notes..."
                    />
                  </Field>
                </div>
              </div>

              {selectedTaxPeriod ? (
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
                      fontWeight: 850,
                      fontSize: 14,
                      color: "#111827",
                      marginBottom: 14,
                    }}
                  >
                    Selected Tax Period Summary
                  </div>

                  <SummaryRow label="Period" value={selectedTaxPeriod.period} />

                  <SummaryRow
                    label="Output VAT"
                    value={formatMoney(selectedTaxPeriod.output_vat)}
                  />

                  <SummaryRow
                    label="Input VAT"
                    value={formatMoney(selectedTaxPeriod.input_vat)}
                  />

                  <SummaryRow
                    label="Net Tax Payable"
                    value={formatMoney(selectedTaxPeriod.net_tax)}
                    color="#d97706"
                    bold
                  />

                  <SummaryRow
                    label="Due Date"
                    value={formatDate(selectedTaxPeriod.due_date)}
                    color={
                      isOverdue(selectedTaxPeriod.due_date, selectedTaxPeriod.status)
                        ? "#dc2626"
                        : "#111827"
                    }
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
                onClick={closeFileTaxModal}
                style={{
                  padding: "9px 20px",
                  background: "#fff",
                  border: "1.5px solid #d1d5db",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFileTax}
                style={{
                  padding: "9px 24px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                File Return
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Taxes;