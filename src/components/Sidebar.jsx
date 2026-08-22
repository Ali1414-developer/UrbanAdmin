import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Utensils, Tag, TicketPercent, Store,
  Users, LogOut, UtensilsCrossed, X, MonitorSmartphone,
  Settings, FileText, UserCheck, MessageSquare, ShieldCheck
} from 'lucide-react';
import api from '../services/api';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/foods', icon: Utensils, label: 'Foods' },
  { to: '/pos', icon: MonitorSmartphone, label: 'POS Terminal' },
  { to: '/categories', icon: Tag, label: 'Categories' },
  { to: '/restaurants', icon: Store, label: 'Restaurants' },
  { to: '/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/staff', icon: ShieldCheck, label: 'Staff Management' },
  { to: '/users', icon: UserCheck, label: 'Users' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/promos', icon: TicketPercent, label: 'Promo Codes' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function Sidebar({ isOpen, onClose }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic brand info
  const [brand, setBrand] = useState(() => {
    try {
      const saved = localStorage.getItem('urbanbite_admin_brand');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { brandName: 'UrbanBite', tagline: 'Admin Panel', logo: '/logo.png' };
  });

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data?.data?.settings) {
          const s = res.data.data.settings;
          const updated = {
            brandName: s.brandName || 'UrbanBite',
            tagline: s.tagline || 'Admin Panel',
            logo: s.logo || '/logo.png'
          };
          setBrand(updated);
          localStorage.setItem('urbanbite_admin_brand', JSON.stringify(updated));
        }
      } catch (e) {}
    };

    fetchBrand();

    const handleSync = () => {
      try {
        const saved = localStorage.getItem('urbanbite_admin_brand');
        if (saved) setBrand(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener('brand_settings_updated', handleSync);
    return () => window.removeEventListener('brand_settings_updated', handleSync);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = admin?.name
    ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'A';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div style={{ position: 'relative' }}>
          <Link
            to="/settings"
            className="sidebar-logo"
            onClick={onClose}
            title="Click to edit Brand Logo & Settings"
          >
            <div className="sidebar-logo-icon">
              <img
                src={brand.logo || '/logo.png'}
                alt={brand.brandName || 'UrbanBite'}
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
              <h1>{brand.brandName || 'UrbanBite'}</h1>
              <span>{brand.tagline || 'Admin Panel'}</span>
            </div>
          </Link>
          {isOpen && (
            <button
              type="button"
              className="btn-icon btn-sm"
              style={{ position: 'absolute', right: 10, top: 16 }}
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
              end={to === '/'}
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
                {admin?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Administrator</div>
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
