import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, GraduationCap, CheckCircle2, TrendingUp,
  Shield, Sparkles, ArrowRight, Settings, AlertCircle, FileCheck, Award
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { api, getError } from '../../api.js';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/admin/overview'),
      api.get('/admin/analytics'),
    ]).then(([overviewRes, analyticsRes]) => {
      if (overviewRes.status === 'fulfilled') {
        setStats(overviewRes.value.data.stats);
      }
      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-enter">
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="stat-card skeleton-card" />)}
        </div>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="page-enter">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> INSTITUTIONAL ADMINISTRATION</div>
          <h1>Northstar University Governance</h1>
          <p className="page-subtitle">Platform health, academic department analytics, course approvals, and user accounts.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/approvals" className="button button-soft">
            <FileCheck size={14} /> Course Approvals {s.pendingCourses > 0 && <span className="nav-new">{s.pendingCourses}</span>}
          </Link>
          <Link to="/admin/users" className="button button-primary">
            <Users size={14} /> Manage Users
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-icon violet"><Users size={16} /></span>
            <span className="stat-change">Active Community</span>
          </div>
          <div className="stat-value">{s.totalUsers || 0}</div>
          <div className="stat-label">{s.totalStudents || 0} Students · {s.totalInstructors || 0} Faculty</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-icon green"><BookOpen size={16} /></span>
            <span className="stat-change">Published Catalog</span>
          </div>
          <div className="stat-value">{s.totalCourses || 0}</div>
          <div className="stat-label">Active Courses ({s.pendingCourses || 0} pending review)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-icon blue"><TrendingUp size={16} /></span>
            <span className="stat-change">Institutional Retention</span>
          </div>
          <div className="stat-value">{s.completionRate || 0}%</div>
          <div className="stat-label">{s.completedEnrollments || 0} of {s.totalEnrollments || 0} Completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-icon orange"><Award size={16} /></span>
            <span className="stat-change">Verified Credentials</span>
          </div>
          <div className="stat-value">{s.totalCertificates || 0}</div>
          <div className="stat-label">Verified Issued Certificates</div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Monthly Activity Trend */}
        <div className="panel" style={{ padding: 20 }}>
          <div className="section-kicker">GROWTH TELEMETRY</div>
          <h3 style={{ font: '700 15px Manrope', margin: '4px 0 16px' }}>Monthly Enrollments & AI Interactions</h3>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer>
              <AreaChart data={analytics?.monthlyTrends || []}>
                <defs>
                  <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b7a6ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#b7a6ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8ad9d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8ad9d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="month" stroke="var(--faint)" fontSize={10} />
                <YAxis stroke="var(--faint)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="enrollments" stroke="#b7a6ff" strokeWidth={2} fillOpacity={1} fill="url(#colorEnroll)" name="Enrollments" />
                <Area type="monotone" dataKey="aiQueries" stroke="#8ad9d4" strokeWidth={2} fillOpacity={1} fill="url(#colorAI)" name="AI Queries" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="panel" style={{ padding: 20 }}>
          <div className="section-kicker">ACADEMIC STANDARDS</div>
          <h3 style={{ font: '700 15px Manrope', margin: '4px 0 16px' }}>Published Grade Distribution</h3>
          <div style={{ width: '100%', height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={analytics?.gradeDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="bucket" stroke="var(--faint)" fontSize={9} />
                <YAxis stroke="var(--faint)" fontSize={10} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="#88c99c" radius={[6, 6, 0, 0]} name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Link to="/admin/approvals" className="panel" style={{ padding: 18, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 13 }}>Course Approvals</b>
            <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
            Review new course proposals submitted by instructors and approve them for catalog enrollment.
          </p>
        </Link>

        <Link to="/admin/users" className="panel" style={{ padding: 18, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 13 }}>User Management</b>
            <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
            Provision instructor accounts, assign institutional roles, search student rosters, and manage access.
          </p>
        </Link>

        <Link to="/admin/settings" className="panel" style={{ padding: 18, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ fontSize: 13 }}>Institutional Settings</b>
            <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ fontSize: 10, color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
            Configure university branding, academic terms, certificate templates, and AI provider policies.
          </p>
        </Link>
      </div>
    </div>
  );
}
