import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, Flame, ShieldAlert, ShieldX, TrendingUp, Users, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { reportAPI } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportAPI.summary(),
      reportAPI.expiringSoon({ days: 30 }),
    ]).then(([summaryRes, expiringRes]) => {
      setSummary(summaryRes.data.data);
      setExpiringSoon(expiringRes.data.data.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-full"><div className="spinner" /></div>;

  const ext = summary?.extinguishers || {};
  const cust = summary?.customers || {};
  const inspections = summary?.inspections_last30d || {};

  const stats = [
    { label: 'Total Extinguishers', value: ext.total || 0, icon: Flame, color: 'cyan' },
    { label: 'Active', value: ext.active || 0, icon: CheckCircle, color: 'green' },
    { label: 'Expired', value: ext.expired || 0, icon: AlertTriangle, color: 'red' },
    { label: 'Expiring (30d)', value: ext.expiring_30d || 0, icon: Clock, color: 'yellow' },
    { label: 'Non-Compliant', value: ext.non_compliant || 0, icon: ShieldX, color: 'red' },
    { label: 'Total Facilities', value: cust.total || 0, icon: Users, color: 'cyan' },
    { label: 'Serviced', value: ext.serviced || 0, icon: Wrench, color: 'orange' },
    { label: 'Expiring (90d)', value: ext.expiring_90d || 0, icon: TrendingUp, color: 'yellow' },
  ];

  return (
    <div>
      <div className="dashboard-hero surface-panel">
        <div>
          <div className="hero-kicker">Operational Readiness</div>
          <h2 className="hero-title">Keep every extinguisher visible, serviceable, and audit-ready.</h2>
          <p className="hero-copy">
            Track field inventory, watch expiring cylinders, and push inspectors toward the next action before a compliance gap turns critical.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/extinguishers')}>Open Inventory</button>
            <button className="btn btn-secondary" onClick={() => navigate('/inspections')}>Schedule Inspection</button>
          </div>
        </div>
        <div className="hero-status-grid">
          <div className="hero-status-card">
            <strong>{ext.critical || 0}</strong>
            <span>Critical issues needing immediate intervention</span>
          </div>
          <div className="hero-status-card">
            <strong>{inspections.pending || 0}</strong>
            <span>Pending inspections still open this cycle</span>
          </div>
          <div className="hero-status-card">
            <strong>{ext.expiring_30d || 0}</strong>
            <span>Units expiring inside the next 30 days</span>
          </div>
          <div className="hero-status-card">
            <strong>{cust.total || 0}</strong>
            <span>Facilities currently under coverage</span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <div className="page-header-strap"><ShieldAlert size={14} /> Fire Extinguisher Status</div>
          <h2>Dashboard</h2>
          <p>Fire Extinguisher Management Overview</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-icon ${stat.color}`}><stat.icon size={22} /></div>
            <div className="stat-info">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 8 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Expiring Within 30 Days</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/extinguishers?compliance=critical')}>View All</button>
          </div>
          {expiringSoon.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <CheckCircle size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p>No extinguishers expiring soon</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Code</th><th>Location</th><th>Expiry</th><th>Days Left</th></tr>
                </thead>
                <tbody>
                  {expiringSoon.map((item) => (
                    <tr key={item.extinguisher_code} style={{ cursor: 'pointer' }} onClick={() => navigate('/extinguishers')}>
                      <td><strong className="mono">{item.extinguisher_code}</strong></td>
                      <td>{item.location}</td>
                      <td>{item.expiry_date ? format(new Date(item.expiry_date), 'dd MMM yyyy') : '-'}</td>
                      <td><span className={`badge ${item.days_remaining <= 7 ? 'badge-red' : item.days_remaining <= 30 ? 'badge-yellow' : 'badge-cyan'}`}>{item.days_remaining}d</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Last 30 Days Activity</h3>
          <div className="metric-strip">
            <div className="metric-row">
              <span style={{ color: 'var(--text-dim)' }}>Inspections Logged</span>
              <strong style={{ fontSize: 20, color: 'var(--accent)' }}>{inspections.total || 0}</strong>
            </div>
            <div className="metric-row">
              <span style={{ color: 'var(--text-dim)' }}>Completed Inspections</span>
              <strong style={{ fontSize: 20, color: 'var(--success)' }}>{inspections.completed || 0}</strong>
            </div>
            <div className="metric-row">
              <span style={{ color: 'var(--text-dim)' }}>Pending Inspections</span>
              <strong style={{ fontSize: 20, color: 'var(--warning)' }}>{inspections.pending || 0}</strong>
            </div>
            <div className="metric-row">
              <span style={{ color: 'var(--text-dim)' }}>Critical Compliance Issues</span>
              <strong style={{ fontSize: 20, color: 'var(--danger)' }}>{ext.critical || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
