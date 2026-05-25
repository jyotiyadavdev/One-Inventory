import React, { useState, useEffect, useCallback } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import generateMockData from "../mockData/financeData";

export default function FinanceSalesRevenue({ push }) {
  const [salesData, setSalesData] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: "£0",
    totalOrders: 0,
    averageOrder: "£0",
    deliveredOrders: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);

  const fetchSalesData = useCallback(async () => {
    try {
      // setLoading(true);
      const { salesOrders } = generateMockData();
      
      setSalesData(salesOrders);

      // Calculate stats
      let totalRevenue = 0;
      let deliveredCount = 0;
      
      salesOrders.forEach(order => {
        if (order.status === 'delivered') {
          totalRevenue += parseFloat(order.total_amount || 0);
          deliveredCount++;
        }
      });

      setStats({
        totalRevenue: `£${totalRevenue.toLocaleString('en-GB')}`,
        totalOrders: salesOrders.length,
        averageOrder: `£${(totalRevenue / (deliveredCount || 1)).toLocaleString('en-GB')}`,
        deliveredOrders: deliveredCount
      });

      // Process monthly data
      const monthlyStats = {};
      salesOrders.forEach(order => {
        const month = new Date(order.created_at).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        if (!monthlyStats[month]) monthlyStats[month] = { month, revenue: 0, orders: 0 };
        if (order.status === 'delivered') {
          monthlyStats[month].revenue += parseFloat(order.total_amount || 0);
          monthlyStats[month].orders += 1;
        }
      });

      setMonthlyData(Object.values(monthlyStats).slice(-6));
    } catch (err) {
      console.error('Error fetching sales data:', err);
      push("Using demo data", "info");
    }
  }, [push]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  return (
    <div className="fade-up">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div className="section-title">💵 Sales & Revenue</div>
        <button className="btn btn-primary">📊 View Analytics</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 24 }}>
        <div className="stat-card c1 i1">
          <div className="stat-icon">💷</div>
          <div className="stat-value">{stats.totalRevenue}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card c2 i2">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card c5 i5">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.averageOrder}</div>
          <div className="stat-label">Avg Order Value</div>
        </div>
        <div className="stat-card c4 i4">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.deliveredOrders}</div>
          <div className="stat-label">Delivered Orders</div>
        </div>
      </div>

      {/* Chart */}
      {monthlyData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Monthly Sales Trend</h3>
          </div>
          <div style={{ height: 300, padding: 20 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`£${value.toLocaleString()}`, '']} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="card">
        <div className="card-header">
          <h3>Recent Sales Orders</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Delivery Date</th>
              </tr>
            </thead>
            <tbody>
              {salesData.slice(0, 10).map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                  <td>{order.customer_name || 'N/A'}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 700 }}>£{parseFloat(order.total_amount || 0).toLocaleString('en-GB')}</td>
                  <td>
                    <span className={`pill ${order.status === 'delivered' ? 'green' : order.status === 'dispatched' ? 'blue' : 'yellow'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}