import React, { useState, useRef } from 'react';
import { Link2, Upload, X, CheckCircle2, Lightbulb } from 'lucide-react';

export default function ImageInputSelector({ value, onChange, label = 'Image', placeholder = 'https://images.unsplash.com/...' }) {
  const [mode, setMode] = useState(value && value.startsWith('data:') ? 'upload' : 'url'); // 'url' | 'upload'
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Selected image is too large. Please choose an image under 5MB.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (typeof dataUrl === 'string') {
        onChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    onChange('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="form-group" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>{label}</label>
        
        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: 2, border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setMode('url')}
            style={{
              padding: '3px 9px',
              fontSize: 11.5,
              fontWeight: mode === 'url' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'url' ? 'var(--accent)' : 'transparent',
              color: mode === 'url' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Link2 size={12} /> URL
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            style={{
              padding: '3px 9px',
              fontSize: 11.5,
              fontWeight: mode === 'upload' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'upload' ? 'var(--accent)' : 'transparent',
              color: mode === 'upload' ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Upload size={12} /> Local PC
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div>
          <input
            type="text"
            className="form-control"
            value={value && !value.startsWith('data:') ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lightbulb size={12} color="var(--accent)" /> Paste a direct image link from Unsplash, CDN, or web hosting.
          </div>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/jpg"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id={`local-file-picker-${label.replace(/\s+/g, '-').toLowerCase()}`}
          />
          <label
            htmlFor={`local-file-picker-${label.replace(/\s+/g, '-').toLowerCase()}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '16px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px dashed var(--border)',
              background: 'var(--bg-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)'
            }}>
              <Upload size={18} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
              {fileName ? fileName : 'Click to select image from your PC / Laptop'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Supports PNG, JPG, JPEG, WEBP (Max 5MB)
            </div>
          </label>
        </div>
      )}

      {/* Live Preview Box */}
      {value && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <img
              src={value}
              alt="Preview"
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-sm)',
                objectFit: 'cover',
                border: '1px solid var(--border)',
                flexShrink: 0
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={13} color="var(--green)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>Image Ready</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 280 }}>
                {value.startsWith('data:') ? `Local PC Upload (${fileName || 'Image Loaded'})` : value}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', fontSize: 11.5, color: 'var(--red)', height: 'auto', flexShrink: 0 }}
          >
            <X size={12} style={{ marginRight: 2 }} /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
