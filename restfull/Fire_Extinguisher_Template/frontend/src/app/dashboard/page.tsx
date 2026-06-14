'use client';

import { useEffect, useState } from 'react';
import { extinguishersApi, notificationsApi, escalationsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Spinner, Badge } from '@/components/ui';
import { Extinguisher, Notification, Escalation } from '@/types';
import { format } from 'date-fns';
import { FireExtinguisher, Bell, AlertTriangle, CheckCircle } from 'lucide-react';

interface Stats {
  expiring: Extinguisher[];
  notifStats: Record<string, number>;
  escalationStats: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [recentNotifs, setRecentNotifs] = useState<Notification[]>([]);
  const [recentEscs, setRecentEscs]     = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const promises: Promise<unknown>[] = [
          notificationsApi.list({ limit: 5 }),
        ];

        if (user?.role !== 'customer') {
          promises.push(
            extinguishersApi.expiring(30),
            notificationsApi.stats(),
            escalationsApi.stats(),
            escalationsApi.list({ limit: 5 }),
          );
        }

        const results = await Promise.allSettled(promises);

        const notifList = results[0].status === 'fulfilled' ? (results[0] as { value: { data: { data: { notifications: Notification[] } } } }).value.data.data.notifications : [];
        setRecentNotifs(notifList);

        if (user?.role !== 'customer') {
          const expiring = results[1].status === 'fulfilled' ? (results[1] as { value: { data: { data: Extinguisher[] } } }).value.data.data : [];
          const notifStats = results[2].status === 'fulfilled' ? (results[2] as { value: { data: { data: Record<string, number> } } }).value.data.data : {};
          const escStats   = results[3].status === 'fulfilled' ? (results[3] as { value: { data: { data: Record<string, number> } } }).value.data.data : {};
          const escList    = results[4].status === 'fulfilled' ? (results[4] as { value: { data: { data: { escalations: Escalation[] } } } }).value.data.data.escalations : [];
          setStats({ expiring, notifStats, escalationStats: escStats });
          setRecentEscs(escList);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with your fire safety system.</p>
      </div>

      {/* Stat cards — staff/admin */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FireExtinguisher size={20}/>} label="Expiring (30d)" value={stats.expiring.length} color="yellow" />
          <StatCard icon={<Bell size={20}/>} label="Notifications sent" value={stats.notifStats.sent ?? 0} color="blue" />
          <StatCard icon={<CheckCircle size={20}/>} label="Acknowledged" value={stats.notifStats.acknowledged ?? 0} color="green" />
          <StatCard icon={<AlertTriangle size={20}/>} label="Open escalations" value={stats.escalationStats.open ?? 0} color="red" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent notifications */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-brand-600" /> Recent Notifications
          </h2>
          {recentNotifs.length === 0 ? (
            <p className="text-sm text-gray-400">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentNotifs.map((n) => (
                <li key={n.id} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{n.customer_name || 'Customer'}</p>
                    <p className="text-xs text-gray-500">{format(new Date(n.sent_at), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                  <Badge status={n.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent escalations — staff/admin only */}
        {user?.role !== 'customer' && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> Recent Escalations
            </h2>
            {recentEscs.length === 0 ? (
              <p className="text-sm text-gray-400">No escalations.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentEscs.map((e) => (
                  <li key={e.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.customer_name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{e.reason}</p>
                    </div>
                    <Badge status={e.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-50 text-yellow-700',
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-700',
  };
  return (
    <div className="card p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
