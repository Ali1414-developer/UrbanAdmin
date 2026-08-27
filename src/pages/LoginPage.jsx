import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ShieldCheck, MapPin, Building2, MonitorSmartphone } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'reception'
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      const role = res.user?.role;
      if (role === 'receptionist' || role === 'reception') {
        navigate('/reception/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const branchAdminLogins = [
    {
      title: 'Super Admin',
      email: 'admin@urbanbite.pk',
      pass: 'admin123',
      badge: 'All Cities',
      color: '#E53935',
      icon: ShieldCheck
    },
    {
      title: 'Lahore Admin',
      email: 'admin.lahore@urbanbite.pk',
      pass: 'admin123',
      badge: 'Lahore',
      color: '#2563EB',
      icon: MapPin
    },
    {
      title: 'Islamabad Admin',
      email: 'admin.islamabad@urbanbite.pk',
      pass: 'admin123',
      badge: 'Islamabad',
      color: '#059669',
      icon: MapPin
    },
    {
      title: 'Multan Admin',
      email: 'admin.multan@urbanbite.pk',
      pass: 'admin123',
      badge: 'Multan',
      color: '#D97706',
      icon: MapPin
    }
  ];

  const branchReceptionLogins = [
    {
      title: 'Lahore Reception',
      email: 'reception.lahore@urbanbite.pk',
      pass: 'reception123',
      badge: 'Lahore Rec.',
      color: '#2563EB',
      icon: MonitorSmartphone
    },
    {
      title: 'Islamabad Reception',
      email: 'reception.islamabad@urbanbite.pk',
      pass: 'reception123',
      badge: 'Islamabad Rec.',
      color: '#059669',
      icon: MonitorSmartphone
    },
    {
      title: 'Multan Reception',
      email: 'reception.multan@urbanbite.pk',
      pass: 'reception123',
      badge: 'Multan Rec.',
      color: '#D97706',
      icon: MonitorSmartphone
    },
    {
      title: 'General Reception',
      email: 'reception@urbanbite.pk',
      pass: 'reception123',
      badge: 'Default Rec.',
      color: '#7C3AED',
      icon: MonitorSmartphone
    }
  ];

  const currentList = activeTab === 'admin' ? branchAdminLogins : branchReceptionLogins;

  return (
    <div className="login-page">
      <div className="login-card fade-in" style={{ maxWidth: 460 }}>
        <div className="login-logo">
          <div className="login-logo-icon">
            <UtensilsCrossed size={24} color="white" />
          </div>
          <div>
            <h1>UrbanBite</h1>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Staff & Admin Portal</div>
          </div>
        </div>

        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">Sign in with your branch admin or reception account</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Staff Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 38 }}
                type="email"
                placeholder="staff@urbanbite.pk"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Fast Branch Login Quick Fill */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Building2 size={13} /> Auto-Fill Accounts:
            </span>

            {/* Admin vs Reception Toggle Tabs */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-hover)', padding: 2, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'admin' ? 'var(--accent, #E53935)' : 'transparent',
                  color: activeTab === 'admin' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                Admins
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reception')}
                style={{
                  padding: '3px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'reception' ? '#2563EB' : 'transparent',
                  color: activeTab === 'reception' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                Receptionists
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {currentList.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.email}
                  onClick={() => setForm({ email: b.email, password: b.pass })}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-hover)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                  title={`Click to fill ${b.title}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: b.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Icon size={12} /> {b.badge}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Auto-fill</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {b.email}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
