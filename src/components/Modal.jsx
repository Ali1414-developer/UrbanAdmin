import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, footer }) {
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal" ref={ref}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
