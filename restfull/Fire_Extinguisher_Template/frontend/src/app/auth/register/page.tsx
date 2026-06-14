'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Input, Button, Alert } from '@/components/ui';
import { Flame } from 'lucide-react';

const registerSchema = z.object({
  name:        z.string().min(2, 'Name must be at least 2 characters'),
  email:       z.string().email('Enter a valid email'),
  phone:       z.string().min(7, 'Enter a valid phone number'),
  national_id: z.string().min(5, 'National ID must be at least 5 characters').regex(/^[A-Za-z0-9\-]+$/, 'Letters, numbers and hyphens only'),
  address:     z.string().optional(),
  password:    z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'Digits only'),
});

type RegisterForm = z.infer<typeof registerSchema>;
type OtpForm      = z.infer<typeof otpSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, user } = useAuth();
  const [step, setStep]     = useState<'form' | 'otp'>('form');
  const [email, setEmail]   = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const form    = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const onRegister = async (data: RegisterForm) => {
    setError(''); setLoading(true);
    try {
      const { confirmPassword: _, ...payload } = data;
      await authApi.register(payload);
      setEmail(data.email);
      setUserName(data.name);
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onOtp = async (data: OtpForm) => {
    setError(''); setLoading(true);
    try {
      await authApi.verifyOtp({ email, code: data.code, purpose: 'registration' });
      // Registration complete - redirect to login
      router.push('/auth/login?verified=true');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4">
            <Flame size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {step === 'form'
              ? 'Register to manage your fire extinguishers'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="card p-8">
          {error && <div className="mb-6"><Alert type="error" message={error} /></div>}

          {step === 'form' ? (
            <form onSubmit={form.handleSubmit(onRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full name *"
                  placeholder="John Doe"
                  error={form.formState.errors.name?.message}
                  {...form.register('name')}
                />
                <Input
                  label="National ID *"
                  placeholder="1199800123456789"
                  error={form.formState.errors.national_id?.message}
                  {...form.register('national_id')}
                />
              </div>
              <Input
                label="Email address *"
                type="email"
                placeholder="john@example.com"
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
              <Input
                label="Phone number *"
                type="tel"
                placeholder="+250 788 000 000"
                error={form.formState.errors.phone?.message}
                {...form.register('phone')}
              />
              <Input
                label="Address"
                placeholder="KG 123 St, Kigali"
                error={form.formState.errors.address?.message}
                {...form.register('address')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Password *"
                  type="password"
                  placeholder="••••••••"
                  error={form.formState.errors.password?.message}
                  hint="8+ chars, 1 uppercase, 1 number"
                  {...form.register('password')}
                />
                <Input
                  label="Confirm password *"
                  type="password"
                  placeholder="••••••••"
                  error={form.formState.errors.confirmPassword?.message}
                  {...form.register('confirmPassword')}
                />
              </div>
              <Button type="submit" loading={loading} className="w-full mt-2">
                Create account
              </Button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <a href="/auth/login" className="text-brand-600 font-medium hover:underline">Sign in</a>
              </p>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOtp)} className="space-y-4">
              <p className="text-sm text-gray-600">
                Hi <strong>{userName}</strong>! Enter the 6-digit code sent to <strong>{email}</strong> to verify your account.
              </p>
              <Input
                label="Verification code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                error={otpForm.formState.errors.code?.message}
                {...otpForm.register('code')}
              />
              <Button type="submit" loading={loading} className="w-full">
                Verify email &amp; continue
              </Button>
              <button
                type="button"
                onClick={() => authApi.resendOtp({ email, purpose: 'registration' })}
                className="w-full text-sm text-brand-600 hover:underline"
              >
                Resend code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
