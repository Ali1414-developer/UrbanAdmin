import { useEffect, useState } from 'react';
import { Search, Star, CheckCircle, XCircle, Trash2, MessageSquare } from 'lucide-react';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reviews/admin', {
        params: { search, status: statusFilter, page, limit: 30 }
      });
      setReviews(data.data || []);
      setTotal(data.total || (data.data || []).length);
    } catch (err) {
      showToast('Failed to load customer reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [search, statusFilter, page]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { data } = await api.patch(`/reviews/admin/${id}/status`, { status: newStatus });
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r)));
      showToast(`Review ${newStatus} successfully!`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update review status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      showToast('Review deleted successfully');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete review', 'error');
    }
  };

  const pages = Math.ceil(total / 30);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="header-title" style={{ margin: 0 }}>Customer Reviews Moderation</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {total} total customer reviews submitted for moderation
          </div>
        </div>
      </div>

      <div className="card" style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              className="search-input"
              placeholder="Search customer name, comment, order number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="form-control form-select"
            style={{ width: 170 }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" />
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Order #</th>
                  <th>Food ID</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.user?.name || 'Customer'}</div>
                      <div className="text-xs text-muted">{r.user?.email || '—'}</div>
                    </td>
                    <td className="text-sm" style={{ fontFamily: 'monospace' }}>
                      {r.order?.orderNumber || '—'}
                    </td>
                    <td className="text-sm text-muted">{r.food?.name || r.foodId || 'Menu Item'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{r.rating}/5</span>
                      </div>
                    </td>
                    <td className="text-sm" style={{ maxWidth: 280, color: 'var(--text-secondary)' }}>
                      "{r.comment}"
                    </td>
                    <td className="text-sm text-muted">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                        {r.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status !== 'approved' && (
                          <button
                            type="button"
                            className="btn btn-icon"
                            style={{ color: 'var(--green)' }}
                            onClick={() => handleUpdateStatus(r._id, 'approved')}
                            title="Approve Review"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            type="button"
                            className="btn btn-icon"
                            style={{ color: 'var(--yellow)' }}
                            onClick={() => handleUpdateStatus(r._id, 'rejected')}
                            title="Reject Review"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-icon"
                          style={{ color: 'var(--red)' }}
                          onClick={() => handleDelete(r._id)}
                          title="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <MessageSquare size={36} />
                        <h3>No reviews found</h3>
                        <p>No customer reviews match your filter parameters.</p>
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
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
