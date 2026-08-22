import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, ShieldCheck, MonitorSmartphone } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="login-page">
      <div className="login-card fade-in">
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
        <p className="login-subtitle">Sign in to manage restaurant operations</p>

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
          <div className="form-group" style={{ marginBottom: 24 }}>
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

        {/* Demo Fast Logins */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            onClick={() => setForm({ email: 'admin@urbanbite.pk', password: 'admin123' })}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-hover)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              border: '1px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
            title="Click to fill Admin credentials"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
              <span><strong style={{ color: 'var(--text-primary)' }}>Admin:</strong> <code>admin@urbanbite.pk</code></span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Fill Admin</span>
          </div>

          <div
            onClick={() => setForm({ email: 'reception@urbanbite.pk', password: 'reception123' })}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-hover)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              border: '1px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
            title="Click to fill Receptionist credentials"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MonitorSmartphone size={16} style={{ color: '#2563EB' }} />
              <span><strong style={{ color: 'var(--text-primary)' }}>Reception:</strong> <code>reception@urbanbite.pk</code></span>
            </div>
            <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>Fill Reception</span>
          </div>
        </div>
      </div>
    </div>
  );
}
