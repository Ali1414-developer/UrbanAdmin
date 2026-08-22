import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, Info } from 'lucide-react';

let showToastFn = null;
export const showToast = (msg, type = 'success') => showToastFn?.(msg, type);

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    showToastFn = (message, type) => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    };
  }, []);

  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast`}>
        {toast.type === 'success' && <CheckCircle size={18} color="var(--green)" />}
        {toast.type === 'error' && <XCircle size={18} color="var(--red)" />}
        {toast.type === 'info' && <Info size={18} color="var(--blue)" />}
        <span style={{ flex: 1 }}>{toast.message}</span>
        <button
          className="btn-icon"
          style={{ width: 22, height: 22, background: 'none', border: 'none' }}
          onClick={() => setToast(null)}
          aria-label="Dismiss toast"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
