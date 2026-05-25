import React from "react";

export default function Sidebar({ activeModule, setActiveModule, user, onLogout }) {
  const adminMenu = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "warehouse", label: "Warehouse", icon: "🏘️" },
    { id: "inventory", label: "Inventory", icon: "📦" },
    { id: "advanced-inventory", label: "Advanced Inventory", icon: "🏭" },
    { id: "purchases", label: "Purchases", icon: "🤝" },
    { id: "customer-orders", label: "Customer Orders", icon: "🛒", badge: "New" },
    { id: "transport", label: "Transport", icon: "🚛" },
    { id: "finance-ledger", label: "Finance & Accounts", icon: "💰" },
    { id: "finance-reports", label: "Reports", icon: "📈" },
    { id: "support-desk", label: "Support Desk", icon: "🎧" },
  ];

  const supplierMenu = [
    { id: "supplier-dashboard", label: "Supplier Dashboard", icon: "📊" },
    { id: "supplier-quotations", label: "Quotations", icon: "📄" },
    { id: "inventory", label: "Products List", icon: "📦" },
  ];

  const customerMenu = [
    { id: "customer-dashboard", label: "Dashboard", icon: "📊" },
    { id: "customer-products", label: "Browse Products", icon: "🛍️" },
    { id: "customer-orders", label: "My Orders", icon: "🛒", badge: "Live" },
    { id: "customer-support", label: "Support & Help", icon: "🆘" },
    { id: "profile", label: "My Profile", icon: "👤" },
  ];

  const buyerMenu = [
    { id: "buyer-overview",   label: "Dashboard",       icon: "📊" },
    { id: "buyer-dashboard",  label: "Quotations",       icon: "📄" },
    { id: "buyer-purchases",  label: "Purchase Orders",  icon: "🛒" },
    { id: "buyer-inventory",  label: "My Inventory",     icon: "📦" },
    { id: "buyer-suppliers",  label: "My Suppliers",     icon: "🏢" },
  ];

  const accountantMenu = [
    { id: "finance-dashboard", label: "Finance Dashboard", icon: "💰" },
    { id: "finance-po", label: "Purchase Orders", icon: "📦" },
    { id: "finance-sales", label: "Sales & Revenue", icon: "💵" },
    { id: "finance-invoices", label: "Invoices & Bills", icon: "📄" },
    { id: "finance-payroll", label: "Payroll & Salaries", icon: "👥" },
    { id: "finance-transport", label: "Transport Costs", icon: "🚛" },
    { id: "finance-warehouse", label: "Warehouse Costs", icon: "🏘️" },
    { id: "finance-ledger", label: "General Ledger", icon: "📊" },
    { id: "finance-payments", label: "Payment Management", icon: "💳" },
    { id: "finance-reports", label: "Financial Reports", icon: "📈" },
    { id: "finance-taxes", label: "Tax Compliance", icon: "🧾" },
  ];

  const dispatcherMenu = [
    { id: "dispatcher-dashboard", label: "My Dashboard", icon: "🚛" },
  ];

  const driverMenu = [
    { id: "driver-dashboard", label: "My Assignments", icon: "🚛" },
  ];

  const warehouseManagerMenu = [
    { id: "warehouse-manager-dashboard", label: "Ops Command", icon: "🏢" },
    { id: "advanced-inventory", label: "Advanced Inventory", icon: "📦" },
    { id: "warehouse", label: "Layout Control", icon: "🏗️" },
    { id: "inventory", label: "Inventory Logic", icon: "📊" },
    { id: "transport", label: "Fleet Sync", icon: "🚛" },
  ];

  const menu = user?.role === 'supplier' ? supplierMenu : 
               user?.role === 'customer' ? customerMenu : 
               user?.role === 'buyer' ? buyerMenu : 
               user?.role === 'accountant' ? accountantMenu : 
               user?.role === 'warehouse_manager' ? warehouseManagerMenu :
               user?.role === 'driver' ? driverMenu :
               user?.role === 'dispatcher' ? dispatcherMenu :
               adminMenu;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">S</div>
        <div className="sidebar-logo-text">SW<span>ORD</span></div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Main Menu</div>
        {menu.map((m) => (
          <div
            key={m.id}
            className={`nav-item ${activeModule === m.id ? "active" : ""}`}
            onClick={() => setActiveModule(m.id)}
          >
            <span className="nav-icon">{m.icon}</span>
            <span>{m.label}</span>
            {m.badge && <span className="nav-badge">{m.badge}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-section" style={{ marginTop: "auto" }}>
        <div className="sidebar-section-label">System</div>
        <div className="nav-item">
          <span className="nav-icon">⚙️</span>
          <span>Settings</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="nav-item">
           <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.5 }}>🚪</span>
        </div>
        <div className="user-card" onClick={onLogout}>
         <div className="user-avatar">L</div>
         <span style={{ marginLeft: "10px" }}>Logout</span>
        </div>
      </div>
    </aside>
  );
}
