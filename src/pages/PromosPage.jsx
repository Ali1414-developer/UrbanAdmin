import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, TicketPercent, Gift } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';

const empty = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  minimumOrder: 0,
  isFreeDelivery: false,
  expiryDate: '',
  usageLimit: '',
  active: true
};

export default function PromosPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/promos/admin/all');
      setPromos(data.data || []);
    } catch (err) {
      showToast('Failed to load promo codes', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPromos(); }, []);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (p) => {
    setForm({
      ...p,
      expiryDate: p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0, 10) : ''
    });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.code || form.discountValue === '') return showToast('Promo code and discount value are required', 'error');
    const normalizedCode = form.code.toUpperCase().trim();

    setSaving(true);
    try {
      const payload = {
        ...form,
        code: normalizedCode,
        discountValue: parseFloat(form.discountValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        expiryDate: form.expiryDate || null
      };

      if (modal === 'add') {
        const { data } = await api.post('/promos', payload);
        setPromos(prev => [data.data, ...prev]);
        showToast('Promo code created successfully!');
      } else {
        const { data } = await api.put(`/promos/${form._id}`, payload);
        setPromos(prev => prev.map(p => p._id === form._id ? data.data : p));
        showToast('Promo code updated successfully!');
      }
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const confirmDeletePromo = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/promos/${deleteTarget._id}`);
      setPromos(prev => prev.filter(p => p._id !== deleteTarget._id));
      showToast('Promo code deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally { setDeleting(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="header-title" style={{ margin: 0 }}>Promo Codes & Offers</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{promos.length} total discount campaigns</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Create Promo</button>
      </div>

      <div className="card" style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Promo Code</th>
                  <th>Description</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage Count</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                          {p.isFreeDelivery ? <Gift size={16} color="var(--accent)" /> : <TicketPercent size={16} color="var(--accent)" />}
                        </div>
                        <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 14, letterSpacing: 1, color: 'var(--text-primary)' }}>
                          {p.code}
                        </span>
                      </div>
                    </td>
                    <td className="text-sm text-muted">{p.description || '—'}</td>
                    <td>
                      {p.isFreeDelivery ? (
                        <span className="badge badge-blue">Free Delivery</span>
                      ) : p.discountType === 'percentage' ? (
                        <span className="badge badge-green">-{p.discountValue}% OFF</span>
                      ) : (
                        <span className="badge badge-green">Rs. {p.discountValue} OFF</span>
                      )}
                      {p.maxDiscount && (
                        <span className="text-xs text-muted" style={{ display: 'block', marginTop: 2 }}>Max Rs. {p.maxDiscount}</span>
                      )}
                    </td>
                    <td className="text-sm" style={{ fontWeight: 600 }}>{p.minimumOrder > 0 ? `Rs. ${p.minimumOrder}` : 'No Min'}</td>
                    <td className="text-sm">{p.usedCount || 0}{p.usageLimit ? ` / ${p.usageLimit}` : ''}</td>
                    <td className="text-sm text-muted">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <span className={`badge ${p.active ? 'badge-green' : 'badge-red'}`}>
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-icon" onClick={() => openEdit(p)} title="Edit promo">
                          <Pencil size={14} />
                        </button>
                        <button type="button" className="btn btn-icon" style={{ color: 'var(--red)' }} onClick={() => setDeleteTarget(p)} title="Delete promo">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <TicketPercent size={36} />
                        <h3>No promo codes found</h3>
                        <p>Create special offer promo codes for marketing campaigns.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Promo Modal */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Create New Promo Code' : 'Edit Promo Code'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Promo'}</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Promo Code *</label>
              <input className="form-control" value={form.code} onChange={e => f('code', e.target.value.toUpperCase())} placeholder="e.g. URBAN20" style={{ fontFamily: 'monospace', letterSpacing: 2, fontWeight: 700 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Discount Type *</label>
              <select className="form-control form-select" value={form.discountType} onChange={e => f('discountType', e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Campaign Description</label>
            <input className="form-control" value={form.description} onChange={e => f('description', e.target.value)} placeholder="e.g. 20% off your entire order — no minimum required!" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Discount Value *</label>
              <input className="form-control" type="number" value={form.discountValue} onChange={e => f('discountValue', e.target.value)} placeholder={form.discountType === 'percentage' ? '20' : '250'} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Discount Cap (Rs.)</label>
              <input className="form-control" type="number" value={form.maxDiscount} onChange={e => f('maxDiscount', e.target.value)} placeholder="500" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Minimum Order Requirement (Rs.)</label>
              <input className="form-control" type="number" value={form.minimumOrder} onChange={e => f('minimumOrder', parseInt(e.target.value) || 0)} placeholder="1000" />
            </div>
            <div className="form-group">
              <label className="form-label">Usage Limit (Max Uses)</label>
              <input className="form-control" type="number" value={form.usageLimit} onChange={e => f('usageLimit', e.target.value)} placeholder="Leave blank for unlimited" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expiry Date</label>
            <input className="form-control" type="date" value={form.expiryDate} onChange={e => f('expiryDate', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 20, paddingTop: 6 }}>
            <label className="form-check"><input type="checkbox" checked={form.isFreeDelivery || false} onChange={e => f('isFreeDelivery', e.target.checked)} /> Free Delivery Offer</label>
            <label className="form-check"><input type="checkbox" checked={form.active !== false} onChange={e => f('active', e.target.checked)} /> Active Campaign</label>
          </div>
        </Modal>
      )}

      {/* Delete Promo Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Promo Code?"
        message={`Are you sure you want to delete promo code "${deleteTarget?.code}"?`}
        confirmText="Delete Promo"
        confirmBtnClass="btn-danger"
        loading={deleting}
        onConfirm={confirmDeletePromo}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
