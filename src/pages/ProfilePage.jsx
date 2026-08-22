import { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Phone, Shield, Calendar, Clock,
  Edit3, Lock, CheckCircle, AlertCircle, Save, X,
  Eye, EyeOff, RefreshCw, KeyRound, Activity, CheckCircle2, XCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

// ── Helpers ───────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Password strength calculator
const calcStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', '#dc2626', '#d97706', '#2563eb', '#16a34a', '#16a34a'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
};

// ── Edit Profile Modal ────────────────────────────────────
function EditProfileModal({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({ name: profile?.name || '', phone: profile?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Name is required.'); return; }
    if (form.name.trim().length > 80) { setError('Name cannot exceed 80 characters.'); return; }

    try {
      setLoading(true);
      const res = await api.put('/admin/profile', {
        name: form.name.trim(),
        phone: form.phone.trim()
      });
      onSaved(res.data.data);
      showToast('Profile updated successfully.', 'success');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title"><Edit3 size={16} style={{ display: 'inline', marginRight: 8 }} />Edit Profile</h2>
          <button className="btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--red)', fontSize: 13, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} />{error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Your full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                maxLength={80}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                placeholder="03xx-xxxxxxx"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                maxLength={20}
              />
            </div>
            <div style={{ background: 'var(--blue-soft)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, color: 'var(--blue)', fontWeight: 500 }}>
              Email address cannot be changed through this form for security reasons.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><RefreshCw size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Change Password Modal ─────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const strength = calcStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      await api.put('/admin/profile/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });
      showToast('Password changed successfully.', 'success');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeBtn = ({ field }) => (
    <button
      type="button"
      onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
    >
      {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title"><KeyRound size={16} style={{ display: 'inline', marginRight: 8 }} />Change Password</h2>
          <button className="btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--red)', fontSize: 13, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} />{error}
              </div>
            )}

            {/* Requirements box */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>Password requirements:</div>
              {[
                ['At least 8 characters', form.newPassword.length >= 8],
                ['At least one uppercase letter', /[A-Z]/.test(form.newPassword)],
                ['At least one number', /[0-9]/.test(form.newPassword)],
                ['Different from current password', form.newPassword.length > 0]
              ].map(([label, met]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CheckCircle size={12} style={{ color: met ? 'var(--green)' : 'var(--border)', flexShrink: 0 }} />
                  <span style={{ color: met ? 'var(--green)' : 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show.current ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Your current password"
                  value={form.currentPassword}
                  onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                  style={{ paddingRight: 40 }}
                  required
                />
                <EyeBtn field="current" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show.new ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Minimum 8 characters"
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  style={{ paddingRight: 40 }}
                  required
                />
                <EyeBtn field="new" />
              </div>
              {form.newPassword && (
                <>
                  <div className="pw-strength-bar">
                    <div className="pw-strength-fill" style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
                  </div>
                  <div className="pw-strength-label" style={{ color: strength.color }}>{strength.label}</div>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show.confirm ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Repeat new password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  style={{ paddingRight: 40 }}
                  required
                />
                <EyeBtn field="confirm" />
              </div>
              {form.confirmPassword && form.newPassword && (
                <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: form.newPassword === form.confirmPassword ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {form.newPassword === form.confirmPassword ? (
                    <><CheckCircle2 size={12} /> Passwords match</>
                  ) : (
                    <><XCircle size={12} /> Passwords do not match</>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><RefreshCw size={14} className="spin" /> Changing...</> : <><KeyRound size={14} /> Change Password</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────
export default function ProfilePage() {
  const { updateAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/profile');
      setProfile(res.data.data);
    } catch (err) {
      showToast('Failed to load profile.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleProfileSaved = (updated) => {
    setProfile(updated);
    updateAdmin({ name: updated.name, phone: updated.phone });
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  return (
    <div className="fade-in">
      {/* ── Page Title ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>My Profile</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage your administrator account and security settings.</p>
      </div>

      <div className="profile-stacked-container">
        {/* ── Top Hero Profile Card ── */}
        <div className="profile-hero-card">
          <div className="profile-hero-left">
            <div className="profile-avatar-circle">{initials}</div>
            <div className="profile-hero-info">
              <div className="profile-name">{profile?.name || 'Administrator'}</div>
              <div className="profile-email">{profile?.email}</div>
              <div className="profile-badges-row">
                <div className="profile-role-badge">
                  <Shield size={12} />
                  {profile?.role || 'admin'}
                </div>
                <div className={`profile-status-badge ${profile?.isActive ? '' : 'badge-red'}`}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: profile?.isActive ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />
                  {profile?.isActive ? 'Active Account' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button className="btn btn-primary" onClick={() => setShowEdit(true)}>
              <Edit3 size={14} /> Edit Profile
            </button>
            <button className="btn btn-secondary" onClick={() => setShowChangePassword(true)}>
              <KeyRound size={14} /> Change Password
            </button>
          </div>
        </div>

        {/* ── Stacked Section 1: Personal Information ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><User size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Personal Information</div>
              <div className="card-subtitle">Basic account details</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
              <Edit3 size={13} /> Edit
            </button>
          </div>

          <div className="profile-info-row">
            <span className="profile-info-label">Full Name</span>
            <span className="profile-info-value">{profile?.name || <span className="empty">Not set</span>}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Email</span>
            <span className="profile-info-value">{profile?.email}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Phone</span>
            <span className={`profile-info-value${!profile?.phone ? ' empty' : ''}`}>
              {profile?.phone || 'Not set'}
            </span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Role</span>
            <span className="profile-info-value">
              <span className="badge badge-orange" style={{ textTransform: 'capitalize' }}>
                {profile?.role}
              </span>
            </span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Status</span>
            <span className="profile-info-value">
              <span className={`badge ${profile?.isActive ? 'badge-green' : 'badge-red'}`}>
                {profile?.isActive ? 'Active' : 'Inactive'}
              </span>
            </span>
          </div>
        </div>

        {/* ── Stacked Section 2: Security ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><Lock size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Security & Authentication</div>
              <div className="card-subtitle">Password and access credentials</div>
            </div>
          </div>

          <div className="profile-info-row">
            <span className="profile-info-label">Password</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="profile-info-value" style={{ letterSpacing: 3, fontSize: 16 }}>••••••••</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowChangePassword(true)}>
                <KeyRound size={12} /> Change
              </button>
            </div>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Authentication</span>
            <span className="profile-info-value">
              <span className="badge badge-blue">JWT Token</span>
            </span>
          </div>
          <div className="profile-info-row" style={{ borderBottom: 'none' }}>
            <span className="profile-info-label">Access Level</span>
            <span className="profile-info-value">
              <span className="badge badge-purple">Full Admin</span>
            </span>
          </div>
        </div>

        {/* ── Stacked Section 3: Account Activity ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><Activity size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Account Activity</div>
              <div className="card-subtitle">Account history and timestamps</div>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon" style={{ background: 'var(--green-soft)' }}>
              <CheckCircle size={16} style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <div className="activity-label">Account Created</div>
              <div className="activity-time">{formatDate(profile?.createdAt)}</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon" style={{ background: 'var(--blue-soft)' }}>
              <Edit3 size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div className="activity-label">Last Profile Update</div>
              <div className="activity-time">{formatDate(profile?.updatedAt)}</div>
            </div>
          </div>
          <div className="activity-item" style={{ borderBottom: 'none' }}>
            <div className="activity-icon" style={{ background: 'var(--accent-soft)' }}>
              <Clock size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <div className="activity-label">Current Session</div>
              <div className="activity-time">Active — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={handleProfileSaved}
        />
      )}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
