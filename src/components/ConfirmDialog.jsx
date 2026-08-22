import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  confirmBtnClass = 'btn-danger',
  onConfirm,
  onClose,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className={`btn ${confirmBtnClass}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'var(--red-soft)', color: 'var(--red)',
          display: 'flex', alignItems: 'center', justifyCenter: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={22} />
        </div>
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {title}
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
