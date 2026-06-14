'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { customersApi } from '@/lib/api';
import { User, Pagination } from '@/types';
import { Input, Button, Spinner, Badge } from '@/components/ui';
import { Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersApi.list({ page, limit: 15, search: search || undefined });
      setCustomers(res.data.data.customers);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination?.total ?? 0} registered customers
          </p>
        </div>
        <Link href="/customers/new">
          <Button><UserPlus size={16} /> Add Customer</Button>
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'National ID', 'Email', 'Phone', 'Extinguishers', 'Verified', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center"><Spinner /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">No customers found</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{c.national_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">
                    {(c as User & { extinguisher_count?: number }).extinguisher_count ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={c.is_verified ? 'active' : 'failed'} label={c.is_verified ? 'Verified' : 'Unverified'} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/customers/${c.id}`} className="text-sm text-brand-600 hover:underline font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
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
