import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Eye, Plus, Wrench, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { extinguisherAPI, maintenanceAPI } from '../services/api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

const EMPTY_FORM = {
  extinguisherId: '',
  serviceDate: '',
  serviceCompany: '',
  technicianName: '',
  actionTaken: '',
  issuesIdentified: '',
  recommendations: '',
  nextServiceDate: '',
  cost: '',
  description: '',
  status: 'completed',
};

function statusBadge(status) {
  const map = { completed: 'badge-green', scheduled: 'badge-cyan', in_progress: 'badge-yellow', cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status.replace('_', ' ')}</span>;
}

export default function MaintenancePage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'view' | null
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [extinguishers, setExtinguishers] = useState([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await maintenanceAPI.list({ page, limit: 10, status: filterStatus });
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => {
    extinguisherAPI.list({ limit: 200 }).then((res) => setExtinguishers(res.data.data)).catch(() => {});
  }, []);

  const f = (date) => (date ? format(new Date(date), 'dd MMM yyyy') : '-');

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, serviceDate: new Date().toISOString().split('T')[0] });
    setErrors([]);
    setSelected(null);
    setModal('create');
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({
      extinguisherId: item.extinguisherId || '',
      serviceDate: item.serviceDate?.split('T')[0] || '',
      serviceCompany: item.serviceCompany || '',
      technicianName: item.technicianName || '',
      actionTaken: item.actionTaken || '',
      issuesIdentified: item.issuesIdentified || '',
      recommendations: item.recommendations || '',
      nextServiceDate: item.nextServiceDate?.split('T')[0] || '',
      cost: item.cost ?? '',
      description: item.description || '',
      status: item.status || 'completed',
    });
    setErrors([]);
    setModal('edit');
  };

  const openView = (item) => {
    setSelected(item);
    setModal('view');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setErrors([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      if (modal === 'create') {
        await maintenanceAPI.create(form);
        toast.success('Maintenance record created');
      } else {
        await maintenanceAPI.update(selected.id, form);
        toast.success('Maintenance record updated');
      }
      closeModal();
      fetchItems();
    } catch (err) {
      const errs = err.response?.data?.errors || [err.response?.data?.message || 'Save failed'];
      setErrors(errs);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await maintenanceAPI.updateStatus(id, status);
      toast.success('Status updated');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      {/* ── page header ── */}
      <div className="page-header">
        <div>
          <h2>Maintenance</h2>
          <p>Log maintenance actions and service recommendations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Record
        </button>
      </div>

      {/* ── filter ── */}
      <div className="search-bar">
        <select className="form-control" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* ── table ── */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Extinguisher</th><th>Service Date</th><th>Company</th>
              <th>Technician</th><th>Action</th><th>Status</th><th>Next Service</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><Wrench /><h3>No maintenance records found</h3></div></td></tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td><strong className="mono">{item.extinguisherCode}</strong></td>
                <td>{f(item.serviceDate)}</td>
                <td>{item.serviceCompany}</td>
                <td>{item.technicianName}</td>
                <td>{item.actionTaken}</td>
                <td>{statusBadge(item.status)}</td>
                <td>{f(item.nextServiceDate)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-icon" title="View" onClick={() => openView(item)}><Eye size={14} /></button>
                    <button className="btn-icon" title="Edit" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                    {item.status === 'scheduled' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(item.id, 'completed')}>Complete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* ── Add / Edit modal ── */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={closeModal} size="lg">
        <div className="modal-header">
          <div>
            <h3>{modal === 'create' ? 'Add Maintenance Record' : 'Edit Maintenance Record'}</h3>
            <p className="modal-subtitle">Capture service details, identified issues, and the next service plan.</p>
          </div>
          <button type="button" className="btn-icon" onClick={closeModal}><X size={16} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {errors.length > 0 && (
              <div className="alert alert-error">
                {errors.map((err, i) => <div key={i}>{err}</div>)}
              </div>
            )}

            <div className="modal-section">
              <div className="modal-section-title">Service Assignment</div>
              <div className="modal-section-copy">Pick the extinguisher and record who carried out the work.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Extinguisher *</label>
              <select
                className="form-control"
                value={form.extinguisherId}
                onChange={(e) => setForm({ ...form, extinguisherId: e.target.value })}
                required
              >
                <option value="">Select extinguisher…</option>
                {extinguishers.map((ext) => (
                  <option key={ext.id} value={ext.id}>{ext.extinguisherCode} — {ext.location}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Service Company *</label>
                <input className="form-control" value={form.serviceCompany} onChange={(e) => setForm({ ...form, serviceCompany: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Technician Name *</label>
                <input className="form-control" value={form.technicianName} onChange={(e) => setForm({ ...form, technicianName: e.target.value })} required />
              </div>
            </div>

            <div className="modal-section" style={{ marginTop: 8 }}>
              <div className="modal-section-title">Maintenance Outcome</div>
              <div className="modal-section-copy">Describe the service action and outcome.</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Action Taken *</label>
                <input className="form-control" value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Service Date *</label>
                <input type="date" className="form-control" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Next Service Date</label>
                <input type="date" className="form-control" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Cost</label>
                <input type="number" className="form-control" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0" min="0" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Issues Identified *</label>
              <textarea className="form-control" value={form.issuesIdentified} onChange={(e) => setForm({ ...form, issuesIdentified: e.target.value })} rows={3} required />
            </div>

            <div className="form-group">
              <label className="form-label">Recommendations</label>
              <textarea className="form-control" value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} rows={2} />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                : modal === 'create' ? 'Save Record' : 'Update Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View modal ── */}
      <Modal open={modal === 'view' && selected !== null} onClose={closeModal}>
        <div className="modal-header">
          <h3>Maintenance Details</h3>
          <button type="button" className="btn-icon" onClick={closeModal}><X size={16} /></button>
        </div>

        {selected && (
          <>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><label>Extinguisher</label><span className="mono">{selected.extinguisherCode}</span></div>
                <div className="detail-item"><label>Status</label>{statusBadge(selected.status)}</div>
                <div className="detail-item"><label>Service Company</label><span>{selected.serviceCompany}</span></div>
                <div className="detail-item"><label>Technician</label><span>{selected.technicianName}</span></div>
                <div className="detail-item"><label>Action</label><span>{selected.actionTaken}</span></div>
                <div className="detail-item"><label>Service Date</label><span>{f(selected.serviceDate)}</span></div>
                <div className="detail-item"><label>Next Service</label><span>{f(selected.nextServiceDate)}</span></div>
                <div className="detail-item"><label>Cost</label><span>{selected.cost > 0 ? selected.cost.toLocaleString() : '-'}</span></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><label>Issues Identified</label><span>{selected.issuesIdentified}</span></div>
                {selected.recommendations && (
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}><label>Recommendations</label><span>{selected.recommendations}</span></div>
                )}
                {selected.description && (
                  <div className="detail-item" style={{ gridColumn: '1 / -1' }}><label>Description</label><span>{selected.description}</span></div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => { closeModal(); openEdit(selected); }}>Edit</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
