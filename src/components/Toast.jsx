import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

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
    <div className={`toast toast-${toast.type}`}>
      {toast.type === 'success' ? <CheckCircle size={18} color="var(--green)" /> : <XCircle size={18} color="var(--red)" />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button className="btn-icon" style={{ width: 24, height: 24, background: 'none', border: 'none' }} onClick={() => setToast(null)}>
        <X size={13} />
      </button>
    </div>
  );
}
