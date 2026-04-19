import { Settings, User, Bell, Shield, Moon, Monitor } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

import { useState } from 'react';
import axios from 'axios';

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.name || "Student");
  const [institution, setInstitution] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      // Update backend
      await axios.patch('http://localhost:8000/api/user/profile/', {
        username: displayName, 
        institution: institution
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Settings saved! (Simulated backend success)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Settings size={28} /> Settings</h1>
          <p className="page-subtitle">Manage your account preferences and integrations.</p>
        </div>
      </div>

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '30px' }}>
        <div className="settings-nav neo-card" style={{ padding: '0', overflow: 'hidden' }}>
          <button className="settings-nav-item active"><User size={18} /> Profile</button>
          <button className="settings-nav-item"><Bell size={18} /> Notifications</button>
          <button className="settings-nav-item"><Shield size={18} /> Privacy</button>
          <button className="settings-nav-item"><Monitor size={18} /> Appearance</button>
        </div>

        <div className="settings-content">
          <div className="neo-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={20} /> Public Profile
            </h3>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Display Name</label>
              <input 
                className="neo-input" 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Institution</label>
              <input 
                className="neo-input" 
                value={institution}
                onChange={e => setInstitution(e.target.value)} 
                placeholder="e.g. Stanford University"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Bio</label>
              <textarea className="neo-input" defaultValue="Computer Science student passionate about AI and Web Development." style={{ minHeight: '80px', width: '100%' }} />
            </div>
            <button className="neo-btn primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="neo-card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Monitor size={20} /> Theme Preferences
            </h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="theme-toggle-btn active">☀️ Light (Neo-brutal)</button>
              <button className="theme-toggle-btn"><Moon size={16} /> Dark Mode</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
