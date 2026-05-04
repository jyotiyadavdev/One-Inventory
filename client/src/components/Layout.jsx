import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Ticket, QrCode, LogOut, ShoppingCart, Users, Shield, DollarSign, BarChart3, UserCog } from 'lucide-react';

function Layout({ children, user, onLogout }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/assets', icon: Package, label: 'Assets' },
    { path: '/tickets', icon: Ticket, label: 'Tickets' },
    { path: '/purchase-orders', icon: ShoppingCart, label: 'Purchase Orders' },
    { path: '/users', icon: UserCog, label: 'Users' },
    { path: '/vendors', icon: Users, label: 'Vendors' },
    { path: '/compliance', icon: Shield, label: 'Compliance' },
    { path: '/budgets', icon: DollarSign, label: 'Budgets' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/scan', icon: QrCode, label: 'Scan QR' },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>OneBill</h1>
          <div className="user-info">
            <span>{user?.full_name}</span>
            <button onClick={onLogout} className="logout-btn">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      
      <div className="main-container">
        <nav className="sidebar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;