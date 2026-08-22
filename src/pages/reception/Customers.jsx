import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Users, Eye, Plus, Phone,
  Mail, MapPin, Calendar, ShoppingBag, X, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../components/Toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // New Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', city: 'Lahore' });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reception/customers', { params: { search, page, limit: 25 } });
      setCustomers(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      showToast('Failed to load customer list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      showToast('Name and phone number are required.', 'error');
      return;
    }

    try {
      setCreating(true);
      await api.post('/reception/customers', newCustomer);
      showToast('Customer created successfully!');
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', city: 'Lahore' });
      fetchCustomers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create customer.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            Customer Directory
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Lookup guest profiles, contact numbers, and order history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchCustomers}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add New Customer
          </button>
        </div>
      </div>

      {/* Unified Customers Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-toolbar">
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Search by customer name, phone, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              <Users size={40} />
              <h3>No customers found</h3>
              <p>Try searching with another name or phone number.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>City / Address</th>
                  <th>Registered Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {c.name ? c.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <span style={{ fontWeight: 700 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.email}</td>
                    <td>
                      {c.address ? `${c.address}, ${c.city || ''}` : (c.city || '—')}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/reception/customers/${c._id}`} className="btn btn-secondary btn-sm" title="View Customer History">
                          <Eye size={13} /> History
                        </Link>
                        <Link to="/reception/new-order" className="btn btn-primary btn-sm" title="Create Order for this customer">
                          <Plus size={13} /> Order
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Customer Modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Customer Profile</h2>
              <button className="btn-icon btn-sm" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Customer Name"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="03001234567"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="customer@email.com"
                    value={newCustomer.email}
                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="House/Street, Area"
                    value={newCustomer.address}
                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
