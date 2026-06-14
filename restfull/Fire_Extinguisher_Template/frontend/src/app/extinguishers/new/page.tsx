'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { extinguishersApi, customersApi } from '@/lib/api';
import { User } from '@/types';
import { Input, Button, Alert } from '@/components/ui';
import { Search } from 'lucide-react';

const schema = z.object({
  customer_id:   z.string().uuid('Select a valid customer'),
  quantity:      z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  purchase_date: z.string().optional(),
  expiry_date:   z.string().min(1, 'Expiry date is required'),
  serial_numbers:z.string().optional(),
  notes:         z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewExtinguisherPage() {
  const router = useRouter();
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers]   = useState<User[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [searching, setSearching]   = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const searchCustomers = async () => {
    if (!customerSearch.trim()) return;
    setSearching(true);
    try {
      const res = await customersApi.list({ search: customerSearch, limit: 10 });
      setCustomers(res.data.data.customers);
    } catch { /* ignore */ }
    finally { setSearching(false); }
  };

  const selectCustomer = (c: User) => {
    setSelectedCustomer(c);
    setValue('customer_id', c.id);
    setCustomers([]);
    setCustomerSearch('');
  };

  const onSubmit = async (data: FormData) => {
    setError(''); setLoading(true);
    try {
      const serialArr = data.serial_numbers
        ? data.serial_numbers.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      await extinguishersApi.create({ ...data, serial_numbers: serialArr });
      router.push('/extinguishers');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Register Extinguisher Purchase</h1>
        <p className="text-sm text-gray-500 mt-1">Record a new fire extinguisher purchase for a customer.</p>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        {/* Customer selector */}
        <div>
          <label className="label">Customer *</label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-500">{selectedCustomer.national_id} · {selectedCustomer.email}</p>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)} className="text-xs text-red-500 hover:underline">Change</button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input pl-8"
                    placeholder="Search customer by name, email, or ID..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchCustomers())}
                  />
                </div>
                <Button type="button" variant="secondary" onClick={searchCustomers} loading={searching}>Search</Button>
              </div>
              {customers.length > 0 && (
                <ul className="mt-1 border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white shadow-sm">
                  {customers.map(c => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        onClick={() => selectCustomer(c)}
                      >
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.national_id} · {c.email}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input type="hidden" {...register('customer_id')} />
              {errors.customer_id && <p className="error-msg">{errors.customer_id.message}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity *"
            type="number"
            min={1}
            placeholder="1"
            error={errors.quantity?.message}
            {...register('quantity')}
          />
          <Input
            label="Purchase date"
            type="date"
            error={errors.purchase_date?.message}
            {...register('purchase_date')}
          />
        </div>

        <Input
          label="Expiry date *"
          type="date"
          error={errors.expiry_date?.message}
          {...register('expiry_date')}
        />

        <Input
          label="Serial numbers"
          placeholder="EXT001, EXT002, EXT003 (comma separated)"
          hint="Optional — enter serial numbers separated by commas"
          error={errors.serial_numbers?.message}
          {...register('serial_numbers')}
        />

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Any additional notes..."
            {...register('notes')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>Register Purchase</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
