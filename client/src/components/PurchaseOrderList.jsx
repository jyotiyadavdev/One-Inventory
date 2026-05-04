import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, DollarSign, Package } from 'lucide-react';
import { format } from 'date-fns';

function PurchaseOrderList() {
  const [pos, setPos] = useState([]);
  const [filteredPos, setFilteredPos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = pos;
    
    if (searchTerm) {
      filtered = filtered.filter(po =>
        po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.status === statusFilter);
    }
    
    setFilteredPos(filtered);
  }, [searchTerm, statusFilter, pos]);

  const fetchData = async () => {
    try {
      const [posRes, statsRes, assetsRes] = await Promise.all([
        axios.get('/purchase-orders'),
        axios.get('/purchase-orders/stats/summary'),
        axios.get('/assets')
      ]);
      setPos(posRes.data);
      setFilteredPos(posRes.data);
      setStats(statsRes.data);
      setAssets(assetsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (poData) => {
    try {
      const response = await axios.post('/purchase-orders', poData);
      setPos([response.data, ...pos]);
      setShowModal(false);
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create purchase order');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`/purchase-orders/${id}/status`, { status });
      setPos(pos.map(po => po.id === id ? response.data : po));
    } catch (error) {
      console.error('Error updating PO:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await axios.delete(`/purchase-orders/${id}`);
        setPos(pos.filter(po => po.id !== id));
      } catch (error) {
        console.error('Error deleting PO:', error);
        alert(error.response?.data?.error || 'Failed to delete');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'status-draft';
      case 'pending_approval': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'ordered': return 'status-ordered';
      case 'delivered': return 'status-delivered';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return <div className="loading">Loading purchase orders...</div>;
  }

  return (
    <div className="po-list">
      <div className="page-header">
        <h2>Purchase Order Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Create PO
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <DollarSign size={32} />
            <div className="stat-info">
              <h3>£{stats.total_value.toLocaleString()}</h3>
              <p>Total PO Value</p>
            </div>
          </div>
          <div className="stat-card">
            <Package size={32} />
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={32} />
            <div className="stat-info">
              <h3>{stats.pending_approval}</h3>
              <p>Pending Approval</p>
            </div>
          </div>
          <div className="stat-card">
            <CheckCircle size={32} />
            <div className="stat-info">
              <h3>{stats.approved}</h3>
              <p>Approved</p>
            </div>
          </div>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by PO #, title, or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="status-filter">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="ordered">Ordered</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      <div className="pos-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Title</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Order Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPos.map(po => (
              <tr key={po.id}>
                <td className="po-number">{po.po_number}</td>
                <td>{po.title}</td>
                <td>{po.vendor}</td>
                <td>£{po.total_amount.toLocaleString()}</td>
                <td>
                  <span className={`badge ${getStatusColor(po.status)}`}>
                    {getStatusLabel(po.status)}
                  </span>
                </td>
                <td>{format(new Date(po.order_date), 'MMM dd, yyyy')}</td>
                <td className="actions-cell">
                  <button 
                    className="icon-btn" 
                    onClick={() => setSelectedPO(po)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  {po.status === 'draft' && (
                    <>
                      <button 
                        className="icon-btn" 
                        onClick={() => handleUpdateStatus(po.id, 'pending_approval')}
                        title="Submit for Approval"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button 
                        className="icon-btn delete" 
                        onClick={() => handleDelete(po.id)}
                        title="Delete"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {po.status === 'pending_approval' && (
                    <button 
                      className="icon-btn approve" 
                      onClick={() => handleUpdateStatus(po.id, 'approved')}
                      title="Approve"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredPos.length === 0 && (
        <div className="empty-state">
          <p>No purchase orders found</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Create your first PO
          </button>
        </div>
      )}

      {showModal && (
        <POModal 
          assets={assets}
          onClose={() => setShowModal(false)} 
          onSubmit={handleCreatePO} 
        />
      )}

      {selectedPO && (
        <PODetailModal 
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

function POModal({ assets, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vendor: '',
    vendor_contact: '',
    delivery_date: '',
    total_amount: '',
    department: 'Facilities',
    budget_code: '',
    asset_id: '',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    const totalAmount = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    
    setFormData({
      ...formData,
      items: newItems,
      total_amount: totalAmount
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totalAmount = newItems.reduce((sum, item) => sum + (item.total || 0), 0);
    setFormData({
      ...formData,
      items: newItems,
      total_amount: totalAmount
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.vendor || formData.items.length === 0) {
      alert('Please fill in required fields and add at least one item');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <h3>Create Purchase Order</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="PO Title *"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          <textarea
            placeholder="Description"
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <div className="form-row">
            <input
              type="text"
              placeholder="Vendor Name *"
              value={formData.vendor}
              onChange={(e) => setFormData({...formData, vendor: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Vendor Contact Email"
              value={formData.vendor_contact}
              onChange={(e) => setFormData({...formData, vendor_contact: e.target.value})}
            />
          </div>
          <div className="form-row">
            <input
              type="date"
              placeholder="Expected Delivery Date"
              value={formData.delivery_date}
              onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
            />
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            >
              <option value="Facilities">Facilities</option>
              <option value="IT">IT</option>
              <option value="Operations">Operations</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Budget Code"
              value={formData.budget_code}
              onChange={(e) => setFormData({...formData, budget_code: e.target.value})}
            />
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
          </div>

          <h4>Line Items</h4>
          <div className="items-list">
            {formData.items.map((item, index) => (
              <div key={index} className="item-row">
                <input
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  style={{ width: '80px' }}
                  required
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  style={{ width: '100px' }}
                  required
                />
                <span className="item-total">£{item.total.toLocaleString()}</span>
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="remove-item">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="btn-secondary add-item-btn">
            + Add Item
          </button>

          <div className="po-total">
            <strong>Total Amount: £{formData.total_amount.toLocaleString()}</strong>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create as Draft</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PODetailModal({ po, onClose, onUpdateStatus }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <div className="po-detail-header">
          <h3>{po.po_number} - {po.title}</h3>
          <span className={`badge ${po.status === 'approved' ? 'status-approved' : po.status === 'pending_approval' ? 'status-pending' : 'status-draft'}`}>
            {po.status.toUpperCase()}
          </span>
        </div>

        <div className="po-info-grid">
          <div><strong>Vendor:</strong> {po.vendor}</div>
          <div><strong>Contact:</strong> {po.vendor_contact || 'N/A'}</div>
          <div><strong>Order Date:</strong> {format(new Date(po.order_date), 'MMM dd, yyyy')}</div>
          <div><strong>Delivery Date:</strong> {po.delivery_date ? format(new Date(po.delivery_date), 'MMM dd, yyyy') : 'TBD'}</div>
          <div><strong>Department:</strong> {po.department}</div>
          <div><strong>Budget Code:</strong> {po.budget_code || 'N/A'}</div>
          <div><strong>Requested By:</strong> Admin</div>
          <div><strong>Total Amount:</strong> <strong>£{po.total_amount.toLocaleString()}</strong></div>
        </div>

        {po.description && (
          <div className="po-description">
            <strong>Description:</strong>
            <p>{po.description}</p>
          </div>
        )}

        <h4>Line Items</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>£{item.unit_price.toLocaleString()}</td>
                <td>£{item.total.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan="3" style={{ textAlign: 'right' }}><strong>Grand Total:</strong></td>
              <td><strong>£{po.total_amount.toLocaleString()}</strong></td>
            </tr>
          </tbody>
        </table>

        {po.asset_id && (
          <div className="related-asset">
            <strong>Related Asset:</strong> Asset ID: {po.asset_id}
          </div>
        )}

        {po.approved_by && (
          <div className="approval-info">
            <strong>Approved By:</strong> Admin on {format(new Date(po.approved_at), 'MMM dd, yyyy HH:mm')}
          </div>
        )}

        <div className="modal-actions">
          {po.status === 'draft' && (
            <>
              <button onClick={() => onUpdateStatus(po.id, 'pending_approval')}>
                Submit for Approval
              </button>
            </>
          )}
          {po.status === 'pending_approval' && (
            <button className="btn-primary" onClick={() => onUpdateStatus(po.id, 'approved')}>
              Approve Order
            </button>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseOrderList;