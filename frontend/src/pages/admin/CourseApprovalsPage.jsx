import { useEffect, useState } from 'react';
import { Check, X, BookOpen, AlertCircle, Eye, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';

export default function CourseApprovalsPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState('');

  const loadPending = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/courses/pending');
      setCourses(data.courses || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (courseId) => {
    setBusy(courseId);
    try {
      await api.patch(`/admin/courses/${courseId}/approve`);
      toast.success('Course approved and published to catalog.');
      loadPending();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy('');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setBusy(rejectModal._id);
    try {
      await api.patch(`/admin/courses/${rejectModal._id}/reject`, { reason: rejectReason });
      toast.success('Course returned for revision.');
      setRejectModal(null);
      setRejectReason('');
      loadPending();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="section-kicker">CURRICULUM OVERSIGHT</div>
          <h1>Course Approval Queue</h1>
          <p>Review new syllabi submitted by faculty. Published courses become visible in the student catalog.</p>
        </div>
      </div>

      {loading ? (
        <div className="course-grid">
          {[1, 2].map((i) => <div key={i} className="course-card skeleton-card" />)}
        </div>
      ) : courses.length ? (
        <div style={{ display: 'grid', gap: 14, maxWidth: 900 }}>
          {courses.map((course) => (
            <article key={course._id} className="panel assignment-card">
              <div className="assignment-top">
                <div>
                  <div className="section-kicker">
                    {course.category} · Instructor: {course.instructorId?.name || course.instructorName}
                  </div>
                  <h2>{course.title}</h2>
                </div>
                <span className="assignment-status pending">Pending Review</span>
              </div>

              <p className="assignment-instructions">{course.description}</p>

              <div className="assignment-meta">
                <span>Level: {course.level}</span>
                <span>Duration: {course.duration}</span>
                <span>Curriculum: {course.modules?.length || 0} Modules</span>
                <span>Enrollment Policy: {course.enrollmentPolicy}</span>
              </div>

              {course.learningOutcomes?.length > 0 && (
                <div style={{ margin: '12px 0', fontSize: 10, color: 'var(--muted)' }}>
                  <b>Learning Outcomes:</b>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
                    {course.learningOutcomes.map((o, idx) => <li key={idx}>{o}</li>)}
                  </ul>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: 14 }}>
                <button
                  className="button button-soft"
                  onClick={() => { setRejectModal(course); setRejectReason(''); }}
                >
                  Return for Revision <X size={13} />
                </button>
                <button
                  className="button button-primary"
                  disabled={busy === course._id}
                  onClick={() => handleApprove(course._id)}
                >
                  {busy === course._id ? 'Publishing...' : 'Approve & Publish'} <Check size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-card" style={{ maxWidth: 600, margin: '40px auto' }}>
          <CheckCircle2 size={32} style={{ color: 'var(--good)', marginBottom: 12 }} />
          <b style={{ fontSize: 14 }}>All caught up!</b>
          <p>There are no courses currently awaiting administrative review.</p>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="mobile-scrim show" style={{ display: 'grid', placeItems: 'center', zIndex: 100 }}>
          <div className="panel" style={{ width: 440, padding: 24 }}>
            <h3 style={{ font: '700 16px Manrope', margin: '0 0 10px' }}>Return Course for Revision</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 14px' }}>
              Provide constructive feedback for <b>{rejectModal.title}</b>. The instructor will see your notes in their studio.
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please expand module 2 with at least two hands-on lessons..."
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, color: 'var(--text)', fontSize: 11 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button className="button button-soft" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="button button-primary" disabled={busy === rejectModal._id} onClick={handleReject}>
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
