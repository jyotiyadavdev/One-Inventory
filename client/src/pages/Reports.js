import React, { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";

/* ─────────────────────────── helpers ─────────────────────────── */

const formatMoney = (value, currency = "GBP") => {
  const amount = Number(value || 0);

  const symbolMap = {
    INR: "₹",
    GBP: "£",
    USD: "$",
    EUR: "€",
  };

  const symbol = symbolMap[currency] || `${currency} `;

  return `${symbol}${amount.toLocaleString("en-GB", {
    maximumFractionDigits: 0,
  })}`;
};

const getPercent = (value, max) => {
  if (!max) return 0;
  return Math.max((Number(value || 0) / Number(max || 1)) * 100, 2);
};

const calculateGrowth = (current, previous) => {
  if (!previous) return 0;

  return ((current - previous) / previous) * 100;
};

/* ─────────────────────────── small components ─────────────────────────── */

const StatCard = ({ icon, label, value, change, accent, description }) => {
  const isPositive = Number(change || 0) >= 0;

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
              fontWeight: 600,
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

      {change !== undefined ? (
        <div
          style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 9px",
            borderRadius: 20,
            background: isPositive ? "#f0fdf4" : "#fef2f2",
            color: isPositive ? "#16a34a" : "#dc2626",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
        </div>
      ) : null}
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

/* ─────────────────────────── charts ─────────────────────────── */

const MonthlyTrendChart = ({ data }) => {
  const maxValue = Math.max(
    ...data.map((item) => Math.max(item.revenue, item.expenses, item.profit)),
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
        const revenueHeight = getPercent(item.revenue, maxValue);
        const expenseHeight = getPercent(item.expenses, maxValue);
        const profitHeight = getPercent(item.profit, maxValue);

        return (
          <div
            key={item.month}
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
                title={`Revenue: ${formatMoney(item.revenue)}`}
                style={{
                  width: 12,
                  height: `${revenueHeight}%`,
                  background: "#2563eb",
                  borderRadius: "6px 6px 0 0",
                }}
              />

              <div
                title={`Expenses: ${formatMoney(item.expenses)}`}
                style={{
                  width: 12,
                  height: `${expenseHeight}%`,
                  background: "#f59e0b",
                  borderRadius: "6px 6px 0 0",
                }}
              />

              <div
                title={`Profit: ${formatMoney(item.profit)}`}
                style={{
                  width: 12,
                  height: `${profitHeight}%`,
                  background: "#22c55e",
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
              {item.month}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CategoryChart = ({ data }) => {
  const maxAmount = Math.max(...data.map((item) => item.amount), 1);

  return (
    <div style={{ paddingTop: 8 }}>
      {data.map((item) => {
        const percent = getPercent(item.amount, maxAmount);

        return (
          <div key={item.name} style={{ marginBottom: 16 }}>
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
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                {item.name}
              </span>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {formatMoney(item.amount)}
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: 10,
                background: "#f3f4f6",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percent}%`,
                  height: "100%",
                  background: "#f59e0b",
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

const ProfitLineChart = ({ data }) => {
  const width = 600;
  const height = 220;
  const padding = 28;

  const maxProfit = Math.max(...data.map((item) => item.profit), 1);
  const minProfit = Math.min(...data.map((item) => item.profit), 0);

  const range = maxProfit - minProfit || 1;

  const points = data.map((item, index) => {
    const x =
      padding + (index / Math.max(data.length - 1, 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      ((item.profit - minProfit) / range) * (height - padding * 2);

    return {
      x,
      y,
      item,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          display: "block",
          width: "100%",
          minWidth: 520,
        }}
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#22c55e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.item.month}>
            <circle cx={point.x} cy={point.y} r="5" fill="#22c55e" />

            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#6b7280"
            >
              {point.item.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ─────────────────────────── main component ─────────────────────────── */

const Reports = ({ push }) => {
  const [reportType, setReportType] = useState("overview");
  const [period, setPeriod] = useState("last_6_months");
  const [currency, setCurrency] = useState("GBP");
  
  const [rawData, setRawData] = useState({
    monthlyTrend: [],
    categories: [],
    profitLoss: []
  });

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      const res = await axios.get(`${API}/reports/data`, { headers });
      setRawData(res.data);
    } catch {
      push?.("Failed to fetch report data", "error");
    }
  }, [push]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const reportData = useMemo(() => {
    const data = rawData.monthlyTrend || [];
    if (period === "last_3_months") {
      return data.slice(-3);
    }
    return data;
  }, [period, rawData.monthlyTrend]);

  const analytics = useMemo(() => {
    const totalRevenue = reportData.reduce((sum, item) => {
      return sum + Number(item.revenue || 0);
    }, 0);

    const totalExpenses = reportData.reduce((sum, item) => {
      return sum + Number(item.expenses || 0);
    }, 0);

    const totalProfit = reportData.reduce((sum, item) => {
      return sum + Number(item.profit || 0);
    }, 0);

    const totalInvoices = reportData.reduce((sum, item) => {
      return sum + Number(item.invoices || 0);
    }, 0);

    const totalBills = reportData.reduce((sum, item) => {
      return sum + Number(item.bills || 0);
    }, 0);

    const latest = reportData[reportData.length - 1] || {};
    const previous = reportData[reportData.length - 2] || {};

    const revenueGrowth = calculateGrowth(latest.revenue, previous.revenue);
    const expenseGrowth = calculateGrowth(latest.expenses, previous.expenses);
    const profitGrowth = calculateGrowth(latest.profit, previous.profit);

    const profitMargin = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;
    const expenseRatio = totalRevenue ? (totalExpenses / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      totalInvoices,
      totalBills,
      revenueGrowth,
      expenseGrowth,
      profitGrowth,
      profitMargin,
      expenseRatio,
    };
  }, [reportData]);

  const profitLoss = useMemo(() => {
    const rows = rawData.profitLoss || [];
    const totalIncome = rows.filter((item) => item.type === "income").reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const totalExpense = rows.filter(
      (item) => item.type === "expense"
    ).reduce((sum, item) => sum + item.amount, 0);

    const netProfit = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netProfit,
      rows: rows,
    };
  }, [rawData.profitLoss]);

  const handleGenerateReport = () => {
    fetchData();
    push?.("Financial report updated successfully", "success");
  };

  const handleExport = () => {
    push?.("Report export prepared using current data", "info");
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
            📊 Financial Reports
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Track revenue, expenses, profit, cash flow, and business performance.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleExport}
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
            onClick={handleGenerateReport}
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
            📈 Generate Report
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
          <Field label="Report Type">
            <select
              className="input"
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="overview">Overview</option>
              <option value="profit_loss">Profit & Loss</option>
              <option value="cash_flow">Cash Flow</option>
              <option value="expenses">Expense Analytics</option>
            </select>
          </Field>

          <Field label="Period">
            <select
              className="input"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
            </select>
          </Field>

          <Field label="Currency">
            <select
              className="input"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="GBP">GBP — £</option>
              <option value="USD">USD — $</option>
            </select>
          </Field>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={formatMoney(analytics.totalRevenue, currency)}
          change={analytics.revenueGrowth}
          accent="#2563eb"
          description={`${analytics.totalInvoices} invoices generated`}
        />

        <StatCard
          icon="📤"
          label="Total Expenses"
          value={formatMoney(analytics.totalExpenses, currency)}
          change={analytics.expenseGrowth}
          accent="#f59e0b"
          description={`${analytics.totalBills} bills recorded`}
        />

        <StatCard
          icon="✅"
          label="Net Profit"
          value={formatMoney(analytics.totalProfit, currency)}
          change={analytics.profitGrowth}
          accent="#22c55e"
          description={`${analytics.profitMargin.toFixed(1)}% profit margin`}
        />

        <StatCard
          icon="📊"
          label="Expense Ratio"
          value={`${analytics.expenseRatio.toFixed(1)}%`}
          accent="#8b5cf6"
          description="Expense vs revenue"
        />
      </div>

      {/* Report Tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          background: "#f3f4f6",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {[
          { key: "overview", label: "📈 Overview" },
          { key: "profit_loss", label: "📋 P&L" },
          { key: "cash_flow", label: "💸 Cash Flow" },
          { key: "expenses", label: "🧾 Expenses" },
        ].map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setReportType(tab.key)}
            style={{
              padding: "8px 18px",
              border: "none",
              borderRadius: 8,
              fontWeight: 750,
              fontSize: 13,
              cursor: "pointer",
              background: reportType === tab.key ? "#fff" : "transparent",
              color: reportType === tab.key ? "#111827" : "#6b7280",
              boxShadow:
                reportType === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {reportType === "overview" ? (
        <>
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
                    Monthly Financial Trend
                  </h3>

                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Revenue, expenses and profit comparison
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
                  <span>🔵 Revenue</span>
                  <span>🟠 Expense</span>
                  <span>🟢 Profit</span>
                </div>
              </div>

              <MonthlyTrendChart data={reportData} />
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
                Quick Summary
              </h3>

              <SummaryRow
                label="Revenue"
                value={formatMoney(analytics.totalRevenue, currency)}
              />

              <SummaryRow
                label="Expenses"
                value={formatMoney(analytics.totalExpenses, currency)}
              />

              <SummaryRow
                label="Net Profit"
                value={formatMoney(analytics.totalProfit, currency)}
                color="#16a34a"
                bold
              />

              <SummaryRow
                label="Profit Margin"
                value={`${analytics.profitMargin.toFixed(1)}%`}
                color="#2563eb"
                bold
              />

              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  color: "#166534",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                ✅ Your business is profitable in this period. Profit margin is{" "}
                <strong>{analytics.profitMargin.toFixed(1)}%</strong>.
              </div>
            </div>
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
              Profit Trend
            </h3>

            <ProfitLineChart data={reportData} />
          </div>
        </>
      ) : null}

      {/* Profit & Loss */}
      {reportType === "profit_loss" ? (
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
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 850,
                color: "#111827",
              }}
            >
              Profit & Loss Statement
            </h3>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Income, expenses and net profit summary.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 700,
              }}
            >
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Particular", "Type", "Amount"].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {profitLoss.rows.map((row) => (
                  <tr key={row.label} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {row.label}
                    </td>

                    <td
                      style={{
                        padding: "14px 16px",
                        color: row.type === "income" ? "#16a34a" : "#dc2626",
                        fontWeight: 800,
                        textTransform: "capitalize",
                      }}
                    >
                      {row.type}
                    </td>

                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 850,
                      }}
                    >
                      {formatMoney(row.amount, currency)}
                    </td>
                  </tr>
                ))}

                <tr style={{ borderTop: "2px solid #e5e7eb", background: "#f9fafb" }}>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 850,
                    }}
                  >
                    Net Profit
                  </td>

                  <td
                    style={{
                      padding: "14px 16px",
                      color: "#16a34a",
                      fontWeight: 850,
                    }}
                  >
                    Final
                  </td>

                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 900,
                      color: "#16a34a",
                    }}
                  >
                    {formatMoney(profitLoss.netProfit, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Cash Flow */}
      {reportType === "cash_flow" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: 20,
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
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                Cash Flow by Month
              </h3>
            </div>

            <MonthlyTrendChart data={reportData} />
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
                marginBottom: 16,
              }}
            >
              Cash Flow Summary
            </h3>

            <SummaryRow
              label="Cash Inflow"
              value={formatMoney(analytics.totalRevenue, currency)}
              color="#16a34a"
            />

            <SummaryRow
              label="Cash Outflow"
              value={formatMoney(analytics.totalExpenses, currency)}
              color="#dc2626"
            />

            <SummaryRow
              label="Net Cash Flow"
              value={formatMoney(
                analytics.totalRevenue - analytics.totalExpenses,
                currency
              )}
              color="#2563eb"
              bold
            />

            <div
              style={{
                marginTop: 18,
                padding: 14,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                color: "#1d4ed8",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              💡 Positive cash flow means business income is higher than outgoing
              expenses.
            </div>
          </div>
        </div>
      ) : null}

      {/* Expenses */}
      {reportType === "expenses" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
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
                marginBottom: 16,
              }}
            >
              Expense Category Breakdown
            </h3>

            <CategoryChart data={rawData.categories || []} />
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
                marginBottom: 16,
              }}
            >
              Expense Insights
            </h3>

            <SummaryRow
              label="Highest Expense"
              value="Salaries"
              color="#dc2626"
              bold
            />

            <SummaryRow
              label="Marketing Spend"
              value={formatMoney(128000, currency)}
            />

            <SummaryRow
              label="Software Cost"
              value={formatMoney(84000, currency)}
            />

            <SummaryRow
              label="Total Expenses"
              value={formatMoney(analytics.totalExpenses, currency)}
              color="#dc2626"
              bold
            />

            <div
              style={{
                marginTop: 18,
                padding: 14,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                color: "#92400e",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              ⚠ Salaries and marketing are your largest cost areas. Review them
              monthly to improve profit margin.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Reports;