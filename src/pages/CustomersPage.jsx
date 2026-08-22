import { useEffect, useState } from 'react';
import { Search, Users, Eye, ShoppingBag, DollarSign, Calendar, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

const statusColors = {
  Placed: 'badge-blue', Confirmed: 'badge-orange', Preparing: 'badge-yellow',
  OutForDelivery: 'badge-purple', ReadyForPickup: 'badge-purple',
  Delivered: 'badge-green', Completed: 'badge-green', Cancelled: 'badge-red'
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/customers', { params: { search, page, limit: 25 } });
      setCustomers(data.data || []);
      setTotal(data.total || (data.data?.length || 0));
    } catch (err) {
      showToast('Failed to load customer directory', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [search, page]);

  const viewCustomer = async (id) => {
    setSelectedLoading(true);
    try {
      const { data } = await api.get(`/admin/customers/${id}`);
      setSelected(data.data);
    } catch (err) {
      showToast('Failed to load customer profile', 'error');
    } finally { setSelectedLoading(false); }
  };

  const toggleCustomerActive = async (cust) => {
    setUpdating(true);
    try {
      const newStatus = !cust.isActive;
      await api.put(`/admin/customers/${cust._id}/status`, { isActive: newStatus });
      setCustomers(prev => prev.map(c => c._id === cust._id ? { ...c, isActive: newStatus } : c));
      if (selected && selected._id === cust._id) {
        setSelected(prev => ({ ...prev, isActive: newStatus }));
      }
      showToast(`Customer account ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      showToast('Failed to change customer status', 'error');
    } finally { setUpdating(false); }
  };

  const pages = Math.ceil(total / 25);

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 className="header-title" style={{ margin: 0 }}>Customer Directory</h2>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{total} total registered customer accounts</div>
      </div>

      <div className="card" style={{ padding: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              className="search-input"
              placeholder="Search customer by name, email, phone number..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : (
          <div className="table-container">
            <table style={{ width: '100%', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '25%', paddingLeft: 16 }}>Customer</th>
                  <th style={{ width: '13%' }}>Phone</th>
                  <th style={{ width: '10%' }}>City</th>
                  <th style={{ width: '12%' }}>Joined</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Orders</th>
                  <th style={{ width: '13%' }}>Total Spent</th>
                  <th style={{ width: '11%', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '8%', textAlign: 'right', paddingRight: 16 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td style={{ paddingLeft: 16, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div className="avatar" style={{ width: 32, height: 32, minWidth: 32, fontSize: 12, flexShrink: 0 }}>
                          {c.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.name}>
                            {c.name}
                          </div>
                          <div className="text-xs text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.email}>
                            {c.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.phone || '—'}</td>
                    <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.city || 'Lahore'}</td>
                    <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="text-sm" style={{ fontWeight: 700, textAlign: 'center' }}>{c.totalOrders || 0}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Rs. {(c.totalSpent || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className={`badge ${c.isActive !== false ? 'badge-green' : 'badge-red'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '3px 8px', fontSize: 11 }}
                        onClick={() => toggleCustomerActive(c)}
                        title="Click to toggle active status"
                      >
                        {c.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
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
                        onClick={() => viewCustomer(c._id)}
                        title="View customer profile & history"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state" style={{ padding: '36px 16px' }}>
                        <Users size={36} />
                        <h3>No customers found</h3>
                        <p>Customer accounts created on registration or checkout will appear here.</p>
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
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {selectedLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="spinner" />
        </div>
      )}

      {/* Customer Detail Profile Modal */}
      {selected && (
        <Modal title="Customer Profile & Order History" onClose={() => setSelected(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, background: 'var(--bg-hover)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
              {selected.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{selected.name}</div>
              <div className="text-sm text-muted">{selected.email}</div>
              <div className="text-sm text-muted">{selected.phone || 'No phone recorded'}</div>
            </div>
            <div>
              <span className={`badge ${selected.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                {selected.isActive !== false ? 'Active Account' : 'Deactivated'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{selected.totalOrders || 0}</div>
              <div className="text-xs text-muted" style={{ fontWeight: 600, marginTop: 2 }}>Total Completed Orders</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>Rs. {(selected.totalSpent || 0).toLocaleString()}</div>
              <div className="text-xs text-muted" style={{ fontWeight: 600, marginTop: 2 }}>Total Customer Spending</div>
            </div>
          </div>

          {/* Customer Order History */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Order History ({selected.orders?.length || 0})
            </div>
            {selected.orders && selected.orders.length > 0 ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {selected.orders.slice(0, 10).map((o, idx) => (
                  <div key={o._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: idx < selected.orders.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-secondary)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{o.orderNumber}</div>
                      <div className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Rs. {o.pricing?.grandTotal?.toLocaleString()}
                      </div>
                      <span className={`badge ${statusColors[o.status] || 'badge-gray'}`} style={{ marginTop: 2 }}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 10px' }}>
                <ShoppingBag size={28} />
                <p style={{ marginTop: 6 }}>No order history logged for this customer yet.</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
