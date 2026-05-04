import React, { useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, X, QrCode } from 'lucide-react';

function QRScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [asset, setAsset] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketData, setTicketData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'facilities'
  });
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  const startScanner = () => {
    setIsScanning(true);
    
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Success callback
        scanner.clear();
        setIsScanning(false);
        handleScan(decodedText);
      },
      (errorMessage) => {
        // Error callback - ignore most errors
        if (errorMessage.includes("No MultiFormat Readers")) {
          // Silently ignore
        }
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScan = async (data) => {
    if (data) {
      try {
        // Try to parse QR data (could be JSON or plain text)
        let qrData;
        try {
          qrData = JSON.parse(data);
        } catch {
          // If not JSON, treat as asset tag
          qrData = { asset_tag: data };
        }
        
        // Fetch asset by tag or ID
        let assetResponse;
        if (qrData.asset_id) {
          assetResponse = await axios.get(`/assets/${qrData.asset_id}`);
        } else if (qrData.asset_tag) {
          // Get all assets and find by tag
          const assetsResponse = await axios.get('/assets');
          const foundAsset = assetsResponse.data.find(a => a.asset_tag === qrData.asset_tag);
          if (foundAsset) {
            assetResponse = { data: foundAsset };
          } else {
            throw new Error('Asset not found');
          }
        } else {
          throw new Error('Invalid QR code');
        }
        
        setAsset(assetResponse.data);
        setScanResult(qrData);
      } catch (error) {
        console.error('Error processing QR scan:', error);
        setScanResult({ error: 'Could not find asset. Please check the QR code.' });
      }
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketData.title) {
      alert('Please enter a title for the issue');
      return;
    }
    
    try {
      await axios.post('/tickets', {
        ...ticketData,
        asset_id: asset.id,
        location: asset.location,
        reported_by: 1
      });
      setShowNewTicket(false);
      setScanResult(null);
      setAsset(null);
      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setAsset(null);
    setShowNewTicket(false);
    setTicketData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'facilities'
    });
    if (scannerRef.current) {
      stopScanner();
    }
  };

  return (
    <div className="qr-scanner">
      <h2>Scan Asset QR Code</h2>
      
      {!scanResult && !isScanning && (
        <div className="scanner-start">
          <button className="btn-primary start-scan-btn" onClick={startScanner}>
            <Camera size={24} /> Start Scanner
          </button>
          <p className="scanner-hint">
            Point your camera at the QR code on any asset to view details or report an issue
          </p>
        </div>
      )}

      {isScanning && (
        <div className="scanner-container">
          <div id="qr-reader" className="qr-reader"></div>
          <button className="stop-scan-btn" onClick={stopScanner}>
            <X size={20} /> Stop Scanning
          </button>
        </div>
      )}

      {scanResult && asset && (
        <div className="scan-result">
          <button className="close-scan" onClick={resetScan}>
            <X size={20} /> Scan Another
          </button>
          
          <div className="asset-detail-card">
            <div className="asset-header">
              <QrCode size={24} />
              <h3>{asset.name}</h3>
            </div>
            <div className="asset-details">
              <div className="detail-row">
                <strong>Asset Tag:</strong> 
                <span>{asset.asset_tag}</span>
              </div>
              <div className="detail-row">
                <strong>Location:</strong> 
                <span>{asset.location || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`badge status-${asset.status}`}>{asset.status}</span>
              </div>
              <div className="detail-row">
                <strong>Manufacturer:</strong> 
                <span>{asset.manufacturer || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Model:</strong> 
                <span>{asset.model || 'N/A'}</span>
              </div>
              {asset.warranty_expiry && (
                <div className="detail-row">
                  <strong>Warranty Expiry:</strong> 
                  <span>{new Date(asset.warranty_expiry).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {!showNewTicket ? (
              <div className="scan-actions">
                <button className="btn-primary" onClick={() => setShowNewTicket(true)}>
                  Report Issue with this Asset
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  View Full Details
                </button>
              </div>
            ) : (
              <div className="new-ticket-form">
                <h4>Report Issue for {asset.name}</h4>
                <input
                  type="text"
                  placeholder="Issue Title *"
                  value={ticketData.title}
                  onChange={(e) => setTicketData({...ticketData, title: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Describe the issue in detail..."
                  rows="3"
                  value={ticketData.description}
                  onChange={(e) => setTicketData({...ticketData, description: e.target.value})}
                />
                <select
                  value={ticketData.priority}
                  onChange={(e) => setTicketData({...ticketData, priority: e.target.value})}
                >
                  <option value="low">Low Priority - Non-urgent</option>
                  <option value="medium">Medium Priority - Needs attention</option>
                  <option value="high">High Priority - Urgent</option>
                  <option value="critical">Critical Priority - Emergency</option>
                </select>
                <select
                  value={ticketData.category}
                  onChange={(e) => setTicketData({...ticketData, category: e.target.value})}
                >
                  <option value="facilities">Facilities</option>
                  <option value="hvac">HVAC</option>
                  <option value="electrical">Electrical</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="it">IT</option>
                </select>
                <div className="form-actions">
                  <button className="btn-secondary" onClick={() => setShowNewTicket(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleCreateTicket}>
                    Submit Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {scanResult && scanResult.error && (
        <div className="scan-result error">
          <div className="error-icon">⚠️</div>
          <p>{scanResult.error}</p>
          <button className="btn-primary" onClick={resetScan}>Try Again</button>
        </div>
      )}
    </div>
  );
}

export default QRScanner;