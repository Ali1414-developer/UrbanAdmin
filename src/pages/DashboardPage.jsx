import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Users, TrendingUp, Clock, DollarSign, Plus, Eye,
  ArrowUpRight, ArrowDownRight, Utensils, Tag, Store, TicketPercent, CheckCircle2, Download, Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../services/api';
import { showToast } from '../components/Toast';

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

const RevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload || {};
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} color="var(--text-muted)" /> {label}
        </p>
        <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 14, margin: '2px 0' }}>
          Rs. {(data.revenue || payload[0].value || 0).toLocaleString()}
        </p>
        <p style={{ color: 'var(--blue)', fontWeight: 600, fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ShoppingBag size={12} color="var(--blue)" /> {data.orders || 0} orders
        </p>
      </div>
    );
  }
  return null;
};

const OrdersTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload || {};
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} color="var(--text-muted)" /> {label}
        </p>
        <p style={{ color: 'var(--blue)', fontWeight: 800, fontSize: 14, margin: '2px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ShoppingBag size={13} color="var(--blue)" /> {payload[0].value || 0} Orders
        </p>
        <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12, margin: 0 }}>
          Rs. {(data.revenue || 0).toLocaleString()} Sales
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [period, setPeriod] = useState('last30days');
  const [analytics, setAnalytics] = useState(null);
  const [topFoods, setTopFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(false);
    try {
      const [dashRes, foodsRes, branchRes] = await Promise.all([
        api.get('/admin/analytics/dashboard', { params: { period } }),
        api.get('/admin/analytics/foods', { params: { period, limit: 5 } }),
        api.get('/admin/analytics/restaurants', { params: { period } })
      ]);
      setAnalytics(dashRes.data.data);
      setTopFoods(foodsRes.data.data?.topFoods || []);
      setBranches(branchRes.data.data || []);
    } catch (err) {
      console.warn('Analytics fetch error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

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
      a.download = `UrbanBite_${reportType}_${period}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast(`Exported ${reportType} CSV successfully!`);
    } catch (err) {
      showToast('Failed to export CSV report', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="empty-state">
        <TrendingUp size={40} />
        <h3>Unable to load analytics data</h3>
        <p>Make sure the backend API server is running and accessible.</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={fetchAnalytics}>
          Retry Loading
        </button>
      </div>
    );
  }

  const kpis = analytics.kpis || {};
  const kpiCards = [
    {
      label: 'Total Revenue',
      value: `Rs. ${kpis.totalRevenue?.toLocaleString() || 0}`,
      change: kpis.revenueChange,
      icon: DollarSign,
      color: 'var(--accent)',
      bg: 'var(--accent-soft)',
      link: '/reports'
    },
    {
      label: 'Total Orders',
      value: kpis.totalOrders || 0,
      change: kpis.orderChange,
      icon: ShoppingBag,
      color: 'var(--blue)',
      bg: 'var(--blue-soft)',
      link: '/orders'
    },
    {
      label: 'Avg Order Value',
      value: `Rs. ${kpis.averageOrderValue?.toLocaleString() || 0}`,
      change: kpis.aovChange,
      icon: TrendingUp,
      color: 'var(--purple)',
      bg: 'var(--purple-soft)',
      link: '/reports'
    },
    {
      label: 'New Customers',
      value: kpis.newCustomers || 0,
      change: kpis.customerChange,
      icon: Users,
      color: 'var(--green)',
      bg: 'var(--green-soft)',
      link: '/customers'
    }
  ];

  return (
    <div className="fade-in space-y-6">
      {/* Top Banner, Date Filter & Export Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Advanced Business Analytics</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            MongoDB aggregation analytics across sales, branches, top foods, and customer retention.
          </p>
        </div>

        {/* Date Filter & Export Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>

          {/* CSV Export Dropdown */}
          <div className="dropdown" style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExportCSV('orders')} title="Export Orders CSV">
              <Download size={14} /> Orders CSV
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExportCSV('revenue')} title="Export Revenue CSV">
              <Download size={14} /> Revenue CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
        {kpiCards.map((kpi) => (
          <div
            className="stat-card"
            key={kpi.label}
            onClick={() => navigate(kpi.link)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              padding: 20,
              minHeight: 140,
              borderRadius: 'var(--radius)'
            }}
            title={`Click to navigate to ${kpi.label} details`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: kpi.bg,
                  flexShrink: 0
                }}
              >
                <kpi.icon size={22} color={kpi.color} />
              </div>
              <span className={`stat-change ${kpi.change >= 0 ? 'up' : 'down'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                {kpi.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.change >= 0 ? `+${kpi.change}%` : `${kpi.change}%`}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 4 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <span>{kpi.label} (vs prev period)</span>
                <span style={{ fontSize: 11, color: kpi.color, fontWeight: 700 }}>View →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery vs Pickup & Order Pipeline Summary */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Delivery vs Pickup Split */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Order Type Breakdown</div>
              <div className="card-subtitle">Express Delivery vs Takeaway Pickup</div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => navigate('/orders')}
            >
              All Orders →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 12 }}>
            <div
              onClick={() => navigate('/orders?type=delivery')}
              style={{
                background: 'var(--bg-hover)',
                padding: 16,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Click to view all Express Delivery orders"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>Express Delivery</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>Open →</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {analytics.orderTypeBreakdown?.deliveryOrders || 0} orders ({analytics.orderTypeBreakdown?.deliveryPercentage || 0}%)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Revenue: <strong>Rs. {analytics.orderTypeBreakdown?.deliveryRevenue?.toLocaleString() || 0}</strong>
              </div>
            </div>

            <div
              onClick={() => navigate('/orders?type=pickup')}
              style={{
                background: 'var(--bg-hover)',
                padding: 16,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Click to view all Takeaway Pickup orders"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>Takeaway Pickup</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)' }}>Open →</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {analytics.orderTypeBreakdown?.pickupOrders || 0} orders ({analytics.orderTypeBreakdown?.pickupPercentage || 0}%)
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Revenue: <strong>Rs. {analytics.orderTypeBreakdown?.pickupRevenue?.toLocaleString() || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Counts */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Fulfillment Pipeline</div>
              <div className="card-subtitle">Completed, Pending & Cancelled status metrics</div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => navigate('/orders')}
            >
              Pipeline →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: 12 }}>
            <div
              onClick={() => navigate('/orders?status=Delivered')}
              style={{ background: 'var(--green-soft)', padding: 14, borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.18s ease' }}
              title="Click to view Completed / Delivered orders"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>Completed</div>
                <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>→</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{kpis.completedOrders || 0}</div>
            </div>
            <div
              onClick={() => navigate('/orders?status=Preparing')}
              style={{ background: 'var(--yellow-soft)', padding: 14, borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.18s ease' }}
              title="Click to view In-Progress / Preparing orders"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)' }}>In Progress</div>
                <span style={{ fontSize: 10, color: 'var(--yellow)', fontWeight: 700 }}>→</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{kpis.pendingOrders || 0}</div>
            </div>
            <div
              onClick={() => navigate('/orders?status=Cancelled')}
              style={{ background: 'var(--accent-soft)', padding: 14, borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.18s ease' }}
              title="Click to view Cancelled orders"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>Cancelled ({kpis.cancellationRate}%)</div>
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>→</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{kpis.cancelledOrders || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Orders Trend Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Daily Revenue Trend</div>
              <div className="card-subtitle">Revenue grouped by day for period ({period})</div>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.revenueChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(d) => {
                    if (!d) return '';
                    const parts = d.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                  }}
                  minTickGap={20}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Order Volume Trend</div>
              <div className="card-subtitle">Daily order counts for period ({period})</div>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(d) => {
                    if (!d) return '';
                    const parts = d.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
                  }}
                  minTickGap={20}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
                <Tooltip content={<OrdersTooltip />} />
                <Line type="monotone" dataKey="orders" stroke="var(--blue)" strokeWidth={2.5} dot={{ fill: 'var(--blue)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Top 5 Foods & Branch Comparison */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Top 5 Foods by Revenue */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top 5 Foods by Sales</div>
              <div className="card-subtitle">Highest grossing food items in this period</div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExportCSV('foods')}>
              Export CSV
            </button>
          </div>
          <div>
            {topFoods.map((food, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent)', width: 20 }}>#{idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }} className="truncate">
                    {food.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Qty Sold: <strong>{food.quantitySold} units</strong> ({food.ordersCount} orders)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Rs. {food.revenue?.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Performance Comparison */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Branch Performance</div>
              <div className="card-subtitle">Revenue & order comparison across locations</div>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleExportCSV('restaurants')}>
              Export CSV
            </button>
          </div>
          <div>
            {branches.map((b, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{b.branchName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {b.totalOrders} orders ({b.deliveryOrders} delivery • {b.pickupOrders} pickup)
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)' }}>Rs. {b.revenue?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AOV: Rs. {b.averageOrderValue?.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
