import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Grid3X3, Users, Plus, CheckCircle, Clock,
  AlertCircle, RefreshCw, X, ShoppingBag, Edit3
} from 'lucide-react';
import api from '../../services/api';
import { showToast } from '../../components/Toast';

const LOCATIONS = ['Main Hall', 'Window Side', 'Family Section', 'VIP Lounge', 'Outdoor Terrace'];

export default function Tables() {
  const [searchParams] = useSearchParams();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [filterArea, setFilterArea] = useState('all');

  useEffect(() => {
    const s = searchParams.get('status');
    if (s !== null) setFilterStatus(s);
  }, [searchParams]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: 4, locationArea: 'Main Hall', notes: '' });
  const [adding, setAdding] = useState(false);

  const [selectedTable, setSelectedTable] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('Available');
  const [notesUpdate, setNotesUpdate] = useState('');
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reception/tables');
      setTables(res.data.data || []);
    } catch (err) {
      showToast('Failed to load table information.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.tableNumber.trim()) {
      showToast('Table number is required.', 'error');
      return;
    }

    try {
      setAdding(true);
      await api.post('/reception/tables', newTable);
      showToast(`Table ${newTable.tableNumber} added successfully!`);
      setShowAddModal(false);
      setNewTable({ tableNumber: '', capacity: 4, locationArea: 'Main Hall', notes: '' });
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add table.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedTable) return;

    try {
      setUpdating(true);
      await api.put(`/reception/tables/${selectedTable._id}/status`, {
        status: statusUpdate,
        notes: notesUpdate
      });
      showToast(`Table ${selectedTable.tableNumber} status updated to ${statusUpdate}.`);
      setSelectedTable(null);
      fetchTables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update table status.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (table) => {
    setSelectedTable(table);
    setStatusUpdate(table.status);
    setNotesUpdate(table.notes || '');
  };

  const filteredTables = tables.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterArea !== 'all' && t.locationArea !== filterArea) return false;
    return true;
  });

  const availableCount = tables.filter(t => t.status === 'Available').length;
  const occupiedCount = tables.filter(t => t.status === 'Occupied').length;
  const reservedCount = tables.filter(t => t.status === 'Reserved').length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            Table Management
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time dine-in floor map, seating capacity, and occupancy status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchTables}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add Table
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Tables</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{tables.length}</div>
          </div>
          <Grid3X3 size={24} color="var(--text-muted)" />
        </div>

        <div style={{ background: 'var(--green-soft)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #86EFAC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' }}>Available</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{availableCount}</div>
          </div>
          <CheckCircle size={24} color="var(--green)" />
        </div>

        <div style={{ background: 'var(--red-soft)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase' }}>Occupied</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>{occupiedCount}</div>
          </div>
          <Users size={24} color="var(--red)" />
        </div>

        <div style={{ background: 'var(--yellow-soft)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid #FDE047', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase' }}>Reserved</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--yellow)' }}>{reservedCount}</div>
          </div>
          <Clock size={24} color="var(--yellow)" />
        </div>
      </div>

      {/* Unified Tables Card with Filter Header */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-toolbar">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%' }}>
            <select
              className="form-control form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ maxWidth: 180 }}
            >
              <option value="all">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Reserved">Reserved</option>
            </select>

            <select
              className="form-control form-select"
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              style={{ maxWidth: 200 }}
            >
              <option value="all">All Floor Areas</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : filteredTables.length === 0 ? (
            <div className="empty-state">
              <Grid3X3 size={40} />
              <h3>No tables match the selected filters</h3>
              <p>Try switching floor area or status filter.</p>
            </div>
          ) : (
            <div className="tables-grid">
              {filteredTables.map(t => (
                <div key={t._id} className={`table-card status-${t.status}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="table-card-number">{t.tableNumber}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{t.locationArea}</div>
                    </div>
                    <span className={`badge ${t.status === 'Available' ? 'badge-green' : (t.status === 'Occupied' ? 'badge-red' : 'badge-yellow')}`}>
                      {t.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <Users size={14} />
                    <span>Capacity: <strong>{t.capacity} guests</strong></span>
                  </div>

                  {t.status === 'Occupied' && t.currentOrderNumber && (
                    <div style={{ background: 'white', padding: '6px 8px', borderRadius: 4, fontSize: 11, border: '1px solid var(--border)' }}>
                      Active Order: <span style={{ fontWeight: 800, color: 'var(--accent)' }}>#{t.currentOrderNumber}</span>
                    </div>
                  )}

                  {t.notes && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Note: {t.notes}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: 11 }}
                      onClick={() => openStatusModal(t)}
                    >
                      <Edit3 size={12} /> Status
                    </button>
                    {t.status === 'Available' && (
                      <Link
                        to="/reception/new-order"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: 11 }}
                      >
                        <ShoppingBag size={12} /> Dine-In
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Table Modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Dining Table</h2>
              <button className="btn-icon btn-sm" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddTable}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Table Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. T-15"
                    value={newTable.tableNumber}
                    onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Seating Capacity (Guests)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    max={50}
                    value={newTable.capacity}
                    onChange={e => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 4 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Floor Area</label>
                  <select
                    className="form-control form-select"
                    value={newTable.locationArea}
                    onChange={e => setNewTable({ ...newTable, locationArea: e.target.value })}
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Near corner, baby chair compatible"
                    value={newTable.notes}
                    onChange={e => setNewTable({ ...newTable, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={adding}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? 'Adding...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Update Table Status Modal ── */}
      {selectedTable && (
        <div className="modal-overlay" onClick={() => setSelectedTable(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Table {selectedTable.tableNumber} Status</h2>
              <button className="btn-icon btn-sm" onClick={() => setSelectedTable(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Change Status</label>
                  <select
                    className="form-control form-select"
                    value={statusUpdate}
                    onChange={e => setStatusUpdate(e.target.value)}
                  >
                    <option value="Available">Available (Ready for guests)</option>
                    <option value="Occupied">Occupied (Guests dining)</option>
                    <option value="Reserved">Reserved (Booked ahead)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Reserved for Ahmed family at 8:00 PM"
                    value={notesUpdate}
                    onChange={e => setNotesUpdate(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedTable(null)} disabled={updating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
