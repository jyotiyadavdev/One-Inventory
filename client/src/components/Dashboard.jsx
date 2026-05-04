import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import { Activity, Package, Ticket, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalTickets: 0,
    openTickets: 0,
    criticalTickets: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [assetsRes, ticketsRes] = await Promise.all([
        axios.get('/assets'),
        axios.get('/tickets')
      ]);
      
      const assets = assetsRes.data;
      const tickets = ticketsRes.data;
      
      setStats({
        totalAssets: assets.length,
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
        criticalTickets: tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').length
      });
      
      setRecentTickets(tickets.slice(0, 5));
      setRecentAssets(assets.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'resolved':
      case 'closed': return <CheckCircle size={16} className="status-resolved" />;
      case 'in_progress': return <Clock size={16} className="status-progress" />;
      default: return <AlertCircle size={16} className="status-new" />;
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <Package size={32} />
          <div className="stat-info">
            <h3>{stats.totalAssets}</h3>
            <p>Total Assets</p>
          </div>
        </div>
        <div className="stat-card">
          <Ticket size={32} />
          <div className="stat-info">
            <h3>{stats.totalTickets}</h3>
            <p>Total Tickets</p>
          </div>
        </div>
        <div className="stat-card">
          <Activity size={32} />
          <div className="stat-info">
            <h3>{stats.openTickets}</h3>
            <p>Open Tickets</p>
          </div>
        </div>
        <div className="stat-card critical">
          <AlertCircle size={32} />
          <div className="stat-info">
            <h3>{stats.criticalTickets}</h3>
            <p>Critical Tickets</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3>Recent Tickets</h3>
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {recentTickets.map(ticket => (
                <tr key={ticket.id}>
                  <td>{ticket.ticket_number}</td>
                  <td>{ticket.title}</td>
                  <td><span className={`badge ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span></td>
                  <td>
                    <span className="status-badge">
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{format(new Date(ticket.created_at), 'MMM dd')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-section">
          <h3>Recent Assets</h3>
          <table className="data-table">
            <thead>
              <tr><th>Tag</th><th>Name</th><th>Location</th><th>Status</th><th>Warranty</th></tr>
            </thead>
            <tbody>
              {recentAssets.map(asset => {
                const warrantyDays = asset.warranty_expiry ? differenceInDays(new Date(asset.warranty_expiry), new Date()) : null;
                return (
                  <tr key={asset.id}>
                    <td>{asset.asset_tag}</td>
                    <td>{asset.name}</td>
                    <td>{asset.location}</td>
                    <td><span className={`badge status-${asset.status}`}>{asset.status}</span></td>
                    <td className={warrantyDays < 90 ? 'warning' : ''}>
                      {warrantyDays ? `${warrantyDays} days left` : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;