import { useEffect, useState } from 'react';
import { Search, UserPlus, Shield, User, X, Check, ArrowRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busy, setBusy] = useState(false);

  // New user form state
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', department: 'Computer Science & Engineering',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', {
        params: {
          search: search.trim() || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          limit: 50,
        },
      });
      setUsers(data.users || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}.`);
      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`User is now ${newStatus}.`);
      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/users', form);
      toast.success(`Created account for ${form.name}.`);
      setShowCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'student', department: 'Computer Science & Engineering' });
      loadUsers();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="section-kicker">USER GOVERNANCE</div>
          <h1>Institutional User Directory</h1>
          <p>Search, invite, approve, and manage permissions for students, instructors, and administrators.</p>
        </div>
        <button className="button button-primary" onClick={() => setShowCreateModal(true)}>
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 240, display: 'flex', gap: 8 }}>
          <div className="catalog-search" style={{ height: 38, flex: 1 }}>
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email address..."
            />
          </div>
          <button className="button button-soft" type="submit" style={{ height: 38 }}>
            Search
          </button>
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="field-label"
          style={{ width: 140, height: 38, margin: 0, padding: '0 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)' }}
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Administrators</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field-label"
          style={{ width: 140, height: 38, margin: 0, padding: '0 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)' }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>DEPARTMENT / ROLE</th>
              <th>STATUS</th>
              <th>JOINED</th>
              <th>ROLE ACTION</th>
              <th>STATUS ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
                  Loading user records...
                </td>
              </tr>
            ) : users.length ? (
              users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{u.name.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <b>{u.name}</b>
                        <small style={{ display: 'block', color: 'var(--muted)', fontSize: 9 }}>{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                    <small style={{ display: 'block', color: 'var(--faint)', fontSize: 8, marginTop: 4 }}>
                      {u.academic?.department || 'General'}
                    </small>
                  </td>
                  <td>
                    <span className={`status-badge-dot ${u.status}`}>
                      <i /> {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      style={{ fontSize: 10, padding: '4px 6px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="button button-soft"
                      style={{ height: 26, fontSize: 9, padding: '0 8px' }}
                      onClick={() => handleStatusToggle(u._id, u.status)}
                    >
                      {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
                  No users found matching query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showCreateModal && (
        <div className="mobile-scrim show" style={{ display: 'grid', placeItems: 'center', zIndex: 100 }}>
          <form className="panel" style={{ width: 440, padding: 24 }} onSubmit={handleCreateUser}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ font: '700 16px Manrope', margin: 0 }}>Create Institutional Account</h3>
              <button className="icon-button subtle" type="button" onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>

            <label className="field-label">
              Full Legal Name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. Jordan Lee" />
            </label>

            <label className="field-label">
              Institutional Email
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jordan@northstar.edu" />
            </label>

            <label className="field-label">
              Initial Password
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" />
            </label>

            <div className="form-row">
              <label className="field-label">
                Assigned Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
              </label>

              <label className="field-label">
                Department
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="button button-soft" type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="button button-primary" type="submit" disabled={busy}>
                {busy ? 'Creating...' : 'Create Account'} <Check size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
