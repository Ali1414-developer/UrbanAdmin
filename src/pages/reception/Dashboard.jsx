import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, DollarSign, Clock, Users,
  Utensils, CheckCircle2, AlertCircle, Plus, Eye,
  Printer, ArrowRight, RefreshCw, Truck
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { showToast } from '../../components/Toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/reception/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(true);
      showToast('Failed to load reception dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Real-time Socket.IO listener for live reception alerts
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join:admin'); // join admin/staff room
    });

    socket.on('order:created', (newOrder) => {
      showToast(`New Order #${newOrder.orderNumber} received!`, 'info');
      fetchDashboard();
    });

    socket.on('order:status_changed', () => {
      fetchDashboard();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchDashboard]);

  if (loading && !data) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="empty-state">
        <AlertCircle size={42} color="var(--red)" />
        <h3>Failed to load Dashboard</h3>
        <p>Make sure the backend API is running and accessible.</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchDashboard}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const kpis = data.kpis || {};
  const tables = data.tablesSummary || {};
  const recentOrders = data.recentOrders || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            Front Desk Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time operations, customer inquiries, dine-in tables, and order dispatch.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDashboard} title="Refresh data">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/reception/new-order" className="btn btn-primary btn-sm">
            <Plus size={14} /> New POS Order
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Link
          to="/reception/orders?date=today"
          className="stat-card"
          style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
          title="Click to view Today's Orders"
        >
          <div className="stat-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className="stat-label">Today's Orders</div>
            <div className="stat-value">{kpis.totalOrders || 0}</div>
          </div>
        </Link>

        <Link
          to="/reception/reports"
          className="stat-card"
          style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
          title="Click to view Revenue & Sales Reports"
        >
          <div className="stat-icon" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-label">Today's Revenue</div>
            <div className="stat-value">Rs. {(kpis.todayRevenue || 0).toLocaleString()}</div>
          </div>
        </Link>

        <Link
          to="/reception/orders?type=dineIn"
          className="stat-card"
          style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
          title="Click to view Dine-In Orders"
        >
          <div className="stat-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
            <Utensils size={24} />
          </div>
          <div>
            <div className="stat-label">Dine-In Orders</div>
            <div className="stat-value">{kpis.dineInOrders || 0}</div>
          </div>
        </Link>

        <Link
          to="/reception/orders?type=pickup"
          className="stat-card"
          style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}
          title="Click to view Takeaway / Pickup Orders"
        >
          <div className="stat-icon" style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-label">Takeaway / Pickup</div>
            <div className="stat-value">{kpis.pickupOrders || 0}</div>
          </div>
        </Link>
      </div>

      {/* Operations Overview */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Live Operational Queues</div>
            <div className="card-subtitle">Orders requiring staff attention and kitchen dispatch</div>
          </div>
          <Link to="/reception/orders" className="btn btn-secondary btn-sm">
            View All Orders <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <Link
            to="/reception/orders?status=Preparing"
            style={{
              textDecoration: 'none',
              display: 'block',
              padding: 16,
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'border-color 0.18s ease, transform 0.18s ease'
            }}
            title="Click to view Kitchen / Preparing Orders"
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Pending / Kitchen
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--yellow)', marginTop: 4 }}>
              {kpis.pendingOrders || 0}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>In-prep & kitchen queues →</div>
          </Link>

          <Link
            to="/reception/orders?status=ReadyForPickup"
            style={{
              textDecoration: 'none',
              display: 'block',
              padding: 16,
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'border-color 0.18s ease, transform 0.18s ease'
            }}
            title="Click to view Ready for Pickup Orders"
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Ready for Pickup
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--purple)', marginTop: 4 }}>
              {kpis.readyForPickupCount || 0}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Awaiting customer pickup →</div>
          </Link>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Front Desk & Website Orders</div>
            <div className="card-subtitle">Showing latest today orders</div>
          </div>
          <Link to="/reception/orders" className="btn btn-secondary btn-sm">
            Full Orders Directory <ArrowRight size={13} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={36} />
            <h3>No orders placed yet today</h3>
            <p>New orders created via reception POS or customer website will appear here in real time.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Order Type</th>
                  <th>Items</th>
                  <th>Grand Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{o.orderNumber}</span>
                      {o.pickupCode && (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--purple)', fontWeight: 600 }}>
                          Code: {o.pickupCode}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customer?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customer?.phone}</div>
                    </td>
                    <td>
                      <span style={{
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        fontSize: 12
                      }}>
                        {o.orderType === 'dineIn' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Utensils size={12} /> Dine-In
                          </span>
                        ) : o.orderType === 'pickup' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <ShoppingBag size={12} /> Pickup
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Truck size={12} /> Delivery
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>
                        {o.items?.map(i => `${i.name} ×${i.quantity}`).join(', ').slice(0, 32)}...
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      Rs. {(o.pricing?.grandTotal || 0).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>{o.paymentMethod}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[o.status] || 'badge-gray'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/reception/orders/${o._id}`} className="btn-icon btn-sm" title="View Order">
                          <Eye size={14} />
                        </Link>
                      </div>
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
