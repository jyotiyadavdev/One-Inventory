import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import Modal from "../components/Modal";
import { Country, State, City } from "country-state-city";

export default function CustomerProducts({ products, push, user, setActiveModule }) {
  const [loading, setLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(null);
  
  // Cart State: { [productId]: { product, quantity, offerPrice } }
  const [cart, setCart] = useState({});
  const [quantities, setQuantities] = useState({});
  const [offerPrices, setOfferPrices] = useState({});
  
  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    delivery_country: "",
    delivery_state: "",
    delivery_city: "",
    delivery_address: "",
    delivery_latitude: "",
    delivery_longitude: "",
    required_delivery_date: "",
    required_delivery_time: "",
    delivery_priority: "normal"
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const fetchProfile = useCallback(async () => {
  if (!user?.id) return;

  try {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("erp_token")}`,
    };

    const res = await axios.get(`${API}/customers/${user.id}`, { headers });

    if (res.data) {
      setCustomerProfile(res.data);
    }
  } catch (err) {
    console.error("Failed to fetch customer profile:", err);
  }
}, [user?.id]);

useEffect(() => {
  setCountries(Country.getAllCountries());
  fetchProfile();
}, [fetchProfile]);

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setCheckoutForm({ ...checkoutForm, delivery_country: code, delivery_state: "", delivery_city: "", delivery_latitude: "", delivery_longitude: "" });
    setStates(State.getStatesOfCountry(code));
    setCities([]);
  };

  const handleStateChange = (e) => {
    const code = e.target.value;
    setCheckoutForm({ ...checkoutForm, delivery_state: code, delivery_city: "", delivery_latitude: "", delivery_longitude: "" });
    setCities(City.getCitiesOfState(checkoutForm.delivery_country, code));
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    const city = cities.find(c => c.name === cityName);
    setCheckoutForm({ 
      ...checkoutForm, 
      delivery_city: cityName,
      delivery_latitude: city?.latitude || "",
      delivery_longitude: city?.longitude || ""
    });
  };

  const handleOpenCheckout = () => {
    if (Object.keys(cart).length === 0) {
      push("Your cart is empty. Add some products with your price offers first!", "error");
      return;
    }

    const defaultCountry = customerProfile?.country || "United Kingdom";
    const countryObj = Country.getAllCountries().find(
      c => c.name === defaultCountry || c.isoCode === defaultCountry
    );
    const countryCode = countryObj?.isoCode || "GB";
    
    const countryStates = State.getStatesOfCountry(countryCode);
    setStates(countryStates);

    const defaultState = customerProfile?.state || "";
    let matchedState = countryStates.find(
      s => s.name === defaultState || s.isoCode === defaultState
    );
    
    const defaultCity = customerProfile?.city || "";
    if (!matchedState && defaultCity) {
      const allCountryCities = City.getCitiesOfCountry(countryCode) || [];
      const matchedCity = allCountryCities.find(
        c => c.name.toLowerCase() === defaultCity.toLowerCase()
      );
      if (matchedCity) {
        matchedState = countryStates.find(s => s.isoCode === matchedCity.stateCode);
      }
    }
    const stateCode = matchedState?.isoCode || "";
    
    let stateCities = [];
    if (stateCode) {
      stateCities = City.getCitiesOfState(countryCode, stateCode);
      setCities(stateCities);
    } else {
      setCities([]);
    }

    setCheckoutForm({
      delivery_country: countryCode,
      delivery_state: stateCode,
      delivery_city: defaultCity,
      delivery_address: customerProfile?.address_line_1 || "",
      delivery_latitude: customerProfile?.latitude || "",
      delivery_longitude: customerProfile?.longitude || "",
      required_delivery_date: "",
      required_delivery_time: "",
      delivery_priority: "normal"
    });

    setShowCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      
      const orderItems = Object.values(cart).map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        weight_kg: (item.product.weight_kg || 1) * item.quantity,
        offered_price_per_unit: item.offerPrice,
        catalog_price_per_unit: item.product.price
      }));

      // Calculate total amount based on user's bid prices
      const totalAmount = orderItems.reduce((acc, curr) => acc + (curr.offered_price_per_unit * curr.quantity), 0);

      const orderPayload = {
        customer_id: user?.id || 1,
        order_number: `ORD-${Math.floor(Math.random() * 1000000)}`,
        delivery_country: checkoutForm.delivery_country,
        delivery_state: checkoutForm.delivery_state,
        delivery_city: checkoutForm.delivery_city,
        delivery_address: checkoutForm.delivery_address,
        delivery_latitude: checkoutForm.delivery_latitude,
        delivery_longitude: checkoutForm.delivery_longitude,
        required_delivery_date: checkoutForm.required_delivery_date,
        required_delivery_time: checkoutForm.required_delivery_time,
        delivery_priority: checkoutForm.delivery_priority,
        items: orderItems,
        total_amount: totalAmount
      };

      await axios.post(`${API}/customer-orders`, orderPayload, { headers });
      
      push("B2B Custom Bid Order submitted successfully! Logistics team will review.", "success");
      setCart({});
      setShowCheckoutModal(false);
      
      if (setActiveModule) {
        setActiveModule("customer-orders");
      }
    } catch (err) {
      push(err.response?.data?.error || "Failed to place order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] || 1;
    const offer = offerPrices[product.id] || product.price;

    setCart(prev => ({
      ...prev,
      [product.id]: {
        product,
        quantity: qty,
        offerPrice: parseFloat(offer) || product.price
      }
    }));
    
    push(`Added ${qty}x ${product.name} to B2B Offer Cart`, "success");
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const getProductIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("wheat") || n.includes("atta")) return "🌾";
    if (n.includes("rice") || n.includes("basmati")) return "🍚";
    if (n.includes("oil") || n.includes("soy")) return "🛢️";
    if (n.includes("chilli") || n.includes("red")) return "🌶️";
    if (n.includes("turmeric")) return "🟡";
    if (n.includes("cumin")) return "🌿";
    if (n.includes("bag")) return "🛍️";
    return "📦";
  };

  const getCatalogTotal = () => {
    return Object.values(cart).reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
  };

  const getOfferedTotal = () => {
    return Object.values(cart).reduce((acc, curr) => acc + (curr.offerPrice * curr.quantity), 0);
  };

  return (
    <div className="fade-up" style={{ padding: "20px", display: "flex", gap: "25px" }}>
      
      {/* Product Catalog Grid */}
      <div style={{ flex: 3 }}>
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, background: "linear-gradient(45deg, var(--accent-1), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            B2B Product Catalog
          </h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.7, fontSize: "14px" }}>
            Select item quantities and **submit your customized offer/bid price** per unit!
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {products?.map((product) => {
            const currentQty = quantities[product.id] || 1;
            const currentOffer = offerPrices[product.id] !== undefined ? offerPrices[product.id] : product.price;
            const isOfferDifferent = parseFloat(currentOffer) !== product.price;

            return (
              <div 
                key={product.id} 
                className="card"
                style={{ 
                  padding: "20px", 
                  borderRadius: "16px", 
                  border: "1px solid var(--border)", 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "15px",
                  transition: "transform 0.3s, border-color 0.3s"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "var(--accent-1)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "38px" }}>{getProductIcon(product.name)}</span>
                  <span 
                    className="pill" 
                    style={{ 
                      fontSize: "9px", 
                      padding: "3px 8px", 
                      background: product.type === "finished_good" ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: product.type === "finished_good" ? "#8b5cf6" : "#10b981",
                      textTransform: "uppercase",
                      fontWeight: 800
                    }}
                  >
                    {product.type.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 style={{ margin: "0 0 5px 0", fontSize: "16px", fontWeight: 700 }}>{product.name}</h3>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>Barcode: {product.barcode}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.02)", padding: "10px", borderRadius: "8px", border: "1px dashed var(--border)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, opacity: 0.7 }}>Catalog Price:</span>
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--accent-2)" }}>£{product.price} / {product.uom}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Quantity selector */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "11px", fontWeight: 700 }}>Select Quantity Required</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={currentQty} 
                      onChange={e => setQuantities({ ...quantities, [product.id]: parseInt(e.target.value) || 1 })}
                      style={{ padding: "8px 12px", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
                    />
                  </div>

                  {/* B2B Offer Price Input */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                      <span>Offer Your Price (£)</span>
                      {isOfferDifferent && <span style={{ color: "#f59e0b", fontSize: "9px" }}>Custom Bid Active</span>}
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontWeight: 800, opacity: 0.5 }}>£</span>
                      <input 
                        type="number" 
                        min="1" 
                        step="0.01"
                        placeholder={product.price}
                        value={offerPrices[product.id] !== undefined ? offerPrices[product.id] : ""} 
                        onChange={e => setOfferPrices({ ...offerPrices, [product.id]: e.target.value })}
                        style={{ padding: "8px 12px 8px 24px", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleAddToCart(product)}
                  style={{
                    background: "linear-gradient(45deg, #6366f1, #8b5cf6)",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: "5px",
                    boxShadow: "0 4px 10px -4px rgba(99, 102, 241, 0.4)"
                  }}
                >
                  🛒 Add to B2B Cart
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Side Panel */}
      <div style={{ flex: 1.2, minWidth: "320px", display: "flex", flexDirection: "column" }}>
        <div 
          className="card" 
          style={{ 
            position: "sticky", 
            top: "20px", 
            padding: "25px", 
            borderRadius: "20px", 
            border: "1px solid var(--border)",
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "15px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>B2B Custom Cart</h2>
            <span 
              className="pill" 
              style={{ 
                background: "var(--accent-1)", 
                color: "white", 
                fontWeight: 800, 
                fontSize: "11px", 
                padding: "3px 8px" 
              }}
            >
              {Object.keys(cart).length} Items
            </span>
          </div>

          {/* Cart Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", flex: 1, overflowY: "auto" }}>
            {Object.values(cart).map((item) => (
              <div 
                key={item.product.id}
                style={{ 
                  display: "flex", 
                  gap: "12px", 
                  alignItems: "center", 
                  background: "rgba(0,0,0,0.02)", 
                  padding: "12px", 
                  borderRadius: "12px", 
                  border: "1px solid var(--border)" 
                }}
              >
                <span style={{ fontSize: "24px" }}>{getProductIcon(item.product.name)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{item.product.name}</div>
                  <div style={{ fontSize: "11px", opacity: 0.6 }}>{item.quantity}x @ £{item.offerPrice} / {item.product.uom}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--accent-1)" }}>
                    £{(item.offerPrice * item.quantity).toFixed(2)}
                  </div>
                  {item.offerPrice !== item.product.price && (
                    <div style={{ fontSize: "9px", color: "#f59e0b", textDecoration: "line-through" }}>
                      £{(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleRemoveFromCart(item.product.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: "14px",
                    padding: "4px"
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            {Object.keys(cart).length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", opacity: 0.5, fontSize: "13px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span>🛒</span>
                <span>Your custom B2B cart is empty. Offer your prices and add products to start shopping!</span>
              </div>
            )}
          </div>

          {/* Cart Pricing Calculations */}
          {Object.keys(cart).length > 0 && (
            <div 
              style={{ 
                borderTop: "1px solid var(--border)", 
                paddingTop: "15px", 
                display: "flex", 
                flexDirection: "column", 
                gap: "10px" 
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", opacity: 0.7 }}>
                <span>Standard Catalog Price:</span>
                <span>£{getCatalogTotal().toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", opacity: 0.7 }}>
                <span>Total Weight:</span>
                <span>{Object.values(cart).reduce((acc, curr) => acc + ((curr.product.weight_kg || 1) * curr.quantity), 0)} kg</span>
              </div>

              <div 
                style={{ 
                  display: "flex", 
                  justify_content: "space-between", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  background: "rgba(16, 185, 129, 0.08)", 
                  padding: "12px", 
                  borderRadius: "12px", 
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                  marginTop: "5px"
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>Your Offered Price</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#065f46" }}>
                    £{getOfferedTotal().toFixed(2)}
                  </div>
                </div>
                {getOfferedTotal() < getCatalogTotal() && (
                  <span className="pill" style={{ background: "#10b981", color: "white", fontSize: "9px", padding: "3px 6px", fontWeight: 800 }}>
                    SAVING £{(getCatalogTotal() - getOfferedTotal()).toFixed(0)}
                  </span>
                )}
              </div>

              <button 
                onClick={handleOpenCheckout}
                style={{
                  background: "linear-gradient(45deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  padding: "14px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "center",
                  boxShadow: "0 10px 20px -10px rgba(16, 185, 129, 0.5)",
                  marginTop: "10px"
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <Modal title="Submit B2B Order Offers" onClose={() => setShowCheckoutModal(false)}>
          <form onSubmit={handleCheckoutSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "10px 0" }}>
            <div className="form-grid">
              
              <div className="form-group">
                <label>Required Delivery Date</label>
                <input type="date" value={checkoutForm.required_delivery_date} onChange={e => setCheckoutForm({...checkoutForm, required_delivery_date: e.target.value})} required />
              </div>

              <div className="form-group">
                <label>Required Delivery Time</label>
                <input type="time" value={checkoutForm.required_delivery_time} onChange={e => setCheckoutForm({...checkoutForm, required_delivery_time: e.target.value})} required />
              </div>
              
              <div className="form-group">
                <label>Priority Level</label>
                <select value={checkoutForm.delivery_priority} onChange={e => setCheckoutForm({...checkoutForm, delivery_priority: e.target.value})}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Delivery Address</label>
                <input placeholder="123 Corporate Blvd, Suite 100" value={checkoutForm.delivery_address} onChange={e => setCheckoutForm({...checkoutForm, delivery_address: e.target.value})} required />
              </div>

              <div className="form-group">
                <label>Country</label>
                <select value={checkoutForm.delivery_country} onChange={handleCountryChange} required>
                  <option value="">Select Country</option>
                  {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>State</label>
                <select value={checkoutForm.delivery_state} onChange={handleStateChange} required disabled={!checkoutForm.delivery_country}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>City</label>
                <select value={checkoutForm.delivery_city} onChange={handleCityChange} required disabled={!checkoutForm.delivery_state}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: "linear-gradient(45deg, #10b981, #059669)", border: "none" }}>
                {loading ? "Processing..." : "Place Custom Bid Order"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
