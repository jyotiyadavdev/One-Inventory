import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import TicketList from './components/TicketList';
import QRScanner from './components/QRScanner';
import PurchaseOrderList from './components/PurchaseOrderList';
import VendorManagement from './components/VendorManagement';
import ComplianceManagement from './components/ComplianceManagement';
import BudgetTracking from './components/BudgetTracking';
import UserManagement from './components/UserManagement';
import ReportingDashboard from './components/ReportingDashboard';
import axios from 'axios';

// Configure axios with correct base URL
// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = API_BASE_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    setLoginError('');
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Server error. Make sure backend is running on port 5000';
      setLoginError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<AssetList />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/purchase-orders" element={<PurchaseOrderList />} />
          <Route path="/vendors" element={<VendorManagement />} />
          <Route path="/compliance" element={<ComplianceManagement />} />
          <Route path="/budgets" element={<BudgetTracking />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/reports" element={<ReportingDashboard />} />
          <Route path="/scan" element={<QRScanner />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

// Updated LoginScreen with better error display
function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState('admin@pfg.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(email, password);
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>OneBill</h1>
        <p>Asset & Facility Management Platform</p>
        
        {error && (
          <div className="error-message" style={{ color: '#dc2626', background: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            ❌ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: admin@pfg.com<br/>Password: any</p>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#667eea' }}>
            Make sure backend is running on port 5000
          </p>
        </div>
      </div>
    </div>
  );
}
export default App;