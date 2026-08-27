import { useEffect, useState } from 'react';
import {
  Search, ShieldCheck, Store, UserCheck, UserX,
  Calendar, Phone, Mail, Plus, Pencil, Trash2,
  Lock, Eye, EyeOff, Building, RefreshCw, AlertCircle,
  CheckCircle2, Users, KeyRound, Shield, Wallet, DollarSign,
  CreditCard, Clock, Printer, Receipt, ArrowUpRight, ArrowDownRight, X
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const formatRs = (n) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;

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
  city: 'Lahore',
  isActive: true,
  baseSalary: 50000,
  allowance: 5000,
  bonus: 0,
  deductions: 0,
  bankName: 'Meezan Bank Ltd',
  accountNumber: 'PK36MEZN000123456789'
};

export default function StaffManagementPage() {
  const { user: currentStaff, updateAdmin } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add / Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formLoading, setFormLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Pay-Off & Salary Management Modal
  const [payrollModalStaff, setPayrollModalStaff] = useState(null);
  const [payFormData, setPayFormData] = useState({
    baseSalary: 50000,
    allowance: 5000,
    bonus: 0,
    deductions: 0,
    month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    bankName: 'Meezan Bank Ltd',
    accountNumber: 'PK36MEZN000123456789',
    paymentMethod: 'Bank Transfer',
    transactionRef: ''
  });
  const [payLoading, setPayLoading] = useState(false);

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
    setFormData({
      ...defaultForm,
      role: presetRole,
      baseSalary: presetRole === 'admin' ? 85000 : 50000,
      allowance: presetRole === 'admin' ? 10000 : 5000
    });
    setShowPass(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    const p = staff.payroll || {};
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '',
      role: staff.role === 'reception' ? 'receptionist' : (staff.role || 'receptionist'),
      branchId: staff.branchId || staff.branchName || 'Main Branch',
      city: staff.city || 'Lahore',
      isActive: staff.isActive !== false,
      baseSalary: p.baseSalary ?? (staff.role === 'admin' ? 85000 : 50000),
      allowance: p.allowance ?? 5000,
      bonus: p.bonus ?? 0,
      deductions: p.deductions ?? 0,
      bankName: p.bankName || 'Meezan Bank Ltd',
      accountNumber: p.accountNumber || 'PK36MEZN000123456789'
    });
    setShowPass(false);
    setIsModalOpen(true);
  };

  const handleOpenPayModal = (staff) => {
    setPayrollModalStaff(staff);
    const p = staff.payroll || {};
    const baseSalary = Number(p.baseSalary) || (staff.role === 'admin' ? 85000 : 50000);
    const allowance = Number(p.allowance) || 5000;
    const bonus = Number(p.bonus) || 0;
    const deductions = Number(p.deductions) || 0;

    setPayFormData({
      baseSalary,
      allowance,
      bonus,
      deductions,
      month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      bankName: p.bankName || 'Meezan Bank Ltd',
      accountNumber: p.accountNumber || 'PK36MEZN000123456789',
      paymentMethod: p.paymentMethod || 'Bank Transfer',
      transactionRef: `UB-PAY-${Date.now().toString().slice(-6)}`
    });
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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || '',
        role: formData.role,
        branchId: formData.branchId,
        city: formData.city,
        isActive: formData.isActive,
        payroll: {
          baseSalary: Number(formData.baseSalary) || 50000,
          allowance: Number(formData.allowance) || 5000,
          bonus: Number(formData.bonus) || 0,
          deductions: Number(formData.deductions) || 0,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber
        }
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingStaff) {
        const { data } = await api.put(`/admin/users/${editingStaff._id}`, payload);
        showToast(`Staff member "${data.data?.name || 'User'}" updated successfully!`, 'success');

        if (currentStaff && (currentStaff._id === editingStaff._id || currentStaff.id === editingStaff._id)) {
          if (updateAdmin) {
            updateAdmin({ name: formData.name, email: formData.email, phone: formData.phone });
          }
        }
      } else {
        const { data } = await api.post('/admin/users', payload);
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

  // Disburse / Record Monthly Pay
  const handleDisbursePay = async () => {
    if (!payrollModalStaff) return;
    setPayLoading(true);
    try {
      // 1. Update general payroll config (base, allowance, bank)
      await api.put(`/admin/users/${payrollModalStaff._id}`, {
        payroll: {
          baseSalary: Number(payFormData.baseSalary) || 50000,
          allowance: Number(payFormData.allowance) || 5000,
          bankName: payFormData.bankName,
          accountNumber: payFormData.accountNumber,
          paymentMethod: payFormData.paymentMethod
        }
      });

      // 2. Record Pay-off for this month
      const { data } = await api.post(`/admin/users/${payrollModalStaff._id}/pay-off`, {
        month: payFormData.month,
        bonus: Number(payFormData.bonus) || 0,
        deductions: Number(payFormData.deductions) || 0,
        transactionRef: payFormData.transactionRef,
        paymentMethod: payFormData.paymentMethod
      });

      showToast(`Monthly pay-off of ${formatRs(data.record?.netPay)} disbursed for ${payrollModalStaff.name}!`, 'success');
      setPayrollModalStaff(null);
      fetchStaff();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record pay-off', 'error');
    } finally {
      setPayLoading(false);
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

  // Staff summary calculations & Payroll metrics
  const totalStaff = staffList.length;
  const totalReceptionists = staffList.filter(s => s.role === 'receptionist' || s.role === 'reception').length;
  const totalAdmins = staffList.filter(s => s.role === 'admin').length;
  const totalActive = staffList.filter(s => s.isActive !== false).length;

  const totalPayrollBudget = staffList
    .filter(s => s.isActive !== false)
    .reduce((sum, s) => sum + (Number(s.payroll?.netPay) || (Number(s.payroll?.baseSalary || 0) + Number(s.payroll?.allowance || 0))), 0);

  const totalPaidCount = staffList.filter(s => s.payroll?.payStatus === 'Paid').length;
  const totalPendingCount = staffList.filter(s => s.payroll?.payStatus !== 'Paid').length;

  // Computed net pay for the modal preview
  const modalNetPay = Math.max(
    0,
    (Number(payFormData.baseSalary) || 0) +
    (Number(payFormData.allowance) || 0) +
    (Number(payFormData.bonus) || 0) -
    (Number(payFormData.deductions) || 0)
  );

  return (
    <div className="fade-in space-y-6">
      {/* Top Header with Add Receptionist & Add Admin Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="var(--accent)" />
            Staff & Payroll Management
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Manage staff credentials, salary packages, monthly disbursements, and branch role assignments.
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

      {/* KPI Cards Header with Payroll Budget */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        {/* Total Staff */}
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{totalActive} Active on duty</div>
        </div>

        {/* Total Monthly Payroll */}
        <div className="stat-card" style={{ padding: '16px 20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', width: 38, height: 38, margin: 0 }}>
              <Wallet size={18} color="#10B981" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>MONTHLY PAYROLL</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>
            {formatRs(totalPayrollBudget)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Total active salaries</div>
        </div>

        {/* Paid Status */}
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--green-soft)', width: 38, height: 38, margin: 0 }}>
              <CheckCircle2 size={18} color="var(--green)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>PAY-OFF STATUS</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>
            {totalPaidCount} / {totalStaff}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Paid this month</div>
        </div>

        {/* Admins & Receptionists Count */}
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--purple-soft)', width: 38, height: 38, margin: 0 }}>
              <ShieldCheck size={18} color="var(--purple)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)' }}>ROLES RATIO</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalAdmins} Adm • {totalReceptionists} Rec
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Across all branches</div>
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
                  <th>Branch Assignment</th>
                  <th>Monthly Package</th>
                  <th>Current Net Pay</th>
                  <th>Pay-Off Status</th>
                  <th>Status</th>
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

                  const p = staff.payroll || {};
                  const baseSalary = Number(p.baseSalary) || 0;
                  const allowance = Number(p.allowance) || 0;
                  const netPay = p.netPay !== undefined ? Number(p.netPay) : (baseSalary + allowance);
                  const isPaid = p.payStatus === 'Paid';

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
                          <span>{staff.branchName || staff.branchId || staff.city || 'Main Branch'}</span>
                        </div>
                      </td>

                      {/* Monthly Salary Package (Base + Allowance) */}
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatRs(baseSalary)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          + {formatRs(allowance)} allowance
                        </div>
                      </td>

                      {/* Current Month Net Pay */}
                      <td>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
                          {formatRs(netPay)}
                        </div>
                        {(p.bonus > 0 || p.deductions > 0) && (
                          <div style={{ fontSize: 10, color: p.bonus > 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                            {p.bonus > 0 && `+${formatRs(p.bonus)} bon. `}
                            {p.deductions > 0 && `-${formatRs(p.deductions)} ded.`}
                          </div>
                        )}
                      </td>

                      {/* Pay-Off Status */}
                      <td>
                        <span className={`badge ${isPaid ? 'badge-green' : 'badge-yellow'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                          {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          <span>{isPaid ? 'Paid' : 'Pending'}</span>
                        </span>
                      </td>

                      {/* Account Active Status */}
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

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                          {/* Pay-Off / Salary Action Button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleOpenPayModal(staff)}
                            title="Manage Salary & Disburse Pay-Off"
                          >
                            <Wallet size={13} color="var(--accent)" />
                            <span>Pay-Off</span>
                          </button>

                          {/* Edit Staff Profile */}
                          <button
                            type="button"
                            className="action-btn-edit"
                            style={{ padding: '6px 10px', borderRadius: 6 }}
                            onClick={() => handleOpenEdit(staff)}
                            title="Edit Staff Member"
                          >
                            <Pencil size={14} />
                          </button>

                          {/* Delete Staff */}
                          {!isSelf && (
                            <button
                              type="button"
                              className="action-btn-delete"
                              style={{ padding: '6px 10px', borderRadius: 6 }}
                              onClick={() => setDeleteTarget(staff)}
                              title="Remove Staff Member"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Staff Modal ── */}
      {isModalOpen && (
        <Modal
          title={editingStaff ? `Edit Staff: ${editingStaff.name}` : `Add New ${formData.role === 'admin' ? 'Administrator' : 'Receptionist'}`}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Tariq Mehmood"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="staff@urbanbite.pk"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+92 300 1234567"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Role & Access</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="receptionist">Receptionist (Front Desk / POS)</option>
                  <option value="admin">Administrator (Management)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Branch City</label>
                <select
                  className="form-control"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                >
                  <option value="Lahore">Lahore (Gulberg Branch)</option>
                  <option value="Islamabad">Islamabad (F-7 Markaz Branch)</option>
                  <option value="Multan">Multan (Cantt Branch)</option>
                  <option value="All">All Branches (Super Admin)</option>
                </select>
              </div>
            </div>

            {/* Salary Package Settings */}
            <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wallet size={14} color="var(--accent)" /> Salary Package Configuration (PKR)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Base Salary (Monthly)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.baseSalary}
                    onChange={e => setFormData({ ...formData, baseSalary: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Monthly Allowance</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.allowance}
                    onChange={e => setFormData({ ...formData, allowance: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">
                {editingStaff ? 'Reset Password (leave empty to keep existing)' : 'Login Password *'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder={editingStaff ? 'Enter new password...' : 'Minimum 6 characters'}
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
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? 'Saving...' : editingStaff ? 'Save Changes' : 'Create Staff Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Pay-Off & Salary Modal ── */}
      {payrollModalStaff && (
        <Modal
          title={`Monthly Pay-Off & Salary: ${payrollModalStaff.name}`}
          onClose={() => setPayrollModalStaff(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header info badge */}
            <div style={{ background: 'var(--bg-hover)', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{payrollModalStaff.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {payrollModalStaff.branchName || payrollModalStaff.city} • {payrollModalStaff.role}
                </div>
              </div>
              <span className={`badge ${payrollModalStaff.payroll?.payStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>
                Current: {payrollModalStaff.payroll?.payStatus || 'Paid'}
              </span>
            </div>

            {/* Compensation Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Base Salary (PKR)</label>
                <input
                  type="number"
                  className="form-control"
                  value={payFormData.baseSalary}
                  onChange={e => setPayFormData({ ...payFormData, baseSalary: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Allowance (PKR)</label>
                <input
                  type="number"
                  className="form-control"
                  value={payFormData.allowance}
                  onChange={e => setPayFormData({ ...payFormData, allowance: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Bonus / Incentive (PKR)</label>
                <input
                  type="number"
                  className="form-control"
                  value={payFormData.bonus}
                  onChange={e => setPayFormData({ ...payFormData, bonus: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Deductions (Tax/Advance PKR)</label>
                <input
                  type="number"
                  className="form-control"
                  value={payFormData.deductions}
                  onChange={e => setPayFormData({ ...payFormData, deductions: e.target.value })}
                />
              </div>
            </div>

            {/* Net Payout preview card */}
            <div style={{ background: 'rgba(229, 57, 53, 0.05)', border: '1px solid rgba(229, 57, 53, 0.2)', padding: 14, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Take-Home Pay</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>{formatRs(modalNetPay)}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>Period: <strong>{payFormData.month}</strong></span>
              </div>
            </div>

            {/* Bank Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Bank Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={payFormData.bankName}
                  onChange={e => setPayFormData({ ...payFormData, bankName: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">IBAN / Account Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={payFormData.accountNumber}
                  onChange={e => setPayFormData({ ...payFormData, accountNumber: e.target.value })}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setPayrollModalStaff(null)}>
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDisbursePay}
                disabled={payLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800 }}
              >
                <CheckCircle2 size={16} />
                <span>{payLoading ? 'Disbursing...' : `Mark as Paid (${formatRs(modalNetPay)})`}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <Modal
          title="Confirm Staff Removal"
          onClose={() => setDeleteTarget(null)}
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <AlertCircle size={48} color="var(--red)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Remove "{deleteTarget.name}"?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto 24px' }}>
              This staff member will no longer be able to log in to the UrbanBite admin or reception portals.
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
                className="btn btn-danger"
                onClick={handleDeleteStaff}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Removing...' : 'Yes, Remove Staff'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
