import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Eye, Clock, CheckCircle2,
  Printer, X, ArrowRight, RefreshCw, ShoppingBag, Utensils, Truck
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { showToast } from '../../components/Toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
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

export default function Orders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || 'all');
  const [page, setPage] = useState(1);

  // Sync state when search parameters in URL change
  useEffect(() => {
    const s = searchParams.get('status');
    const t = searchParams.get('type');
    const d = searchParams.get('date');
    if (s !== null) setStatusFilter(s);
    if (t !== null) setTypeFilter(t);
    if (d !== null) setDateFilter(d);
  }, [searchParams]);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search,
        status: statusFilter,
        orderType: typeFilter,
        date: dateFilter,
        page,
        limit: 25
      };
      const res = await api.get('/reception/orders', { params });
      setOrders(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      showToast('Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, dateFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join:admin');
    });

    socket.on('order:created', (newOrder) => {
      showToast(`New Order #${newOrder.orderNumber} received!`, 'info');
      fetchOrders();
    });

    socket.on('order:status_changed', () => {
      fetchOrders();
    });

    return () => socket.disconnect();
  }, [fetchOrders]);

  // Update Status handler
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.put(`/reception/orders/${orderId}/status`, { status: newStatus });
      showToast(`Order status updated to ${newStatus}.`);
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data.data);
      }
      fetchOrders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            Orders Management
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Manage dine-in, takeaway, and delivery orders dispatched from front desk.
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchOrders}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Unified Orders Card with Filters Header */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-toolbar">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, width: '100%' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 36 }}
                placeholder="Search #, customer, phone, code..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-control form-select"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Statuses</option>
              <option value="Placed">Placed</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Preparing">Preparing</option>
              <option value="ReadyForPickup">Ready for Pickup</option>
              <option value="OutForDelivery">Out for Delivery</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Type Filter */}
            <select
              className="form-control form-select"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Order Types</option>
              <option value="dineIn">Dine-In</option>
              <option value="pickup">Takeaway / Pickup</option>
              <option value="delivery">Delivery</option>
            </select>

            {/* Date Filter */}
            <select
              className="form-control form-select"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Time</option>
              <option value="today">Today Only</option>
            </select>
          </div>
        </div>

        <div className="table-container">
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={40} />
            <h3>No orders found</h3>
            <p>Try adjusting your search criteria or date filter.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Order Type</th>
                <th>Items Summary</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{o.orderNumber}</span>
                    {o.pickupCode && (
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--purple)', fontWeight: 700 }}>
                        {o.pickupCode}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.customer?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customer?.phone}</div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: 12 }}>
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
                      {o.items?.map(i => `${i.name} ×${i.quantity}`).join(', ').slice(0, 30)}...
                    </span>
                  </td>
                  <td style={{ fontWeight: 800 }}>
                    {formatRs(o.pricing?.grandTotal)}
                  </td>
                  <td>
                    <span style={{ fontSize: 12 }}>{o.paymentMethod}</span>
                    <span className={`badge ${o.paymentStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}`} style={{ display: 'block', width: 'fit-content', marginTop: 2 }}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusColors[o.status] || 'badge-gray'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 195 }}>
                      {/* Fixed-width slot for Operational Next Stage Buttons */}
                      <div style={{ width: 115, minWidth: 115, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0 }}>
                        {o.status === 'Confirmed' && (
                          <button className="btn btn-secondary btn-sm" style={{ width: '100%', whiteSpace: 'nowrap' }} onClick={() => handleStatusChange(o._id, 'Preparing')} title="Set to Preparing">
                            → Preparing
                          </button>
                        )}
                        {o.status === 'Preparing' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', whiteSpace: 'nowrap' }}
                            onClick={() => handleStatusChange(o._id, o.orderType === 'pickup' ? 'ReadyForPickup' : (o.orderType === 'dineIn' ? 'Completed' : 'OutForDelivery'))}
                          >
                            → {o.orderType === 'pickup' ? 'Ready' : (o.orderType === 'dineIn' ? 'Complete' : 'Dispatch')}
                          </button>
                        )}
                        {o.status === 'ReadyForPickup' && (
                          <button className="btn btn-success btn-sm" style={{ width: '100%', whiteSpace: 'nowrap', gap: 4 }} onClick={() => handleStatusChange(o._id, 'Completed')}>
                            <CheckCircle2 size={12} /> Pickup Done
                          </button>
                        )}
                        {o.status === 'OutForDelivery' && (
                          <button className="btn btn-success btn-sm" style={{ width: '100%', whiteSpace: 'nowrap', gap: 4 }} onClick={() => handleStatusChange(o._id, 'Delivered')}>
                            <CheckCircle2 size={12} /> Delivered
                          </button>
                        )}
                      </div>

                      {/* Fixed-position Eye and Print Action Buttons */}
                      <button
                        className="btn-icon"
                        style={{ width: 34, height: 34, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setSelectedOrder(o)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ width: 34, height: 34, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red, #e53935)' }}
                        onClick={() => setPrintOrder(o)}
                        title="Print Receipt"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Order #{selectedOrder.orderNumber}</h2>
              <button className="btn-icon btn-sm" onClick={() => setSelectedOrder(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {/* Top Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 12, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Type</div>
                  <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                    {selectedOrder.orderType === 'dineIn' ? `Dine-In (Table ${selectedOrder.tableNumber})` : selectedOrder.orderType}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Status</div>
                  <span className={`badge ${statusColors[selectedOrder.status]}`}>{selectedOrder.status}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Payment</div>
                  <div style={{ fontWeight: 700 }}>{selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</div>
                </div>
              </div>

              {/* Customer */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Customer Information</div>
                <div style={{ fontWeight: 700 }}>{selectedOrder.customer?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedOrder.customer?.phone}</div>
                {selectedOrder.customer?.address && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selectedOrder.customer.address}</div>
                )}
              </div>

              {/* Items List */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Ordered Items</div>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 700 }}>{formatRs(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Pricing Totals */}
              <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Subtotal</span><span>{formatRs(selectedOrder.pricing?.subtotal)}</span>
                </div>
                {selectedOrder.pricing?.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green)', marginBottom: 4 }}>
                    <span>Discount</span><span>- {formatRs(selectedOrder.pricing?.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>GST (5%)</span><span>{formatRs(selectedOrder.pricing?.tax)}</span>
                </div>
                {selectedOrder.pricing?.deliveryFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Delivery</span><span>{formatRs(selectedOrder.pricing?.deliveryFee)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                  <span>Grand Total</span><span style={{ color: 'var(--accent)' }}>{formatRs(selectedOrder.pricing?.grandTotal)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setPrintOrder(selectedOrder); }}>
                <Printer size={14} /> Print Receipt
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {printOrder && (
        <div className="modal-overlay" onClick={() => setPrintOrder(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Receipt #{printOrder.orderNumber}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                  <Printer size={14} /> Print Receipt
                </button>
                <button className="btn-icon btn-sm" onClick={() => setPrintOrder(null)}><X size={16} /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="pos-receipt">
                <div className="pos-receipt-header">
                  <h2>UrbanBite</h2>
                  <div style={{ fontSize: 11 }}>Front Desk Order Receipt</div>
                </div>
                <div className="pos-receipt-row"><span>Order #</span><span style={{ fontWeight: 'bold' }}>{printOrder.orderNumber}</span></div>
                <div className="pos-receipt-row"><span>Date</span><span>{new Date(printOrder.createdAt).toLocaleDateString()}</span></div>
                <div className="pos-receipt-row"><span>Type</span><span>{printOrder.orderType}</span></div>
                <div className="pos-receipt-row"><span>Customer</span><span>{printOrder.customer?.name}</span></div>
                <div className="pos-receipt-row"><span>Phone</span><span>{printOrder.customer?.phone}</span></div>
                <hr className="pos-receipt-divider" />
                {printOrder.items?.map((item, i) => (
                  <div key={i} className="pos-receipt-row">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatRs(item.price * item.quantity)}</span>
                  </div>
                ))}
                <hr className="pos-receipt-divider" />
                <div className="pos-receipt-row"><span>Subtotal</span><span>{formatRs(printOrder.pricing?.subtotal)}</span></div>
                <div className="pos-receipt-row"><span>GST</span><span>{formatRs(printOrder.pricing?.tax)}</span></div>
                <div className="pos-receipt-total"><span>TOTAL</span><span>{formatRs(printOrder.pricing?.grandTotal)}</span></div>
                <div className="pos-receipt-footer">
                  <div>Thank you for choosing UrbanBite!</div>
                  {printOrder.pickupCode && <div style={{ fontWeight: 'bold', marginTop: 4 }}>Pickup Code: {printOrder.pickupCode}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
