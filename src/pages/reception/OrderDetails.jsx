import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Printer, CheckCircle2, Clock, MapPin,
  Users, ShoppingBag, Phone, Mail, DollarSign, Tag
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

export default function OrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reception/orders/${orderId}`);
      setOrder(res.data.data);
    } catch (err) {
      showToast('Failed to load order details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const res = await api.put(`/reception/orders/${orderId}/status`, { status: newStatus });
      setOrder(res.data.data);
      showToast(`Order status updated to ${newStatus}.`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Status update failed.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /></div>;
  }

  if (!order) {
    return (
      <div className="empty-state">
        <ShoppingBag size={40} />
        <h3>Order not found</h3>
        <Link to="/reception/orders" className="btn btn-primary" style={{ marginTop: 12 }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => navigate('/reception/orders')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Order #{order.orderNumber}
            </h1>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Placed on {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={14} /> Print Receipt
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left: Items & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Ordered Food Items ({order.items?.length})</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Quantity: {item.quantity} × {formatRs(item.price)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>
                    {formatRs(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span><span>{formatRs(order.pricing?.subtotal)}</span>
              </div>
              {order.pricing?.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green)', fontWeight: 600 }}>
                  <span>Discount</span><span>- {formatRs(order.pricing?.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GST (5%)</span><span>{formatRs(order.pricing?.tax)}</span>
              </div>
              {order.pricing?.deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Fee</span><span>{formatRs(order.pricing?.deliveryFee)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                <span>Grand Total</span><span style={{ color: 'var(--accent)' }}>{formatRs(order.pricing?.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Meta, Customer, Status Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status & Workflow Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Order Status</div>
              <span className={`badge ${statusColors[order.status]}`}>{order.status}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {order.status === 'Confirmed' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange('Preparing')} disabled={updating}>
                  Mark as Preparing
                </button>
              )}
              {order.status === 'Preparing' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleStatusChange(order.orderType === 'pickup' ? 'ReadyForPickup' : (order.orderType === 'dineIn' ? 'Completed' : 'OutForDelivery'))}
                  disabled={updating}
                >
                  Mark as {order.orderType === 'pickup' ? 'Ready for Pickup' : (order.orderType === 'dineIn' ? 'Completed' : 'Out for Delivery')}
                </button>
              )}
              {order.status === 'ReadyForPickup' && (
                <button className="btn btn-success" onClick={() => handleStatusChange('Completed')} disabled={updating}>
                  Complete Pickup
                </button>
              )}
              {order.status === 'OutForDelivery' && (
                <button className="btn btn-success" onClick={() => handleStatusChange('Delivered')} disabled={updating}>
                  Mark as Delivered
                </button>
              )}
              {order.status !== 'Completed' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange('Cancelled')} disabled={updating}>
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Customer info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Customer & Branch</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div><strong>Name:</strong> {order.customer?.name}</div>
              <div><strong>Phone:</strong> {order.customer?.phone}</div>
              {order.customer?.address && <div><strong>Address:</strong> {order.customer.address}</div>}
              {order.tableNumber && <div><strong>Table:</strong> Table {order.tableNumber} (Guests: {order.guestCount})</div>}
              {order.pickupCode && <div><strong>Pickup Code:</strong> {order.pickupCode}</div>}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <strong>Branch:</strong> {order.restaurant?.name || 'Main Branch'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
