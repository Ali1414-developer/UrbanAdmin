import { useEffect, useState } from 'react';
import {
  Search, Users, Eye, ShoppingBag, ShieldCheck,
  UserCheck, UserX, Calendar, Phone, Mail, MapPin,
  RefreshCw, CheckCircle2, XCircle, Shield, Store
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

const roleBadges = {
  admin: { label: 'Admin', class: 'badge-purple', icon: ShieldCheck },
  receptionist: { label: 'Receptionist', class: 'badge-orange', icon: Store },
  customer: { label: 'Customer', class: 'badge-blue', icon: Users }
};

const statusOrderColors = {
  Placed: 'badge-blue', Confirmed: 'badge-orange', Preparing: 'badge-yellow',
  OutForDelivery: 'badge-purple', ReadyForPickup: 'badge-purple',
  Delivered: 'badge-green', Completed: 'badge-green', Cancelled: 'badge-red'
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalStaff: 0,
    totalActive: 0,
    totalInactive: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: {
          search,
          role: roleFilter,
          status: statusFilter,
          page,
          limit: 25
        }
      });
      setUsers(data.data || []);
      setTotal(data.total || 0);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err) {
      showToast('Failed to load registered users directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const viewUser = async (id) => {
    setSelectedLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${id}`);
      setSelected(data.data);
    } catch (err) {
      showToast('Failed to load user profile', 'error');
    } finally {
      setSelectedLoading(false);
    }
  };

  const toggleUserActive = async (targetUser) => {
    setUpdating(true);
    try {
      const newStatus = targetUser.isActive === false ? true : false;
      await api.put(`/admin/users/${targetUser._id}/status`, { isActive: newStatus });
      
      setUsers(prev => prev.map(u => u._id === targetUser._id ? { ...u, isActive: newStatus } : u));
      if (selected && selected._id === targetUser._id) {
        setSelected(prev => ({ ...prev, isActive: newStatus }));
      }
      
      setSummary(prev => ({
        ...prev,
        totalActive: newStatus ? prev.totalActive + 1 : Math.max(0, prev.totalActive - 1),
        totalInactive: newStatus ? Math.max(0, prev.totalInactive - 1) : prev.totalInactive + 1
      }));

      showToast(`User account ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      showToast('Failed to update user status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const pages = Math.ceil(total / 25);

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Registered Users Directory
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Complete database directory of all registered accounts including customers, receptionists, and administrators.
        </p>
      </div>

      {/* KPI Cards Header */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-soft)', width: 38, height: 38, margin: 0 }}>
              <Users size={18} color="var(--accent)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ALL USERS</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {summary.totalUsers}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Registered accounts</div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--blue-soft)', width: 38, height: 38, margin: 0 }}>
              <Users size={18} color="var(--blue)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>CUSTOMERS</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {summary.totalCustomers}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Website buyers</div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--orange-soft)', width: 38, height: 38, margin: 0 }}>
              <Store size={18} color="var(--orange)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>STAFF TEAM</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {summary.totalStaff}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Admins & Receptionists</div>
        </div>

        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--green-soft)', width: 38, height: 38, margin: 0 }}>
              <UserCheck size={18} color="var(--green)" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>ACTIVE</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>
            {summary.totalActive}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Active accounts</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        {/* Filter Bar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 14, padding: '16px 20px' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
            <Search size={16} />
            <input
              type="text"
              className="search-input"
              placeholder="Search users by name, email or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 140, padding: '8px 12px', fontSize: 13, fontWeight: 600 }}
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers</option>
              <option value="receptionist">Receptionists</option>
              <option value="admin">Administrators</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 130, padding: '8px 12px', fontSize: 13, fontWeight: 600 }}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Inactive / Suspended</option>
            </select>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchUsers}
              title="Refresh users directory"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="loading-overlay" style={{ padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User & Contact</th>
                  <th>Role</th>
                  <th>Branch / City</th>
                  <th>Orders Count</th>
                  <th>Total Spent</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleConfig = roleBadges[u.role] || roleBadges.customer;
                  const RoleIcon = roleConfig.icon;
                  const initials = u.name
                    ? u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'UB';

                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: u.role === 'admin' ? 'var(--purple-soft)' : (u.role === 'receptionist' ? 'var(--orange-soft)' : 'var(--blue-soft)'),
                              color: u.role === 'admin' ? 'var(--purple)' : (u.role === 'receptionist' ? 'var(--orange)' : 'var(--blue)'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 13,
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                              <Mail size={11} /> {u.email}
                            </div>
                            {u.phone && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                                <Phone size={10} /> {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${roleConfig.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700 }}>
                          <RoleIcon size={12} />
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {u.branchId || u.city || 'Main Branch'}
                        </div>
                        {u.area && (
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{u.area}</div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 13 }}>
                          {u.totalOrders || 0}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>orders</span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 800, color: u.totalSpent > 0 ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13 }}>
                          Rs. {(u.totalSpent || 0).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </td>

                      <td>
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => toggleUserActive(u)}
                          className={`badge ${u.isActive !== false ? 'badge-green' : 'badge-red'}`}
                          style={{
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.15s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title={`Click to ${u.isActive !== false ? 'deactivate' : 'activate'} this user`}
                        >
                          {u.isActive !== false ? <UserCheck size={11} /> : <UserX size={11} />}
                          <span>{u.isActive !== false ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <button
                          type="button"
                          className="action-btn-edit"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#F0F9FF',
                            border: '1px solid #BAE6FD',
                            color: '#0284C7',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => viewUser(u._id)}
                          title="View user details & history"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: '48px 16px', textAlign: 'center' }}>
                        <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No users found</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                          No accounts match your search filter criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', margin: 0 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-btn${p === page ? ' active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Detail Profile Modal */}
      {selectedLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {selected && (
        <Modal title="User Account & Details" onClose={() => setSelected(null)}>
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--bg-hover)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: selected.role === 'admin' ? 'var(--purple-soft)' : (selected.role === 'receptionist' ? 'var(--orange-soft)' : 'var(--blue-soft)'),
                  color: selected.role === 'admin' ? 'var(--purple)' : (selected.role === 'receptionist' ? 'var(--orange)' : 'var(--blue)'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18
                }}
              >
                {selected.name?.slice(0, 2).toUpperCase() || 'UB'}
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selected.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className={`badge ${roleBadges[selected.role]?.class || 'badge-blue'}`}>
                    {roleBadges[selected.role]?.label || selected.role}
                  </span>
                  <span className={`badge ${selected.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                    {selected.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SPENT</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent)' }}>
                Rs. {(selected.totalSpent || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>EMAIL ADDRESS</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3 }}>
                {selected.email}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>PHONE NUMBER</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3 }}>
                {selected.phone || 'Not provided'}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>BRANCH / CITY</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3 }}>
                {selected.branchId || selected.city || 'Main Branch'}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>REGISTERED DATE</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3 }}>
                {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Recent Orders History</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                {selected.orders?.length || 0} orders found
              </span>
            </h4>

            {selected.orders && selected.orders.length > 0 ? (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.orders.map(o => (
                      <tr key={o._id}>
                        <td><code>#{o.orderNumber || o._id.slice(-6).toUpperCase()}</code></td>
                        <td>{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td>
                          <span className={`badge ${statusOrderColors[o.status] || 'badge-gray'}`} style={{ fontSize: 10 }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Rs. {(o.pricing?.grandTotal || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: 12 }}>
                No orders placed yet by this account.
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
