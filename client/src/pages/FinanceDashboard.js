import React, { useState, useEffect, useCallback } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import generateMockData from "../mockData/financeData";

export default function FinanceDashboard({ push }) {
  const [stats, setStats] = useState({
    cashOnHand: "£0",
    receivables: "£0",
    payables: "£0",
    netProfit: "£0",
    monthlyRevenue: "£0",
    pendingInvoices: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { purchaseOrders, salesOrders, ledgerEntries } = generateMockData();
      
      // Calculate financial stats from mock data
      const completedSales = salesOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const completedPurchases = purchaseOrders.filter(o => o.status === 'Received').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const pendingPurchases = purchaseOrders.filter(o => o.status !== 'Received' && o.status !== 'Cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      const pendingSales = salesOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      
      const cashOnHand = completedSales - completedPurchases;
      const netProfit = cashOnHand;

      setStats({
        cashOnHand: `£${cashOnHand.toLocaleString('en-GB')}`,
        receivables: `£${pendingSales.toLocaleString('en-GB')}`,
        payables: `£${(pendingPurchases).toLocaleString('en-GB')}`,
        netProfit: `£${netProfit.toLocaleString('en-GB')}`
      });

      // Process monthly data from ledger
      const monthlyStats = {};
      ledgerEntries.forEach(item => {
        const month = new Date(item.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        if (!monthlyStats[month]) monthlyStats[month] = { month, income: 0, expenses: 0, profit: 0 };

        if (item.type === 'Credit') {
          monthlyStats[month].income += parseFloat(item.amount);
        } else {
          monthlyStats[month].expenses += parseFloat(item.amount);
        }
        monthlyStats[month].profit = monthlyStats[month].income - monthlyStats[month].expenses;
      });

      const chartData = Object.values(monthlyStats).sort((a, b) => new Date(a.month) - new Date(b.month)).slice(-6);
      setMonthlyData(chartData);

      // Process category data
      const categoryTotals = {};
      ledgerEntries.forEach(item => {
        if (!categoryTotals[item.category]) categoryTotals[item.category] = 0;
        categoryTotals[item.category] += parseFloat(item.amount);
      });

      const categoryChartData = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ name: category, value: amount }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setCategoryData(categoryChartData);

      // Set recent transactions
      setRecentTransactions(ledgerEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      push("Using demo data", "info");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="fade-up" style={{ textAlign: 'center', padding: 50 }}>
        <div>Loading Finance Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">🏦 Finance & Accounting Dashboard</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary">📊 Generate Report</button>
          <button className="btn btn-outline">💳 Process Payments</button>
          <button className="btn btn-outline">📄 Create Invoice</button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 24 }}>
        <div className="stat-card c1 i1">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{stats.cashOnHand}</div>
          <div className="stat-label">Cash on Hand</div>
        </div>
        <div className="stat-card c2 i2">
          <div className="stat-icon">📩</div>
          <div className="stat-value">{stats.receivables}</div>
          <div className="stat-label">Accounts Receivable</div>
        </div>
        <div className="stat-card c5 i5">
          <div className="stat-icon">📤</div>
          <div className="stat-value">{stats.payables}</div>
          <div className="stat-label">Accounts Payable</div>
        </div>
        <div className="stat-card c4 i4">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{stats.netProfit}</div>
          <div className="stat-label">Net Profit</div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Monthly Performance Chart */}
        <div className="card">
          <div className="card-header">
            <h3>📊 Monthly Financial Performance</h3>
          </div>
          <div style={{ height: 350, padding: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="card">
          <div className="card-header">
            <h3>🥧 Expense Breakdown</h3>
          </div>
          <div style={{ height: 350, padding: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Recent Transactions</h3>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td>{transaction.description}</td>
                    <td>
                      <span className="pill gray">{transaction.category}</span>
                    </td>
                    <td>
                      <span className={`pill ${transaction.type === 'Credit' ? 'green' : 'red'}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      £{parseFloat(transaction.amount).toLocaleString()}
                    </td>
                    <td>
                      <span className={`pill ${transaction.status === 'Completed' ? 'green' : 'yellow'}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Summary */}
        <div className="card">
          <div className="card-header">
            <h3>⚡ Quick Actions</h3>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn btn-primary" style={{ width: '100%' }}>
                ➕ Record Transaction
              </button>
              <button className="btn btn-outline" style={{ width: '100%' }}>
                📄 Generate Invoice
              </button>
              <button className="btn btn-outline" style={{ width: '100%' }}>
                💳 Process Payment
              </button>
              <button className="btn btn-outline" style={{ width: '100%' }}>
                📊 Financial Report
              </button>
              <button className="btn btn-outline" style={{ width: '100%' }}>
                🧾 Tax Filing
              </button>
            </div>

            <hr style={{ margin: '20px 0' }} />

            <div>
              <h4>📈 This Month Summary</h4>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Total Income:</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>
                    £{monthlyData[monthlyData.length - 1]?.income?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Total Expenses:</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    £{monthlyData[monthlyData.length - 1]?.expenses?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <span>Net Profit:</span>
                  <span style={{ color: monthlyData[monthlyData.length - 1]?.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    £{monthlyData[monthlyData.length - 1]?.profit?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}