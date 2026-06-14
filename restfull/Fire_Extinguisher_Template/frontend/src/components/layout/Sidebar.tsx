'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, FireExtinguisher, Bell, AlertTriangle, LogOut, Flame,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard, roles: ['customer','staff','admin'] },
  { href: '/customers',      label: 'Customers',      icon: Users,           roles: ['staff','admin'] },
  { href: '/extinguishers',  label: 'Extinguishers',  icon: FireExtinguisher,roles: ['staff','admin'] },
  { href: '/notifications',  label: 'Notifications',  icon: Bell,            roles: ['customer','staff','admin'] },
  { href: '/escalations',    label: 'Escalations',    icon: AlertTriangle,   roles: ['staff','admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <Flame size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">FireShield</p>
          <p className="text-xs text-gray-500">Safety Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={18} className={active ? 'text-brand-600' : 'text-gray-400'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
