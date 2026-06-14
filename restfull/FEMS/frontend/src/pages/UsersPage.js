import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Search, Shield, UserCheck, UserX, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { authAPI } from '../services/api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const ROLES = ['admin', 'inspector', 'user'];

function roleBadge(role) {
  const map = { admin: 'badge-red', inspector: 'badge-cyan', user: 'badge-green' };
  return <span className={`badge ${map[role] || 'badge-gray'}`}>{role}</span>;
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleModal, setRoleModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers({ page, limit: 10, search });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (user) => {
    try {
      await authAPI.toggleUser(user.id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleRoleChange = async () => {
    setSaving(true);
    try {
      await authAPI.updateRole(roleModal.id, newRole);
      toast.success('Role updated');
      setRoleModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Users</h2><p>Manage system users and roles</p></div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input className="form-control" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><h3>No users found</h3></div></td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.firstName} {user.lastName}</strong></td>
                <td>{user.email}</td>
                <td>{roleBadge(user.role)}</td>
                <td><span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(user)}>
                      {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-icon" title="View details" onClick={() => setViewModal(user)}>
                      <Eye size={14} />
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => { setRoleModal(user); setNewRole(user.role); }}>
                      <Shield size={13} /> Role
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} style={{ width: 'min(100%, 400px)' }}>
            <div className="modal-header">
              <h3>Change Role</h3>
              <button type="button" className="btn-icon" onClick={() => setRoleModal(null)}><X size={16} /></button>
            </div>
            {roleModal && (
              <>
            <div className="modal-body">
              <p style={{ marginBottom: 16, color: 'var(--text-dim)' }}>
                Changing role for <strong>{roleModal.firstName} {roleModal.lastName}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">New Role</label>
                <select className="form-control" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setRoleModal(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleRoleChange} disabled={saving || newRole === roleModal.role}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : 'Update Role'}
              </button>
            </div>
              </>
            )}
      </Modal>

      <Modal open={!!viewModal} onClose={() => setViewModal(null)}>
            <div className="modal-header">
              <div>
                <h3>User Details</h3>
                <p className="modal-subtitle">Review account identity, access level, and activation state before making admin changes.</p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setViewModal(null)}><X size={16} /></button>
            </div>
            {viewModal && (
              <>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><label>Full Name</label><span>{viewModal.firstName} {viewModal.lastName}</span></div>
                <div className="detail-item"><label>Email</label><span>{viewModal.email}</span></div>
                <div className="detail-item"><label>Role</label>{roleBadge(viewModal.role)}</div>
                <div className="detail-item"><label>Status</label><span className={`badge ${viewModal.isActive ? 'badge-green' : 'badge-red'}`}>{viewModal.isActive ? 'Active' : 'Inactive'}</span></div>
                <div className="detail-item"><label>Joined</label><span>{viewModal.createdAt ? format(new Date(viewModal.createdAt), 'dd MMM yyyy') : '-'}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setViewModal(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => { setViewModal(null); setRoleModal(viewModal); setNewRole(viewModal.role); }}>Change Role</button>
            </div>
              </>
            )}
      </Modal>
    </div>
  );
}
