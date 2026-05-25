import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useMockStoreSnapshot } from "../mockData/mockHooks";

function formatCurrency(val) {
  return "£" + (val || 0).toLocaleString("en-GB", { minimumFractionDigits: 0 });
}

function getStockStatus(stock, threshold = 100) {
  if (stock <= 0) return { label: "Out of Stock", color: "#c62828" };
  if (stock < threshold) return { label: "Low Stock", color: "#f57f17" };
  return { label: "In Stock", color: "#2e7d32" };
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#1a1a1a",
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: "4px",
  },
  controlBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: "200px",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: 14,
    fontFamily: "Inter",
  },
  filterSelect: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: 14,
    fontFamily: "Inter",
    backgroundColor: "white",
    cursor: "pointer",
  },
  btn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "Inter",
  },
  btnPrimary: {
    backgroundColor: "#4a90e2",
    color: "white",
  },
  btnSecondary: {
    backgroundColor: "#f0f0f0",
    color: "#333",
    border: "1px solid #ddd",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    marginBottom: "16px",
  },
  cardHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableWrap: {
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    backgroundColor: "#f9f9f9",
    fontWeight: 600,
    color: "#1a1a1a",
    borderBottom: "1px solid #e0e0e0",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0",
  },
  pill: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: 12,
    fontWeight: 500,
  },
  pillGreen: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
  },
  pillYellow: {
    backgroundColor: "#fffde7",
    color: "#f57f17",
  },
  pillRed: {
    backgroundColor: "#ffebee",
    color: "#c62828",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryCard: {
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: "4px",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: 500,
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#999",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: "12px",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#666",
  },
  progressBar: {
    width: "100%",
    height: "6px",
    backgroundColor: "#e0e0e0",
    borderRadius: "3px",
    overflow: "hidden",
    marginTop: "4px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
};

export default function BuyerInventory({ push }) {
  const inventoryProducts = useMockStoreSnapshot((s) => s?.inventory?.products || []);
  const suppliers = useMockStoreSnapshot((s) => s?.suppliers || []);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("stock");
  const [viewMode, setViewMode] = useState("standard");
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [abcAnalysis, setAbcAnalysis] = useState([]);

  const normalizedProducts = useMemo(() => {
    // Map mockStore inventory products into the richer shape this UI expects.
    // Some fields from dummy data (monthly_consumption, turnover_days, etc.) don't exist in mockStore;
    // we provide safe prototype defaults derived from stock/price.
    const inv = inventoryProducts.map((p) => {
      const category = p?.type || "General";
      const stock = Number(p?.stock ?? 0);
      const reorderPoint = 100; // keep consistent with previous dummy default
      const stockStatus = getStockStatus(stock, 100);

      // Prototype defaults
      const monthlyConsumption = Math.max(0, Math.round(stock * 0.05)); // arbitrary but stable-ish
      const stockTurnoverDays = monthlyConsumption > 0 ? Math.round(stock / monthlyConsumption * 30) : 0;
      const safetyStock = Math.round(reorderPoint * 0.5);
      const supplier = suppliers.find((s) => s.name === p?.supplier_name || s.company_name === p?.supplier_name);

      return {
        id: p.id,
        name: p.name,
        category,
        stock,
        weight_kg: Number(p.weight_kg ?? 0),
        price: Number(p.price ?? 0),
        uom: p.uom || "units",
        warehouse_name: p.warehouse_name || "N/A",
        bin_code: p.bin_code || "N/A",
        supplier_name: p.supplier_name || "N/A",
        barcode: p.barcode || "N/A",
        stockStatus,
        totalValue: stock * Number(p.price ?? 0),
        reorderPoint,
        monthly_consumption: monthlyConsumption,
        stock_turnover_days: stockTurnoverDays,
        safety_stock: safetyStock,
        supplier_rating: Number(supplier?.rating ?? 0),
        last_price_change: 0,
      };
    });

    return inv;
  }, [inventoryProducts, suppliers]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      // no-op delay for UX consistency
      await new Promise((r) => setTimeout(r, 150));
      setInventory(normalizedProducts);
      setFilteredInventory(normalizedProducts);
      const uniqueCategories = [...new Set(normalizedProducts.map((p) => p.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      if (push) push("Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  }, [normalizedProducts, push]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const calculateABCAnalysis = useCallback(() => {
    if (inventory.length === 0) return;

    const sortedByValue = [...inventory].sort((a, b) => b.totalValue - a.totalValue);
    const totalValue = sortedByValue.reduce((sum, p) => sum + p.totalValue, 0) || 1;

    let cumulativeValue = 0;
    const analyzed = sortedByValue.map((product) => {
      cumulativeValue += product.totalValue;
      const percentage = (cumulativeValue / totalValue) * 100;

      let abc_category = "C";
      if (percentage <= 80) abc_category = "A";
      else if (percentage <= 95) abc_category = "B";

      return {
        ...product,
        abc_category,
        value_percentage: ((product.totalValue / totalValue) * 100).toFixed(2),
      };
    });

    setAbcAnalysis(analyzed);
  }, [inventory]);

  useEffect(() => {
    calculateABCAnalysis();
  }, [inventory, calculateABCAnalysis]);

  useEffect(() => {
    let filtered = [...inventory];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.barcode || "").toLowerCase().includes(term) ||
          p.supplier_name.toLowerCase().includes(term)
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }

    if (filterStatus === "low") filtered = filtered.filter((p) => p.stock > 0 && p.stock < 100);
    else if (filterStatus === "out") filtered = filtered.filter((p) => p.stock === 0);
    else if (filterStatus === "in") filtered = filtered.filter((p) => p.stock >= 100);

    if (sortBy === "stock") filtered.sort((a, b) => a.stock - b.stock);
    else if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "value") filtered.sort((a, b) => b.totalValue - a.totalValue);

    setFilteredInventory(filtered);
  }, [searchTerm, filterCategory, filterStatus, inventory, sortBy]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading inventory...</div>
      </div>
    );
  }

  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = inventory.reduce((sum, p) => sum + p.totalValue, 0);
  const lowStockCount = inventory.filter((p) => p.stock > 0 && p.stock < 100).length;
  const outOfStockCount = inventory.filter((p) => p.stock === 0).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Buyer Inventory</h1>
        <p style={styles.subtitle}>Current stock levels and inventory management</p>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{totalProducts}</div>
          <div style={styles.summaryLabel}>Total Products</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{totalStock}</div>
          <div style={styles.summaryLabel}>Total Stock Units</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{formatCurrency(totalValue)}</div>
          <div style={styles.summaryLabel}>Total Inventory Value</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{ ...styles.summaryValue, color: outOfStockCount > 0 ? "#c62828" : "#2e7d32" }}>{outOfStockCount}</div>
          <div style={styles.summaryLabel}>Out of Stock</div>
        </div>
      </div>

      <div style={styles.controlBar}>
        <input
          type="text"
          placeholder="Search by product name, barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={styles.filterSelect}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.filterSelect}>
          <option value="all">All Status</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.filterSelect}>
          <option value="stock">Sort by Stock</option>
          <option value="name">Sort by Name</option>
          <option value="value">Sort by Value</option>
        </select>
      </div>

      <div style={{ ...styles.controlBar, marginBottom: "16px" }}>
        <button
          onClick={() => setViewMode("standard")}
          style={{ ...styles.btn, ...(viewMode === "standard" ? styles.btnPrimary : styles.btnSecondary) }}
        >
          📊 Standard View
        </button>
        <button onClick={() => setViewMode("abc")} style={{ ...styles.btn, ...(viewMode === "abc" ? styles.btnPrimary : styles.btnSecondary) }}>
          📈 ABC Analysis
        </button>
      </div>

      {viewMode === "standard" && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Product Inventory</h2>
            <span style={{ color: "#666", fontSize: 14 }}>{filteredInventory.length} products</span>
          </div>

          {filteredInventory.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📦</div>
              <p>No products found in inventory</p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Stock Level</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Unit Price</th>
                    <th style={styles.th}>Total Value</th>
                    <th style={styles.th}>Turnover (days)</th>
                    <th style={styles.th}>Supplier ⭐</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((product) => (
                    <tr key={product.id}>
                      <td style={styles.td}>
                        <div>
                          <strong>{product.name}</strong>
                          <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{product.barcode}</div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.pill, backgroundColor: "#f0f0f0", color: "#666" }}>{product.category}</span>
                      </td>
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>
                            {product.stock} {product.uom}
                          </div>
                          <div style={styles.progressBar}>
                            <div
                              style={{
                                ...styles.progressFill,
                                width: `${Math.min((product.stock / (product.reorderPoint || 1)) * 100, 100)}%`,
                                backgroundColor: product.stockStatus.color,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.pill,
                            backgroundColor:
                              product.stockStatus.color === "#2e7d32"
                                ? "#e8f5e9"
                                : product.stockStatus.color === "#f57f17"
                                  ? "#fffde7"
                                  : "#ffebee",
                            color: product.stockStatus.color,
                          }}
                        >
                          {product.stockStatus.label}
                        </span>
                      </td>
                      <td style={styles.td}>{formatCurrency(product.price)}</td>
                      <td style={styles.td}>
                        <strong>{formatCurrency(product.totalValue)}</strong>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: 13, color: "#666" }}>{product.stock_turnover_days} days</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: 13 }}>
                          {product.supplier_name}
                          <div style={{ fontSize: 12, color: "#f57f17", marginTop: 2 }}>{"⭐".repeat(Math.round(product.supplier_rating || 0))}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewMode === "abc" && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>📈 ABC Inventory Analysis</h2>
            <span style={{ color: "#666", fontSize: 14 }}>Pareto analysis - focus on high-value items</span>
          </div>

          {abcAnalysis.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <p>No data for ABC analysis</p>
            </div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Product Name</th>
                    <th style={styles.th}>Total Value</th>
                    <th style={styles.th}>% of Total</th>
                    <th style={styles.th}>Stock</th>
                    <th style={styles.th}>Monthly Use</th>
                    <th style={styles.th}>Price Trend</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {abcAnalysis.map((product) => {
                    const abcColor =
                      product.abc_category === "A"
                        ? { bg: "#e3f2fd", color: "#1565c0" }
                        : product.abc_category === "B"
                          ? { bg: "#fff3e0", color: "#e65100" }
                          : { bg: "#f3e5f5", color: "#6a1b9a" };

                    return (
                      <tr key={product.id}>
                        <td style={styles.td}>
                          <span style={{ ...styles.pill, backgroundColor: abcColor.bg, color: abcColor.color, fontWeight: 700, fontSize: 14 }}>
                            {product.abc_category}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <strong>{product.name}</strong>
                        </td>
                        <td style={styles.td}>
                          <strong>{formatCurrency(product.totalValue)}</strong>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{product.value_percentage}%</div>
                          <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${parseFloat(product.value_percentage)}%`, backgroundColor: abcColor.color }} />
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.pill,
                              backgroundColor: product.stock > product.reorderPoint ? "#e8f5e9" : "#ffebee",
                              color: product.stock > product.reorderPoint ? "#2e7d32" : "#c62828",
                            }}
                          >
                            {product.stock} {product.uom}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontSize: 13, color: "#666" }}>{product.monthly_consumption} {product.uom}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 600, color: "#999" }}>➡️ 0%</span>
                        </td>
                        <td style={styles.td}>
                          {product.abc_category === "A" && (
                            <span style={{ padding: "4px 8px", backgroundColor: "#e3f2fd", color: "#1565c0", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                              ✓ Priority Focus
                            </span>
                          )}
                          {product.abc_category === "B" && (
                            <span style={{ padding: "4px 8px", backgroundColor: "#fff3e0", color: "#e65100", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                              ○ Monitor
                            </span>
                          )}
                          {product.abc_category === "C" && (
                            <span style={{ padding: "4px 8px", backgroundColor: "#f3e5f5", color: "#6a1b9a", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                              ◎ Low Priority
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: "16px 20px", backgroundColor: "#f9f9f9", borderTop: "1px solid #f0f0f0" }}>
            <div style={{ fontSize: 12, marginBottom: 8 }}>
              <strong>ABC Analysis Guide:</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", fontSize: 13 }}>
              <div>
                <span style={{ ...styles.pill, backgroundColor: "#e3f2fd", color: "#1565c0" }}>A</span> <strong>High Value (80%)</strong>
              </div>
              <div>
                <span style={{ ...styles.pill, backgroundColor: "#fff3e0", color: "#e65100" }}>B</span> <strong>Medium Value (15%)</strong>
              </div>
              <div>
                <span style={{ ...styles.pill, backgroundColor: "#f3e5f5", color: "#6a1b9a" }}>C</span> <strong>Low Value (5%)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {lowStockCount > 0 && (
        <div style={{ ...styles.card, borderLeft: "4px solid #f57f17", backgroundColor: "#fffde7" }}>
          <div style={{ padding: "16px 20px" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#f57f17", fontSize: 16 }}>⚠️ Low Stock Alert</h3>
            <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
              {lowStockCount} product(s) have low stock levels. Consider re-ordering to maintain optimal inventory levels.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
