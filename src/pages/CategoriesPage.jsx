import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tag, Utensils, X, Eye, ArrowRight, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageInputSelector from '../components/ImageInputSelector';
import { showToast } from '../components/Toast';

const empty = { name: '', slug: '', tagline: '', icon: 'Utensils', image: '', displayOrder: 1, popular: false, active: true };

export const getDefaultCategoryImage = (name = '', slug = '') => {
  const s = `${name} ${slug}`.toLowerCase();
  if (s.includes('pasta') || s.includes('rice') || s.includes('bowl') || s.includes('noodle')) {
    return 'https://images.unsplash.com/photo-1621996346565-e3d5d62810a9?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('burger') || s.includes('smash') || s.includes('sandwich')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('chicken') || s.includes('wing') || s.includes('broast') || s.includes('tender')) {
    return 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('wrap') || s.includes('roll') || s.includes('shawarma')) {
    return 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('fry') || s.includes('fries') || s.includes('snack') || s.includes('side')) {
    return 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('dessert') || s.includes('cake') || s.includes('sweet') || s.includes('shake') || s.includes('beverage') || s.includes('drink')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80';
  }
  if (s.includes('breakfast') || s.includes('egg') || s.includes('morning')) {
    return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Category Items Pop-up State
  const [viewingCat, setViewingCat] = useState(null);
  const [categoryFoods, setCategoryFoods] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(false);

  const fetchCats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories/admin/all');
      setCategories(data.data || []);
    } catch (err) {
      showToast('Failed to load categories', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCats(); }, []);

  const openAdd = () => { setForm(empty); setModal('add'); };
  const openEdit = (cat) => { setForm({ ...cat }); setModal('edit'); };

  const handleSave = async () => {
    if (!form.name) return showToast('Category name is required', 'error');
    if (!form.slug) form.slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!form.image) form.image = getDefaultCategoryImage(form.name, form.slug);
    setSaving(true);
    try {
      if (modal === 'add') {
        const { data } = await api.post('/categories', form);
        setCategories(prev => [...prev, data.data]);
        showToast('Category created successfully!');
      } else {
        const { data } = await api.put(`/categories/${form._id}`, form);
        setCategories(prev => prev.map(c => c._id === form._id ? data.data : c));
        showToast('Category updated successfully!');
      }
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget._id}`);
      setCategories(prev => prev.filter(c => c._id !== deleteTarget._id));
      showToast('Category deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally { setDeleting(false); }
  };

  // ── Open Category Items Modal ──
  const handleViewCategoryItems = async (cat) => {
    setViewingCat(cat);
    setLoadingFoods(true);
    setCategoryFoods([]);
    try {
      // First try fetching via slug, fallback to categoryId
      const res = await api.get('/foods/admin/all', {
        params: { category: cat.slug, limit: 200 }
      });
      let foods = res.data.data || [];
      if (foods.length === 0) {
        const fallbackRes = await api.get('/foods/admin/all', {
          params: { category: cat._id, limit: 200 }
        });
        foods = fallbackRes.data.data || [];
      }
      setCategoryFoods(foods);
    } catch (err) {
      showToast('Failed to load category items', 'error');
    } finally {
      setLoadingFoods(false);
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Food Categories Management</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{categories.length} total active & inactive categories</div>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Category</button>
      </div>

      {/* ── Table Card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <div className="loading-overlay" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Category</th>
                  <th>Tagline</th>
                  <th>Icon</th>
                  <th>Products Count</th>
                  <th>Display Order</th>
                  <th>Tags</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={cat.image || getDefaultCategoryImage(cat.name, cat.slug)}
                          alt={cat.name}
                          className="food-img"
                          style={{ width: 44, height: 44, minWidth: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getDefaultCategoryImage(cat.name, cat.slug);
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>{cat.name}</div>
                          <div className="text-xs text-muted" style={{ marginTop: 2 }}>{cat.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-muted" style={{ maxWidth: 220 }}>{cat.tagline || '—'}</td>
                    <td>
                      <span className="badge badge-gray" style={{ fontWeight: 600, fontSize: 12 }}>
                        {cat.icon || 'Utensils'}
                      </span>
                    </td>
                    <td>
                      {/* Clickable Products Count Button */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          background: (cat.itemCount || 0) > 0 ? '#F0F9FF' : '#F8FAFC',
                          border: `1px solid ${(cat.itemCount || 0) > 0 ? '#BAE6FD' : '#E2E8F0'}`,
                          color: (cat.itemCount || 0) > 0 ? '#0284C7' : '#64748B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleViewCategoryItems(cat)}
                        title={`Click to view all ${cat.itemCount || 0} product(s) in ${cat.name}`}
                      >
                        <Utensils size={12} color={(cat.itemCount || 0) > 0 ? '#0284C7' : '#94A3B8'} />
                        <span>{cat.itemCount || 0} Products</span>
                      </button>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 12 }}>
                        #{cat.displayOrder}
                      </span>
                    </td>
                    <td>{cat.popular ? <span className="badge badge-orange">Popular</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${cat.active ? 'badge-green' : 'badge-red'}`}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 20 }}>
                      <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="action-btn-edit"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#F0F9FF',
                            border: '1px solid #BAE6FD',
                            color: '#0284C7',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => openEdit(cat)}
                          title="Edit category"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className="action-btn-delete"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => setDeleteTarget(cat)}
                          title="Delete category"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <Tag size={36} />
                        <h3>No categories found</h3>
                        <p>Add your first food category to organize menu items.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Category Items Pop-Up Modal ── */}
      {viewingCat && (
        <div className="modal-overlay" onClick={() => setViewingCat(null)}>
          <div className="modal" style={{ maxWidth: 680, maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={18} color="var(--accent)" />
                  <span>{viewingCat.name}</span>
                  <span className="badge badge-gray" style={{ fontSize: 11 }}>Order: {viewingCat.displayOrder}</span>
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {viewingCat.tagline || `Category slug: ${viewingCat.slug}`}
                </div>
              </div>
              <button type="button" className="btn-icon btn-sm" onClick={() => setViewingCat(null)}><X size={16} /></button>
            </div>

            <div className="modal-body" style={{ padding: 0 }}>
              {/* Category Meta Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Total Items in Database: <span style={{ color: 'var(--accent)' }}>{categoryFoods.length}</span>
                </div>
                <Link
                  to="/foods"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setViewingCat(null)}
                >
                  Manage in Foods Page <ArrowRight size={12} />
                </Link>
              </div>

              {/* Items List */}
              {loadingFoods ? (
                <div className="loading-overlay" style={{ minHeight: 220 }}>
                  <div className="spinner" />
                </div>
              ) : categoryFoods.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <Utensils size={36} color="var(--text-muted)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>No food items assigned yet</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    This category does not contain any food items in the database.
                  </p>
                  <Link
                    to="/foods"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 14 }}
                    onClick={() => setViewingCat(null)}
                  >
                    <Plus size={13} /> Add Food to {viewingCat.name}
                  </Link>
                </div>
              ) : (
                <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Food Item</th>
                        <th>Price</th>
                        <th>Discount</th>
                        <th>Rating</th>
                        <th>Status</th>
                        <th>Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryFoods.map(food => (
                        <tr key={food._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {food.image ? (
                                <img
                                  src={food.image}
                                  alt={food.name}
                                  className="food-img"
                                  style={{ width: 40, height: 40, minWidth: 40 }}
                                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div className="food-img-placeholder" style={{ width: 40, height: 40, minWidth: 40, display: food.image ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Utensils size={18} color="var(--accent)" />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
                                  {food.name}
                                </div>
                                {food.prepTime && (
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                    <Clock size={11} /> {food.prepTime}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', fontSize: 13 }}>
                              Rs. {food.price?.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            {food.discount > 0 ? (
                              <span className="badge badge-green">-{food.discount}%</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <span style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                              ⭐ {food.rating || '5.0'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${food.available ? 'badge-green' : 'badge-red'}`}>
                              {food.available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {food.isPopular && <span className="badge badge-orange">Popular</span>}
                              {food.isNew && <span className="badge badge-blue">New</span>}
                              {!food.isPopular && !food.isNew && (
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setViewingCat(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Food Category' : 'Edit Category'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Category'}</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input className="form-control" value={form.name} onChange={e => { f('name', e.target.value); f('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); }} placeholder="e.g. Gourmet Burgers" />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input className="form-control" value={form.slug} onChange={e => f('slug', e.target.value)} placeholder="burgers" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tagline</label>
            <input className="form-control" value={form.tagline} onChange={e => f('tagline', e.target.value)} placeholder="e.g. Handcrafted beef & crispy chicken gourmet smashers" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Icon Name (Lucide Icon)</label>
              <input className="form-control" value={form.icon} onChange={e => f('icon', e.target.value)} placeholder="Utensils" />
            </div>
            <div className="form-group">
              <label className="form-label">Display Order</label>
              <input className="form-control" type="number" value={form.displayOrder} onChange={e => f('displayOrder', parseInt(e.target.value) || 1)} placeholder="1" />
            </div>
          </div>

          <ImageInputSelector
            label="Category Banner Image"
            value={form.image}
            onChange={(val) => f('image', val)}
            placeholder="https://images.unsplash.com/..."
          />

          <div style={{ display: 'flex', gap: 20, paddingTop: 6 }}>
            <label className="form-check"><input type="checkbox" checked={form.popular || false} onChange={e => f('popular', e.target.checked)} /> Popular Category</label>
            <label className="form-check"><input type="checkbox" checked={form.active !== false} onChange={e => f('active', e.target.checked)} /> Active</label>
          </div>
        </Modal>
      )}

      {/* Delete Category Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Food Category?"
        message={`Are you sure you want to delete category "${deleteTarget?.name}"? Items assigned to this category must be reassigned first.`}
        confirmText="Delete Category"
        confirmBtnClass="btn-danger"
        loading={deleting}
        onConfirm={confirmDeleteCategory}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
