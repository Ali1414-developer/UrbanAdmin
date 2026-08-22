import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

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

  const handleFillDemo = () => {
    setEmail('reception@urbanbite.pk');
    setPassword('Reception@123');
    setError('');
  };

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
        maxWidth: 420,
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

        {/* Quick fill card for testing */}
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: 12 }}
            onClick={handleFillDemo}
          >
            <CheckCircle size={13} color="var(--green)" /> Auto-fill Reception Credentials
          </button>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            reception@urbanbite.pk / Reception@123
          </div>
        </div>
      </div>
    </div>
  );
}
