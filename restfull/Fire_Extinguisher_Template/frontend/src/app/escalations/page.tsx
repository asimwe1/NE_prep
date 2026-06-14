'use client';

import { useEffect, useState, useCallback } from 'react';
import { escalationsApi } from '@/lib/api';
import { Escalation } from '@/types';
import { Spinner, Badge, Alert, Button, Input } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['open', 'in_review', 'notified_authority', 'resolved', 'closed'];

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [updating, setUpdating]   = useState<string | null>(null);
  const [message, setMessage]     = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm]   = useState({ status: '', notes: '', authority_ref: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await escalationsApi.list({ limit: 50, status: filter || undefined });
      setEscalations(res.data.data.escalations);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (esc: Escalation) => {
    setEditingId(esc.id);
    setEditForm({ status: esc.status, notes: esc.notes || '', authority_ref: esc.authority_ref || '' });
  };

  const saveUpdate = async (id: string) => {
    setUpdating(id);
    try {
      await escalationsApi.update(id, {
        status: editForm.status || undefined,
        notes: editForm.notes || undefined,
        authority_ref: editForm.authority_ref || undefined,
      });
      setMessage({ type: 'success', text: 'Escalation updated.' });
      setEditingId(null);
      load();
    } catch {
      setMessage({ type: 'error', text: 'Update failed. Please try again.' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={22} className="text-red-500" /> Escalations
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage non-compliance cases and authority notifications.</p>
      </div>

      {message && (
        <div className="mb-4"><Alert type={message.type} message={message.text} /></div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : escalations.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No escalations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalations.map((esc) => (
            <div key={esc.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge status={esc.status} />
                    {esc.authority_ref && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-mono">
                        Ref: {esc.authority_ref}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{esc.customer_name}</p>
                  <p className="text-xs text-gray-500 font-mono">ID: {esc.national_id} · {esc.customer_phone}</p>
                  <p className="text-sm text-gray-700 mt-2">{esc.reason}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Expiry: {esc.expiry_date ? format(new Date(esc.expiry_date), 'dd MMM yyyy') : '—'}</span>
                    <span>Escalated: {format(new Date(esc.escalated_at), 'dd MMM yyyy')}</span>
                    {esc.resolved_at && <span>Resolved: {format(new Date(esc.resolved_at), 'dd MMM yyyy')}</span>}
                  </div>
                  {esc.notes && <p className="text-xs text-gray-500 mt-1 italic">{esc.notes}</p>}
                </div>

                <div className="flex gap-2 shrink-0">
                  {editingId !== esc.id && (
                    <Button variant="secondary" onClick={() => startEdit(esc)}>Update</Button>
                  )}
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === esc.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="label">Status</label>
                    <select
                      className="input"
                      value={editForm.status}
                      onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Authority reference"
                    placeholder="e.g. RNP/2024/001"
                    value={editForm.authority_ref}
                    onChange={(e) => setEditForm(f => ({ ...f, authority_ref: e.target.value }))}
                  />
                  <Input
                    label="Notes"
                    placeholder="Internal notes..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  />
                  <div className="flex gap-2 sm:col-span-3">
                    <Button loading={updating === esc.id} onClick={() => saveUpdate(esc.id)}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
