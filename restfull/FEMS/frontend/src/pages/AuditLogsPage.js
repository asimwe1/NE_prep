import React, { useCallback, useEffect, useState } from 'react';
import { Eye, FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { reportAPI } from '../services/api';

function prettyJson(value) {
  if (!value) return '-';
  try {
    return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditLogsPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportAPI.audit({ page, limit: 20, action, entityType });
      setItems(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, action, entityType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-strap">Audit Trail</div>
          <h2>Audit Logs</h2>
          <p>Review backend activity records, entity changes, and user actions with pagination and detail views.</p>
        </div>
      </div>

      <div className="search-bar">
        <input
          className="form-control"
          placeholder="Filter by action"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 220 }}
        />
        <input
          className="form-control"
          placeholder="Filter by entity type"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 220 }}
        />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>User</th>
              <th>Email</th>
              <th>Created</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><FileText /><h3>No audit logs found</h3></div></td></tr>
            ) : items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.action}</strong></td>
                <td>{item.entity_type}</td>
                <td>{[item.first_name, item.last_name].filter(Boolean).join(' ') || '-'}</td>
                <td>{item.user_email || '-'}</td>
                <td>{item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy HH:mm') : '-'}</td>
                <td>
                  <button className="btn-icon" onClick={() => setSelected(item)} title="View log details">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} size="lg">
            <div className="modal-header">
              <h3>Audit Log Details</h3>
              <button type="button" className="btn-icon" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            {selected && (
              <>
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: 16 }}>
                <div className="detail-item"><label>Action</label><span>{selected.action}</span></div>
                <div className="detail-item"><label>Entity Type</label><span>{selected.entity_type}</span></div>
                <div className="detail-item"><label>Entity ID</label><span className="mono">{selected.entity_id || '-'}</span></div>
                <div className="detail-item"><label>User Email</label><span>{selected.user_email || '-'}</span></div>
                <div className="detail-item"><label>IP Address</label><span>{selected.ip_address || '-'}</span></div>
                <div className="detail-item"><label>Created</label><span>{selected.created_at ? format(new Date(selected.created_at), 'dd MMM yyyy HH:mm:ss') : '-'}</span></div>
              </div>

              <div className="grid-2">
                <div className="detail-item" style={{ minHeight: 220 }}>
                  <label>Old Values</label>
                  <pre className="log-json">{prettyJson(selected.old_values)}</pre>
                </div>
                <div className="detail-item" style={{ minHeight: 220 }}>
                  <label>New Values</label>
                  <pre className="log-json">{prettyJson(selected.new_values)}</pre>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
              </>
            )}
      </Modal>
    </div>
  );
}
