import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Utensils, Star, Clock, Flame, Sparkles, Tag, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageInputSelector from '../components/ImageInputSelector';
import { showToast } from '../components/Toast';

const emptyForm = {
  name: '',
  slug: '',
  categoryId: '',
  price: '',
  originalPrice: '',
  discount: 0,
  rating: '4.8',
  reviewCount: 0,
  calories: '',
  prepTime: '10-15 min',
  description: '',
  image: '',
  ingredients: '',
  isPopular: false,
  isFeatured: false,
  isNew: false,
  available: true
};

export default function FoodsPage() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [deleteTarget, setDeleteTarget] = useState(null); // food item object to delete
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/foods/admin/all', { params: { search, category: catFilter, page, limit: 50 } });
      let list = data.data || [];
      if (availFilter === 'available') list = list.filter(f => f.available);
      if (availFilter === 'unavailable') list = list.filter(f => !f.available);
      setFoods(list);
      setTotal(data.total || list.length);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load foods', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { fetchFoods(); }, [search, catFilter, availFilter, page]);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (food) => {
    setForm({
      ...food,
      name: food.name || '',
      slug: food.slug || '',
      categoryId: food.categoryId || '',
      price: food.price !== undefined ? food.price.toString() : '',
      originalPrice: food.originalPrice !== undefined ? food.originalPrice.toString() : '',
      discount: food.discount !== undefined ? food.discount.toString() : '0',
      rating: food.rating !== undefined ? food.rating.toString() : '4.8',
      reviewCount: food.reviewCount !== undefined ? food.reviewCount.toString() : '0',
      calories: food.calories || '',
      prepTime: food.prepTime || '10-15 min',
      description: food.description || '',
      image: food.image || '',
      ingredients: Array.isArray(food.ingredients) ? food.ingredients.join(', ') : (food.ingredients || ''),
      available: food.available !== false,
      isPopular: !!food.isPopular,
      isFeatured: !!food.isFeatured,
      isNew: !!food.isNew
    });
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId || !form.price) return showToast('Name, category & selling price are required', 'error');
    if (parseFloat(form.price) < 0) return showToast('Selling price cannot be negative', 'error');
    if (!form.slug) form.slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        originalPrice: parseFloat(form.originalPrice) || 0,
        discount: parseInt(form.discount) || 0,
        rating: Math.min(5, Math.max(0, parseFloat(form.rating) || 4.8)),
        reviewCount: Math.max(0, parseInt(form.reviewCount) || 0),
        calories: form.calories ? form.calories.trim() : '',
        prepTime: form.prepTime ? form.prepTime.trim() : '10-15 min',
        description: form.description ? form.description.trim() : '',
        ingredients: form.ingredients ? form.ingredients.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      if (modal === 'add') {
        const { data } = await api.post('/foods', payload);
        setFoods(prev => [data.data, ...prev]);
        setTotal(t => t + 1);
        showToast('Food item created successfully!');
      } else {
        const { data } = await api.put(`/foods/${form._id}`, payload);
        setFoods(prev => prev.map(f => f._id === form._id ? data.data : f));
        showToast('Food item updated successfully!');
      }
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const confirmDeleteFood = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/foods/${deleteTarget._id}`);
      setFoods(prev => prev.filter(f => f._id !== deleteTarget._id));
      showToast('Food item deleted successfully');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally { setDeleting(false); }
  };

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const pages = Math.ceil(total / 50);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Foods & Menu Management</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{total} total menu items in database</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Food Item</button>
      </div>

      {/* ── Unified Menu Table & Filters Card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Toolbar & Filters */}
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={15} />
            <input className="search-input" placeholder="Search foods by name, description..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control form-select" style={{ width: 180 }} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
          </select>
          <select className="form-control form-select" style={{ width: 160 }} value={availFilter} onChange={e => { setAvailFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {loading ? <div className="loading-overlay" style={{ minHeight: 200 }}><div className="spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 260 }}>Food Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Rating</th>
                  <th>Availability</th>
                  <th>Badges</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {foods.map(food => {
                  const catObj = categories.find(c => c.slug === food.categoryId || c._id === food.categoryId);
                  const catName = catObj ? catObj.name : (food.categoryId || 'General');

                  return (
                    <tr key={food._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          {food.image ? (
                            <img
                              src={food.image}
                              alt={food.name}
                              className="food-img"
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className="food-img-placeholder" style={{ display: food.image ? 'none' : 'flex' }}>
                            <Utensils size={18} color="var(--accent)" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5, whiteSpace: 'normal', lineHeight: 1.3 }}>
                              {food.name}
                            </div>
                            {food.prepTime && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> {food.prepTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray" style={{ fontWeight: 600, fontSize: 12 }}>
                          {catName}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', fontSize: 13.5 }}>
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
                        <span style={{ whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Star size={12} fill="#F59E0B" color="#F59E0B" /> {food.rating || '5.0'} <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 400 }}>({food.reviewCount || 0})</span>
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
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          )}
                        </div>
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
                            onClick={() => openEdit(food)}
                            title="Edit item"
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
                            onClick={() => setDeleteTarget(food)}
                            title="Delete item"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {foods.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <Utensils size={36} />
                        <h3>No food items found</h3>
                        <p>Add your first menu item or clear filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', margin: 0 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Food Modal */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Add New Food Item' : `Edit Food: ${form.name || 'Item'}`}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (modal === 'add' ? 'Create Food Item' : 'Save Changes')}
              </button>
            </>
          }
        >
          {/* Row 1: Name & Slug */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Food Name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => {
                  f('name', e.target.value);
                  if (modal === 'add') {
                    f('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }
                }}
                placeholder="e.g. Crispy Zinger Smash Burger"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Slug / URL Key</label>
              <input
                className="form-control"
                value={form.slug}
                onChange={e => f('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
                placeholder="crispy-zinger-smash-burger"
              />
            </div>
          </div>

          {/* Row 2: Category & Availability */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-control form-select" value={form.categoryId} onChange={e => f('categoryId', e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <select
                className="form-control form-select"
                value={form.available ? 'true' : 'false'}
                onChange={e => f('available', e.target.value === 'true')}
              >
                <option value="true">Available (In Stock & Active)</option>
                <option value="false">Unavailable (Out of Stock)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Pricing (Selling Price vs Original Price & Discount) */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 800, color: 'var(--accent)' }}>Selling Price (Rs.) *</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.price}
                onChange={e => f('price', e.target.value)}
                placeholder="890"
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                Final payable price charged to customer
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Original / Regular Price (Rs.)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.originalPrice}
                onChange={e => f('originalPrice', e.target.value)}
                placeholder="1050"
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                Higher regular price shown with strikethrough
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Discount (%)</label>
              <input
                className="form-control"
                type="number"
                value={form.discount}
                onChange={e => f('discount', e.target.value)}
                placeholder="15"
                min="0"
                max="100"
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                Discount badge (e.g. 15% OFF)
              </div>
            </div>
          </div>

          {/* Row 4: Rating, Reviews, Prep Time & Calories */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rating (0.0 - 5.0)</label>
              <input
                className="form-control"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={e => f('rating', e.target.value)}
                placeholder="4.8"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Review Count</label>
              <input
                className="form-control"
                type="number"
                min="0"
                value={form.reviewCount}
                onChange={e => f('reviewCount', e.target.value)}
                placeholder="45"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preparation Time</label>
              <input
                className="form-control"
                value={form.prepTime}
                onChange={e => f('prepTime', e.target.value)}
                placeholder="10-15 min"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Calories / Energy</label>
              <input
                className="form-control"
                value={form.calories}
                onChange={e => f('calories', e.target.value)}
                placeholder="580 kcal"
              />
            </div>
          </div>

          {/* Row 5: Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.description}
              onChange={e => f('description', e.target.value)}
              placeholder="Describe taste profile, ingredients, freshness, and recipe details..."
            />
          </div>

          {/* Row 6: Image Input with Dual Option (URL + Local PC) */}
          <ImageInputSelector
            label="Food Item Image"
            value={form.image}
            onChange={(val) => f('image', val)}
            placeholder="https://images.unsplash.com/..."
          />

          {/* Row 7: Ingredients */}
          <div className="form-group">
            <label className="form-label">Ingredients (comma-separated)</label>
            <input
              className="form-control"
              value={form.ingredients}
              onChange={e => f('ingredients', e.target.value)}
              placeholder="Beef Patty, Aged Cheddar, Caramelized Onions, Secret Smoked Sauce"
            />
          </div>

          {/* Row 8: Promotional Badges & Highlights */}
          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            marginTop: 8
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Tag size={13} color="var(--accent)" /> Promotional Badges & Highlights:
            </div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              <label className="form-check" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={form.isPopular || false} onChange={e => f('isPopular', e.target.checked)} />
                <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Flame size={13} color="#EA580C" /> Popular Item
                </span>
              </label>
              <label className="form-check" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={form.isNew || false} onChange={e => f('isNew', e.target.checked)} />
                <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={13} color="#2563EB" /> New Launch
                </span>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Food Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Food Item?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Historical orders will retain item information.`}
        confirmText="Delete Food"
        confirmBtnClass="btn-danger"
        loading={deleting}
        onConfirm={confirmDeleteFood}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
