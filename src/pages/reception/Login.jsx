import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, AlertCircle, Eye, EyeOff, MapPin, Building2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate('/reception/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  const branchReceptionLogins = [
    {
      title: 'Lahore Front Desk (Gulberg)',
      email: 'reception.lahore@urbanbite.pk',
      pass: 'reception123',
      badge: 'Lahore Reception',
      color: '#2563EB'
    },
    {
      title: 'Islamabad Front Desk (F-7)',
      email: 'reception.islamabad@urbanbite.pk',
      pass: 'reception123',
      badge: 'Islamabad Reception',
      color: '#059669'
    },
    {
      title: 'Multan Front Desk (Cantt)',
      email: 'reception.multan@urbanbite.pk',
      pass: 'reception123',
      badge: 'Multan Reception',
      color: '#D97706'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #EDF2F7 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        padding: '36px 32px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--accent), #C62828)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 20px rgba(229, 57, 53, 0.3)'
          }}>
            <UtensilsCrossed size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            UrbanBite
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Reception & Front Desk Portal
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-soft)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: 'var(--red)',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="rec-email">Staff Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="rec-email"
                type="email"
                className="form-control"
                style={{ paddingLeft: 38 }}
                placeholder="reception@urbanbite.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rec-pw">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="rec-pw"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Reception'}
          </button>
        </form>

        {/* 1-Click Fast Branch Receptionist Quick Selectors */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={13} /> Select Branch Receptionist to Auto-Fill:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {branchReceptionLogins.map((b) => (
              <div
                key={b.email}
                onClick={() => { setEmail(b.email); setPassword(b.pass); setError(''); }}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-hover)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                title={`Click to fill ${b.title}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} style={{ color: b.color }} />
                  <span style={{ fontWeight: 700, color: b.color }}>{b.badge}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({b.email})</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: b.color }}>Fill</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
