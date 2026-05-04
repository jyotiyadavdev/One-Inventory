import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = tickets;
    
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    setFilteredTickets(filtered);
  }, [searchTerm, statusFilter, tickets]);

  const fetchData = async () => {
    try {
      const [ticketsRes, assetsRes] = await Promise.all([
        axios.get('/tickets'),
        axios.get('/assets')
      ]);
      setTickets(ticketsRes.data);
      setFilteredTickets(ticketsRes.data);
      setAssets(assetsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await axios.post('/tickets', ticketData);
      setTickets([response.data, ...tickets]);
      setShowModal(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`/tickets/${id}/status`, { status });
      setTickets(tickets.map(t => t.id === id ? response.data : t));
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleAddComment = async (id, comment) => {
    try {
      await axios.post(`/tickets/${id}/comments`, { comment, user_id: 1 });
      // Refresh ticket details if open
      if (selectedTicket && selectedTicket.id === id) {
        const response = await axios.get(`/tickets/${id}`);
        setSelectedTicket(response.data);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
    return <div className="loading">Loading tickets...</div>;
  }

  return (
    <div className="ticket-list">
      <div className="page-header">
        <h2>Facility Tickets</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="status-filter">
          <Filter size={18} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="tickets-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Asset</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map(ticket => (
              <tr key={ticket.id}>
                <td>{ticket.ticket_number}</td>
                <td>{ticket.title}</td>
                <td>
                  <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td>
                  <span className="status-badge">
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{ticket.asset_name || 'N/A'}</td>
                <td>{format(new Date(ticket.created_at), 'MMM dd, HH:mm')}</td>
                <td>
                  <button 
                    className="btn-sm" 
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <TicketModal 
          assets={assets} 
          onClose={() => setShowModal(false)} 
          onSubmit={handleCreateTicket} 
        />
      )}

      {selectedTicket && (
        <TicketDetailModal 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
}

function TicketModal({ assets, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'facilities',
    priority: 'medium',
    asset_id: '',
    location: '',
    reported_by: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Create New Ticket</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title *"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Description"
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <div className="form-row">
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="facilities">Facilities</option>
              <option value="hvac">HVAC</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="it">IT</option>
            </select>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-row">
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
            >
              <option value="">No related asset</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_tag} - {asset.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create Ticket</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TicketDetailModal({ ticket, onClose, onUpdateStatus, onAddComment }) {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(ticket.id, newComment);
      setNewComment('');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="ticket-detail-header">
          <h3>{ticket.ticket_number} - {ticket.title}</h3>
          <div className="ticket-status-actions">
            <span className={`badge ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
            {ticket.status === 'new' && (
              <button onClick={() => onUpdateStatus(ticket.id, 'assigned')} className="btn-sm">
                Assign
              </button>
            )}
            {ticket.status === 'assigned' && (
              <button onClick={() => onUpdateStatus(ticket.id, 'in_progress')} className="btn-sm">
                Start
              </button>
            )}
            {ticket.status === 'in_progress' && (
              <button onClick={() => onUpdateStatus(ticket.id, 'resolved')} className="btn-sm">
                Resolve
              </button>
            )}
            {ticket.status === 'resolved' && (
              <button onClick={() => onUpdateStatus(ticket.id, 'closed')} className="btn-sm">
                Close
              </button>
            )}
          </div>
        </div>

        <div className="ticket-detail-info">
          <div className="info-row">
            <strong>Description:</strong>
            <p>{ticket.description || 'No description provided'}</p>
          </div>
          <div className="info-grid">
            <div><strong>Asset:</strong> {ticket.asset_name || 'N/A'}</div>
            <div><strong>Location:</strong> {ticket.location || 'N/A'}</div>
            <div><strong>Reported By:</strong> {ticket.reported_by_name || 'System'}</div>
            <div><strong>Created:</strong> {format(new Date(ticket.created_at), 'MMM dd, yyyy HH:mm')}</div>
          </div>
        </div>

        <div className="ticket-comments">
          <h4>Comments</h4>
          <div className="comments-list">
            {ticket.comments && ticket.comments.map(comment => (
              <div key={comment.id} className="comment">
                <div className="comment-header">
                  <strong>{comment.full_name}</strong>
                  <span>{format(new Date(comment.created_at), 'MMM dd, HH:mm')}</span>
                </div>
                <p>{comment.comment}</p>
              </div>
            ))}
            {(!ticket.comments || ticket.comments.length === 0) && (
              <p className="no-comments">No comments yet</p>
            )}
          </div>
          <div className="add-comment">
            <textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="3"
            />
            <button onClick={handleAddComment}>
              <Send size={18} /> Post Comment
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default TicketList;