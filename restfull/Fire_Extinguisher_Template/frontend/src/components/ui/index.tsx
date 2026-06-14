'use client';

import { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

// ── Input ───────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div>
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={clsx('input', error && 'input-error', className)}
        {...props}
      />
      {error && <p className="error-msg">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ── Button ──────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', loading, children, className, ...props }: ButtonProps) {
  const cls = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
  }[variant];

  return (
    <button className={clsx(cls, className)} disabled={loading || props.disabled} {...props}>
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

// ── Badge ───────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  active:              'bg-green-100 text-green-800',
  expiring_soon:       'bg-yellow-100 text-yellow-800',
  expired:             'bg-red-100 text-red-800',
  renewed:             'bg-blue-100 text-blue-800',
  escalated:           'bg-purple-100 text-purple-800',
  sent:                'bg-blue-100 text-blue-800',
  acknowledged:        'bg-green-100 text-green-800',
  failed:              'bg-red-100 text-red-800',
  open:                'bg-orange-100 text-orange-800',
  in_review:           'bg-yellow-100 text-yellow-800',
  notified_authority:  'bg-purple-100 text-purple-800',
  resolved:            'bg-green-100 text-green-800',
  closed:              'bg-gray-100 text-gray-700',
};

export function Badge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={clsx('badge', STATUS_STYLES[status] || 'bg-gray-100 text-gray-600')}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}

// ── Alert ───────────────────────────────────────────────────────────
interface AlertProps { type: 'error' | 'success' | 'warning'; message: string }
export function Alert({ type, message }: AlertProps) {
  const styles = {
    error:   'bg-red-50 border-red-300 text-red-800',
    success: 'bg-green-50 border-green-300 text-green-800',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
  }[type];
  return (
    <div className={clsx('rounded-lg border px-4 py-3 text-sm', styles)}>
      {message}
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <svg className={clsx('animate-spin text-brand-600', sz)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}
