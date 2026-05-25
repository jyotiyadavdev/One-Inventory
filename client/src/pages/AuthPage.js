// import React, { useState } from "react";
// import axios from "axios";
// import { API } from "../config";

// export default function AuthPage({ onLogin, push }) {
//   const [tab, setTab] = useState("login");
//   const [form, setForm] = useState({ username: "", email: "", password: "", role: "staff" });
//   const [loading, setLoading] = useState(false);
//   const [suppliers, setSuppliers] = useState([]);
//   const [error, setError] = useState("");

//   const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

//   React.useEffect(() => {
//     if (tab === "register") {
//       axios.get(`${API}/purchases/suppliers`).then(res => setSuppliers(res.data)).catch(console.error);
//     }
//   }, [tab]);

//   const submit = async () => {
//     setError(""); setLoading(true);
//     try {
//       if (tab === "login") {
//         const res = await axios.post(`${API}/auth/login`, { email: form.email, password: form.password });
//         if (res.data && res.data.user) {
//           localStorage.setItem("erp_token", res.data.token);
//           localStorage.setItem("erp_user", JSON.stringify(res.data.user));
//           onLogin(res.data.user);
//           push("Welcome back, " + res.data.user.username + "!");
//         } else {
//           setError("Invalid response from server");
//         }

//       } else {
//         await axios.post(`${API}/auth/register`, { 
//           username: form.username, 
//           email: form.email, 
//           password: form.password, 
//           role: form.role,
//           supplier_id: form.role === 'supplier' ? form.supplier_id : null
//         });
//         push("Account created! Please log in.");
//         setTab("login");
//       }
//     } catch (err) {
//       setError(err.response?.data?.error || "Connection error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-page">
//       <div className="login-bg-glow g1"></div>
//       <div className="login-bg-glow g2"></div>
      
//       <div className="login-card fade-up">
//         <div className="login-logo">
//           {/* <div className="login-logo-icon">G</div>
//           <div className="login-logo-text">GYRO<span>FOODS</span></div> */}
//           <div className="login-logo-icon">S</div>
//           <div className="login-logo-text">SW<span>ORD</span></div>
//         </div>

//         <div className="login-tab-row">
//           <button className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")}>Login</button>
//           <button className={`login-tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
//         </div>

//         {error && <div style={{ color: "var(--accent-5)", background: "rgba(244,63,94,0.1)", padding: "10px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px" }}>{error}</div>}

//         <div className="form-group" style={{ marginBottom: "15px" }}>
//           {tab === "register" && (
//             <>
//               <label>Username</label>
//               <input value={form.username} onChange={set("username")} placeholder="John Doe" />
//             </>
//           )}
//           <label style={{ marginTop: tab === "register" ? "15px" : 0 }}>Email Address</label>
//           <input value={form.email} onChange={set("email")} placeholder="name@company.com" />
          
//           <label style={{ marginTop: "15px" }}>Password</label>
//           <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />

//           {tab === "register" && (
//             <>
//               <label style={{ marginTop: "15px" }}>Role</label>
//               <select value={form.role} onChange={set("role")} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
//                 <option value="admin">Admin</option>
//                 <option value="customer">Customer</option>
//                 <option value="supplier">Supplier</option>
//                 <option value="buyer">Buyer</option>
//                 <option value="driver">Driver</option>
//                 <option value="dispatcher">Dispatcher</option>
//                 <option value="accountant">Accountant</option>
//                 <option value="manager">Manager</option>
//               </select>

//               {form.role === 'supplier' && (
//                 <>
//                   <label style={{ marginTop: "15px" }}>Select Your Company (Supplier)</label>
//                   <select value={form.supplier_id} onChange={set("supplier_id")} style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
//                     <option value="">Select Supplier...</option>
//                     {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                   </select>
//                   <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>If your company isn't listed, please contact the administrator.</div>
//                 </>
//               )}
//             </>
//           )}
//         </div>

//         <button className="btn btn-primary" onClick={submit} style={{ width: "100%", height: "45px", marginTop: "10px" }} disabled={loading}>
//           {loading ? "Authenticating..." : tab === "login" ? "Sign In" : "Create Account"}
//         </button>

//         <div style={{ textAlign: "center", marginTop: "24px", fontSize: "12px", color: "var(--text-muted)" }}>
//           {tab === "login" ? "Forgot your password?" : "By joining, you agree to our Terms"}
//         </div>
//       </div>
//     </div>
//   );
// }






import React, { useState } from "react";
import axios from "axios";
import { API } from "../config";

export default function AuthPage({ onLogin, push }) {
  const [tab, setTab] = useState("login");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff",
    supplier_id: "",
  });

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState("");

  const set = (k) => (e) =>
    setForm((p) => ({
      ...p,
      [k]: e.target.value,
    }));

  const dashboardLogins = [
    {
      label: "Admin",
      role: "admin",
      email: "admin@sword.com",
      password: "123456",
    },
    {
      label: "Warehouse",
      role: "manager",
      email: "manager@sword.com",
      password: "123456",
    },
    {
      label: "Buyer",
      role: "buyer",
      email: "buyer@sword.com",
      password: "123456",
    },
    {
      label: "Accountant",
      role: "accountant",
      email: "accountant@sword.com",
      password: "123456",
    },
    
    {
      label: "Dispatcher",
      role: "dispatcher",
      email: "dispatcher@sword.com",
      password: "123456",
    },
    {
      label: "Driver",
      role: "driver",
      email: "driver@sword.com",
      password: "123456",
    },
    {
      label: "Customer",
      role: "customer",
      email: "customer@sword.com",
      password: "123456",
    },
  ];

  React.useEffect(() => {
    if (tab === "register") {
      axios
        .get(`${API}/purchases/suppliers`)
        .then((res) => setSuppliers(res.data))
        .catch(console.error);
    }
  }, [tab]);

  const handleLoginResponse = (res) => {
    if (res.data && res.data.user) {
      localStorage.setItem("erp_token", res.data.token);
      localStorage.setItem("erp_user", JSON.stringify(res.data.user));

      onLogin(res.data.user);
      push("Welcome back, " + res.data.user.username + "!");
    } else {
      setError("Invalid response from server");
    }
  };

  const quickDashboardLogin = async (account) => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: account.email,
        password: account.password,
      });

      handleLoginResponse(res);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          `Unable to login as ${account.label}. Please check demo account credentials.`
      );
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setError("");
    setLoading(true);

    try {
      if (tab === "login") {
        const res = await axios.post(`${API}/auth/login`, {
          email: form.email,
          password: form.password,
        });

        handleLoginResponse(res);
      } else {
        await axios.post(`${API}/auth/register`, {
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          supplier_id: form.role === "supplier" ? form.supplier_id : null,
        });

        push("Account created! Please log in.");
        setTab("login");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-glow g1"></div>
      <div className="login-bg-glow g2"></div>

      <div className="login-card fade-up">
        <div className="login-logo">
          <div className="login-logo-icon">S</div>
          <div className="login-logo-text">
            SW<span>ORD</span>
          </div>
        </div>

        <div className="login-tab-row">
          <button
            className={`login-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
            type="button"
          >
            Login
          </button>

          <button
            className={`login-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => setTab("register")}
            type="button"
          >
            Register
          </button>
        </div>

        {tab === "login" && (
          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              Direct Dashboard Login
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
              }}
            >
              {dashboardLogins.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => quickDashboardLogin(account)}
                  disabled={loading}
                  style={{
                    padding: "9px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                    color: "var(--text-primary)",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              color: "var(--accent-5)",
              background: "rgba(244,63,94,0.1)",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "15px" }}>
          {tab === "register" && (
            <>
              <label>Username</label>
              <input
                value={form.username}
                onChange={set("username")}
                placeholder="John Doe"
              />
            </>
          )}

          <label style={{ marginTop: tab === "register" ? "15px" : 0 }}>
            Email Address
          </label>
          <input
            value={form.email}
            onChange={set("email")}
            placeholder="name@company.com"
          />

          <label style={{ marginTop: "15px" }}>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="••••••••"
          />

          {tab === "register" && (
            <>
              <label style={{ marginTop: "15px" }}>Role</label>
              <select
                value={form.role}
                onChange={set("role")}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="buyer">Buyer</option>
                <option value="driver">Driver</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="accountant">Accountant</option>
                <option value="manager">Manager</option>
              </select>

              {form.role === "supplier" && (
                <>
                  <label style={{ marginTop: "15px" }}>
                    Select Your Company Supplier
                  </label>

                  <select
                    value={form.supplier_id}
                    onChange={set("supplier_id")}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-muted)",
                      marginTop: 5,
                    }}
                  >
                    If your company is not listed, please contact the
                    administrator.
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={submit}
          style={{
            width: "100%",
            height: "45px",
            marginTop: "10px",
          }}
          disabled={loading}
          type="button"
        >
          {loading
            ? "Authenticating..."
            : tab === "login"
            ? "Sign In"
            : "Create Account"}
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          {tab === "login"
            ? "Forgot your password?"
            : "By joining, you agree to our Terms"}
        </div>
      </div>
    </div>
  );
}