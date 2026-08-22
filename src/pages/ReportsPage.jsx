import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, Printer, TrendingUp, ShoppingBag, DollarSign,
  Calendar, CheckCircle2, Clock, XCircle, CreditCard, Banknote,
  Utensils, Store, ArrowUpRight, ArrowDownRight, RefreshCw, Truck
} from 'lucide-react';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('allTime');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [dashRes, foodsRes, branchRes, ordersRes] = await Promise.all([
        api.get('/admin/analytics/dashboard', { params: { period } }),
        api.get('/admin/analytics/foods', { params: { period, limit: 10 } }),
        api.get('/admin/analytics/restaurants', { params: { period } }),
        api.get('/admin/orders', { params: { limit: 20 } })
      ]);

      setAnalytics(dashRes.data.data);
      setFoods(foodsRes.data.data?.topFoods || []);
      setBranches(branchRes.data.data || []);
      setRecentOrders(ordersRes.data.data || []);
    } catch (err) {
      showToast('Failed to load system reports data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = async (reportType) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('urbanbite_admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/analytics/export/${reportType}?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UrbanBite_Admin_${reportType}_Report_${period}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast(`Exported ${reportType} report successfully!`);
    } catch (err) {
      showToast('Failed to export CSV report', 'error');
    }
  };

  const kpis = analytics?.kpis || {};
  const breakdown = analytics?.orderTypeBreakdown || {};

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* ── Top Header & Report Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} color="var(--accent)" /> System & Sales Reports
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            100% Real-Time MongoDB transactional reports, revenue audit, and inventory performance.
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="today">Today's Report</option>
              <option value="yesterday">Yesterday's Report</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="allTime">All-Time Cumulative</option>
            </select>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={handlePrint} title="Print Financial Report">
            <Printer size={14} /> Print Report
          </button>

          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleExportCSV('revenue')} title="Export Full CSV">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : (
        <>
          {/* ── Executive Summary KPI Cards ── */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', margin: 0 }}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="stat-icon" style={{ background: 'var(--accent-soft)', margin: 0 }}>
                  <DollarSign size={22} color="var(--accent)" />
                </div>
                <span className="badge badge-green" style={{ fontSize: 11 }}>100% Live DB</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>Rs. {(kpis.totalRevenue || 0).toLocaleString()}</div>
              <div className="stat-label">Gross Revenue ({period})</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="stat-icon" style={{ background: 'var(--blue-soft)', margin: 0 }}>
                  <ShoppingBag size={22} color="var(--blue)" />
                </div>
                <span className="badge badge-blue">{kpis.completedOrders || 0} Delivered</span>
              </div>
              <div className="stat-value">{kpis.totalOrders || 0}</div>
              <div className="stat-label">Total System Orders</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="stat-icon" style={{ background: 'var(--purple-soft)', margin: 0 }}>
                  <TrendingUp size={22} color="var(--purple)" />
                </div>
                <span className="badge badge-gray">Per Order</span>
              </div>
              <div className="stat-value">Rs. {(kpis.averageOrderValue || 0).toLocaleString()}</div>
              <div className="stat-label">Average Order Value (AOV)</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="stat-icon" style={{ background: 'var(--green-soft)', margin: 0 }}>
                  <CheckCircle2 size={22} color="var(--green)" />
                </div>
                <span className="badge badge-green">{100 - (kpis.cancellationRate || 0)}% Success</span>
              </div>
              <div className="stat-value">{kpis.cancellationRate || 0}%</div>
              <div className="stat-label">Cancellation Rate</div>
            </div>
          </div>

          {/* ── Order Type & Revenue Breakdown ── */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Order Channels Distribution</div>
                  <div className="card-subtitle">Dine-In, Takeaway Pickup & Express Delivery</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={14} /> Express Delivery
                    </span>
                    <strong style={{ fontSize: 14 }}>{breakdown.deliveryOrders || 0} orders ({breakdown.deliveryPercentage || 0}%)</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Revenue Generated: <strong>Rs. {(breakdown.deliveryRevenue || 0).toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ShoppingBag size={14} /> Takeaway Pickup
                    </span>
                    <strong style={{ fontSize: 14 }}>{breakdown.pickupOrders || 0} orders ({breakdown.pickupPercentage || 0}%)</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Revenue Generated: <strong>Rs. {(breakdown.pickupRevenue || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Branch Sales Performance</div>
                  <div className="card-subtitle">Location-based revenue and volume</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {branches.slice(0, 4).map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{b.branchName}</div>
                      <div className="text-xs text-muted">{b.totalOrders} total orders processed</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>Rs. {(b.revenue || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted">AOV: Rs. {(b.averageOrderValue || 0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Top Selling Menu Items Table ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Top 10 Selling Menu Items</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Ranked by units sold in this period</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExportCSV('foods')}>
                <Download size={13} /> Export Menu Sales
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 60, paddingLeft: 20 }}>Rank</th>
                    <th>Item Name</th>
                    <th>Units Sold</th>
                    <th>Unit Price</th>
                    <th>Orders Count</th>
                    <th style={{ textAlign: 'right', paddingRight: 20 }}>Total Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ paddingLeft: 20, fontWeight: 800, color: 'var(--accent)' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: 12 }}>{item.quantitySold || item.quantity} sold</span>
                      </td>
                      <td className="text-sm">Rs. {(item.price || 0).toLocaleString()}</td>
                      <td className="text-sm text-muted">{item.ordersCount || '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: 20, fontWeight: 800, color: 'var(--accent)', fontSize: 14 }}>
                        Rs. {(item.revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {foods.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }} className="text-muted">
                        No sales recorded for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Recent Transaction Audit Log ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Recent System Audit Log</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Latest orders logged in MongoDB database</div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExportCSV('orders')}>
                <Download size={13} /> Export Orders Log
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Order #</th>
                    <th>Channel</th>
                    <th>Customer</th>
                    <th>Payment</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: 20 }}>Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 15).map((o) => (
                    <tr
                      key={o._id}
                      onClick={() => navigate('/orders')}
                      style={{ cursor: 'pointer' }}
                      title="Click to view order in Orders Page"
                    >
                      <td style={{ paddingLeft: 20, fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        {o.orderNumber}
                      </td>
                      <td className="text-sm">
                        <span className={`badge ${o.orderType === 'delivery' ? 'badge-blue' : o.orderType === 'dineIn' ? 'badge-orange' : 'badge-purple'}`}>
                          {o.orderType?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.customer?.name || 'Customer'}</div>
                        <div className="text-xs text-muted">{o.customer?.phone || '—'}</div>
                      </td>
                      <td className="text-sm" style={{ textTransform: 'capitalize' }}>
                        {o.paymentMethod || 'Cash'}
                      </td>
                      <td className="text-sm text-muted">
                        {new Date(o.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge ${o.status === 'Completed' || o.status === 'Delivered' ? 'badge-green' : o.status === 'Cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                        Rs. {(o.pricing?.grandTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                        No transactions logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Navigation Footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Showing <strong>{Math.min(recentOrders.length, 15)}</strong> latest audit logs
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700, color: 'var(--accent)', borderColor: 'var(--accent)' }}
                onClick={() => navigate('/orders')}
              >
                View Full Orders Directory & Filter History →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
