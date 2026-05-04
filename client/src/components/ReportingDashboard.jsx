import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, Calendar, Filter, TrendingUp, TrendingDown,
  Package, Ticket, ShoppingCart, Users, Shield, DollarSign,
  AlertCircle, CheckCircle, Clock, BarChart3, PieChart,
  FileText, Printer, Mail
} from 'lucide-react';

function ReportingDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [exportFormat, setExportFormat] = useState('json');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/reports/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type) => {
    try {
      const response = await axios.get(`/reports/export/${type}`, {
        params: { format: exportFormat },
        responseType: exportFormat === 'csv' ? 'blob' : 'json'
      });
      
      if (exportFormat === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        console.log('JSON data:', response.data);
        alert('JSON data logged to console');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (!dashboardData) {
    return <div>Error loading dashboard data</div>;
  }

  return (
    <div className="reporting-dashboard">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0 }}>Executive Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <button
            onClick={() => exportReport('overview')}
            style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Last Updated */}
      <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
        Last Updated: {new Date(dashboardData.last_updated).toLocaleString()}
      </div>

      {/* Report Type Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'assets', label: 'Assets', icon: Package },
          { id: 'tickets', label: 'Tickets', icon: Ticket },
          { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
          { id: 'vendors', label: 'Vendors', icon: Users },
          { id: 'compliance', label: 'Compliance', icon: Shield },
          { id: 'budgets', label: 'Budgets', icon: DollarSign }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: selectedReport === tab.id ? '#667eea' : '#6b7280',
                borderBottom: selectedReport === tab.id ? '2px solid #667eea' : 'none',
                fontWeight: selectedReport === tab.id ? '600' : 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <KPICard 
              title="Total Assets" 
              value={dashboardData.assets.total} 
              icon={Package} 
              color="#667eea"
              trend={dashboardData.assets.total}
            />
            <KPICard 
              title="Open Tickets" 
              value={dashboardData.tickets.by_status.new + dashboardData.tickets.by_status.assigned + dashboardData.tickets.by_status.in_progress} 
              icon={Ticket} 
              color="#f59e0b"
              trend={dashboardData.tickets.by_status.new}
            />
            <KPICard 
              title="PO Value" 
              value={`£${(dashboardData.purchase_orders.total_value / 1000).toFixed(0)}k`} 
              icon={ShoppingCart} 
              color="#10b981"
              trend={dashboardData.purchase_orders.total}
            />
            <KPICard 
              title="Compliance" 
              value={`${((dashboardData.compliance.total - dashboardData.compliance.expired) / dashboardData.compliance.total * 100).toFixed(0)}%`} 
              icon={Shield} 
              color="#3b82f6"
              trend="Active"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
            {/* Ticket Priority Distribution */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Ticket Priority Distribution</h3>
              <div>
                {Object.entries(dashboardData.tickets.by_priority).map(([priority, count]) => {
                  const colors = { critical: '#dc2626', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };
                  const total = Object.values(dashboardData.tickets.by_priority).reduce((a, b) => a + b, 0);
                  const percentage = (count / total) * 100;
                  return (
                    <div key={priority} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ textTransform: 'capitalize' }}>{priority}</span>
                        <span>{count} tickets ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, background: colors[priority], height: '8px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly PO Spend */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Monthly Purchase Order Spend</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px' }}>
                {dashboardData.purchase_orders.monthly_spend.map((month, idx) => {
                  const maxSpend = Math.max(...dashboardData.purchase_orders.monthly_spend.map(m => m.amount));
                  const height = (month.amount / maxSpend) * 160;
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ 
                        height: `${height}px`, 
                        width: '100%', 
                        background: '#667eea', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s'
                      }} />
                      <span style={{ fontSize: '10px', marginTop: '4px' }}>{month.month}</span>
                      <span style={{ fontSize: '9px', color: '#666' }}>£{Math.round(month.amount / 1000)}k</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asset Status */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Asset Status</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {Object.entries(dashboardData.assets.by_status).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    <span style={{ fontWeight: '500' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA Compliance */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>SLA Compliance</h3>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: dashboardData.tickets.sla_compliance >= 90 ? '#10b981' : '#f59e0b' }}>
                  {dashboardData.tickets.sla_compliance.toFixed(0)}%
                </div>
                <p style={{ color: '#6b7280', marginTop: '8px' }}>Tickets resolved within SLA</p>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Avg. Resolution Time: {dashboardData.tickets.average_resolution_time.toFixed(1)} hours
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginTop: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Recent Activity</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_activity.map((activity, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          background: activity.type === 'ticket' ? '#fee2e2' : activity.type === 'purchase_order' ? '#fef3c7' : '#e0e7ff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {activity.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{activity.title}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          color: activity.status === 'resolved' || activity.status === 'approved' || activity.status === 'active' ? '#10b981' : 
                                 activity.status === 'critical' || activity.status === 'expired' ? '#dc2626' : '#f59e0b'
                        }}>
                          {activity.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{new Date(activity.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assets Report */}
      {selectedReport === 'assets' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Asset Categories</h3>
              {Object.entries(dashboardData.assets.by_category).map(([category, count]) => (
                <div key={category} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{category || 'Uncategorized'}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / dashboardData.assets.total) * 100}%`, background: '#667eea', height: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Asset Value</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '8px' }}>
                £{(dashboardData.assets.total_value / 1000).toFixed(0)}k
              </div>
              <p style={{ color: '#6b7280' }}>Total asset value</p>
              <hr style={{ margin: '16px 0' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Warranty expiring soon:</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{dashboardData.assets.warranty_expiring_soon}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => exportReport('assets')} className="btn-secondary">
              <Download size={16} /> Export Assets Report
            </button>
          </div>
        </div>
      )}

      {/* Tickets Report */}
      {selectedReport === 'tickets' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Tickets by Category</h3>
              {Object.entries(dashboardData.tickets.by_category).map(([category, count]) => (
                <div key={category} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{category}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / dashboardData.tickets.total) * 100}%`, background: '#f59e0b', height: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Ticket Status</h3>
              {Object.entries(dashboardData.tickets.by_status).map(([status, count]) => (
                <div key={status} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / dashboardData.tickets.total) * 100}%`, background: '#10b981', height: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => exportReport('tickets')} className="btn-secondary">
              <Download size={16} /> Export Tickets Report
            </button>
          </div>
        </div>
      )}

      {/* Purchase Orders Report */}
      {selectedReport === 'purchase-orders' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Spend by Department</h3>
              {Object.entries(dashboardData.purchase_orders.by_department).map(([dept, amount]) => (
                <div key={dept} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{dept}</span>
                    <span>£{(amount / 1000).toFixed(0)}k</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(amount / dashboardData.purchase_orders.total_value) * 100}%`, background: '#10b981', height: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>PO Status</h3>
              {Object.entries(dashboardData.purchase_orders.by_status).map(([status, count]) => (
                <div key={status} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / dashboardData.purchase_orders.total) * 100}%`, background: '#3b82f6', height: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => exportReport('purchase-orders')} className="btn-secondary">
              <Download size={16} /> Export PO Report
            </button>
          </div>
        </div>
      )}

      {/* Vendors Report */}
      {selectedReport === 'vendors' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Vendor Categories</h3>
              {Object.entries(dashboardData.vendors.by_category).map(([category, count]) => (
                <div key={category} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{category}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / dashboardData.vendors.total) * 100}%`, background: '#8b5cf6', height: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Contract Value</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
                £{(dashboardData.vendors.total_contract_value / 1000).toFixed(0)}k
              </div>
              <p style={{ color: '#6b7280' }}>Total active contract value</p>
              <hr style={{ margin: '16px 0' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Active Vendors:</span>
                  <span style={{ fontWeight: 'bold' }}>{dashboardData.vendors.active}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => exportReport('vendors')} className="btn-secondary">
              <Download size={16} /> Export Vendors Report
            </button>
          </div>
        </div>
      )}

      {/* Compliance Report */}
      {selectedReport === 'compliance' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Compliance Status</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Active Records:</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>{dashboardData.compliance.total - dashboardData.compliance.expired}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Expiring Soon:</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{dashboardData.compliance.expiring_soon}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Expired:</span>
                  <span style={{ fontWeight: 'bold', color: '#dc2626' }}>{dashboardData.compliance.expired}</span>
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>By Type</h3>
              {Object.entries(dashboardData.compliance.by_type).map(([type, count]) => (
                <div key={type} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{type}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / dashboardData.compliance.total) * 100}%`, background: '#3b82f6', height: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => exportReport('compliance')} className="btn-secondary">
              <Download size={16} /> Export Compliance Report
            </button>
          </div>
        </div>
      )}

      {/* Budgets Report */}
      {selectedReport === 'budgets' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <h3>Budget Overview</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Total Budget:</span>
                  <span style={{ fontWeight: 'bold' }}>£{(dashboardData.budgets.total_budget / 1000).toFixed(0)}k</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Allocated:</span>
                  <span>£{(dashboardData.budgets.total_allocated / 1000).toFixed(0)}k</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Spent:</span>
                  <span>£{(dashboardData.budgets.total_spent / 1000).toFixed(0)}k</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Committed:</span>
                  <span>£{(dashboardData.budgets.total_committed / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Overall Utilization:</span>
                  <span style={{ fontWeight: 'bold' }}>{dashboardData.budgets.overall_utilization.toFixed(0)}%</span>
                </div>
                <div style={{ background: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${dashboardData.budgets.overall_utilization}%`, 
                    background: dashboardData.budgets.overall_utilization >= 90 ? '#dc2626' : 
                               dashboardData.budgets.overall_utilization >= 75 ? '#f59e0b' : '#10b981', 
                    height: '8px' 
                  }} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={() => exportReport('budgets')} className="btn-secondary">
              <Download size={16} /> Export Budgets Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, color, trend }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{title}</p>
          <h2 style={{ fontSize: '28px', margin: '0 0 4px 0' }}>{value}</h2>
          {trend && (
            <p style={{ fontSize: '12px', color: '#10b981' }}>
              <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
              +{trend} this period
            </p>
          )}
        </div>
        <div style={{ padding: '12px', background: `${color}10`, borderRadius: '12px' }}>
          <Icon size={24} style={{ color: color }} />
        </div>
      </div>
    </div>
  );
}

export default ReportingDashboard;