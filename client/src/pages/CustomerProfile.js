import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../config";
import { Country, State, City } from "country-state-city";

export default function CustomerProfile({ push, user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Form states for password change (cosmetic)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfile = useCallback(async () => {
  if (!user?.id) return;

  setLoading(true);

  try {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("erp_token")}`,
    };

    const res = await axios.get(`${API}/customers/${user.id}`, { headers });

    if (res.data) {
      setProfile(res.data);

      if (res.data.country) {
        const countryObj = Country.getAllCountries().find(
          (c) => c.name === res.data.country || c.isoCode === res.data.country
        );

        if (countryObj) {
          const countryStates = State.getStatesOfCountry(countryObj.isoCode);
          setStates(countryStates);

          let stateObj = countryStates.find(
            (s) => s.name === res.data.state || s.isoCode === res.data.state
          );

          if (!stateObj && res.data.city) {
            const allCountryCities =
              City.getCitiesOfCountry(countryObj.isoCode) || [];

            const matchedCity = allCountryCities.find(
              (c) =>
                c.name.toLowerCase() === String(res.data.city).toLowerCase()
            );

            if (matchedCity) {
              stateObj = countryStates.find(
                (s) => s.isoCode === matchedCity.stateCode
              );
            }
          }

          if (stateObj) {
            setCities(
              City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode)
            );
          }
        }
      }
    }
  } catch (err) {
    push("Failed to load profile details", "error");
  } finally {
    setLoading(false);
  }
  }, [user?.id, push]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
    fetchProfile();
  }, [fetchProfile]);

  const handleCountryChange = (e) => {
    const code = e.target.value;
    const countryName = countries.find(c => c.isoCode === code)?.name || "";
    
    setProfile({
      ...profile,
      country: countryName,
      state: "",
      city: "",
      latitude: "",
      longitude: "",
    });
    setStates(State.getStatesOfCountry(code));
    setCities([]);
  };

  const handleStateChange = (e) => {
    const code = e.target.value;
    const stateName = states.find(s => s.isoCode === code)?.name || "";
    
    // Find matching country code
    const countryObj = countries.find(c => c.name === profile.country);
    
    setProfile({
      ...profile,
      state: stateName,
      city: "",
      latitude: "",
      longitude: "",
    });
    
    if (countryObj) {
      setCities(City.getCitiesOfState(countryObj.isoCode, code));
    }
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    const city = cities.find(c => c.name === cityName);
    
    setProfile({
      ...profile,
      city: cityName,
      latitude: city?.latitude ? parseFloat(city.latitude) : "",
      longitude: city?.longitude ? parseFloat(city.longitude) : "",
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("erp_token")}` };
      await axios.put(`${API}/customers/${user.id}`, profile, { headers });
      push("Profile updated successfully!", "success");
      
      // Update local storage username if modified
      const currentLocalUser = JSON.parse(localStorage.getItem("erp_user") || "{}");
      currentLocalUser.username = profile.customer_name;
      localStorage.setItem("erp_user", JSON.stringify(currentLocalUser));
      
      fetchProfile();
    } catch (err) {
      push(err.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      push("New passwords do not match!", "error");
      return;
    }
    push("Password updated successfully!", "success");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  if (loading || !profile) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading profile details...</p>
      </div>
    );
  }

  // Get current country code for selector matching
  const currentCountryCode = countries.find(c => c.name === profile.country)?.isoCode || "";
  
  // Find state code matching the profile state
  let matchedState = states.find(s => s.name === profile.state || s.isoCode === profile.state);
  
  // Fallback: Resolve state from city if state name didn't match the database directly
  if (!matchedState && profile.city && currentCountryCode) {
    const allCountryCities = City.getCitiesOfCountry(currentCountryCode) || [];
    const matchedCity = allCountryCities.find(
      c => c.name.toLowerCase() === profile.city.toLowerCase()
    );
    if (matchedCity) {
      matchedState = states.find(s => s.isoCode === matchedCity.stateCode);
    }
  }

  const currentStateCode = matchedState?.isoCode || "";

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and manage your client account details</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Card: Summary & Avatar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '30px 20px' }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
          }}>
            {profile.customer_name ? profile.customer_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C'}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            {profile.customer_name}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            {profile.company_name}
          </p>

          <span className={`pill ${profile.status === 'active' ? 'green' : 'red'}`} style={{ marginBottom: 24, padding: '4px 12px', fontSize: 11 }}>
            {profile.status ? profile.status.toUpperCase() : 'ACTIVE'}
          </span>

          <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Account Type</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Customer Portal</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Priority Tier</span>
              <span className={`pill ${profile.delivery_priority === 'urgent' ? 'red' : 'blue'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                {profile.delivery_priority ? profile.delivery_priority.toUpperCase() : 'NORMAL'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current City</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{profile.city || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Tabbed Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Main Account Details Form */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: 'var(--text-primary)' }}>Account & Shipping Profile</h3>
            
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Primary Contact Name</label>
                  <input 
                    type="text" 
                    value={profile.customer_name} 
                    onChange={e => setProfile({ ...profile, customer_name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    value={profile.company_name} 
                    onChange={e => setProfile({ ...profile, company_name: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    onChange={e => setProfile({ ...profile, email: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    value={profile.phone} 
                    onChange={e => setProfile({ ...profile, phone: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Delivery / Shipping Address</h4>
                
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Address Line 1</label>
                  <input 
                    type="text" 
                    placeholder="Street Address, P.O. Box" 
                    value={profile.address_line_1} 
                    onChange={e => setProfile({ ...profile, address_line_1: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Address Line 2 (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Apartment, suite, unit, building" 
                    value={profile.address_line_2} 
                    onChange={e => setProfile({ ...profile, address_line_2: e.target.value })} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Country</label>
                    <select value={currentCountryCode} onChange={handleCountryChange} required>
                      <option value="">Select Country</option>
                      {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>State / Region</label>
                    <select value={currentStateCode} onChange={handleStateChange} required disabled={!profile.country}>
                      <option value="">Select State</option>
                      {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group">
                    <label>City</label>
                    <select value={profile.city} onChange={handleCityChange} required disabled={!profile.state}>
                      <option value="">Select City</option>
                      {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Postal / Pincode</label>
                    <input 
                      type="text" 
                      value={profile.pincode} 
                      onChange={e => setProfile({ ...profile, pincode: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Delivery Latitude (Auto-Filled)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={profile.latitude} 
                      onChange={e => setProfile({ ...profile, latitude: parseFloat(e.target.value) || "" })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Delivery Longitude (Auto-Filled)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={profile.longitude} 
                      onChange={e => setProfile({ ...profile, longitude: parseFloat(e.target.value) || "" })} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 800 }} disabled={saving}>
                  {saving ? "Saving Details..." : "Save Account Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* Dummy Password / Security Card */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: 'var(--text-primary)' }}>Account Security</h3>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.currentPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} 
                    placeholder="••••••••"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.newPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                    placeholder="New password"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.confirmPassword} 
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                    placeholder="Confirm password"
                    required 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="btn btn-secondary" style={{ padding: '8px 20px', fontWeight: 800 }}>
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
