'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { extinguishersApi } from '@/lib/api';
import { Extinguisher, Pagination } from '@/types';
import { Spinner, Badge, Button } from '@/components/ui';
import { Plus, ChevronLeft, ChevronRight, FireExtinguisher } from 'lucide-react';
import { format } from 'date-fns';

export default function ExtinguishersPage() {
  const [items, setItems]           = useState<Extinguisher[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage]             = useState(1);
  const [filter, setFilter]         = useState('');
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await extinguishersApi.list({ page, limit: 20, status: filter || undefined });
      setItems(res.data.data.extinguishers);
      setPagination(res.data.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const STATUS_FILTERS = ['', 'active', 'expiring_soon', 'expired', 'renewed', 'escalated'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FireExtinguisher size={22} className="text-brand-600" /> Extinguishers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination?.total ?? 0} records</p>
        </div>
        <Link href="/extinguishers/new">
          <Button><Plus size={16} /> Register Purchase</Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Customer', 'National ID', 'Qty', 'Purchase Date', 'Expiry Date', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><Spinner /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No records found</td></tr>
              ) : items.map((e) => {
                const daysLeft = e.days_until_expiry;
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{e.customer_name}</p>
                      <p className="text-xs text-gray-400">{e.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{e.national_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{e.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(e.purchase_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{format(new Date(e.expiry_date), 'dd MMM yyyy')}</p>
                      {daysLeft !== undefined && (
                        <p className={`text-xs ${daysLeft <= 0 ? 'text-red-500' : daysLeft <= 14 ? 'text-yellow-600' : 'text-gray-400'}`}>
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge status={e.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                <ChevronLeft size={14} />
              </Button>
              <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
