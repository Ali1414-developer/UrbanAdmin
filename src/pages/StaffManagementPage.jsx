import { useEffect, useState } from 'react';
import {
  Search, ShieldCheck, Store, UserCheck, UserX,
  Calendar, Phone, Mail, Plus, Pencil, Trash2,
  Lock, Eye, EyeOff, Building, RefreshCw, AlertCircle,
  CheckCircle2, Users, KeyRound, Shield
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const roleBadges = {
  admin: { label: 'Administrator', class: 'badge-purple', icon: ShieldCheck },
  receptionist: { label: 'Receptionist', class: 'badge-orange', icon: Store }
};

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'receptionist',
  branchId: 'Main Branch',
  isActive: true
};

export default function StaffManagementPage() {
  const { user: currentStaff, updateAdmin } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: {
          search,
          role: roleFilter === 'all' ? undefined : roleFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 100
        }
      });
      // Filter out pure customers, focus only on staff (admins & receptionists)
      const allUsers = data.data || [];
      const staffOnly = allUsers.filter(u => {
        if (roleFilter === 'admin') return u.role === 'admin';
        if (roleFilter === 'receptionist') return u.role === 'receptionist' || u.role === 'reception';
        return u.role === 'admin' || u.role === 'receptionist' || u.role === 'reception';
      });
      setStaffList(staffOnly);
    } catch (err) {
      showToast('Failed to load staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search, roleFilter, statusFilter]);

  const handleOpenAdd = (presetRole = 'receptionist') => {
    setEditingStaff(null);
    setFormData({ ...defaultForm, role: presetRole });
    setShowPass(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '',
      role: staff.role === 'reception' ? 'receptionist' : (staff.role || 'receptionist'),
      branchId: staff.branchId || 'Main Branch',
      isActive: staff.isActive !== false
    });
    setShowPass(false);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim()) {
      showToast('Name and email are required', 'error');
      return;
    }
    if (!editingStaff && !formData.password?.trim()) {
      showToast('Password is required for creating new staff accounts', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (editingStaff) {
        // Edit existing staff member or admin own profile
        const { data } = await api.put(`/admin/users/${editingStaff._id}`, formData);
        showToast(`Staff member "${data.data?.name || 'User'}" updated successfully!`, 'success');
        
        // If current admin edited their own profile, sync local state
        if (currentStaff && (currentStaff._id === editingStaff._id || currentStaff.id === editingStaff._id)) {
          if (updateAdmin) {
            updateAdmin({ name: formData.name, email: formData.email, phone: formData.phone });
          }
        }
      } else {
        // Add new staff member (receptionist or admin)
        const { data } = await api.post('/admin/users', formData);
        showToast(`New ${data.data?.role === 'admin' ? 'Administrator' : 'Receptionist'} created successfully!`, 'success');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      showToast(msg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      showToast(`${deleteTarget.name} has been removed successfully`, 'success');
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete staff member';
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleStaffStatus = async (staff) => {
    setStatusLoadingId(staff._id);
    try {
      const newStatus = staff.isActive === false ? true : false;
      await api.put(`/admin/users/${staff._id}/status`, { isActive: newStatus });
      setStaffList(prev => prev.map(s => s._id === staff._id ? { ...s, isActive: newStatus } : s));
      showToast(`${staff.name} is now ${newStatus ? 'Active' : 'Inactive'}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setStatusLoadingId(null);
    }
  };

  // Staff summary calculations
  const totalStaff = staffList.length;
  const totalReceptionists = staffList.filter(s => s.role === 'receptionist' || s.role === 'reception').length;
  const totalAdmins = staffList.filter(s => s.role === 'admin').length;
  const totalActive = staffList.filter(s => s.isActive !== false).length;

  return (
    <div className="fade-in space-y-6">
      {/* Top Header with Add Receptionist & Add Admin Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Staff & Receptionist Management
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Register new receptionists, manage staff credentials, update administrator profiles, and assign branches.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleOpenAdd('admin')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', fontWeight: 700 }}
          >
            <ShieldCheck size={16} color="var(--purple)" />
            <span>+ Add Admin</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenAdd('receptionist')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', fontWeight: 700 }}
          >
            <Plus size={18} />
            <span>+ Add Receptionist</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-soft)', width: 38, height: 38, margin: 0 }}>
              <Users size={18} color="var(--accent)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL STAFF</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalStaff}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Authorized portal accounts</div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--orange-soft)', width: 38, height: 38, margin: 0 }}>
              <Store size={18} color="var(--orange)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>RECEPTIONISTS</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalReceptionists}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Front desk staff</div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--purple-soft)', width: 38, height: 38, margin: 0 }}>
              <ShieldCheck size={18} color="var(--purple)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)' }}>ADMINS</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalAdmins}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Management access</div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--green-soft)', width: 38, height: 38, margin: 0 }}>
              <UserCheck size={18} color="var(--green)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>ACTIVE STAFF</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>
            {totalActive}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Can login & operate</div>
        </div>
      </div>

      {/* Staff Directory Card */}
      <div className="card">
        {/* Filter Bar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 14, padding: '16px 20px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search staff by name, email, phone or branch..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 150, padding: '8px 12px', fontSize: 13, fontWeight: 600 }}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Staff Roles</option>
              <option value="receptionist">Receptionists Only</option>
              <option value="admin">Administrators Only</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 130, padding: '8px 12px', fontSize: 13, fontWeight: 600 }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Suspended</option>
            </select>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchStaff}
              title="Refresh staff list"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="loading-overlay" style={{ padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role & Access</th>
                  <th>Assigned Branch</th>
                  <th>Contact Information</th>
                  <th>Account Status</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => {
                  const normalizedRole = staff.role === 'reception' ? 'receptionist' : staff.role;
                  const roleConfig = roleBadges[normalizedRole] || roleBadges.receptionist;
                  const RoleIcon = roleConfig.icon;
                  const isSelf = currentStaff && (currentStaff._id === staff._id || currentStaff.id === staff._id || currentStaff.email === staff.email);
                  const initials = staff.name
                    ? staff.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'ST';

                  return (
                    <tr key={staff._id} style={{ background: isSelf ? 'rgba(229, 57, 53, 0.02)' : 'transparent' }}>
                      {/* Name & Badge */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: normalizedRole === 'admin' ? 'var(--purple-soft)' : 'var(--orange-soft)',
                              color: normalizedRole === 'admin' ? 'var(--purple)' : 'var(--orange)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 14,
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{staff.name}</span>
                              {isSelf && (
                                <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4 }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                              <code>{staff.email}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span className={`badge ${roleConfig.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '4px 10px' }}>
                          <RoleIcon size={13} />
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      {/* Branch Assignment */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          <Building size={13} color="var(--text-muted)" />
                          <span>{staff.branchId || staff.city || 'Main Branch'}</span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Phone size={12} color="var(--text-muted)" />
                          <span>{staff.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Status Toggle Button */}
                      <td>
                        <button
                          type="button"
                          disabled={statusLoadingId === staff._id}
                          onClick={() => toggleStaffStatus(staff)}
                          className={`badge ${staff.isActive !== false ? 'badge-green' : 'badge-red'}`}
                          style={{
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.15s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            fontWeight: 700
                          }}
                          title={`Click to ${staff.isActive !== false ? 'deactivate' : 'activate'} this staff account`}
                        >
                          {staff.isActive !== false ? <UserCheck size={12} /> : <UserX size={12} />}
                          <span>{staff.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Created Date */}
                      <td>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </td>

                      {/* Actions (Edit & Delete) */}
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                          {/* Edit Staff / Password */}
                          <button
                            type="button"
                            className="action-btn-edit"
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              background: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              color: '#0284C7',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: 12
                            }}
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit details & reset password"
                          >
                            <Pencil size={13} />
                            <span>Edit / Password</span>
                          </button>

                          {/* Delete Staff */}
                          {!isSelf && (
                            <button
                              type="button"
                              className="action-btn-delete"
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                cursor: 'pointer'
                              }}
                              onClick={() => setDeleteTarget(staff)}
                              title="Delete staff account"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center' }}>
                        <Store size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No staff members found</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px' }}>
                          No receptionists or administrators match your filter. Register staff members to manage portal operations.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenAdd('receptionist')}
                        >
                          + Add Receptionist Now
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <Modal
          title={
            editingStaff
              ? `Edit Staff — ${editingStaff.name} (${editingStaff.role === 'admin' ? 'Administrator' : 'Receptionist'})`
              : `Register New ${formData.role === 'admin' ? 'Administrator' : 'Receptionist'}`
          }
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ayesha Tariq"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address (Login Username) *</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. reception.gulberg@urbanbite.pk"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +92 300 1234567"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Password with Eye Toggle */}
            <div className="form-group">
              <label className="form-label">
                {editingStaff ? 'New Password (Leave blank to keep current password)' : 'Account Password *'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingRight: 40 }}
                  placeholder={editingStaff ? '••••••••' : 'Minimum 6 characters'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editingStaff}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role & Branch */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Role & Access Type</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="receptionist">Receptionist (Front Desk Portal)</option>
                  <option value="admin">Administrator (Full Admin Access)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Branch / Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Main Branch, Gulberg, DHA"
                  value={formData.branchId}
                  onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                />
              </div>
            </div>

            {/* Active Status Toggle */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <input
                type="checkbox"
                id="staff-active-check"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <label htmlFor="staff-active-check" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                Active Account (Staff member can log in and process orders)
              </label>
            </div>

            {/* Submit & Cancel Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading}
                style={{ minWidth: 130 }}
              >
                {formLoading ? 'Saving...' : (editingStaff ? 'Save Changes' : 'Create Staff Member')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Staff Confirmation Modal */}
      {deleteTarget && (
        <Modal title="Confirm Account Deletion" onClose={() => setDeleteTarget(null)}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Trash2 size={26} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Delete {deleteTarget.name}?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this <strong>{deleteTarget.role}</strong> account (<code>{deleteTarget.email}</code>)? They will no longer be able to log in.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#DC2626', color: '#FFFFFF', fontWeight: 700 }}
                onClick={handleDeleteStaff}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
