import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Eye, Edit, Calendar, 
  AlertCircle, CheckCircle, Clock, FileText,
  Shield, Award, ClipboardList
} from 'lucide-react';

function ComplianceManagement() {
  const [compliance, setCompliance] = useState([]);
  const [filteredCompliance, setFilteredCompliance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = compliance;
    
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.compliance_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        if (statusFilter === 'expired') return c.is_expired;
        if (statusFilter === 'expiring_soon') return c.is_expiring_soon;
        return c.status === statusFilter;
      });
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }
    
    setFilteredCompliance(filtered);
  }, [searchTerm, statusFilter, typeFilter, compliance]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [complianceRes, statsRes, assetsRes, vendorsRes] = await Promise.all([
        axios.get('/compliance'),
        axios.get('/compliance/stats/summary'),
        axios.get('/assets'),
        axios.get('/vendors')
      ]);
      setCompliance(complianceRes.data);
      setFilteredCompliance(complianceRes.data);
      setStats(statsRes.data);
      setAssets(assetsRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (recordData) => {
    try {
      const response = await axios.post('/compliance', recordData);
      setCompliance([response.data, ...compliance]);
      setShowModal(false);
      alert('Compliance record created successfully!');
    } catch (error) {
      console.error('Error creating record:', error);
      alert('Failed to create compliance record');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await axios.patch(`/compliance/${id}/status`, { status });
      setCompliance(compliance.map(c => c.id === id ? response.data : c));
      alert(`Record marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (record) => {
    if (record.is_expired) {
      return { color: '#dc2626', label: 'Expired', icon: AlertCircle };
    }
    if (record.is_expiring_soon) {
      return { color: '#f59e0b', label: 'Expiring Soon', icon: Clock };
    }
    if (record.status === 'active') {
      return { color: '#10b981', label: 'Active', icon: CheckCircle };
    }
    return { color: '#9ca3af', label: record.status, icon: FileText };
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Certificate': return Award;
      case 'Permit': return Shield;
      case 'Inspection': return ClipboardList;
      default: return FileText;
    }
  };

  if (loading) {
    return <div className="loading">Loading compliance records...</div>;
  }

  return (
    <div className="compliance-management">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0 }}>Compliance Management</h2>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add Compliance Record
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '30px' }}>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <FileText size={28} style={{ color: '#667eea', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Records</p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <CheckCircle size={28} style={{ color: '#10b981', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.active}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Active</p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <Clock size={28} style={{ color: '#f59e0b', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.expiring_soon}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Expiring Soon</p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <AlertCircle size={28} style={{ color: '#dc2626', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.expired}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Expired</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px' }}>
          <Search size={18} style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by title, number, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, marginLeft: '8px' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}
        >
          <option value="all">All Types</option>
          <option value="Certificate">Certificates</option>
          <option value="Permit">Permits</option>
          <option value="Inspection">Inspections</option>
        </select>
      </div>

      {/* Compliance Records Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
        {filteredCompliance.map(record => {
          const StatusBadge = getStatusBadge(record);
          const TypeIcon = getTypeIcon(record.type);
          const daysRemaining = record.days_remaining;
          
          return (
            <div key={record.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ 
                padding: '16px', 
                borderBottom: '1px solid #e5e7eb', 
                background: record.is_expired ? '#fef2f2' : record.is_expiring_soon ? '#fffbeb' : '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TypeIcon size={24} style={{ color: '#667eea' }} />
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{record.title}</h3>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{record.compliance_number}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      background: getPriorityColor(record.priority),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      {record.priority}
                    </span>
                    <span style={{ 
                      background: StatusBadge.color,
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <StatusBadge.icon size={12} />
                      {StatusBadge.label}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Category</span>
                  <div style={{ fontWeight: '500' }}>{record.category}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Issue Date</span>
                    <div style={{ fontSize: '14px' }}>{record.issue_date}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Expiry Date</span>
                    <div style={{ 
                      fontSize: '14px',
                      color: record.is_expired ? '#dc2626' : record.is_expiring_soon ? '#f59e0b' : '#1f2937',
                      fontWeight: record.is_expired || record.is_expiring_soon ? '600' : 'normal'
                    }}>
                      {record.expiry_date || 'N/A'}
                      {daysRemaining && daysRemaining > 0 && !record.is_expired && (
                        <span style={{ fontSize: '12px', marginLeft: '8px' }}>({daysRemaining} days)</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {record.asset_name && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Related Asset</span>
                    <div style={{ fontSize: '14px' }}>{record.asset_name}</div>
                  </div>
                )}
                
                {record.vendor_name && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Related Vendor</span>
                    <div style={{ fontSize: '14px' }}>{record.vendor_name}</div>
                  </div>
                )}
                
                {record.issuing_authority && (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Issuing Authority</span>
                    <div style={{ fontSize: '14px' }}>{record.issuing_authority}</div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <button 
                    onClick={() => setSelectedRecord(record)}
                    style={{ flex: 1, background: '#667eea', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    View Details
                  </button>
                  {record.status === 'active' && !record.is_expired && (
                    <button 
                      onClick={() => handleUpdateStatus(record.id, 'completed')}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCompliance.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
          <FileText size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
          <p style={{ color: '#6b7280' }}>No compliance records found</p>
          <button onClick={() => setShowModal(true)} style={{ marginTop: '16px', background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
            Add your first compliance record
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <ComplianceModal 
          assets={assets}
          vendors={vendors}
          onClose={() => setShowModal(false)} 
          onSubmit={handleCreateRecord}
        />
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <ComplianceDetailModal 
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

// Compliance Modal for creating new records
function ComplianceModal({ assets, vendors, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Certificate',
    category: '',
    description: '',
    priority: 'medium',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    reminder_days: 30,
    issuing_authority: '',
    reference_number: '',
    asset_id: '',
    vendor_id: '',
    inspection_frequency: 'annual',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please enter a title');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '550px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <h3>Add Compliance Record</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Title *"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="Certificate">Certificate</option>
              <option value="Permit">Permit</option>
              <option value="Inspection">Inspection</option>
            </select>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <input
            type="text"
            placeholder="Category (e.g., Fire Safety, Electrical)"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px', minHeight: '80px' }}
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="date"
              placeholder="Issue Date"
              value={formData.issue_date}
              onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <input
              type="date"
              placeholder="Expiry Date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              placeholder="Reminder Days (before expiry)"
              value={formData.reminder_days}
              onChange={(e) => setFormData({...formData, reminder_days: parseInt(e.target.value)})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <select
              value={formData.inspection_frequency}
              onChange={(e) => setFormData({...formData, inspection_frequency: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="biannual">Bi-annual</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          
          <input
            type="text"
            placeholder="Issuing Authority"
            value={formData.issuing_authority}
            onChange={(e) => setFormData({...formData, issuing_authority: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData({...formData, asset_id: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="">Select Related Asset (Optional)</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name} ({asset.asset_tag})</option>
              ))}
            </select>
            <select
              value={formData.vendor_id}
              onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            >
              <option value="">Select Related Vendor (Optional)</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </div>
          
          <textarea
            placeholder="Additional Notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px', minHeight: '80px' }}
          />
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create Record</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Compliance Detail Modal
function ComplianceDetailModal({ record, onClose, onUpdateStatus }) {
  const StatusBadge = record.is_expired ? { color: '#dc2626', label: 'Expired' } : 
                       record.is_expiring_soon ? { color: '#f59e0b', label: 'Expiring Soon' } : 
                       { color: '#10b981', label: record.status };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{record.compliance_number}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0' }}>{record.title}</h4>
          <div><strong>Type:</strong> {record.type}</div>
          <div><strong>Category:</strong> {record.category}</div>
          <div><strong>Priority:</strong> <span style={{ color: record.priority === 'critical' ? '#dc2626' : record.priority === 'high' ? '#f59e0b' : '#3b82f6' }}>{record.priority}</span></div>
          <div><strong>Status:</strong> <span style={{ color: StatusBadge.color }}>{StatusBadge.label}</span></div>
          {record.description && <div><strong>Description:</strong> {record.description}</div>}
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4>Dates & Compliance</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><strong>Issue Date:</strong> {record.issue_date}</div>
            <div><strong>Expiry Date:</strong> {record.expiry_date || 'N/A'}</div>
            <div><strong>Last Inspection:</strong> {record.last_inspection_date || 'N/A'}</div>
            <div><strong>Next Inspection:</strong> {record.next_inspection_date || 'N/A'}</div>
            <div><strong>Frequency:</strong> {record.inspection_frequency}</div>
            <div><strong>Reminder:</strong> {record.reminder_days} days before expiry</div>
          </div>
        </div>
        
        {record.issuing_authority && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Issuing Authority</h4>
            <div>{record.issuing_authority}</div>
            {record.reference_number && <div>Reference: {record.reference_number}</div>}
          </div>
        )}
        
        {record.requirements && record.requirements.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Requirements</h4>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {record.requirements.map((req, idx) => (
                <li key={idx}>{req}</li>
              ))}
            </ul>
          </div>
        )}
        
        {record.notes && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Notes</h4>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>{record.notes}</div>
          </div>
        )}
        
        {record.audits && record.audits.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Audit History</h4>
            {record.audits.map(audit => (
              <div key={audit.id} style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' }}>
                <div><strong>{audit.audit_date}</strong> - {audit.auditor}</div>
                <div>Findings: {audit.findings}</div>
                {audit.corrective_actions.length > 0 && (
                  <div>Actions: {audit.corrective_actions.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {record.status === 'active' && !record.is_expired && (
            <button 
              onClick={() => onUpdateStatus(record.id, 'completed')}
              style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}
            >
              Mark as Completed
            </button>
          )}
          <button onClick={onClose} style={{ flex: 1, background: '#667eea', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ComplianceManagement;