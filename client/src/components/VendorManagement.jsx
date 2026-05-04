import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Eye, Edit, Trash2, 
  Calendar, DollarSign, Building, Phone, Mail,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';

function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' or 'contracts'

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = vendors;
    
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(v => v.category === categoryFilter);
    }
    
    setFilteredVendors(filtered);
  }, [searchTerm, categoryFilter, vendors]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, contractsRes, statsRes] = await Promise.all([
        axios.get('/vendors'),
        axios.get('/contracts'),
        axios.get('/vendors/stats/summary')
      ]);
      setVendors(vendorsRes.data);
      setContracts(contractsRes.data);
      setStats(statsRes.data);
      setFilteredVendors(vendorsRes.data);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (vendorData) => {
    try {
      const response = await axios.post('/vendors', vendorData);
      setVendors([response.data, ...vendors]);
      setShowVendorModal(false);
      alert('Vendor created successfully!');
    } catch (error) {
      console.error('Error creating vendor:', error);
      alert('Failed to create vendor');
    }
  };

  const handleCreateContract = async (contractData) => {
    try {
      const response = await axios.post('/contracts', contractData);
      setContracts([response.data, ...contracts]);
      setShowContractModal(false);
      alert('Contract created successfully!');
    } catch (error) {
      console.error('Error creating contract:', error);
      alert('Failed to create contract');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return { bg: '#10b981', label: 'Active' };
      case 'pending': return { bg: '#f59e0b', label: 'Pending' };
      case 'expired': return { bg: '#dc2626', label: 'Expired' };
      case 'terminated': return { bg: '#6b7280', label: 'Terminated' };
      default: return { bg: '#9ca3af', label: status };
    }
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    return `${days} days left`;
  };

  const categories = [...new Set(vendors.map(v => v.category))];

  if (loading) {
    return <div className="loading">Loading vendor data...</div>;
  }

  return (
    <div className="vendor-management">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ margin: 0 }}>Vendor & Contract Management</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowVendorModal(true)}
            style={{ background: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add Vendor
          </button>
          <button 
            onClick={() => setShowContractModal(true)}
            style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add Contract
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <Building size={32} style={{ color: '#667eea', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.total_vendors}</h3>
            <p style={{ margin: 0, color: '#666' }}>Total Vendors</p>
          </div>
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.active_vendors}</h3>
            <p style={{ margin: 0, color: '#666' }}>Active Vendors</p>
          </div>
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <FileText size={32} style={{ color: '#f59e0b', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>{stats.total_contracts}</h3>
            <p style={{ margin: 0, color: '#666' }}>Total Contracts</p>
          </div>
          <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <DollarSign size={32} style={{ color: '#3b82f6', marginBottom: '8px' }} />
            <h3 style={{ margin: '8px 0', fontSize: '24px' }}>£{stats.total_contract_value.toLocaleString()}</h3>
            <p style={{ margin: 0, color: '#666' }}>Contract Value</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('vendors')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'vendors' ? '#667eea' : '#6b7280',
            borderBottom: activeTab === 'vendors' ? '2px solid #667eea' : 'none',
            fontWeight: activeTab === 'vendors' ? '600' : 'normal'
          }}
        >
          Vendors
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === 'contracts' ? '#667eea' : '#6b7280',
            borderBottom: activeTab === 'contracts' ? '2px solid #667eea' : 'none',
            fontWeight: activeTab === 'contracts' ? '600' : 'normal'
          }}
        >
          Contracts
        </button>
      </div>

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 16px' }}>
              <Search size={18} style={{ color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search vendors by name, code, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', flex: 1, marginLeft: '8px' }}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredVendors.map(vendor => (
              <div key={vendor.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0' }}>{vendor.name}</h3>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{vendor.vendor_code}</span>
                    </div>
                    <span style={{ 
                      background: vendor.status === 'active' ? '#10b981' : '#9ca3af',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {vendor.status}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                    <span style={{ color: '#6b7280' }}>Category:</span>
                    <span>{vendor.category}</span>
                  </div>
                  {vendor.contact_person && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '14px' }}>
                      <User size={14} style={{ color: '#6b7280' }} />
                      <span>{vendor.contact_person}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '14px' }}>
                      <Mail size={14} style={{ color: '#6b7280' }} />
                      <span>{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
                      <Phone size={14} style={{ color: '#6b7280' }} />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Contracts</span>
                      <div style={{ fontWeight: 'bold' }}>{vendor.active_contracts || 0} active</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Rating</span>
                      <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>{'★'.repeat(Math.floor(vendor.rating || 0))}{vendor.rating || 'N/A'}</div>
                    </div>
                    <button 
                      onClick={() => setSelectedVendor(vendor)}
                      style={{ background: '#667eea', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {contracts.map(contract => {
              const statusStyle = getStatusColor(contract.status);
              const daysRemaining = getDaysRemaining(contract.end_date);
              const isExpiringSoon = daysRemaining && typeof daysRemaining === 'string' && daysRemaining.includes('days') && parseInt(daysRemaining) <= 30;
              
              return (
                <div key={contract.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0 }}>{contract.contract_number}</h3>
                        <span style={{ background: statusStyle.bg, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {statusStyle.label}
                        </span>
                        {isExpiringSoon && (
                          <span style={{ background: '#fef3c7', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} /> Expiring Soon
                          </span>
                        )}
                      </div>
                      <h4 style={{ margin: '0 0 8px 0' }}>{contract.title}</h4>
                      <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>{contract.description}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedContract(contract)}
                      style={{ background: 'none', border: '1px solid #667eea', color: '#667eea', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      View Details
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Vendor</span>
                      <div style={{ fontWeight: '500' }}>{contract.vendor_name}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Contract Value</span>
                      <div style={{ fontWeight: '500', color: '#10b981' }}>£{contract.value.toLocaleString()}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Period</span>
                      <div style={{ fontSize: '14px' }}>
                        {contract.start_date} → {contract.end_date || 'Ongoing'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {contract.status === 'active' ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <Clock size={14} style={{ color: '#f59e0b' }} />}
                        <span>{daysRemaining || 'Active'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <VendorDetailModal 
          vendor={selectedVendor}
          contracts={contracts.filter(c => c.vendor_id === selectedVendor.id)}
          onClose={() => setSelectedVendor(null)}
        />
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <ContractDetailModal 
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
        />
      )}

      {/* Create Vendor Modal */}
      {showVendorModal && (
        <VendorModal 
          onClose={() => setShowVendorModal(false)} 
          onSubmit={handleCreateVendor}
        />
      )}

      {/* Create Contract Modal */}
      {showContractModal && (
        <ContractModal 
          vendors={vendors}
          onClose={() => setShowContractModal(false)} 
          onSubmit={handleCreateContract}
        />
      )}
    </div>
  );
}

// Icon components
const User = ({ size, style }) => <span style={style}>👤</span>;
const FileText = ({ size, style }) => <span style={style}>📄</span>;

// Vendor Detail Modal
function VendorDetailModal({ vendor, contracts, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{vendor.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
          <div><strong>Vendor Code:</strong> {vendor.vendor_code}</div>
          <div><strong>Category:</strong> {vendor.category}</div>
          <div><strong>Contact Person:</strong> {vendor.contact_person || 'N/A'}</div>
          <div><strong>Email:</strong> {vendor.email || 'N/A'}</div>
          <div><strong>Phone:</strong> {vendor.phone || 'N/A'}</div>
          <div><strong>Address:</strong> {vendor.address || 'N/A'}</div>
          <div><strong>Payment Terms:</strong> {vendor.payment_terms || 'N/A'}</div>
          <div><strong>Tax ID:</strong> {vendor.tax_id || 'N/A'}</div>
        </div>
        
        <h4>Contracts ({contracts.length})</h4>
        {contracts.length === 0 ? (
          <p>No contracts found for this vendor.</p>
        ) : (
          contracts.map(contract => (
            <div key={contract.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px' }}>
              <div><strong>{contract.contract_number}</strong> - {contract.title}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Value: £{contract.value.toLocaleString()} | Status: {contract.status}</div>
            </div>
          ))
        )}
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Contract Detail Modal
function ContractDetailModal({ contract, onClose }) {
  const statusStyle = contract.status === 'active' ? { bg: '#10b981', label: 'Active' } : 
                      contract.status === 'pending' ? { bg: '#f59e0b', label: 'Pending' } : 
                      { bg: '#dc2626', label: 'Expired' };
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>{contract.contract_number}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div><strong>Title:</strong> {contract.title}</div>
          <div><strong>Vendor:</strong> {contract.vendor_name}</div>
          <div><strong>Type:</strong> {contract.type}</div>
          <div><strong>Description:</strong> {contract.description || 'N/A'}</div>
          <div><strong>Start Date:</strong> {contract.start_date}</div>
          <div><strong>End Date:</strong> {contract.end_date || 'Ongoing'}</div>
          <div><strong>Value:</strong> £{contract.value.toLocaleString()}</div>
          <div><strong>Auto Renew:</strong> {contract.auto_renew ? 'Yes' : 'No'}</div>
          <div><strong>Status:</strong> <span style={{ background: statusStyle.bg, color: 'white', padding: '2px 8px', borderRadius: '4px' }}>{statusStyle.label}</span></div>
        </div>
        
        {contract.service_level && Object.keys(contract.service_level).length > 0 && (
          <>
            <h4>Service Level Agreement</h4>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '12px' }}>
              {contract.service_level.response_time && <div>Response Time: {contract.service_level.response_time}</div>}
              {contract.service_level.resolution_time && <div>Resolution Time: {contract.service_level.resolution_time}</div>}
              {contract.service_level.uptime_guarantee && <div>Uptime Guarantee: {contract.service_level.uptime_guarantee}</div>}
            </div>
          </>
        )}
        
        {contract.terms && (
          <>
            <h4>Terms & Conditions</h4>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>{contract.terms}</div>
          </>
        )}
        
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Create Vendor Modal
function VendorModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    category: 'General',
    tax_id: '',
    payment_terms: 'Net 30'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter vendor name');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <h3>Add New Vendor</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Vendor Name *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <input
            type="text"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={(e) => setFormData({...formData, company_name: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <input
            type="text"
            placeholder="Contact Person"
            value={formData.contact_person}
            onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <input
            type="text"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="General">General</option>
            <option value="HVAC">HVAC</option>
            <option value="Electrical">Electrical</option>
            <option value="IT">IT</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Construction">Construction</option>
          </select>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create Vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Contract Modal
function ContractModal({ vendors, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    vendor_id: '',
    title: '',
    description: '',
    type: 'Service',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    value: '',
    auto_renew: false,
    terms: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.vendor_id || !formData.title || !formData.value) {
      alert('Please fill all required fields');
      return;
    }
    onSubmit({...formData, value: parseFloat(formData.value)});
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '500px', maxWidth: '90%', maxHeight: '80vh', overflow: 'auto', padding: '24px' }}>
        <h3>Add New Contract</h3>
        <form onSubmit={handleSubmit}>
          <select
            value={formData.vendor_id}
            onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          >
            <option value="">Select Vendor *</option>
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Contract Title *"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px', minHeight: '80px' }}
          />
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
          >
            <option value="Service">Service</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Supply">Supply</option>
            <option value="Consulting">Consulting</option>
          </select>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="date"
              placeholder="Start Date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <input
              type="date"
              placeholder="End Date"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              style={{ flex: 1, padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            />
          </div>
          <input
            type="number"
            placeholder="Contract Value (£) *"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px' }}
            required
          />
          <textarea
            placeholder="Terms & Conditions"
            value={formData.terms}
            onChange={(e) => setFormData({...formData, terms: e.target.value})}
            style={{ width: '100%', padding: '10px', margin: '10px 0', border: '1px solid #ccc', borderRadius: '6px', minHeight: '80px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
            <input
              type="checkbox"
              checked={formData.auto_renew}
              onChange={(e) => setFormData({...formData, auto_renew: e.target.checked})}
            />
            Auto-renew contract
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create Contract</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VendorManagement;