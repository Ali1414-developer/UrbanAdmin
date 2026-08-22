import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Search, Store } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';

const empty = {
  name: '',
  slug: '',
  city: 'Lahore',
  area: '',
  address: '',
  phone: '',
  email: '',
  openingTime: '11:00 AM',
  closingTime: '02:00 AM',
  rating: 4.8,
  image: '',
  services: { delivery: true, pickup: true, dineIn: true },
  active: true,
  isFeatured: false
};

const cities = ['Lahore', 'Islamabad', 'Karachi', 'Multan', 'Faisalabad', 'Rawalpindi', 'Peshawar'];

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/restaurants/admin/all', { params: { city: cityFilter, search } });
      setRestaurants(data.data || []);
    } catch (err) {
      showToast('Failed to load restaurants', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRestaurants(); }, [cityFilter, search]);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (r) => {
    setForm({ ...r, services: r.services || { delivery: true, pickup: true, dineIn: true } });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.city || !form.address) return showToast('Name, city & address are required', 'error');
    if (!form.slug) form.slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSaving(true);
    try {
      if (modal === 'add') {
        const { data } = await api.post('/restaurants', form);
        setRestaurants(prev => [data.data, ...prev]);
        showToast('Restaurant branch created successfully!');
      } else {
        const { data } = await api.put(`/restaurants/${form._id}`, form);
        setRestaurants(prev => prev.map(r => r._id === form._id ? data.data : r));
        showToast('Restaurant branch updated successfully!');
      }
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const confirmDeleteRestaurant = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/restaurants/${deleteTarget._id}`);
      setRestaurants(prev => prev.filter(r => r._id !== deleteTarget._id));
      showToast('Restaurant branch deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally { setDeleting(false); }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fSvc = (k, v) => setForm(p => ({ ...p, services: { ...p.services, [k]: v } }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="header-title" style={{ margin: 0 }}>Restaurants & Branches</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{restaurants.length} total active & inactive branches</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Branch</button>
      </div>

      <div className="card" style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={15} />
            <input className="search-input" placeholder="Search branch name, address..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control form-select" style={{ width: 170 }} value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>City / Area</th>
                    <th>Phone</th>
                    <th>Operating Hours</th>
                    <th>Rating</th>
                    <th>Services</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {r.image ? (
                            <img
                              src={r.image}
                              alt={r.name}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                              <Store size={20} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{r.name}</div>
                            {r.isFeatured && <span className="badge badge-orange" style={{ marginTop: 2 }}>Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13 }}>
                          <MapPin size={13} color="var(--accent)" />
                          <span>{r.city}{r.area ? `, ${r.area}` : ''}</span>
                        </div>
                      </td>
                      <td className="text-sm text-muted">{r.phone || '—'}</td>
                      <td className="text-sm text-muted">{r.openingTime || '11:00 AM'} - {r.closingTime || '02:00 AM'}</td>
                      <td className="text-sm">⭐ {r.rating}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {r.services?.delivery && <span className="badge badge-blue">Delivery</span>}
                          {r.services?.pickup && <span className="badge badge-purple">Pickup</span>}
                          {r.services?.dineIn && <span className="badge badge-green">Dine-In</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${r.active ? 'badge-green' : 'badge-red'}`}>
                          {r.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn btn-icon" onClick={() => openEdit(r)} title="Edit branch">
                            <Pencil size={14} />
                          </button>
                          <button type="button" className="btn btn-icon" style={{ color: 'var(--red)' }} onClick={() => setDeleteTarget(r)} title="Delete branch">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {restaurants.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <Store size={36} />
                          <h3>No restaurant branches found</h3>
                          <p>Add your first branch location to enable online ordering.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Add / Edit Restaurant Modal */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Restaurant Branch' : 'Edit Branch Location'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Branch'}</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Branch Name *</label>
              <input className="form-control" value={form.name} onChange={e => { f('name', e.target.value); f('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }} placeholder="e.g. UrbanBite DHA Phase 6" />
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <select className="form-control form-select" value={form.city} onChange={e => f('city', e.target.value)}>
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Area / Sector</label>
              <input className="form-control" value={form.area} onChange={e => f('area', e.target.value)} placeholder="DHA Phase 6" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input className="form-control" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+92 42 3574 8891" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Street Address *</label>
            <input className="form-control" value={form.address} onChange={e => f('address', e.target.value)} placeholder="Sector CCA, Block MB, DHA Phase 6, Lahore" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Opening Time</label>
              <input className="form-control" value={form.openingTime} onChange={e => f('openingTime', e.target.value)} placeholder="11:00 AM" />
            </div>
            <div className="form-group">
              <label className="form-label">Closing Time</label>
              <input className="form-control" value={form.closingTime} onChange={e => f('closingTime', e.target.value)} placeholder="02:00 AM" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image Banner URL</label>
            <input className="form-control" value={form.image} onChange={e => f('image', e.target.value)} placeholder="https://images.unsplash.com/..." />
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 8, paddingTop: 4 }}>
            <strong className="text-sm" style={{ width: '100%' }}>Available Services:</strong>
            {[['delivery', 'Delivery'], ['pickup', 'Pickup'], ['dineIn', 'Dine-In']].map(([k, l]) => (
              <label key={k} className="form-check">
                <input type="checkbox" checked={form.services?.[k] || false} onChange={e => fSvc(k, e.target.checked)} />
                {l}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20, paddingTop: 6 }}>
            <label className="form-check"><input type="checkbox" checked={form.active !== false} onChange={e => f('active', e.target.checked)} /> Active Branch</label>
            <label className="form-check"><input type="checkbox" checked={form.isFeatured || false} onChange={e => f('isFeatured', e.target.checked)} /> Featured Branch</label>
          </div>
        </Modal>
      )}

      {/* Delete Branch Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Branch Location?"
        message={`Are you sure you want to delete branch "${deleteTarget?.name}"?`}
        confirmText="Delete Branch"
        confirmBtnClass="btn-danger"
        loading={deleting}
        onConfirm={confirmDeleteRestaurant}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
