import { useState, useEffect, useCallback } from 'react';
import {
  Mail, MessageSquare, Search, Phone, User, Calendar,
  Clock, CheckCircle, RefreshCw, Trash2, Eye, ExternalLink,
  Filter, AlertCircle, Sparkles, Send, Tag, ChevronLeft, ChevronRight,
  Inbox
} from 'lucide-react';
import api from '../services/api';
import { showToast } from '../components/Toast';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Selected message for details modal
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/contact-messages', {
        params: {
          search,
          status: statusFilter,
          page,
          limit: 15
        }
      });
      if (res.data?.success) {
        setMessages(res.data.data || []);
        setTotal(res.data.total || 0);
        setUnreadCount(res.data.unreadCount || 0);
        setPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load contact messages', err);
      showToast(err.response?.data?.message || 'Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdating(true);
      const res = await api.put(`/admin/contact-messages/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        showToast(`Marked message as ${newStatus}`, 'success');
        setMessages(prev => prev.map(m => m._id === id ? { ...m, status: newStatus } : m));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(prev => ({ ...prev, status: newStatus }));
        }
        if (newStatus === 'Read') {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      setUpdating(true);
      const res = await api.delete(`/admin/contact-messages/${id}`);
      if (res.data?.success) {
        showToast('Message deleted successfully', 'success');
        setMessages(prev => prev.filter(m => m._id !== id));
        setTotal(prev => Math.max(0, prev - 1));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      showToast('Failed to delete message', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const openMessageModal = (msg) => {
    setSelectedMessage(msg);
    if (msg.status === 'Unread') {
      handleUpdateStatus(msg._id, 'Read');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Unread':
        return <span className="badge badge-red" style={{ fontSize: 11, fontWeight: 700 }}>Unread</span>;
      case 'Read':
        return <span className="badge badge-blue" style={{ fontSize: 11, fontWeight: 700 }}>Read</span>;
      case 'Replied':
        return <span className="badge badge-green" style={{ fontSize: 11, fontWeight: 700 }}>Replied</span>;
      default:
        return <span className="badge badge-gray" style={{ fontSize: 11, fontWeight: 700 }}>{status}</span>;
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={24} color="var(--accent)" /> Customer Contact Messages
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                marginLeft: 4
              }}>
                {unreadCount} New
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Inquiries, questions, and feedback submitted directly by customers from the website.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchMessages}
          disabled={loading}
          style={{ gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Stats Summary Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inbox size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Inquiries</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(249, 115, 22, 0.1)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Unread Messages</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F97316' }}>{unreadCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Processed / Replied</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#22C55E' }}>{Math.max(0, total - unreadCount)}</div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 400 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email, phone, subject..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-secondary)', padding: 4, borderRadius: 8 }}>
          {['all', 'Unread', 'Read', 'Replied'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => { setStatusFilter(st); setPage(1); }}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === st ? '#FFFFFF' : 'transparent',
                color: statusFilter === st ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: statusFilter === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {st === 'all' ? 'All Messages' : st}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages Table / List ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading customer messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--text-muted)' }}>
              <Inbox size={26} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>No Messages Found</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              {search || statusFilter !== 'all' ? 'No messages match your current filters.' : 'When users send inquiries through the website contact form, they will appear here.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Status</th>
                  <th>Customer</th>
                  <th>Contact Info</th>
                  <th>Inquiry Type</th>
                  <th>Subject & Preview</th>
                  <th style={{ width: 140 }}>Received On</th>
                  <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg._id}
                    onClick={() => openMessageModal(msg)}
                    style={{
                      cursor: 'pointer',
                      background: msg.status === 'Unread' ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                      fontWeight: msg.status === 'Unread' ? 600 : 400
                    }}
                  >
                    <td>{getStatusBadge(msg.status)}</td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color="var(--text-muted)" /> {msg.name}
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{msg.email}</div>
                      {msg.phone && (
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Phone size={11} /> {msg.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>
                        {msg.inquiryType || 'General'}
                      </span>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.subject}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {msg.message}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <div>{new Date(msg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div style={{ fontSize: 11 }}>{new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openMessageModal(msg)}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-red"
                          onClick={() => handleDelete(msg._id)}
                          title="Delete Message"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Page {page} of {pages} ({total} total messages)
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Message Detail Modal ── */}
      {selectedMessage && (
        <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div
            className="modal"
            style={{ maxWidth: 600, display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} color="var(--accent)" /> Customer Inquiry Details
              </h2>
              <button type="button" className="btn-close" onClick={() => setSelectedMessage(null)}>
                ×
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Top Meta Info */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedMessage.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <a href={`mailto:${selectedMessage.email}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                      ✉ {selectedMessage.email}
                    </a>
                    {selectedMessage.phone && (
                      <a href={`tel:${selectedMessage.phone}`} style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 600 }}>
                        📞 {selectedMessage.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div>{getStatusBadge(selectedMessage.status)}</div>
              </div>

              {/* Inquiry Type & Timestamp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inquiry Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedMessage.inquiryType || 'General'}</div>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    {new Date(selectedMessage.createdAt).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 4 }}>Subject</label>
                <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedMessage.subject}
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 4 }}>Customer Message</label>
                <div style={{
                  padding: '14px 16px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 220,
                  overflowY: 'auto'
                }}>
                  {selectedMessage.message}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="btn btn-primary btn-sm"
                  style={{ gap: 6 }}
                  onClick={() => handleUpdateStatus(selectedMessage._id, 'Replied')}
                >
                  <Send size={14} /> Reply via Email
                </a>
                {selectedMessage.phone && (
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: 6 }}
                  >
                    <Phone size={14} /> Call Customer
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedMessage.status !== 'Replied' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUpdateStatus(selectedMessage._id, 'Replied')}
                    disabled={updating}
                  >
                    Mark as Replied
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
