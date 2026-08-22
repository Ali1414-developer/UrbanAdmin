import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <AlertCircle size={48} color="var(--accent)" />
      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 12 }}>
        Page Not Found
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, maxWidth: 360 }}>
        The reception page you requested could not be found or has moved.
      </p>
      <Link to="/reception/dashboard" className="btn btn-primary" style={{ marginTop: 20 }}>
        <Home size={14} /> Back to Reception Dashboard
      </Link>
    </div>
  );
}
