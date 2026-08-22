import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Users, UtensilsCrossed,
  X, LogOut, MonitorSmartphone, Receipt,
  FileText
} from 'lucide-react';

const navItems = [
  { to: '/reception/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reception/new-order', icon: MonitorSmartphone, label: 'New Order / POS' },
  { to: '/reception/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/reception/customers', icon: Users, label: 'Customers' },
  { to: '/reception/receipts', icon: Receipt, label: 'Receipts' },
  { to: '/reception/reports', icon: FileText, label: 'Reports' }
];

export default function ReceptionSidebar({ isOpen, onClose }) {
  const { receptionUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = receptionUser?.name
    ? receptionUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'RS';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <img
              src="/logo.png"
              alt="UrbanBite Logo"
              className="sidebar-logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              style={{
                display: 'none',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent)'
              }}
            >
              <UtensilsCrossed size={18} color="white" />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>UrbanBite</h1>
            <span>Reception Portal</span>
          </div>
          {isOpen && (
            <button
              type="button"
              className="btn-icon btn-sm"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="/profile"
            onClick={onClose}
            className={`sidebar-user-link${location.pathname === '/profile' ? ' active' : ''}`}
            style={{
              ...(location.pathname === '/profile' ? {
                background: 'var(--accent-soft)',
                border: '1px solid rgba(229, 57, 53, 0.2)'
              } : {})
            }}
            title="Click to view & edit Profile"
          >
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: location.pathname === '/profile' ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {receptionUser?.name || 'Reception Staff'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Front Desk Staff</div>
            </div>
          </Link>
          <button
            type="button"
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center', fontSize: 13 }}
            onClick={handleLogout}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
