import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "./config";

import { installMockAxios, resetPrototype } from "./mockData/mockApi";


// Components
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Pages
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import AdvancedInventory from "./pages/AdvancedInventory";
import Purchases from "./pages/Purchases";
import Transport from "./pages/Transport";
import Warehouse from "./pages/Warehouse";
import Finance from "./pages/Finance";
import FinanceDashboard from "./pages/FinanceDashboard";
import FinancePurchaseOrders from "./pages/FinancePurchaseOrders";
import FinanceSalesRevenue from "./pages/FinanceSalesRevenue";
import FinanceTransportCosts from "./pages/FinanceTransportCosts";
import FinanceWarehouseCosts from "./pages/FinanceWarehouseCosts";
import FinancePayroll from "./pages/FinancePayroll";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import Taxes from "./pages/Taxes";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierQuotations from "./pages/SupplierQuotations";
import Customers from "./pages/Customers";
import CustomerOrders from "./pages/CustomerOrders";
import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerQuotations from "./pages/BuyerQuotations";
import BuyerSuppliers from "./pages/BuyerSuppliers";
import BuyerReorders from "./pages/BuyerReorders";
import BuyerInventory from "./pages/BuyerInventory";
import BuyerOverview from "./pages/BuyerOverview";
import BuyerPurchaseOrders from "./pages/BuyerPurchaseOrders";
import WarehouseManagerDashboard from "./pages/WarehouseManagerDashboard";
import DriverDashboard from "./pages/DispatcherDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerProducts from "./pages/CustomerProducts";
import CustomerSupportPanel from "./pages/CustomerSupportPanel";
import SupportAgentDashboard from "./pages/SupportAgentDashboard";

// ── Toast Hook ──────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, push };
}

// ── App Orchestrator ────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const { toasts, push } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/inventory/products`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setProducts(res.data);
    } catch {
      push("Failed to load inventory data", "error");
    }
  }, [push]);

  useEffect(() => {
    // Prototype: use shared frontend mock backend so UI is fully functional without server.
    installMockAxios();
    resetPrototype();

    const savedUser = localStorage.getItem("erp_user");

    if (savedUser && savedUser !== "undefined") {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Corrupted user data", e);
        localStorage.removeItem("erp_user");
      }
    }

    fetchProducts();
  }, [fetchProducts]);

  // Set default module when user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'supplier') {
        setActiveModule('supplier-dashboard');
      } else if (user.role === 'buyer') {
        setActiveModule('buyer-overview');
      } else if (user.role === 'accountant') {
        setActiveModule('finance-dashboard');
      } else if (user.role === 'warehouse_manager') {
        setActiveModule('warehouse-manager-dashboard');
      } else if (user.role === 'driver') {
        setActiveModule('driver-dashboard');
      } else if (user.role === 'dispatcher') {
        setActiveModule('dispatcher-dashboard');
      } else if (user.role === 'customer') {
        setActiveModule('customer-dashboard');
      } else {
        setActiveModule('dashboard');
      }
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setUser(null);
    // push("Logged out successfully");
  };

  if (!user) return <AuthPage onLogin={setUser} push={push} />;

  return (
    <div className="app-layout">
      <Toast toasts={toasts} />
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule} 
        user={user} 
        onLogout={handleLogout} 
      />

      <main className="main-content">
        <Topbar activeModule={activeModule} />
        
        <div className="page">
          {activeModule === "dashboard" && <Dashboard products={products} />}
          {activeModule === "customers" && <Customers push={push} />}
          {activeModule === "warehouse" && <Warehouse products={products} push={push} />}
          {activeModule === "inventory" && <Inventory products={products} onRefresh={fetchProducts} push={push} user={user} />}
          {activeModule === "advanced-inventory" && <AdvancedInventory push={push} user={user} />}
          {activeModule === "purchases" && <Purchases products={products} onRefreshProducts={fetchProducts} push={push} />}
          {activeModule === "customer-dashboard" && <CustomerDashboard products={products} push={push} user={user} setActiveModule={setActiveModule} />}
          {activeModule === "customer-products" && <CustomerProducts products={products} push={push} user={user} setActiveModule={setActiveModule} />}
          {activeModule === "customer-orders" && <CustomerOrders products={products} push={push} user={user} />}
          {activeModule === "customer-support" && <CustomerSupportPanel push={push} user={user} isAdmin={user?.role === "admin"} />}
          {activeModule === "profile" && <CustomerProfile push={push} user={user} />}
          {activeModule === "transport" && <Transport push={push} />}
          
          {/* Finance & Accounting Modules */}
          {activeModule === "finance-dashboard" && <FinanceDashboard push={push} />}
          {activeModule === "finance-po" && <FinancePurchaseOrders push={push} />}
          {activeModule === "finance-sales" && <FinanceSalesRevenue push={push} />}
          {activeModule === "finance-invoices" && <Invoices push={push} />}
          {activeModule === "finance-payroll" && <FinancePayroll push={push} />}
          {activeModule === "finance-transport" && <FinanceTransportCosts push={push} />}
          {activeModule === "finance-warehouse" && <FinanceWarehouseCosts push={push} />}
          {activeModule === "finance-ledger" && <Finance push={push} />}
          {activeModule === "finance-payments" && <Payments push={push} />}
          {activeModule === "finance-reports" && <Reports push={push} />}
          {activeModule === "finance-taxes" && <Taxes push={push} />}
          
          {/* Supplier Modules */}
          {activeModule === "supplier-dashboard" && <SupplierDashboard user={user} products={products} push={push} setActiveModule={setActiveModule} />}
          {activeModule === "supplier-quotations" && <SupplierQuotations products={products} push={push} />}
          
          {/* Buyer Modules */}
          {activeModule === "buyer-overview" && (
            <BuyerOverview push={push} setActiveModule={setActiveModule} />
          )}

          {activeModule === "buyer-dashboard" && (
            <BuyerDashboard
              products={products}
              push={push}
              user={user}
            />
          )}

          {activeModule === "buyer-reorders" && (
            <BuyerReorders push={push} />
          )}

          {activeModule === "buyer-inventory" && (
            <BuyerInventory push={push} user={user} />
          )}

          {activeModule === "buyer-suppliers" && (
            <BuyerSuppliers push={push} />
          )}

          {activeModule === "buyer-quotations" && (
            <BuyerQuotations
              products={products}
              push={push}
              user={user}
            />
          )}

          {activeModule === "buyer-purchases" && (
            <BuyerPurchaseOrders push={push} />
          )}

          {activeModule === "warehouse-manager-dashboard" && (
            <WarehouseManagerDashboard products={products} push={push} user={user} />
          )}

          {activeModule === "driver-dashboard" && (
            <DriverDashboard push={push} user={user} />
          )}

          {activeModule === "dispatcher-dashboard" && (
            <DriverDashboard push={push} user={user} />
          )}

          
          {["manufacturing", "reports"].includes(activeModule) && (
            <div className="empty-state">
              <div className="icon">🏗️</div>
              <p>{activeModule.charAt(0).toUpperCase() + activeModule.slice(1)} module is under development.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;