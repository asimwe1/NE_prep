'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Input, Button, Alert } from '@/components/ui';
import { Flame } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'Digits only'),
});

type LoginForm = z.infer<typeof loginSchema>;
type OtpForm   = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router  = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, user } = useAuth();
  const [step, setStep]     = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Show success message if coming from registration
    if (searchParams.get('verified') === 'true') {
      setSuccessMsg('Email verified successfully! Please sign in to continue.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const dashboardPath = getDashboardPath(user.role);
      router.replace(dashboardPath);
    }
  }, [user, router]);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const otpForm   = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const onLogin = async (data: LoginForm) => {
    setError(''); setLoading(true);
    try {
      await authApi.login(data);
      setEmail(data.email);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const onOtp = async (data: OtpForm) => {
    setError(''); setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, code: data.code, purpose: 'login' });
      const { token, user } = res.data.data;
      setAuth(user, token);
      
      // Redirect based on user role
      const dashboardPath = getDashboardPath(user.role);
      router.push(dashboardPath);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await authApi.resendOtp({ email, purpose: 'login' });
      setResendMsg('A new OTP has been sent to your email.');
    } catch {
      setResendMsg('Failed to resend. Try again shortly.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-brand-600 flex-col items-center justify-center p-12 text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 mb-6">
          <Flame size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3">FireShield</h1>
        <p className="text-brand-100 text-center text-lg max-w-sm">
          Fire extinguisher management — track purchases, monitor expiry, stay compliant.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
          {[
            ['📋', 'Customer Registry'],
            ['⏰', 'Expiry Tracking'],
            ['📧', 'Auto Notifications'],
            ['🚨', 'Escalation System'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 rounded-lg p-3 text-sm">
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'credentials' ? 'Sign in to your account' : 'Enter verification code'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {step === 'credentials'
                ? 'Welcome back. Enter your credentials to continue.'
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {successMsg && <div className="mb-4"><Alert type="success" message={successMsg} /></div>}
          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

          {step === 'credentials' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={loginForm.formState.errors.password?.message}
                {...loginForm.register('password')}
              />
              <Button type="submit" loading={loading} className="w-full">
                Continue
              </Button>
              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <a href="/auth/register" className="text-brand-600 font-medium hover:underline">Register</a>
              </p>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOtp)} className="space-y-4">
              <Input
                label="6-digit OTP"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                error={otpForm.formState.errors.code?.message}
                {...otpForm.register('code')}
              />
              {resendMsg && <p className="text-sm text-green-600">{resendMsg}</p>}
              <Button type="submit" loading={loading} className="w-full">
                Verify &amp; Sign in
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep('credentials')} className="text-gray-500 hover:text-gray-700">
                  ← Back
                </button>
                <button type="button" onClick={resendOtp} className="text-brand-600 font-medium hover:underline">
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to determine dashboard path based on user role
function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'staff':
      return '/dashboard';
    case 'customer':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}
