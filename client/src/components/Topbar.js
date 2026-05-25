import React from "react";

export default function Topbar({ activeModule }) {
  const getModuleTitle = (module) => {
    const titles = {
      'finance-dashboard': 'Finance Dashboard',
      'finance-po': 'Purchase Orders',
      'finance-sales': 'Sales & Revenue',
      'finance-invoices': 'Invoices & Bills',
      'finance-payroll': 'Payroll & Salaries',
      'finance-transport': 'Transport Costs',
      'finance-warehouse': 'Warehouse Costs',
      'finance-ledger': 'General Ledger',
      'finance-payments': 'Payment Management',
      'finance-reports': 'Financial Reports',
      'finance-taxes': 'Tax Compliance',
      'supplier-dashboard': 'Supplier Dashboard',
      'buyer-overview': 'Buyer Dashboard',
      'buyer-dashboard': 'Buyer Quotations',
      'buyer-purchases': 'Purchase Orders',
      'buyer-inventory': 'Buyer Inventory',
      'buyer-suppliers': 'Buyer Suppliers',
      'supplier-quotations': 'Supplier Quotations',
      'customer-orders': 'Customer Orders'
    };

    return titles[module] || module.charAt(0).toUpperCase() + module.replace(/-/g, ' ').slice(1);
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        {getModuleTitle(activeModule)}
        <div className="topbar-subtitle">Manage your {activeModule.replace(/-/g, ' ')} and operations</div>
      </div>

      <div className="topbar-search">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Search anything..." />
      </div>

      <div className="topbar-btn">
        <span>🔔</span>
        <div className="badge">3</div>
      </div>

      <div className="topbar-btn">
        <span>💬</span>
      </div>
    </header>
  );
}
