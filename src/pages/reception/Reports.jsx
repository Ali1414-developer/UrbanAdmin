import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Download, Printer, ShoppingBag,
  Calendar, CheckCircle2, Clock, Utensils, CreditCard, Banknote, Truck, Globe
} from 'lucide-react';
import api from '../../services/api';

export default function Reports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('allTime');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reception/reports', { params: { period } });
      setReportData(res.data.data);
    } catch (err) {
      console.error('Failed to load reception reports', err);
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

  const handleExportCSV = () => {
    if (!reportData) return;
    const summary = reportData.summary || {};
    const items = reportData.topSellingItems || [];

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'UrbanBite Reception Sales & Operational Report\n';
    csvContent += `Period,${period}\n`;
    csvContent += `Generated On,${new Date().toLocaleString()}\n\n`;

    csvContent += 'FINANCIAL & ORDER SUMMARY\n';
    csvContent += `Total Orders,${summary.totalOrders || 0}\n`;
    csvContent += `Completed Orders,${summary.completedCount || 0}\n`;
    csvContent += `Gross Revenue,Rs. ${summary.grossRevenue || 0}\n`;
    csvContent += `Subtotal Revenue,Rs. ${summary.subtotalRevenue || 0}\n`;
    csvContent += `Total Tax Collected,Rs. ${summary.totalTax || 0}\n`;
    csvContent += `Total Delivery Collected,Rs. ${summary.totalDeliveryCharges || 0}\n`;
    csvContent += `Average Order Value,Rs. ${summary.averageOrderValue || 0}\n\n`;

    csvContent += 'TOP SELLING ITEMS\n';
    csvContent += 'Rank,Item Name,Units Sold,Unit Price,Total Sales\n';
    items.forEach((item, idx) => {
      csvContent += `${idx + 1},"${item.name}",${item.quantity},${item.price},${item.revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UrbanBite_Reception_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const summary = reportData?.summary || {};
  const orderTypes = reportData?.orderTypes || {};
  const payments = reportData?.payments || {};
  const topItems = reportData?.topSellingItems || [];
  const recentOrders = reportData?.recentOrders || [];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* ── Top Header & Action Controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={22} color="var(--accent)" /> Reception System & Sales Reports
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time operational summary, POS revenue reconciliation, and live sales metrics.
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="today">Today's Shift</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="allTime">All-Time History</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCSV}
            disabled={loading || !reportData}
            style={{ gap: 6 }}
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePrint}
            style={{ gap: 6 }}
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* ── Main Report Content ── */}
      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', background: '#FFFFFF' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            Analyzing and compiling operational reports...
          </div>
        </div>
      ) : (
        <>
          {/* ── 4 Top KPI Cards (Interactive Navigation) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Link
              to="/reception/orders"
              className="card"
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Click to view all Revenue & Order Transactions"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>Gross Revenue</span>
                <span className="badge badge-green">Net Sales</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>
                Rs. {(summary.grossRevenue || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tax: Rs. {(summary.totalTax || 0).toLocaleString()}</div>
            </Link>

            <Link
              to="/reception/orders"
              className="card"
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Click to view Total Orders List"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>Total Volume</span>
                <span className="badge badge-blue">{summary.totalOrders || 0} Orders</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
                {summary.totalOrders || 0} Orders
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{summary.completedCount || 0} completed & served →</div>
            </Link>

            <Link
              to="/reception/orders"
              className="card"
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Click to view Orders & Spending Details"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>Average Order (AOV)</span>
                <span className="badge badge-gray">AOV</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--blue)' }}>
                Rs. {(summary.averageOrderValue || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Average order spending →</div>
            </Link>

            <Link
              to="/reception/orders?status=Completed"
              className="card"
              style={{
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Click to view Completed & Fulfilled Orders"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.4px' }}>Completed Orders</span>
                <span className="badge badge-green">Fulfilled</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>
                {summary.completedCount || 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Successfully served / delivered →</div>
            </Link>
          </div>

          {/* ── Channels & Payment Reconciliation ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, width: '100%' }}>
            {/* Order Channels Split */}
            <div className="card" style={{ background: '#FFFFFF', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px' }}>
                Order Channels Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link
                  to="/reception/orders?type=delivery"
                  style={{
                    background: 'var(--bg-hover)',
                    padding: '12px 14px',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Filter Delivery Orders"
                >
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={14} /> Express Delivery
                    </strong>
                    <div className="text-xs text-muted">{orderTypes.delivery?.count || 0} orders processed →</div>
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    Rs. {(orderTypes.delivery?.revenue || 0).toLocaleString()}
                  </strong>
                </Link>

                <Link
                  to="/reception/orders?type=pickup"
                  style={{
                    background: 'var(--bg-hover)',
                    padding: '12px 14px',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Filter Takeaway / Pickup Orders"
                >
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--purple)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ShoppingBag size={14} /> Takeaway / Pickup
                    </strong>
                    <div className="text-xs text-muted">{orderTypes.pickup?.count || 0} orders processed →</div>
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    Rs. {(orderTypes.pickup?.revenue || 0).toLocaleString()}
                  </strong>
                </Link>

                <Link
                  to="/reception/orders?type=dineIn"
                  style={{
                    background: 'var(--bg-hover)',
                    padding: '12px 14px',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="Filter Dine-In Orders"
                >
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Utensils size={14} /> Dine-In Orders
                    </strong>
                    <div className="text-xs text-muted">{orderTypes.dineIn?.count || 0} dine-in orders →</div>
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    Rs. {(orderTypes.dineIn?.revenue || 0).toLocaleString()}
                  </strong>
                </Link>
              </div>
            </div>

            {/* Payment Method Split */}
            <div className="card" style={{ background: '#FFFFFF', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px' }}>
                Payment Tender Reconciliation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'var(--bg-hover)', padding: '12px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Banknote size={14} /> Cash Transactions
                    </strong>
                    <div className="text-xs text-muted">{payments.cash?.count || 0} cash orders</div>
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--green)' }}>
                    Rs. {(payments.cash?.revenue || 0).toLocaleString()}
                  </strong>
                </div>

                <div style={{ background: 'var(--bg-hover)', padding: '12px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CreditCard size={14} /> POS Debit/Credit Card
                    </strong>
                    <div className="text-xs text-muted">{payments.card?.count || 0} card orders</div>
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--blue)' }}>
                    Rs. {(payments.card?.revenue || 0).toLocaleString()}
                  </strong>
                </div>

                <div style={{ background: 'var(--bg-hover)', padding: '12px 14px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Globe size={14} /> Online Gateway / Other
                    </strong>
                    <div className="text-xs text-muted">{payments.online?.count || 0} transactions</div>
                  </div>
                  <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                    Rs. {(payments.online?.revenue || 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── Top Selling Food Items ── */}
          <div className="card" style={{ background: '#FFFFFF', padding: 0, borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Top Selling Menu Items</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Ranked by order frequency and units sold</div>
              </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: 60 }}>Rank</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Item Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Units Sold</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Unit Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--accent)' }}>#{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-blue">{item.quantity} units</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>Rs. {(item.price || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>
                        Rs. {(item.revenue || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {topItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No menu items sold in this period yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Recent Reception Transaction Log ── */}
          <div className="card" style={{ background: '#FFFFFF', padding: 0, borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Recent Orders Transaction Log</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Real-time orders recorded from POS and Web</div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Order #</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Payment</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 15).map((o) => (
                    <tr
                      key={o._id}
                      onClick={() => navigate(`/reception/orders/${o._id}`)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      title="Click to view order details"
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                        {o.orderNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${o.orderType === 'delivery' ? 'badge-blue' : o.orderType === 'dineIn' ? 'badge-orange' : 'badge-purple'}`}>
                          {o.orderType?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.customer?.name || 'Walk-in Customer'}</div>
                        <div className="text-xs text-muted">{o.customer?.phone || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>
                        {o.paymentMethod || 'Cash'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${o.status === 'Completed' || o.status === 'Delivered' ? 'badge-green' : o.status === 'Cancelled' ? 'badge-red' : 'badge-yellow'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Rs. {(o.pricing?.grandTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No orders recorded yet.
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
                onClick={() => navigate('/reception/orders')}
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
