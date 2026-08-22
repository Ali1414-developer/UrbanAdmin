import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, Trash2, X, ShoppingBag,
  Clock, Truck, CheckCircle2, AlertCircle, Sparkles, ExternalLink
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSecs = Math.floor((now - date) / 1000);

  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type) {
  switch (type) {
    case 'ORDER_PLACED':
    case 'ORDER_CONFIRMED':
      return { icon: ShoppingBag, color: 'var(--accent)', bg: 'var(--accent-soft)' };
    case 'ORDER_PREPARING':
      return { icon: Clock, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
    case 'ORDER_OUT_FOR_DELIVERY':
    case 'ORDER_READY_FOR_PICKUP':
      return { icon: Truck, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
    case 'ORDER_DELIVERED':
    case 'ORDER_COMPLETED':
      return { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
    case 'ORDER_CANCELLED':
      return { icon: AlertCircle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    default:
      return { icon: Sparkles, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
  }
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications from server
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        const list = res.data.data || [];
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time socket listener
  useEffect(() => {
    let socket;
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        socket.emit('join:admin');
      });

      socket.on('notification:new', (newNotif) => {
        setNotifications(prev => [newNotif, ...prev.filter(n => n._id !== newNotif._id)]);
        setUnreadCount(prev => prev + 1);
      });

      socket.on('order:created', (order) => {
        // Create an optimistic notification if not yet delivered
        const orderNotif = {
          _id: 'order-' + (order._id || Date.now()),
          type: 'ORDER_PLACED',
          title: `New Order #${order.orderNumber || ''}`,
          message: `${order.customer?.name || 'Customer'} placed ${order.orderType || 'dine-in'} order (${order.items?.length || 1} items).`,
          orderId: order.orderNumber,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [orderNotif, ...prev.filter(n => n.orderId !== order.orderNumber)]);
        setUnreadCount(prev => prev + 1);
      });
    } catch (err) {
      console.warn('Socket connection skipped for notifications:', err.message);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Mark single notification as read
  const handleMarkAsRead = async (e, id) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err.message);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (e, id) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const target = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  };

  // Clear all
  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err.message);
    }
  };

  // Handle click on a notification item
  const handleItemClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(null, notif._id);
    }
    setOpen(false);
    navigate('/orders');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        className="header-icon-btn"
        title="Notifications"
        onClick={() => {
          setOpen(v => !v);
          if (!open) fetchNotifications();
        }}
        aria-label="Open Notifications"
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF',
              boxShadow: '0 2px 4px rgba(229, 57, 53, 0.3)',
              lineHeight: 1
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 360,
            maxWidth: '90vw',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.16), 0 8px 18px -3px rgba(0, 0, 0, 0.09)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Dropdown Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 10
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 6px',
                    borderRadius: 4
                  }}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} color="var(--accent)" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications List Container */}
          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--bg-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Bell size={20} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                  No Notifications
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  You are completely caught up!
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon: IconComponent, color, bg } = getNotificationIcon(notif.type);
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      background: notif.isRead ? 'transparent' : 'rgba(229, 57, 53, 0.03)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(229, 57, 53, 0.03)'}
                  >
                    {/* Unread indicator dot */}
                    {!notif.isRead && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 6,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--accent)'
                        }}
                      />
                    )}

                    {/* Icon Bubble */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: bg,
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2
                      }}
                    >
                      <IconComponent size={16} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <h4
                          style={{
                            fontSize: 13,
                            fontWeight: notif.isRead ? 600 : 750,
                            color: 'var(--text-primary)',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {notif.title}
                        </h4>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          margin: '3px 0 0',
                          lineHeight: 1.35,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Quick Delete */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(e, notif._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--red)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      title="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('/orders');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0
                }}
              >
                <span>View Orders</span>
                <ExternalLink size={12} />
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Trash2 size={12} />
                <span>Clear all</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
