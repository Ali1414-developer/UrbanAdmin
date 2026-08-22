import { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Phone, Shield, Calendar, Clock,
  Edit3, Lock, CheckCircle, AlertCircle, Save, X,
  Eye, EyeOff, RefreshCw, KeyRound, Activity
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/Toast';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

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

export default function Profile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const strength = calcStrength(pwForm.newPassword);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reception/profile');
      setProfile(res.data.data);
      setForm({ name: res.data.data.name || '', phone: res.data.data.phone || '' });
    } catch (err) {
      showToast('Failed to load profile.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }

    try {
      setSavingEdit(true);
      const res = await api.put('/reception/profile', {
        name: form.name.trim(),
        phone: form.phone.trim()
      });
      setProfile(res.data.data);
      updateUser({ name: res.data.data.name, phone: res.data.data.phone });
      showToast('Profile updated successfully!');
      setShowEdit(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('All password fields are required.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    try {
      setSavingPw(true);
      await api.put('/reception/profile/change-password', pwForm);
      showToast('Password changed successfully!');
      setShowPasswordModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'RS';

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Title */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
          Staff Profile
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Front desk receptionist account and security credentials.
        </p>
      </div>

      <div className="profile-stacked-container">
        {/* ── Top Hero Card ── */}
        <div className="profile-hero-card">
          <div className="profile-hero-left">
            <div className="profile-avatar-circle">{initials}</div>
            <div className="profile-hero-info">
              <div className="profile-name">{profile?.name || 'Reception Staff'}</div>
              <div className="profile-email">{profile?.email}</div>
              <div className="profile-badges-row">
                <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
                  <Shield size={12} /> {profile?.role || 'receptionist'}
                </span>
                <span className="badge badge-green">
                  Active Front Desk Account
                </span>
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button className="btn btn-primary" onClick={() => setShowEdit(true)}>
              <Edit3 size={14} /> Edit Profile
            </button>
            <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)}>
              <KeyRound size={14} /> Change Password
            </button>
          </div>
        </div>

        {/* ── Stacked Section 1: Staff Details ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><User size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Staff Details</div>
              <div className="card-subtitle">Basic front desk account information</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
              <Edit3 size={13} /> Edit
            </button>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Full Name</span>
            <span className="profile-info-value">{profile?.name}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Email Address</span>
            <span className="profile-info-value">{profile?.email}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Phone Number</span>
            <span className="profile-info-value">{profile?.phone || 'Not provided'}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Assigned Role</span>
            <span className="profile-info-value">
              <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>{profile?.role}</span>
            </span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Account Created</span>
            <span className="profile-info-value">{formatDate(profile?.createdAt)}</span>
          </div>
        </div>

        {/* ── Stacked Section 2: Security & Permissions ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><Lock size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Security & Operational Permissions</div>
              <div className="card-subtitle">Front desk authorizations and password security</div>
            </div>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Password</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="profile-info-value" style={{ letterSpacing: 3, fontSize: 16 }}>••••••••</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPasswordModal(true)}>
                <KeyRound size={12} /> Change
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)' }}>
              <CheckCircle size={15} /> Operational POS & Order Creation
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)' }}>
              <CheckCircle size={15} /> Customer Lookup & History Access
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)' }}>
              <CheckCircle size={15} /> Dining Table Management
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)' }}>
              <CheckCircle size={15} /> Thermal Receipt Printing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginTop: 4 }}>
              <Shield size={14} /> System settings and database administration are restricted to System Admins.
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Staff Profile</h2>
              <button className="btn-icon btn-sm" onClick={() => setShowEdit(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--blue)', background: 'var(--blue-soft)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  Email address and staff role cannot be modified.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)} disabled={savingEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Change Password</h2>
              <button className="btn-icon btn-sm" onClick={() => setShowPasswordModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                {pwError && (
                  <div style={{ background: 'var(--red-soft)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={15} /> {pwError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Current Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw.current ? 'text' : 'password'}
                      className="form-control"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw.new ? 'text' : 'password'}
                      className="form-control"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {pwForm.newPassword && (
                    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: strength.color }}>
                      Strength: {strength.label}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      className="form-control"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={savingPw}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPw}>
                  {savingPw ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
