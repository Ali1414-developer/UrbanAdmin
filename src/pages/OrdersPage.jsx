import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Eye, ShoppingBag, MapPin, Clock, Calendar, CheckCircle2, AlertCircle, Printer, Receipt, X } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const formatRs = (n) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;

const statusColors = {
  Placed: 'badge-blue',
  'Order Placed': 'badge-blue',
  Confirmed: 'badge-orange',
  Preparing: 'badge-yellow',
  OutForDelivery: 'badge-purple',
  'Out for Delivery': 'badge-purple',
  ReadyForPickup: 'badge-purple',
  'Ready for Pickup': 'badge-purple',
  Delivered: 'badge-green',
  Completed: 'badge-green',
  Cancelled: 'badge-red'
};

const statusWorkflows = {
  delivery: ['Confirmed', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'],
  pickup: ['Confirmed', 'Preparing', 'ReadyForPickup', 'Completed', 'Cancelled']
};

// ── Thermal Receipt Modal (80mm) ──────────────────────────────
function ReceiptModal({ order, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 460 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={18} color="var(--accent)" /> Order Receipt
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Print Receipt
            </button>
            <button type="button" className="btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className="modal-body" style={{ padding: '12px 24px 20px' }}>
          <div className="pos-receipt" ref={receiptRef}>
            {/* Receipt Header */}
            <div className="pos-receipt-header">
              <h2>UrbanBite</h2>
              <div style={{ fontSize: 11 }}>Official Order Receipt</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
                {order.restaurant?.name && <div>{order.restaurant.name}</div>}
                {order.restaurant?.address && <div>{order.restaurant.address}</div>}
              </div>
            </div>

            {/* Order Info */}
            <div className="pos-receipt-row">
              <span>Order #</span>
              <span style={{ fontWeight: 'bold' }}>{order.orderNumber}</span>
            </div>
            <div className="pos-receipt-row">
              <span>Date</span>
              <span>{new Date(order.createdAt).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}</span>
            </div>
            <div className="pos-receipt-row">
              <span>Type</span>
              <span style={{ textTransform: 'capitalize' }}>
                {order.orderType === 'dineIn' ? `Dine-In (Table ${order.tableNumber || '—'})` : order.orderType}
              </span>
            </div>
            {order.pickupCode && (
              <div className="pos-receipt-row">
                <span>Pickup Code</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{order.pickupCode}</span>
              </div>
            )}
            <div className="pos-receipt-row">
              <span>Customer</span>
              <span>{order.customer?.name || 'Customer'}</span>
            </div>
            <div className="pos-receipt-row">
              <span>Phone</span>
              <span>{order.customer?.phone || '—'}</span>
            </div>
            <div className="pos-receipt-row">
              <span>Payment</span>
              <span>{order.paymentMethod || 'Cash'} ({order.paymentStatus || 'Pending'})</span>
            </div>

            <hr className="pos-receipt-divider" />

            {/* Items Table */}
            <div style={{ marginBottom: 6, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>Item</span><span>Amount</span>
            </div>
            {order.items?.map((item, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <div className="pos-receipt-row">
                  <span style={{ flex: 1, paddingRight: 8 }}>{item.name} × {item.quantity}</span>
                  <span>{formatRs(item.price * item.quantity)}</span>
                </div>
                <div style={{ fontSize: 10, color: '#666', paddingLeft: 4 }}>
                  @ {formatRs(item.price)} each
                </div>
              </div>
            ))}

            <hr className="pos-receipt-divider" />

            {/* Pricing Summary */}
            <div className="pos-receipt-row">
              <span>Subtotal</span>
              <span>{formatRs(order.pricing?.subtotal)}</span>
            </div>
            {order.pricing?.discount > 0 && (
              <div className="pos-receipt-row" style={{ color: 'var(--green)' }}>
                <span>Discount ({order.pricing?.promoCode || 'PROMO'})</span>
                <span>- {formatRs(order.pricing.discount)}</span>
              </div>
            )}
            <div className="pos-receipt-row">
              <span>GST (5%)</span>
              <span>{formatRs(order.pricing?.tax)}</span>
            </div>
            {order.pricing?.deliveryFee > 0 && (
              <div className="pos-receipt-row">
                <span>Delivery Fee</span>
                <span>{formatRs(order.pricing.deliveryFee)}</span>
              </div>
            )}

            <hr className="pos-receipt-divider" />

            <div className="pos-receipt-total">
              <span>GRAND TOTAL</span>
              <span>{formatRs(order.pricing?.grandTotal)}</span>
            </div>

            {/* Footer */}
            <div className="pos-receipt-footer">
              <div>Thank you for choosing UrbanBite!</div>
              <div style={{ marginTop: 2 }}>www.urbanbite.pk • +92 300 0000000</div>
              <div style={{ marginTop: 4, fontSize: 9 }}>Source: {order.orderSource?.toUpperCase() || 'POS'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, onStatusUpdate, onPrintReceipt }) {
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);

  const isPickup = order.orderType?.toLowerCase() === 'pickup';
  const availableStatuses = statusWorkflows[isPickup ? 'pickup' : 'delivery'] || statusWorkflows.delivery;

  const handleStatusUpdate = async () => {
    if (newStatus === order.status) return;
    setUpdating(true);
    try {
      const { data } = await api.put(`/admin/orders/${order._id}/status`, { status: newStatus });
      onStatusUpdate(order._id, newStatus, data.data);
      showToast(`Order status updated to ${newStatus}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      {/* Header Meta Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20, background: 'var(--bg-hover)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
        <div>
          <div className="text-xs text-muted" style={{ fontWeight: 600 }}>Order Number</div>
          <div style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>{order.orderNumber}</div>
          {order.pickupCode && (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginTop: 2 }}>
              Pickup Code: {order.pickupCode}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-muted" style={{ fontWeight: 600 }}>Order Type</div>
          <span className={`badge ${isPickup ? 'badge-purple' : 'badge-blue'}`} style={{ marginTop: 2 }}>
            {isPickup ? 'Takeaway Pickup' : 'Home Delivery'}
          </span>
        </div>
        <div>
          <div className="text-xs text-muted" style={{ fontWeight: 600 }}>Current Status</div>
          <span className={`badge ${statusColors[order.status] || 'badge-gray'}`} style={{ marginTop: 2 }}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Customer & Branch Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', uppercase: true, marginBottom: 8, letterSpacing: 0.5 }}>
            Customer Details
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{order.customer?.name || 'Guest User'}</div>
          <div className="text-sm text-muted" style={{ marginTop: 2 }}>{order.customer?.phone || 'No phone'}</div>
          <div className="text-sm text-muted">{order.customer?.email || 'No email'}</div>

          {order.customer?.address && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Delivery Address:</div>
              {order.customer.address}, {order.customer.area && `${order.customer.area}, `}{order.customer.city || 'Lahore'}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', uppercase: true, marginBottom: 8, letterSpacing: 0.5 }}>
            Branch & Payment
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{order.restaurant?.name || 'UrbanBite DHA Branch'}</div>
          <div className="text-sm text-muted" style={{ marginTop: 2 }}>{order.restaurant?.address || 'Lahore, Pakistan'}</div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span className="text-muted">Payment: <strong>{order.paymentMethod || 'Cash'}</strong></span>
            <span className={`badge ${order.paymentStatus === 'Paid' ? 'badge-green' : 'badge-orange'}`}>
              {order.paymentStatus || 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Ordered Items List */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Ordered Items ({order.items?.length || 0})
        </div>
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-secondary)' }}>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{item.name}</span>
                <span className="text-muted text-xs" style={{ marginLeft: 8 }}>× {item.quantity}</span>
                {item.instructions && (
                  <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 2 }}>Note: {item.instructions}</div>
                )}
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                Rs. {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Pricing Summary */}
      <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 20, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span className="text-muted">Subtotal</span>
          <span>Rs. {order.pricing?.subtotal?.toLocaleString()}</span>
        </div>
        {order.pricing?.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
            <span>Discount {order.pricing?.promoCode && `(${order.pricing.promoCode})`}</span>
            <span>- Rs. {order.pricing?.discount?.toLocaleString()}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span className="text-muted">Tax (GST)</span>
          <span>Rs. {order.pricing?.tax?.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span className="text-muted">Delivery Fee</span>
          <span>{order.pricing?.deliveryFee > 0 ? `Rs. ${order.pricing?.deliveryFee}` : 'Free'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span>Grand Total</span>
          <span style={{ color: 'var(--accent)' }}>Rs. {order.pricing?.grandTotal?.toLocaleString()}</span>
        </div>
      </div>

      {/* Update Order Status & Print Controls */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Order Actions & Workflow Status
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => onPrintReceipt(order)} title="Print Receipt">
            <Printer size={14} /> Print Receipt
          </button>
          <select className="form-control form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ flex: 1, minWidth: 150 }}>
            {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating || newStatus === order.status}>
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const initialType = searchParams.get('type') || '';

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

      useEffect(() => {
        const s = searchParams.get('status');
        const t = searchParams.get('type');
        if (s !== null) setStatusFilter(s);
        if (t !== null) setTypeFilter(t);
      }, [searchParams]);

      const fetchOrders = async () => {
        setLoading(true);
        try {
          const { data } = await api.get('/admin/orders', {
            params: { search, status: statusFilter, page, limit: 30 }
          });
          let list = data.data || [];
          if (typeFilter) list = list.filter(o => o.orderType?.toLowerCase() === typeFilter.toLowerCase());
          setOrders(list);
          setTotal(data.total || list.length);
        } catch (err) {
          showToast('Failed to load orders', 'error');
        } finally { setLoading(false); }
      };

      useEffect(() => { fetchOrders(); }, [search, statusFilter, typeFilter, page]);

      // Real-time Socket.IO connection for Admin Panel
      useEffect(() => {
        const savedSettings = JSON.parse(localStorage.getItem('urbanbite_admin_settings') || '{}');
        const liveUpdatesEnabled = savedSettings?.order?.liveUpdates !== false;

        if (!liveUpdatesEnabled) return;

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
          socket.emit('join:admin');
        });

        socket.on('order:created', (newOrder) => {
          const currentStaff = JSON.parse(localStorage.getItem('staffUser') || '{}');
          if (currentStaff?.branchSlug && currentStaff.branchSlug !== 'all') {
            const orderBranch = newOrder.restaurant?.id || newOrder.restaurant?.slug || '';
            const orderCity = newOrder.customer?.city || newOrder.restaurant?.city || '';
            const matches = orderBranch === currentStaff.branchSlug || (currentStaff.city && orderCity.toLowerCase() === currentStaff.city.toLowerCase());
            if (!matches) return;
          }
          showToast(`New Order #${newOrder.orderNumber} received for ${newOrder.restaurant?.name || 'your branch'}!`);
          setOrders((prev) => [newOrder, ...prev]);
          setTotal((prev) => prev + 1);
        });

        socket.on('order:status_changed', (data) => {
          setOrders((prev) =>
            prev.map((o) =>
              o._id === data.orderId || o.orderNumber === data.orderNumber
                ? { ...o, status: data.status, statusTimeline: data.statusTimeline || o.statusTimeline }
                : o
            )
          );
        });

        return () => socket.disconnect();
      }, []);

      const handleStatusUpdate = (id, newStatus, updatedObj) => {
        setOrders(prev => prev.map(o => o._id === id ? (updatedObj || { ...o, status: newStatus }) : o));
        setSelected(prev => prev ? (updatedObj || { ...prev, status: newStatus }) : null);
      };

      const handleQuickStatusAdvance = async (orderId, newStatus) => {
        try {
          const { data } = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
          if (data.success) {
            showToast(`Order status updated to ${newStatus}`);
            handleStatusUpdate(orderId, newStatus, data.data);
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to update status', 'error');
        }
      };

      const pages = Math.ceil(total / 30);

      return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 className="header-title" style={{ margin: 0 }}>Orders Management</h2>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{total} total orders received across channels</div>
            </div>
          </div>

          <div className="card" style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
            <div className="card-toolbar">
              <div className="search-box">
                <Search size={15} />
                <input
                  className="search-input"
                  placeholder="Search by order #, customer name, phone..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <select className="form-control form-select" style={{ width: 170 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                <option value="Placed">Order Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="OutForDelivery">Out for Delivery</option>
                <option value="ReadyForPickup">Ready for Pickup</option>
                <option value="Delivered">Delivered / Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select className="form-control form-select" style={{ width: 150 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="delivery">Delivery</option>
                <option value="pickup">Pickup</option>
                <option value="dineIn">Dine-In</option>
              </select>
            </div>

            {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
                <div className="table-container">
                  <table style={{ width: '100%', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '12%', paddingLeft: 12, paddingRight: 4 }}>Order #</th>
                        <th style={{ width: '14%', paddingLeft: 4, paddingRight: 4 }}>Customer</th>
                        <th style={{ width: '12%', paddingLeft: 4, paddingRight: 4 }}>Branch</th>
                        <th style={{ width: '8%', paddingLeft: 4, paddingRight: 4 }}>Type</th>
                        <th style={{ width: '11%', paddingLeft: 4, paddingRight: 4 }}>Payment</th>
                        <th style={{ width: '10%', paddingLeft: 4, paddingRight: 4 }}>Grand Total</th>
                        <th style={{ width: '9%', paddingLeft: 4, paddingRight: 4 }}>Status</th>
                        <th style={{ width: '9%', paddingLeft: 4, paddingRight: 4 }}>Order Date</th>
                        <th style={{ width: '15%', textAlign: 'right', paddingRight: 12, paddingLeft: 4 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o._id}>
                          <td style={{ paddingLeft: 12, paddingRight: 4 }}>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 11.5, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.orderNumber}>
                              {o.orderNumber}
                            </div>
                          </td>
                          <td style={{ paddingLeft: 4, paddingRight: 4, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.customer?.name || 'Guest'}>
                              {o.customer?.name || 'Guest'}
                            </div>
                            <div className="text-xs text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {o.customer?.phone || '—'}
                            </div>
                          </td>
                          <td className="text-sm text-muted" style={{ paddingLeft: 4, paddingRight: 4, overflow: 'hidden' }}>
                            <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.restaurant?.name || 'Main Branch'}>
                              {o.restaurant?.name || 'Main Branch'}
                            </div>
                          </td>
                          <td style={{ paddingLeft: 4, paddingRight: 4 }}>
                            <span className={`badge ${o.orderType === 'pickup' ? 'badge-purple' : o.orderType === 'dineIn' ? 'badge-orange' : 'badge-blue'}`} style={{ fontSize: 10, padding: '3px 6px' }}>
                              {o.orderType?.toUpperCase() || 'DELIVERY'}
                            </span>
                          </td>
                          <td className="text-sm" style={{ paddingLeft: 4, paddingRight: 4, overflow: 'hidden' }}>
                            <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={o.paymentMethod || 'Cash'}>
                              {o.paymentMethod || 'Cash'}
                            </div>
                            <div style={{ fontSize: 10.5, color: o.paymentStatus === 'Paid' ? 'var(--green)' : 'var(--yellow)', fontWeight: 700 }}>
                              {o.paymentStatus || 'Pending'}
                            </div>
                          </td>
                          <td style={{ paddingLeft: 4, paddingRight: 4, fontWeight: 800, color: 'var(--text-primary)', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                            Rs. {o.pricing?.grandTotal?.toLocaleString()}
                          </td>
                          <td style={{ paddingLeft: 4, paddingRight: 4 }}>
                            <span className={`badge ${statusColors[o.status] || 'badge-gray'}`} style={{ fontSize: 10.5, padding: '3px 6px' }}>
                              {o.status}
                            </span>
                          </td>
                          <td className="text-sm text-muted" style={{ paddingLeft: 4, paddingRight: 4, fontSize: 11.5, whiteSpace: 'nowrap' }}>
                            {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', paddingRight: 12, paddingLeft: 4, textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                              {/* Next Stage Button */}
                              {(o.status === 'Pending' || o.status === 'Placed' || o.status === 'Order Placed') && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '4px 7px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
                                  onClick={() => handleQuickStatusAdvance(o._id, 'Confirmed')}
                                  title="Confirm Order"
                                >
                                  ✓ Confirm
                                </button>
                              )}
                              {o.status === 'Confirmed' && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 7px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
                                  onClick={() => handleQuickStatusAdvance(o._id, 'Preparing')}
                                  title="Set to Preparing"
                                >
                                  → Preparing
                                </button>
                              )}
                              {o.status === 'Preparing' && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 7px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}
                                  onClick={() => handleQuickStatusAdvance(o._id, o.orderType === 'pickup' ? 'ReadyForPickup' : (o.orderType === 'dineIn' ? 'Completed' : 'OutForDelivery'))}
                                  title={o.orderType === 'pickup' ? 'Ready for Pickup' : (o.orderType === 'dineIn' ? 'Complete Order' : 'Dispatch for Delivery')}
                                >
                                  → {o.orderType === 'pickup' ? 'Ready' : (o.orderType === 'dineIn' ? 'Complete' : 'Dispatch')}
                                </button>
                              )}
                              {(o.status === 'ReadyForPickup' || o.status === 'Ready for Pickup') && (
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  style={{ padding: '4px 7px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', gap: 3 }}
                                  onClick={() => handleQuickStatusAdvance(o._id, 'Completed')}
                                  title="Mark Pickup Complete"
                                >
                                  <CheckCircle2 size={11} /> Done
                                </button>
                              )}
                              {(o.status === 'OutForDelivery' || o.status === 'Out for Delivery') && (
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  style={{ padding: '4px 7px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', gap: 3 }}
                                  onClick={() => handleQuickStatusAdvance(o._id, 'Delivered')}
                                  title="Mark as Delivered"
                                >
                                  <CheckCircle2 size={11} /> Delivered
                                </button>
                              )}

                              {/* Eye and Print Action Buttons */}
                              <button
                                type="button"
                                className="btn btn-icon"
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 8,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                  background: 'var(--bg-card, #ffffff)',
                                  border: '1px solid var(--border, #e2e8f0)',
                                  color: 'var(--text-secondary, #64748b)',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  flexShrink: 0
                                }}
                                onClick={() => setSelected(o)}
                                title="View order details"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-icon"
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 8,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                  color: '#e53935',
                                  background: '#fee2e2',
                                  border: '1px solid rgba(229,57,53,0.3)',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(229,57,53,0.1)',
                                  flexShrink: 0
                                }}
                                onClick={() => setReceiptOrder(o)}
                                title="Print / Re-print Order Receipt Slip"
                              >
                                <Printer size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={9}>
                            <div className="empty-state">
                              <ShoppingBag size={36} />
                              <h3>No orders found</h3>
                              <p>Try adjusting your search keywords or status filter.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {pages > 1 && (
                <div className="pagination">
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                </div>
              )}
            </div>

          {/* Order Details Modal */}
          {selected && (
            <Modal title={`Order Details: ${selected.orderNumber}`} onClose={() => setSelected(null)}>
              <OrderDetail
                order={selected}
                onStatusUpdate={handleStatusUpdate}
                onPrintReceipt={(o) => {
                  setSelected(null);
                  setReceiptOrder(o);
                }}
              />
            </Modal>
          )}

          {/* Receipt Modal */}
          {receiptOrder && (
            <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
          )}
        </div>
      );
    }
