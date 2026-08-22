import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2,
  MonitorSmartphone, Receipt, RefreshCw, CheckCircle,
  Printer, Clock, TrendingUp, AlertCircle, Tag, Users,
  CreditCard, Banknote, Smartphone, ChevronDown, ClipboardList,
  Utensils, ShoppingBag, Truck, MapPin, CheckCircle2
} from 'lucide-react';
import api from '../../services/api';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatRs = (n) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;

const STATUS_BADGE = {
  Placed: 'badge-gray',
  Confirmed: 'badge-blue',
  Preparing: 'badge-yellow',
  ReadyForPickup: 'badge-orange',
  Completed: 'badge-green',
  Cancelled: 'badge-red'
};

const ORDER_TYPES = [
  { value: 'dineIn', label: 'Dine-In' },
  { value: 'pickup', label: 'Pickup' }
];

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash', icon: Banknote },
  { value: 'Credit / Debit Card', label: 'Card', icon: CreditCard },
  { value: 'JazzCash / Easypaisa', label: 'JazzCash', icon: Smartphone }
];

// ─── Receipt Component ──────────────────────────────────────────────────────
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
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} /> Print Receipt
            </button>
            <button className="btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className="modal-body" style={{ padding: '12px 24px 20px' }}>
          <div className="pos-receipt" ref={receiptRef}>
            {/* Receipt Header */}
            <div className="pos-receipt-header">
              <h2>UrbanBite</h2>
              <div style={{ fontSize: 11 }}>Point of Sale Receipt</div>
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
              <span>{order.orderType === 'dineIn' ? 'Dine-In' : 'Pickup'}</span>
            </div>
            {order.tableNumber && (
              <div className="pos-receipt-row">
                <span>Table</span>
                <span>{order.tableNumber}</span>
              </div>
            )}
            {order.guestCount > 1 && (
              <div className="pos-receipt-row">
                <span>Guests</span>
                <span>{order.guestCount}</span>
              </div>
            )}
            <div className="pos-receipt-row">
              <span>Customer</span>
              <span>{order.customer?.name}</span>
            </div>
            <div className="pos-receipt-row">
              <span>Payment</span>
              <span>{order.paymentMethod}</span>
            </div>

            <hr className="pos-receipt-divider" />

            {/* Items */}
            <div style={{ marginBottom: 6, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>Item</span><span>Amount</span>
            </div>
            {order.items?.map((item, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <div className="pos-receipt-row">
                  <span style={{ flex: 1, paddingRight: 8 }}>{item.name} × {item.quantity}</span>
                  <span>{formatRs(item.price * item.quantity)}</span>
                </div>
                <div style={{ fontSize: 10, color: '#888', paddingLeft: 4 }}>
                  @ {formatRs(item.price)} each
                </div>
              </div>
            ))}

            <hr className="pos-receipt-divider" />

            {/* Totals */}
            <div className="pos-receipt-row">
              <span>Subtotal</span>
              <span>{formatRs(order.pricing?.subtotal)}</span>
            </div>
            {order.pricing?.discount > 0 && (
              <div className="pos-receipt-row">
                <span>Discount {order.pricing?.promoCode ? `(${order.pricing.promoCode})` : ''}</span>
                <span>- {formatRs(order.pricing.discount)}</span>
              </div>
            )}
            <div className="pos-receipt-row">
              <span>GST (5%)</span>
              <span>{formatRs(order.pricing?.tax)}</span>
            </div>
            {order.pricing?.deliveryFee > 0 && (
              <div className="pos-receipt-row">
                <span>Delivery</span>
                <span>{formatRs(order.pricing?.deliveryFee)}</span>
              </div>
            )}

            <div className="pos-receipt-total">
              <span>TOTAL</span>
              <span>{formatRs(order.pricing?.grandTotal)}</span>
            </div>

            <div className="pos-receipt-footer">
              <div>Thank you for dining with UrbanBite!</div>
              <div style={{ marginTop: 4 }}>We hope to serve you again soon</div>
              {order.pickupCode && (
                <div style={{ marginTop: 8, fontWeight: 'bold', fontSize: 13 }}>
                  Pickup Code: {order.pickupCode}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Modal ─────────────────────────────────────────────────────────
function CheckoutModal({ cart, pricing, orderType = 'dineIn', onClose, onSuccess, restaurants, posSettings }) {
  const [currentOrderType, setCurrentOrderType] = useState(posSettings?.defaultOrderType || orderType);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState(posSettings?.defaultPaymentMethod || 'Cash');
  const [tableNumber, setTableNumber] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const requirePhone = posSettings?.requireCustomerPhone !== false;
    const customerName = customer.name.trim() || 'Walk-In Customer';
    const customerPhone = customer.phone.trim() || (requirePhone ? '' : '0300-0000000');

    if (!customerName || (requirePhone && !customerPhone)) {
      setError('Customer name and phone number are required.');
      return;
    }

    let customerEmail = customer.email ? customer.email.trim().toLowerCase() : '';
    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else {
      const sanitizedPhone = customerPhone.replace(/[^0-9]/g, '') || Date.now();
      customerEmail = `pos.${sanitizedPhone}@urbanbite.pk`;
    }

    try {
      setLoading(true);
      const idempotencyKey = `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const selectedRestaurant = restaurants.find(r => r._id === restaurantId);

      const res = await api.post('/pos/orders', {
        items: cart.map(c => ({
          foodId: c._id,
          name: c.name,
          image: c.image || '',
          price: c.price,
          quantity: c.quantity
        })),
        orderType: currentOrderType,
        restaurant: selectedRestaurant ? {
          id: selectedRestaurant._id,
          name: selectedRestaurant.name,
          city: selectedRestaurant.city,
          address: selectedRestaurant.address,
          phone: selectedRestaurant.phone
        } : {},
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          city: 'Lahore',
          area: '',
          address: currentOrderType === 'dineIn' ? 'Dine-In' : (customer.address || (currentOrderType === 'pickup' ? 'Takeaway' : 'Lahore'))
        },
        paymentMethod,
        tableNumber: '',
        guestCount: 1,
        idempotencyKey
      }, {
        headers: { 'X-Idempotency-Key': idempotencyKey }
      });

      if (posSettings?.autoPrint) {
        setTimeout(() => {
          try { window.print(); } catch (e) {}
        }, 400);
      }

      onSuccess(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal"
          style={{ maxWidth: 540, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="var(--accent)" /> Order Details & Checkout
            </h2>
            <button className="btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            data-lpignore="true"
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
          >
            <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
              {error && (
                <div style={{
                  background: 'var(--red-soft)', border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  color: 'var(--red)', fontSize: 13, fontWeight: 500, marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {/* Order Type Selection inside Modal */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Order Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    style={{
                      padding: '9px 6px',
                      border: `2px solid ${currentOrderType === 'dineIn' ? 'var(--accent)' : 'var(--border)'}`,
                      background: currentOrderType === 'dineIn' ? 'var(--accent-soft)' : 'var(--bg-input)',
                      color: currentOrderType === 'dineIn' ? 'var(--accent)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    onClick={() => setCurrentOrderType('dineIn')}
                  >
                    <Utensils size={14} /> Dine-In
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '9px 6px',
                      border: `2px solid ${currentOrderType === 'pickup' ? 'var(--accent)' : 'var(--border)'}`,
                      background: currentOrderType === 'pickup' ? 'var(--accent-soft)' : 'var(--bg-input)',
                      color: currentOrderType === 'pickup' ? 'var(--accent)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    onClick={() => {
                      setCurrentOrderType('pickup');
                      if (paymentMethod === 'Cash') setPaymentMethod('JazzCash / Easypaisa');
                    }}
                  >
                    <ShoppingBag size={14} /> Pickup
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '9px 6px',
                      border: `2px solid ${currentOrderType === 'delivery' ? 'var(--accent)' : 'var(--border)'}`,
                      background: currentOrderType === 'delivery' ? 'var(--accent-soft)' : 'var(--bg-input)',
                      color: currentOrderType === 'delivery' ? 'var(--accent)' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    onClick={() => setCurrentOrderType('delivery')}
                  >
                    <Truck size={14} /> Delivery
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div style={{
                background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                padding: '10px 14px', marginBottom: 14, border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Order Summary</div>
                {cart.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{formatRs(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed var(--border)', marginTop: 6, paddingTop: 6 }}>
                  {pricing?.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--green)' }}>
                      <span>Discount</span><span>- {formatRs(pricing.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span>GST (5%)</span><span>{formatRs(pricing?.tax)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14.5, fontWeight: 800, marginTop: 4 }}>
                    <span>Total</span><span style={{ color: 'var(--accent)' }}>{formatRs(pricing?.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Restaurant Branch */}
              {restaurants.length > 0 && (
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Restaurant Branch</label>
                  <select
                    className="form-control form-select"
                    value={restaurantId}
                    onChange={e => setRestaurantId(e.target.value)}
                  >
                    <option value="">— Select Restaurant Branch —</option>
                    {restaurants.map(r => (
                      <option key={r._id} value={r._id}>{r.name} – {r.city}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Customer Info */}
              <div style={{ fontSize: 11.5, fontWeight: 750, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Customer Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Customer name"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="03xx-xxxxxxx"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Email Address (Optional)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="customer@email.com"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  value={customer.email}
                  onChange={e => setCustomer({ ...customer, email: e.target.value })}
                />
              </div>

              {/* Address (delivery) */}
              {currentOrderType === 'delivery' && (
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Delivery Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="House #, Street, Area..."
                    autoComplete="new-password"
                    data-lpignore="true"
                    value={customer.address}
                    onChange={e => setCustomer({ ...customer, address: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Payment Method */}
              <div className="form-group" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Payment Method</label>
                  {currentOrderType === 'pickup' && (
                    <span style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700 }}>
                      ⚡ Pickup: Online / Digital Pay Only
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: currentOrderType === 'pickup' ? '1fr 1fr' : '1fr 1fr 1fr',
                  gap: 8
                }}>
                  {PAYMENT_METHODS
                    .filter(pm => currentOrderType !== 'pickup' || pm.value !== 'Cash')
                    .map(pm => (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setPaymentMethod(pm.value)}
                        style={{
                          padding: '9px 6px',
                          border: `2px solid ${paymentMethod === pm.value ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          background: paymentMethod === pm.value ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                          color: paymentMethod === pm.value ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <pm.icon size={16} />
                        {pm.label}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 190 }}>
                {loading ? <><RefreshCw size={14} className="spin" /> Processing...</> : <><CheckCircle size={14} /> Confirm Order — {formatRs(pricing?.grandTotal)}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Main POS Page ──────────────────────────────────────────────────────────
export default function POSPage() {
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'orders'

  // Menu state
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Cart state
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dineIn');
  const [promoCode, setPromoCode] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [pricing, setPricing] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [posSettings, setPosSettings] = useState(null);

  // Load public POS settings
  useEffect(() => {
    api.get('/settings').then(res => {
      if (res?.data?.data?.pos) {
        setPosSettings(res.data.data.pos);
        if (res.data.data.pos.defaultOrderType) {
          setOrderType(res.data.data.pos.defaultOrderType);
        }
      }
    }).catch(() => {});
  }, []);

  // Modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Today's orders
  const [todayOrders, setTodayOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  // ── Load menu ──────────────────────────────────────────
  const loadMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.categoryId = selectedCategory;
      if (search) params.search = search;
      const res = await api.get('/pos/menu', { params });
      setFoods(res.data.data.foods || []);
      setCategories(res.data.data.categories || []);
      setRestaurants(res.data.data.restaurants || []);
    } catch (err) {
      console.error('Failed to load POS menu:', err);
    } finally {
      setMenuLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // ── Load today's orders + summary ─────────────────────
  const loadTodayOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const [ordersRes, summaryRes] = await Promise.all([
        api.get('/pos/orders', { params: { date: 'today', limit: 100 } }),
        api.get('/pos/summary')
      ]);
      setTodayOrders(ordersRes.data.data || []);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Failed to load POS orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => { loadTodayOrders(); }, [loadTodayOrders]);

  // ── Calculate pricing whenever cart/promo/orderType changes ───────────────
  useEffect(() => {
    if (cart.length === 0) { setPricing(null); return; }
    const timer = setTimeout(async () => {
      try {
        setCalcLoading(true);
        const res = await api.post('/pos/calculate', {
          items: cart.map(c => ({ foodId: c._id, name: c.name, price: c.price, quantity: c.quantity })),
          promoCode,
          orderType
        });
        setPricing(res.data.data);
        setPromoError('');
      } catch (err) {
        setPricing(null);
        if (err.response?.data?.message?.toLowerCase().includes('promo') ||
          err.response?.data?.message?.toLowerCase().includes('expired')) {
          setPromoError(err.response.data.message);
        }
      } finally {
        setCalcLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [cart, promoCode, orderType]);

  // ── Cart helpers ──────────────────────────────────────
  const addToCart = (food) => {
    setCart(prev => {
      const existing = prev.find(c => c._id === food._id);
      if (existing) {
        return prev.map(c => c._id === food._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const updateQty = (foodId, delta) => {
    setCart(prev => {
      const updated = prev.map(c =>
        c._id === foodId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
      );
      return updated.filter(c => c.quantity > 0);
    });
  };

  const removeFromCart = (foodId) => {
    setCart(prev => prev.filter(c => c._id !== foodId));
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode('');
    setPromoInput('');
    setPricing(null);
    setPromoError('');
  };

  const applyPromo = () => {
    if (!promoInput.trim()) return;
    setPromoCode(promoInput.toUpperCase().trim());
  };

  const removePromo = () => {
    setPromoCode('');
    setPromoInput('');
    setPromoError('');
  };

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  // ── Order success ──────────────────────────────────────
  const handleOrderSuccess = (order) => {
    setLastOrder(order);
    setShowCheckout(false);
    setShowReceipt(true);
    clearCart();
    loadTodayOrders();
  };

  // ── Status update for today's orders ──────────────────
  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      loadTodayOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // ── Filtered foods ─────────────────────────────────────
  const filteredFoods = search
    ? foods.filter(f =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase())
    )
    : foods;

  // ════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div style={{ margin: '-24px', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── POS Header Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 52, background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), #C62828)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MonitorSmartphone size={16} color="white" />
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>POS Terminal</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Integrated Search Input in Top Section */}
        {activeTab === 'terminal' && (
          <div style={{ flex: '1', maxWidth: 360, position: 'relative', margin: '0 10px' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Search food items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 30px 6px 32px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--bg-card, #ffffff)'
              }}
            />
            {search && (
              <button
                type="button"
                className="btn-icon btn-sm"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        <div className="pos-header-tabs" style={{ flexShrink: 0 }}>
          <button
            className={`pos-header-tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShoppingCart size={13} /> Terminal
            </span>
          </button>
          <button
            className={`pos-header-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); loadTodayOrders(); }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ClipboardList size={13} /> Today's Orders {todayOrders.length > 0 && `(${todayOrders.length})`}
            </span>
          </button>
          <button className="btn-icon btn-sm" onClick={loadMenu} title="Refresh Menu">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── TAB: Terminal ── */}
      {activeTab === 'terminal' && (
        <div className="pos-layout" style={{ flex: 1, overflow: 'hidden' }}>

          {/* LEFT: Menu Grid */}
          <div className="pos-left">
            {/* Category Filter */}
            <div className="pos-category-bar">
              <button
                className={`pos-cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                All Items
              </button>
              {categories.map(cat => {
                const catVal = cat.slug || cat._id;
                return (
                  <button
                    key={cat._id}
                    className={`pos-cat-btn ${selectedCategory === catVal ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(catVal)}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Food Grid */}
            {menuLoading ? (
              <div className="loading-overlay">
                <div className="spinner" />
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="empty-state" style={{ flex: 1 }}>
                <Search size={40} />
                <h3>No items found</h3>
                <p>Try a different search or category</p>
              </div>
            ) : (
              <div className="pos-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, padding: 12 }}>
                {filteredFoods.map(food => {
                  const inCart = cart.find(c => c._id === food._id);
                  return (
                    <div
                      key={food._id}
                      className="pos-food-card"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 215,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Top Image & Badges Container */}
                      <div style={{ position: 'relative', width: '100%', height: 90, minHeight: 90, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                        {food.image ? (
                          <img
                            src={food.image}
                            alt={food.name}
                            className="pos-food-img"
                            style={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }}
                            onError={e => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="pos-food-img-placeholder"
                          style={{
                            display: food.image ? 'none' : 'flex',
                            width: '100%',
                            height: 95,
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #FFF5F5, #FFEBEB)'
                          }}
                        >
                          <Utensils size={26} color="var(--accent)" />
                        </div>

                        {/* Discount % Off Badge */}
                        {food.discount > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              background: '#16a34a',
                              color: '#FFFFFF',
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: 4,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                              zIndex: 2
                            }}
                          >
                            {food.discount}% OFF
                          </span>
                        )}

                        {/* Rating Badge */}
                        {food.rating && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              background: 'rgba(0,0,0,0.65)',
                              color: '#FFFFFF',
                              fontSize: 9,
                              fontWeight: 700,
                              padding: '1px 4px',
                              borderRadius: 4,
                              backdropFilter: 'blur(2px)',
                              zIndex: 2
                            }}
                          >
                            ⭐ {food.rating}
                          </span>
                        )}

                        {/* In-Cart Quantity Badge */}
                        {inCart && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              background: 'var(--accent)',
                              color: '#FFFFFF',
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 10,
                              boxShadow: '0 2px 5px rgba(229,57,53,0.4)',
                              zIndex: 2
                            }}
                          >
                            ×{inCart.quantity}
                          </div>
                        )}
                      </div>

                      {/* Card Content & Action */}
                      <div className="pos-food-info" style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, background: '#FFFFFF' }}>
                        <div
                          className="pos-food-name"
                          style={{
                            fontWeight: 700,
                            fontSize: 12,
                            color: 'var(--text-primary)',
                            lineHeight: 1.25,
                            minHeight: 28,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          title={food.name}
                        >
                          {food.name}
                        </div>

                        {/* Price Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 2 }}>
                          <span className="pos-food-price" style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {formatRs(food.price)}
                          </span>
                          {food.originalPrice && food.originalPrice > food.price && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              {formatRs(food.originalPrice)}
                            </span>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{
                            width: '100%',
                            marginTop: 6,
                            justifyContent: 'center',
                            padding: '6px 8px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            borderRadius: 6,
                            gap: 4,
                            flexShrink: 0
                          }}
                          onClick={() => addToCart(food)}
                        >
                          <Plus size={12} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Cart Panel */}
          <div className="pos-cart">
            {/* Cart Header */}
            <div className="pos-cart-header">
              <div className="pos-cart-title">
                <ShoppingCart size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Current Order
              </div>
              {totalItems > 0 && (
                <span className="pos-cart-count">{totalItems} items</span>
              )}
            </div>

            {/* Cart Items */}
            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <ShoppingCart size={40} />
                  <p>Cart is empty.<br />Click items from the menu to add them.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item._id} className="pos-cart-item">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="pos-cart-item-img"
                        onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div className="pos-cart-item-img" style={{ background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Utensils size={16} color="var(--accent)" />
                      </div>
                    )}
                    <div className="pos-cart-item-info">
                      <div className="pos-cart-item-name">{item.name}</div>
                      <div className="pos-cart-item-price">{formatRs(item.price * item.quantity)}</div>
                    </div>
                    <div className="pos-qty-controls">
                      <button
                        className="pos-qty-btn"
                        onClick={() => updateQty(item._id, -1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="pos-qty-num">{item.quantity}</span>
                      <button
                        className="pos-qty-btn"
                        onClick={() => updateQty(item._id, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        className="pos-qty-btn remove"
                        onClick={() => removeFromCart(item._id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Checkout */}
            {cart.length > 0 && (
              <div className="pos-totals">
                {/* Promo Code */}
                {!promoCode ? (
                  <div className="pos-promo-row">
                    <input
                      type="text"
                      className="pos-promo-input"
                      placeholder="PROMO CODE"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyPromo()}
                    />
                    <button className="pos-promo-btn" onClick={applyPromo}>Apply</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      background: 'var(--green-soft)', color: 'var(--green)',
                      border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius-sm)',
                      padding: '5px 10px', fontSize: 12, fontWeight: 700, flex: 1
                    }}>
                      <Tag size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {promoCode} applied!
                    </span>
                    <button className="btn-icon btn-sm" onClick={removePromo} style={{ width: 28, height: 28 }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                {promoError && (
                  <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} /> {promoError}
                  </div>
                )}

                {/* Price breakdown */}
                {pricing ? (
                  <>
                    <div className="pos-total-row">
                      <span>Subtotal</span>
                      <span>{formatRs(pricing.subtotal)}</span>
                    </div>
                    {pricing.discount > 0 && (
                      <div className="pos-total-row discount">
                        <span>Discount</span>
                        <span>- {formatRs(pricing.discount)}</span>
                      </div>
                    )}
                    <div className="pos-total-row">
                      <span>GST (5%)</span>
                      <span>{formatRs(pricing.tax)}</span>
                    </div>
                    {pricing.deliveryFee > 0 && (
                      <div className="pos-total-row">
                        <span>Delivery</span>
                        <span>{formatRs(pricing.deliveryFee)}</span>
                      </div>
                    )}
                    <div className="pos-total-row grand">
                      <span>TOTAL</span>
                      <span style={{ color: 'var(--accent)' }}>{formatRs(pricing.grandTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="pos-total-row" style={{ justifyContent: 'center' }}>
                    {calcLoading ? <><RefreshCw size={14} className="spin" style={{ marginRight: 6 }} /> Calculating...</> : '—'}
                  </div>
                )}

                <button
                  className="pos-checkout-btn"
                  disabled={!pricing || calcLoading}
                  onClick={() => setShowCheckout(true)}
                >
                  <Receipt size={16} />
                  Checkout — {pricing ? formatRs(pricing.grandTotal) : '...'}
                </button>
                <button className="pos-clear-btn" onClick={clearCart}>
                  <Trash2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Clear Cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Today's Orders ── */}
      {activeTab === 'orders' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {ordersLoading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : todayOrders.length === 0 ? (
            <div className="empty-state">
              <ClipboardList size={40} />
              <h3>No POS orders today</h3>
              <p>Orders placed from the POS terminal will appear here.</p>
            </div>
          ) : (
            <div className="pos-orders-list">
              {todayOrders.map(order => (
                <div key={order._id} className="pos-order-card">
                  <div className="pos-order-card-top">
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>#{order.orderNumber}</span>
                      {order.tableNumber && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                          Table {order.tableNumber}
                        </span>
                      )}
                      <span style={{
                        marginLeft: 8, fontSize: 11, background: 'var(--blue-soft)', color: 'var(--blue)',
                        borderRadius: 10, padding: '1px 7px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>
                        {order.orderType === 'dineIn' ? (
                          <><Utensils size={10} /> Dine-In</>
                        ) : (
                          <><ShoppingBag size={10} /> Pickup</>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${STATUS_BADGE[order.status] || 'badge-gray'}`}>
                        {order.status}
                      </span>
                      <button
                        className="btn-icon btn-sm"
                        title="Print Receipt"
                        onClick={() => { setLastOrder(order); setShowReceipt(true); }}
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} />
                      {order.customer?.name}
                      {order.guestCount > 1 && ` · ${order.guestCount} guests`}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--accent)' }}>
                      {formatRs(order.pricing?.grandTotal)}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                    {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                  </div>

                  {/* Status action buttons */}
                  {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {order.status === 'Confirmed' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => updateOrderStatus(order._id, 'Preparing')}
                        >
                          → Preparing
                        </button>
                      )}
                      {order.status === 'Preparing' && (
                        <>
                          {order.orderType === 'pickup' ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => updateOrderStatus(order._id, 'ReadyForPickup')}
                            >
                              → Ready for Pickup
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => updateOrderStatus(order._id, 'Completed')}
                            >
                              <CheckCircle size={13} /> Complete
                            </button>
                          )}
                        </>
                      )}
                      {order.status === 'ReadyForPickup' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateOrderStatus(order._id, 'Completed')}
                        >
                          <CheckCircle size={13} /> Complete
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />
                    {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    {' · '}{order.paymentMethod}
                    {order.paymentStatus === 'Paid' ? ' · Paid' : ' · Cash Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          pricing={pricing}
          orderType={orderType}
          restaurants={restaurants}
          posSettings={posSettings}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {showReceipt && lastOrder && (
        <ReceiptModal
          order={lastOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}
