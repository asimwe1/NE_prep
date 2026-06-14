'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import { Spinner, Badge, Alert, Button } from '@/components/ui';
import { Bell, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_LABELS: Record<string, string> = {
  expiry_30days: '30 days notice',
  expiry_14days: '14 days notice',
  expiry_7days:  '7 days notice',
  expiry_1day:   '1 day notice',
  expired:       'Expired',
};

export default function NotificationsPage() {
  const searchParams = useSearchParams();
  const ackId = searchParams.get('ack');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [ackLoading, setAckLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ limit: 50, status: filter || undefined });
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Auto-acknowledge if coming from email link
  useEffect(() => {
    if (ackId) {
      handleAcknowledge(ackId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ackId]);

  const handleAcknowledge = async (id: string) => {
    setAckLoading(id);
    try {
      await notificationsApi.acknowledge(id);
      setMessage({ type: 'success', text: 'Notification acknowledged successfully.' });
      load();
    } catch {
      setMessage({ type: 'error', text: 'Failed to acknowledge. Please try again.' });
    } finally {
      setAckLoading(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell size={22} className="text-brand-600" /> Notifications
        </h1>
        <p className="text-sm text-gray-500 mt-1">Track expiry alerts and acknowledge them here.</p>
      </div>

      {message && (
        <div className="mb-4">
          <Alert type={message.type} message={message.text} />
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'sent', 'acknowledged', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className={`card p-5 flex items-start justify-between gap-4 ${n.status === 'acknowledged' ? 'opacity-70' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge status={n.type === 'expired' ? 'expired' : 'expiring_soon'} label={TYPE_LABELS[n.type]} />
                  <Badge status={n.status} />
                </div>
                {n.customer_name && (
                  <p className="text-sm font-medium text-gray-900">{n.customer_name}</p>
                )}
                <p className="text-sm text-gray-500">
                  Expiry date: <span className="font-medium text-gray-700">{n.expiry_date ? format(new Date(n.expiry_date), 'dd MMM yyyy') : '—'}</span>
                  {n.quantity && ` · ${n.quantity} unit(s)`}
                </p>
                <p className="text-xs text-gray-400 mt-1">Sent: {format(new Date(n.sent_at), 'dd MMM yyyy HH:mm')}</p>
                {n.acknowledged_at && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Acknowledged: {format(new Date(n.acknowledged_at), 'dd MMM yyyy HH:mm')}
                  </p>
                )}
              </div>
              {n.status !== 'acknowledged' && (
                <Button
                  variant="secondary"
                  loading={ackLoading === n.id}
                  onClick={() => handleAcknowledge(n.id)}
                  className="shrink-0"
                >
                  <CheckCircle size={14} /> Acknowledge
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
