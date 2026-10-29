import { useState, useEffect } from 'react';
import { Users, Check, X, Download, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';

export default function StudentRosterPage({ user }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses/managed');
      const list = data?.courses || [];
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourseId(list[0]._id);
        fetchRoster(list[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      toast.error(getError(err));
      setLoading(false);
    }
  };

  const fetchRoster = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/courses/${courseId}/roster`);
      setRoster(data?.data?.enrollments || []);
    } catch (err) {
      toast.error(getError(err));
      setRoster([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (id) => {
    setSelectedCourseId(id);
    fetchRoster(id);
  };

  const handleDecision = async (enrollmentId, decision) => {
    try {
      await api.patch(`/courses/enrollments/${enrollmentId}/decision`, { decision });
      toast.success(decision === 'approve' ? 'Enrollment approved!' : 'Enrollment declined.');
      fetchRoster(selectedCourseId);
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const exportCSV = () => {
    if (!roster.length) {
      toast.error('No learners in roster to export');
      return;
    }
    const headers = ['Learner Name', 'Email', 'Enrollment Status', 'Progress (%)', 'Enrolled Date'];
    const rows = roster.map((r) => [
      `"${r.userId?.name || 'Learner'}"`,
      `"${r.userId?.email || ''}"`,
      r.status,
      r.progress || 0,
      r.enrolledAt ? new Date(r.enrolledAt).toLocaleDateString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OmniClass_Roster_${selectedCourseId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Roster exported to CSV');
  };

  const filteredRoster = roster.filter((item) => {
    const matchesSearch =
      (item.userId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.userId?.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = roster.filter((r) => r.status === 'active').length;
  const completedCount = roster.filter((r) => r.status === 'completed').length;
  const pendingCount = roster.filter((r) => r.status === 'pending').length;

  return (
    <div className="page-enter p-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="section-kicker">COURSE ADMINISTRATION</div>
          <h1 className="text-3xl font-bold tracking-tight">Student Roster & Cohort</h1>
          <p className="text-sm opacity-70">
            Monitor student completion trajectories, review enrollment applications, and track learning progress.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!roster.length}
          className="button button-soft flex items-center gap-2 self-start"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Course Selector & Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2 panel p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <label className="text-xs uppercase font-semibold text-slate-400 whitespace-nowrap">Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="panel p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Active Learners</div>
            <div className="text-2xl font-bold text-indigo-400">{activeCount}</div>
          </div>
          <Users size={22} className="text-indigo-500/40" />
        </div>

        <div className="panel p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Completed</div>
            <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
          </div>
          <CheckCircle2 size={22} className="text-emerald-500/40" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learner name or email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['all', 'active', 'completed', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
              {status === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="panel rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs">Loading course cohort...</p>
          </div>
        ) : filteredRoster.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/40 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Learner</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Curriculum Progress</th>
                  <th className="px-6 py-4">Enrolled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRoster.map((item) => {
                  const learner = item.userId;
                  return (
                    <tr key={item._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {learner?.name ? learner.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{learner?.name || 'Unknown Learner'}</div>
                            <div className="text-xs text-slate-400">{learner?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            item.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.status === 'active'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : item.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-700/30 text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-44 space-y-1">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>{item.progress || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDecision(item._id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleDecision(item._id, 'reject')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <X size={13} /> Decline
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Enrolled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users size={32} className="mx-auto opacity-30" />
            <p className="text-sm font-medium">No learners found in this cohort</p>
            <p className="text-xs opacity-70">Enrolled students and pending requests will appear in this table.</p>
          </div>
        )}
      </div>
    </div>
  );
}
