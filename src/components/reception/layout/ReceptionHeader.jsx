import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  Menu, LogOut, ChevronRight, User,
  ChevronDown
} from 'lucide-react';

const routeTitles = {
  '/reception/dashboard': 'Reception Dashboard',
  '/reception/new-order': 'New Order & POS',
  '/reception/orders': 'Orders Management',
  '/reception/customers': 'Customer Directory',
  '/reception/receipts': 'Receipts Archive',
  '/reception/reports': 'Operations Reports',
  '/reception/profile': 'Staff Profile'
};

export default function ReceptionHeader({ onToggleSidebar }) {
  const { receptionUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTitle = routeTitles[location.pathname] || 'Reception Portal';

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

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

  const initials = receptionUser?.name
    ? receptionUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'RS';

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
            <span>Front Desk</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{currentTitle}</span>
          </div>
          <h2 className="header-title">{currentTitle}</h2>
        </div>
      </div>

      <div className="header-actions">
        <NotificationDropdown />

        <div style={{ height: 24, width: 1, background: 'var(--border)' }} />

        {/* Staff Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="header-account-btn"
            onClick={() => setDropdownOpen(v => !v)}
            aria-label="Staff account menu"
            aria-expanded={dropdownOpen}
          >
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {initials}
            </div>
            <div className="header-account-info">
              <span className="header-account-name">{receptionUser?.name || 'Reception Staff'}</span>
              <span className="header-account-role">Front Desk Staff</span>
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
              <div className="header-dropdown-user">
                <div className="avatar" style={{ width: 38, height: 38, fontSize: 14, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {receptionUser?.name || 'Reception Staff'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {receptionUser?.email || 'reception@urbanbite.pk'}
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
