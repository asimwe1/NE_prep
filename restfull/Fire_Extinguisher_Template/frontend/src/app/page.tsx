'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect authenticated users to their dashboard
      router.replace('/dashboard');
    } else {
      // Redirect unauthenticated users to login
      router.replace('/auth/login');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
