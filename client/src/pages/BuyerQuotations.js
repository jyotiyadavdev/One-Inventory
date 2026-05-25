import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";

import { installMockAxios } from "../mockData/mockApi";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

export default function BuyerQuotations() {
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    buyer_id: "",
    supplier_id: "",
    product_id: "",
    product_name: "",
    quantity: "",
    target_price: "",
    required_delivery_date: "",
    notes: "",
  });

  const token = localStorage.getItem("token");

  const config = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  const fetchData = useCallback(async () => {
    try {
      const [supplierRes, inventoryRes, quotationRes] = await Promise.all([
        axios.get(`${API}/suppliers`, config),
        axios.get(`${API}/inventory/products`, config),
        axios.get(`${API}/buyer-quotations`, config),
      ]);

      setSuppliers(supplierRes.data || []);
      setInventory(inventoryRes.data || []);
      setQuotations(quotationRes.data || []);
    } catch (error) {
      console.error("Fetch buyer quotation data error:", error);
      setSuppliers([]);
      setInventory([]);
      setQuotations([]);
    }
  }, [config]);

  useEffect(() => {
    installMockAxios();
    fetchData();
  }, [fetchData]);

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selectedProduct = inventory.find(
      (item) => String(item.id) === String(productId)
    );

    setForm((prev) => ({
      ...prev,
      product_id: productId,
      product_name: selectedProduct?.name || "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.supplier_id || !form.product_name || !form.quantity || !form.target_price) {
      alert("Supplier, product, quantity and target price are required");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API}/buyer-quotations`,
        {
          ...form,
          buyer_id: form.buyer_id || 1,
        },
        config
      );

      alert("Quotation sent to supplier successfully");

      setForm({
        buyer_id: "",
        supplier_id: "",
        product_id: "",
        product_name: "",
        quantity: "",
        target_price: "",
        required_delivery_date: "",
        notes: "",
      });

      fetchData();
    } catch (error) {
      console.error("Submit buyer quotation error:", error);
      alert("Failed to send quotation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Buyer Quotations</h2>
      <p>Buyer can send quotation requests to suppliers.</p>

      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 12,
          marginBottom: 24,
          border: "1px solid #e5e7eb",
        }}
      >
        <h3>Send New Quotation</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <select
            value={form.supplier_id}
            onChange={(e) =>
              setForm({ ...form, supplier_id: e.target.value })
            }
          >
            <option value="">Select Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name || supplier.company_name}
              </option>
            ))}
          </select>

          <select value={form.product_id} onChange={handleProductChange}>
            <option value="">Select Product From Inventory</option>
            {inventory.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - Stock: {product.quantity || 0}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Target Price"
            value={form.target_price}
            onChange={(e) =>
              setForm({ ...form, target_price: e.target.value })
            }
          />

          <input
            type="date"
            value={form.required_delivery_date}
            onChange={(e) =>
              setForm({ ...form, required_delivery_date: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginTop: 16,
            padding: "10px 18px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {loading ? "Sending..." : "Send Quotation"}
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={th}>Product</th>
              <th style={th}>Supplier</th>
              <th style={th}>Qty</th>
              <th style={th}>Target Price</th>
              <th style={th}>Total</th>
              <th style={th}>Delivery Date</th>
              <th style={th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {quotations.map((q) => (
              <tr key={q.id}>
                <td style={td}>{q.product_name}</td>
                <td style={td}>{q.supplier_name}</td>
                <td style={td}>{q.quantity}</td>
                <td style={td}>£{q.target_price}</td>
                <td style={td}>£{q.total}</td>
                <td style={td}>{q.required_delivery_date || "—"}</td>
                <td style={td}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "#eef2ff",
                      color: "#3730a3",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}

            {quotations.length === 0 && (
              <tr>
                <td style={td} colSpan="7">
                  No buyer quotations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "14px",
  fontSize: "12px",
  color: "#64748b",
  borderBottom: "1px solid #e5e7eb",
};

const td = {
  padding: "14px",
  fontSize: "14px",
  color: "#334155",
  borderBottom: "1px solid #e5e7eb",
};