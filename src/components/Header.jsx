import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  Menu, LogOut, ChevronRight, User, Settings,
  ChevronDown, Shield
} from 'lucide-react';

const routeTitles = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/foods': 'Foods & Menu',
  '/categories': 'Food Categories',
  '/promos': 'Promo Codes',
  '/restaurants': 'Restaurants & Branches',
  '/customers': 'Customer Directory',
  '/reviews': 'Reviews',
  '/pos': 'POS Terminal',
  '/profile': 'My Profile',
  '/settings': 'System Settings'
};

export default function Header({ onToggleSidebar }) {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTitle = routeTitles[location.pathname] || 'Admin Panel';

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  // Initials from name
  const initials = admin?.name
    ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <header className="page-header">
      <div className="header-left">
        <button
          type="button"
          className="header-icon-btn mobile-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-title-container">
          <div className="header-breadcrumbs">
            <span>UrbanBite</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{currentTitle}</span>
          </div>
          <h2 className="header-title">{currentTitle}</h2>
        </div>
      </div>

      <div className="header-actions">
        {/* Active Branch Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          background: admin?.isSuperAdmin ? 'rgba(229, 57, 53, 0.08)' : 'rgba(37, 99, 235, 0.08)',
          border: `1px solid ${admin?.isSuperAdmin ? 'rgba(229, 57, 53, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
          borderRadius: 'var(--radius-full, 9999px)',
          fontSize: 12,
          fontWeight: 700,
          color: admin?.isSuperAdmin ? 'var(--accent, #E53935)' : '#2563EB'
        }}>
          <span>{admin?.isSuperAdmin ? '🌐 All Branches' : `📍 ${admin?.city || 'Branch'} • ${admin?.branchName || 'Branch Portal'}`}</span>
        </div>

        <NotificationDropdown />

        <div style={{ height: 24, width: 1, background: 'var(--border)' }} />

        {/* ── Account Dropdown ── */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="header-account-btn"
            onClick={() => setDropdownOpen(v => !v)}
            aria-label="Account menu"
            aria-expanded={dropdownOpen}
          >
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {initials}
            </div>
            <div className="header-account-info">
              <span className="header-account-name">{admin?.name || 'Admin'}</span>
              <span className="header-account-role">
                {admin?.isSuperAdmin ? 'Super Admin' : `${admin?.city || 'Branch'} Admin`}
              </span>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-muted)',
                transition: 'transform 0.2s',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            />
          </button>

          {dropdownOpen && (
            <div className="header-dropdown">
              {/* Dropdown header */}
              <div className="header-dropdown-user">
                <div className="avatar" style={{ width: 38, height: 38, fontSize: 14, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {admin?.name || 'Admin'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {admin?.email || ''}
                  </div>
                </div>
              </div>

              <div className="header-dropdown-divider" />

              <button
                className="header-dropdown-item"
                onClick={() => handleNav('/profile')}
              >
                <User size={15} />
                <span>My Profile</span>
              </button>
              <button
                className="header-dropdown-item"
                onClick={() => handleNav('/settings')}
              >
                <Settings size={15} />
                <span>System Settings</span>
              </button>

              <div className="header-dropdown-divider" />

              <button
                className="header-dropdown-item header-dropdown-logout"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
