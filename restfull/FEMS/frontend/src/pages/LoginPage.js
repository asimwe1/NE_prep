import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.data.user, res.data.data.token);
      toast.success(`Welcome back, ${res.data.data.user.firstName}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      const errs = err.response?.data?.errors || [];
      setErrors(errs.length ? errs : [msg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <div>
            <div className="auth-badge"><Flame size={14} /> Fire Safety Control</div>
            <h1>Coordinate extinguisher readiness from one command surface.</h1>
            <p>
              Built for facilities teams that need fast inventory visibility, inspection cadence, and compliance escalation without drifting into a generic blue admin panel.
            </p>
            <div className="auth-points">
              <div className="auth-point">
                <strong>Inventory first</strong>
                <span>See which units are active, expiring, serviced, or overdue before field work starts.</span>
              </div>
              <div className="auth-point">
                <strong>Inspection discipline</strong>
                <span>Schedule inspections with time slots and keep maintenance recommendations attached to the unit history.</span>
              </div>
              <div className="auth-point">
                <strong>Compliance pressure</strong>
                <span>Use notifications and escalations to push critical extinguishers into action quickly.</span>
              </div>
            </div>
          </div>
          <div className="auth-footer-note">
            Default seeded admin access is included for local setup so you can validate the full workflow immediately.
          </div>
        </div>

        <div className="auth-box">
          <div className="auth-logo">
            <div className="logo-icon"><Flame size={28} /></div>
            <h1>Sign In</h1>
            <p>Fire Extinguisher Management & Compliance</p>
          </div>

          {errors.length > 0 && (
            <div className="alert alert-error">
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="admin@femcs.rw"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 12, color: 'var(--accent-strong)', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent-strong)', textDecoration: 'none', fontWeight: 700 }}>
                Create account
              </Link>
            </p>
          </div>

          {/* <div className="auth-helper-card">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
              Default admin: <span style={{ color: 'var(--accent-strong)', fontFamily: 'monospace' }}>admin@femcs.rw</span> / <span style={{ color: 'var(--accent-strong)', fontFamily: 'monospace' }}>Admin@1234</span>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
