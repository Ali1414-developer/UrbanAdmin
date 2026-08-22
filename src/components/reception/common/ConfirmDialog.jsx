import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={440}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: danger ? 'var(--red-soft)' : 'var(--yellow-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={20} color={danger ? 'var(--red)' : 'var(--yellow)'} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
