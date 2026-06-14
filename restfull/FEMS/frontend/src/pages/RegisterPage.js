import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Flame, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','throwam.com','sharklasers.com',
  'guerrillamailblock.com','grr.la','guerrillamail.info','guerrillamail.biz','guerrillamail.de',
  'guerrillamail.net','guerrillamail.org','spam4.me','yopmail.com','yopmail.fr','cool.fr.nf',
  'jetable.fr.nf','nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf','trashmail.at','trashmail.com',
  'trashmail.io','trashmail.me','trashmail.net','dispostable.com','mailnull.com',
  'spamgourmet.com','trashmail.org','getairmail.com','filzmail.com','throwam.com',
  'tempr.email','discard.email','maildrop.cc','spamhereplease.com','mailscrap.com',
  'fakeinbox.com','mailnesia.com','mailnull.com','nowmymail.com','tempinbox.com',
  'mailexpire.com','mailfreeonline.com','mailguard.me','mailhazard.com','mailimate.com',
]);

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p) => /\d/.test(p), label: 'One number' },
  { test: (p) => /[@$!%*.?&_\-#]/.test(p), label: 'One special character (@$!%*.?&_-#)' },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [emailError, setEmailError] = useState('');

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, email: val });
    if (!val) { setEmailError(''); return; }
    if (!isValidEmailFormat(val)) { setEmailError('Enter a valid email address'); return; }
    if (isDisposableEmail(val)) { setEmailError('Temporary/disposable email addresses are not allowed'); return; }
    setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (!isValidEmailFormat(form.email)) {
      setErrors(['Enter a valid email address']);
      return;
    }
    if (isDisposableEmail(form.email)) {
      setErrors(['Temporary/disposable email addresses are not allowed']);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrors(['Passwords do not match']);
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      login(res.data.data.user, res.data.data.token);
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors || [err.response?.data?.message || 'Registration failed'];
      setErrors(errs);
    } finally {
      setLoading(false);
    }
  };

  const passStrength = PASSWORD_RULES.filter((rule) => rule.test(form.password)).length;
  const strengthColor = passStrength <= 2 ? 'var(--danger)' : passStrength <= 3 ? 'var(--warning)' : passStrength === 4 ? 'var(--orange)' : 'var(--success)';
  const strengthLabel = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][passStrength];

  return (
    <div className="auth-page">
      <div className="auth-shell compact">
        <div className="auth-brand-panel">
          <div>
            <div className="auth-badge"><Flame size={14} /> Team Onboarding</div>
            <h1>Bring operators, inspectors, and admins into the same safety workflow.</h1>
            <p>
              Every account should map to a real role in extinguisher operations. Keep the entry point controlled and the responsibilities explicit.
            </p>
            <div className="auth-points">
              <div className="auth-point">
                <strong>Admin</strong>
                <span>Owns reporting, escalations, user controls, and overall compliance oversight.</span>
              </div>
              <div className="auth-point">
                <strong>Inspector</strong>
                <span>Schedules checks, records findings, and drives corrective action on failing units.</span>
              </div>
              <div className="auth-point">
                <strong>User</strong>
                <span>Works with inventory visibility and the operational record around each extinguisher.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-box">
          <div className="auth-logo">
            <div className="logo-icon"><Flame size={28} /></div>
            <h1>Create Account</h1>
            <p>Register a new FEMCS operator</p>
          </div>

          {errors.length > 0 && (
            <div className="alert alert-error">
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {errors.map((err, index) => <li key={index}>{err}</li>)}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-control" placeholder="John" value={form.firstName} onChange={setField('firstName')} required autoComplete="given-name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-control" placeholder="Doe" value={form.lastName} onChange={setField('lastName')} required autoComplete="family-name" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-control"
                placeholder="john.doe@example.com"
                value={form.email}
                onChange={handleEmailChange}
                required
                autoComplete="email"
                style={{ borderColor: emailError ? 'var(--danger)' : undefined }}
              />
              {emailError && <div className="form-error">{emailError}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={setField('password')}
                  required
                  style={{ paddingRight: 44 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4, 5].map((index) => (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          background: index <= passStrength ? strengthColor : 'var(--border-strong)',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor, fontWeight: 700 }}>{strengthLabel}</div>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                    {PASSWORD_RULES.map((rule, index) => (
                      <span key={index} style={{ fontSize: 11, color: rule.test(form.password) ? 'var(--success)' : 'var(--text-muted)' }}>
                        {rule.test(form.password) ? 'Yes' : 'No'} {rule.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={setField('confirmPassword')}
                  required
                  style={{
                    paddingRight: 44,
                    borderColor: form.confirmPassword
                      ? form.password === form.confirmPassword ? 'var(--success)' : 'var(--danger)'
                      : undefined,
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <div className="form-error">Passwords do not match</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || passStrength < 5 || form.password !== form.confirmPassword || !!emailError} style={{ marginTop: 8 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : <><UserPlus size={16} /> Create Account</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-strong)', textDecoration: 'none', fontWeight: 700 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
