import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Globe, Bell, Shield, MonitorSmartphone,
  ClipboardList, Server, RefreshCw, Save, CheckCircle,
  AlertCircle, Info, Printer, Timer, ToggleLeft,
  DollarSign, Phone, Mail, MapPin, Clock, Image as ImageIcon
} from 'lucide-react';
import api from '../services/api';
import ImageInputSelector from '../components/ImageInputSelector';
import { showToast } from '../components/Toast';

// ── Toggle Switch Component ───────────────────────────────
function Toggle({ checked, onChange, id }) {
  return (
    <label className="toggle-switch" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="toggle-slider" />
    </label>
  );
}

// ── Settings sections ─────────────────────────────────────
const SECTIONS = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'system', label: 'System Info', icon: Server }
];

const TIMEZONES = [
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Kolkata',
  'UTC',
  'Europe/London',
  'America/New_York'
];

const CURRENCIES = ['PKR', 'USD', 'AED', 'GBP', 'EUR'];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      setSettings(res.data.data.settings);
      setSystemInfo(res.data.data.systemInfo);
    } catch (err) {
      showToast('Failed to load settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Update a nested settings field
  const set = (path, value) => {
    setDirty(true);
    setSettings(prev => {
      const updated = { ...prev };
      const parts = path.split('.');
      let obj = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = { ...obj[parts[i]] };
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = async () => {
    if (!dirty) return;
    try {
      setSaving(true);
      const res = await api.put('/admin/settings', {
        brandName: settings.brandName,
        tagline: settings.tagline,
        logo: settings.logo,
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
        defaultBranch: settings.defaultBranch,
        currency: settings.currency,
        timezone: settings.timezone,
        notifications: settings.notifications,
        order: settings.order,
        pos: settings.pos,
        receipt: settings.receipt
      });
      setSettings(res.data.data);
      setDirty(false);
      try {
        localStorage.setItem('urbanbite_admin_brand', JSON.stringify({
          brandName: res.data.data.brandName || 'UrbanBite',
          tagline: res.data.data.tagline || 'Admin Panel',
          logo: res.data.data.logo || '/logo.png'
        }));
        localStorage.setItem('urbanbite_admin_settings', JSON.stringify(res.data.data));
        window.dispatchEvent(new Event('brand_settings_updated'));
        window.dispatchEvent(new Event('admin_settings_updated'));
      } catch (e) {}
      showToast('Settings saved successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  if (!settings) return null;

  // ── Section Renderers ────────────────────────────────────

  const renderGeneral = () => (
    <div className="settings-section">
      <div className="settings-card">
        <div className="settings-card-header">
          <Globe size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <div className="settings-card-title">Brand & Logo Settings</div>
            <div className="settings-card-subtitle">Configure your restaurant identity, website logo, and sidebar info</div>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input type="text" className="form-control" value={settings.brandName || ''} onChange={e => set('brandName', e.target.value)} placeholder="UrbanBite" maxLength={100} />
            </div>
            <div className="form-group">
              <label className="form-label">Sidebar Tagline / Subtitle</label>
              <input type="text" className="form-control" value={settings.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Admin Panel" maxLength={100} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <ImageInputSelector
              label="Website & Sidebar Logo"
              value={settings.logo || '/logo.png'}
              onChange={val => set('logo', val)}
              placeholder="/logo.png or https://..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Default Branch</label>
              <input type="text" className="form-control" value={settings.defaultBranch || ''} onChange={e => set('defaultBranch', e.target.value)} placeholder="Main Branch" maxLength={100} />
            </div>
            <div className="form-group">
              <label className="form-label"><Phone size={13} style={{ display: 'inline', marginRight: 5 }} />Contact Phone</label>
              <input type="tel" className="form-control" value={settings.contactPhone || ''} onChange={e => set('contactPhone', e.target.value)} placeholder="+92 300 0000000" maxLength={30} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><Mail size={13} style={{ display: 'inline', marginRight: 5 }} />Contact Email</label>
              <input type="email" className="form-control" value={settings.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} placeholder="info@urbanbite.com" maxLength={100} />
            </div>
            <div className="form-group">
              <label className="form-label"><DollarSign size={13} style={{ display: 'inline', marginRight: 5 }} />Currency</label>
              <select className="form-control form-select" value={settings.currency || 'PKR'} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label"><Clock size={13} style={{ display: 'inline', marginRight: 5 }} />Timezone</label>
              <select className="form-control form-select" value={settings.timezone || 'Asia/Karachi'} onChange={e => set('timezone', e.target.value)}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
          <div className="settings-save-bar">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? <><RefreshCw size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="settings-section">
      <div className="settings-card">
        <div className="settings-card-header">
          <Bell size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <div className="settings-card-title">Notification Preferences</div>
            <div className="settings-card-subtitle">Control which events trigger admin notifications</div>
          </div>
        </div>
        <div className="settings-card-body">
          {[
            { key: 'newOrders', label: 'New Order Alerts', desc: 'Notify in real-time when a new order is placed' },
            { key: 'orderStatus', label: 'Order Status Updates', desc: 'Notify in real-time when order status changes' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="toggle-row">
              <div>
                <div className="toggle-label">{label}</div>
                <div className="toggle-description">{desc}</div>
              </div>
              <Toggle
                id={`notif-${key}`}
                checked={settings.notifications?.[key] ?? false}
                onChange={v => set(`notifications.${key}`, v)}
              />
            </div>
          ))}
          <div className="settings-save-bar">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? <><RefreshCw size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="settings-section">
      <div className="settings-card">
        <div className="settings-card-header">
          <Server size={18} style={{ color: 'var(--accent)' }} />
          <div>
            <div className="settings-card-title">System Information</div>
            <div className="settings-card-subtitle">Live server telemetry and environment details</div>
          </div>
        </div>
        <div className="settings-card-body">
          <div className="sysinfo-grid">
            {[
              { label: 'API Status', value: systemInfo?.apiStatus || 'Connected', className: 'connected' },
              { label: 'Database', value: systemInfo?.databaseStatus || 'Connected', className: systemInfo?.databaseStatus === 'Connected' ? 'connected' : 'disconnected' },
              { label: 'Environment', value: systemInfo?.environment || 'development' },
              { label: 'Node.js', value: systemInfo?.nodeVersion || 'v20+' },
              { label: 'Uptime', value: systemInfo?.uptime ? `${Math.floor(systemInfo.uptime / 60)}m ${systemInfo.uptime % 60}s` : 'Active' },
              { label: 'Architecture', value: 'MERN Stack' }
            ].map(({ label, value, className }) => (
              <div key={label} className="sysinfo-item">
                <div className="sysinfo-label">{label}</div>
                <div className={`sysinfo-value ${className || ''}`}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadSettings}>
              <RefreshCw size={13} /> Refresh Telemetry
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneral();
      case 'notifications': return renderNotifications();
      case 'system': return renderSystem();
      default: return null;
    }
  };

  return (
    <div className="fade-in">
      {/* ── Page Title ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>System Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure UrbanBite Admin Panel and POS system preferences.</p>
      </div>

      {dirty && (
        <div style={{
          background: 'var(--yellow-soft)', border: '1px solid rgba(217,119,6,0.25)',
          borderRadius: 'var(--radius-sm)', padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, fontSize: 13, color: 'var(--yellow)', fontWeight: 600
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} /> You have unsaved changes.
          </span>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <><RefreshCw size={13} className="spin" /> Saving...</> : <><Save size={13} /> Save Now</>}
          </button>
        </div>
      )}

      <div className="settings-layout">
        {/* ── Settings Nav ── */}
        <nav className="settings-nav">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings-nav-item ${activeSection === id ? 'active' : ''}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* ── Active Section ── */}
        <div key={activeSection} className="fade-in">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
