import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Phone, Mail, MapPin,
  Calendar, ShoppingBag, DollarSign, Eye, Plus
} from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../components/Toast';

const formatRs = (n) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;

const statusColors = {
  Placed: 'badge-blue',
  Confirmed: 'badge-orange',
  Preparing: 'badge-yellow',
  OutForDelivery: 'badge-purple',
  ReadyForPickup: 'badge-purple',
  Delivered: 'badge-green',
  Completed: 'badge-green',
  Cancelled: 'badge-red'
};

export default function CustomerDetails() {
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/reception/customers/${customerId}`);
        setCustomer(res.data.data.customer);
        setOrders(res.data.data.orders || []);
        setTotalSpent(res.data.data.totalSpent || 0);
        setOrderCount(res.data.data.orderCount || 0);
      } catch (err) {
        showToast('Failed to load customer profile.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId]);

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  if (!customer) {
    return (
      <div className="empty-state">
        <Users size={40} />
        <h3>Customer not found</h3>
        <Link to="/reception/customers" className="btn btn-primary" style={{ marginTop: 12 }}>
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => navigate('/reception/customers')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
              {customer.name}
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Customer Profile & Lifetime History
            </span>
          </div>
        </div>

        <Link to="/reception/new-order" className="btn btn-primary btn-sm">
          <Plus size={14} /> New Order for {customer.name.split(' ')[0]}
        </Link>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{orderCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">{formatRs(totalSpent)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
            <Phone size={22} />
          </div>
          <div>
            <div className="stat-label">Phone Number</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{customer.phone || '—'}</div>
          </div>
        </div>
      </div>

      {/* Orders History Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Order History ({orders.length})</div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={36} />
            <h3>No past orders found</h3>
            <p>Orders placed by this customer will appear here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{o.orderNumber}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ textTransform: 'uppercase' }}>
                        {o.orderSource || 'website'}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: 12 }}>
                        {o.orderType}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>
                        {o.items?.map(i => `${i.name} ×${i.quantity}`).join(', ').slice(0, 30)}...
                      </span>
                    </td>
                    <td style={{ fontWeight: 800 }}>
                      {formatRs(o.pricing?.grandTotal)}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[o.status] || 'badge-gray'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/reception/orders/${o._id}`} className="btn-icon btn-sm" title="View Order">
                        <Eye size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
