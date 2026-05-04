import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, QrCode, Eye } from 'lucide-react';

function AssetList() {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    const filtered = assets.filter(asset =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAssets(filtered);
  }, [searchTerm, assets]);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/assets');
      setAssets(response.data);
      setFilteredAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (assetData) => {
    try {
      const response = await axios.post('/assets', assetData);
      setAssets([response.data, ...assets]);
      setShowModal(false);
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const handleViewAsset = async (id) => {
    try {
      const response = await axios.get(`/assets/${id}`);
      setSelectedAsset(response.data);
    } catch (error) {
      console.error('Error fetching asset details:', error);
    }
  };

  const generateQR = async (id) => {
    try {
      const response = await axios.post(`/assets/${id}/generate-qr`);
      window.open(response.data.qr_code, '_blank');
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading assets...</div>;
  }

  return (
    <div className="asset-list">
      <div className="page-header">
        <h2>Asset Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Asset
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by name, tag, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="asset-grid">
        {filteredAssets.map(asset => (
          <div key={asset.id} className="asset-card">
            <div className="asset-card-header">
              <h3>{asset.name}</h3>
              <span className={`badge status-${asset.status}`}>{asset.status}</span>
            </div>
            <div className="asset-card-details">
              <p><strong>Tag:</strong> {asset.asset_tag}</p>
              <p><strong>Location:</strong> {asset.location || 'N/A'}</p>
              <p><strong>Category:</strong> {asset.category || 'N/A'}</p>
              <p><strong>Purchase Cost:</strong> {asset.purchase_cost ? `£${asset.purchase_cost.toLocaleString()}` : 'N/A'}</p>
            </div>
            <div className="asset-card-actions">
              <button onClick={() => handleViewAsset(asset.id)} className="icon-btn">
                <Eye size={18} /> View
              </button>
              <button onClick={() => generateQR(asset.id)} className="icon-btn">
                <QrCode size={18} /> QR
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <AssetModal onClose={() => setShowModal(false)} onSubmit={handleCreateAsset} />
      )}

      {selectedAsset && (
        <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}

function AssetModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    asset_tag: '',
    name: '',
    category: '',
    location: '',
    status: 'active',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiry: '',
    manufacturer: '',
    model: '',
    serial_number: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add New Asset</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Asset Tag *"
              value={formData.asset_tag}
              onChange={(e) => setFormData({...formData, asset_tag: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Asset Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div className="form-row">
            <input
              type="date"
              placeholder="Purchase Date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
            />
            <input
              type="number"
              placeholder="Purchase Cost"
              value={formData.purchase_cost}
              onChange={(e) => setFormData({...formData, purchase_cost: e.target.value})}
            />
          </div>
          <div className="form-row">
            <input
              type="date"
              placeholder="Warranty Expiry"
              value={formData.warranty_expiry}
              onChange={(e) => setFormData({...formData, warranty_expiry: e.target.value})}
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
            />
            <input
              type="text"
              placeholder="Model"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssetDetailModal({ asset, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal large" onClick={(e) => e.stopPropagation()}>
        <h3>Asset Details</h3>
        <div className="asset-detail-grid">
          <div>
            <strong>Asset Tag</strong>
            <p>{asset.asset_tag}</p>
          </div>
          <div>
            <strong>Name</strong>
            <p>{asset.name}</p>
          </div>
          <div>
            <strong>Category</strong>
            <p>{asset.category || 'N/A'}</p>
          </div>
          <div>
            <strong>Location</strong>
            <p>{asset.location || 'N/A'}</p>
          </div>
          <div>
            <strong>Status</strong>
            <p>{asset.status}</p>
          </div>
          <div>
            <strong>Purchase Date</strong>
            <p>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <strong>Purchase Cost</strong>
            <p>{asset.purchase_cost ? `£${asset.purchase_cost.toLocaleString()}` : 'N/A'}</p>
          </div>
          <div>
            <strong>Warranty Expiry</strong>
            <p>{asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <strong>Manufacturer</strong>
            <p>{asset.manufacturer || 'N/A'}</p>
          </div>
          <div>
            <strong>Model</strong>
            <p>{asset.model || 'N/A'}</p>
          </div>
          <div>
            <strong>Serial Number</strong>
            <p>{asset.serial_number || 'N/A'}</p>
          </div>
        </div>

        {asset.tickets && asset.tickets.length > 0 && (
          <>
            <h4>Ticket History</h4>
            <table className="data-table">
              <thead>
                <tr><th>Ticket #</th><th>Title</th><th>Status</th><th>Created</th></tr>
              </thead>
              <tbody>
                {asset.tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>{ticket.ticket_number}</td>
                    <td>{ticket.title}</td>
                    <td>{ticket.status}</td>
                    <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default AssetList;