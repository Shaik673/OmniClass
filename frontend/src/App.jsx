import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, ArrowDownRight, ArrowRight, Bell, BookOpen, Bookmark, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, HelpCircle, Clock3, Code2, Compass, GraduationCap, LayoutDashboard, LogOut, Menu, MessageCircle, Moon, MoreHorizontal, Search, Settings, Shield, Sparkles, Sun, Target, TrendingUp, Trophy, UserRound, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from './api.js';
import EmptyState from './components/shared/EmptyState.jsx';
import UserAvatar from './components/shared/UserAvatar.jsx';
import { completeLesson, getCourseLearning } from './services/learning.js';

import ProfilePage from './pages/profile/ProfilePage.jsx';
import AIWorkspacePage from './pages/ai/AIWorkspacePage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import CourseApprovalsPage from './pages/admin/CourseApprovalsPage.jsx';
import InstitutionalSettingsPage from './pages/admin/InstitutionalSettingsPage.jsx';
import CourseBuilderPage from './pages/instructor/CourseBuilderPage.jsx';
import InstructorCopilotPage from './pages/instructor/InstructorCopilotPage.jsx';
import StudentRosterPage from './pages/instructor/StudentRosterPage.jsx';
import OnboardingWizard from './pages/onboarding/OnboardingWizard.jsx';
import CalendarPage from './pages/student/CalendarPage.jsx';
import AuthPage from './pages/auth/AuthPage.jsx';
import OmniClassLogo from './components/shared/OmniClassLogo.jsx';
import LandingFooter from './components/shared/LandingFooter.jsx';
import WorkspaceFooter from './components/shared/WorkspaceFooter.jsx';
import ViewCertificateModal from './components/shared/ViewCertificateModal.jsx';

const initialCourses = [];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('omniclass-theme') || 'dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const apply = (preference) => {
      const dark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply(theme);
    localStorage.setItem('omniclass-theme', theme);
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => apply('system');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [theme]);

  useEffect(() => {
    api.get('/users/me')
      .then((res) => {
        const u = res?.user || res?.data?.user || res?.data;
        if (u && (u._id || u.id || u.email)) {
          setUser(u);
          if (u.theme) setTheme(u.theme);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          setUser(null);
        }
      })
      .finally(() => {
        setAuthLoading(false);
      });
    api.get('/notifications').then((res) => setNotifications(res?.notifications || res?.data?.notifications || [])).catch(() => {});
  }, [location.pathname]);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* local sign-out still works when the API is offline */ }
    setUser(null); toast.success('You’re signed out.'); navigate('/');
  };

  const themeToggle = () => setTheme((value) => value === 'dark' ? 'light' : value === 'light' ? 'system' : 'dark');
  const loggedIn = Boolean(user);
  const isAuthOnlyPath = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  const markNotificationRead = async (notification) => {
    if (notification.readAt) return;
    try {
      const { data } = await api.patch(`/notifications/${notification._id}/read`);
      setNotifications((items) => items.map((item) => item._id === notification._id ? data.notification : item));
    } catch (error) {
      toast.error(getError(error));
    }
  };

  const markAllNotificationsRead = async () => {
    if (!notifications.some((item) => !item.readAt)) return;
    try {
      await api.patch('/notifications/read-all');
      const readAt = new Date().toISOString();
      setNotifications((items) => items.map((item) => item.readAt ? item : { ...item, readAt }));
    } catch (error) {
      toast.error(getError(error));
    }
  };

  if (authLoading && !user) {
    return (
      <div className="app-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>Connecting to OmniClass...</span>
        </div>
      </div>
    );
  }

  return <div className="app-shell">
    {loggedIn && !isAuthOnlyPath ? <>
      <Sidebar user={user} onLogout={logout} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />
      <div className="workspace">
        <Header user={user} notifications={notifications} onReadNotification={markNotificationRead} onReadAll={markAllNotificationsRead} onTheme={themeToggle} theme={theme} onMenu={() => setMobileOpen(true)} onLogout={logout} />
        <main className="main-content"><Routes>
          <Route path="/" element={user.role === 'admin' ? <AdminDashboard user={user} /> : user.role === 'instructor' ? <TeachingDashboard user={user} /> : <Dashboard user={user} />} />
          <Route path="/dashboard" element={user.role === 'admin' ? <AdminDashboard user={user} /> : user.role === 'instructor' ? <TeachingDashboard user={user} /> : <Dashboard user={user} />} />
          <Route path="/teaching" element={<TeachingDashboard user={user} />} />
          <Route path="/teaching/builder" element={<CourseBuilderPage user={user} />} />
          <Route path="/teaching/copilot" element={<InstructorCopilotPage />} />
          <Route path="/teaching/roster" element={<StudentRosterPage user={user} />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/admin/dashboard" element={<AdminDashboard user={user} />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/approvals" element={<CourseApprovalsPage />} />
          <Route path="/admin/settings" element={<InstitutionalSettingsPage />} />
          <Route path="/courses" element={user.role === 'student' ? <CoursesPage /> : <TeachingDashboard user={user} />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/courses/:courseId" element={<CourseDetails user={user} />} />
          <Route path="/learn/:courseId" element={<CoursePlayer user={user} />} />
          <Route path="/assignments" element={<AssignmentsPage user={user} />} />
          <Route path="/assessments" element={<QuizPage user={user} />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/discussions" element={<DiscussionsPage user={user} />} />
          <Route path="/certificates" element={<CertificatesPage user={user} />} />
          <Route path="/verify/:certificateCode" element={<CertificateVerifyPage />} />
          <Route path="/profile" element={<ProfilePage user={user} onUser={setUser} onTheme={setTheme} />} />
          <Route path="/onboarding" element={<OnboardingWizard user={user} onUser={setUser} onTheme={setTheme} />} />
          <Route path="/planner" element={<PersistentPlannerPage />} />
          <Route path="/ai" element={<AIWorkspacePage user={user} />} />
          <Route path="/library" element={<SavedLibraryPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<ComingSoon title={pageTitle(location.pathname)} />} />
        </Routes></main>
        <WorkspaceFooter />
      </div>
    </> : <Routes>
      <Route path="/login" element={<AuthPage mode="login" onUser={setUser} onTheme={setTheme} />} />
      <Route path="/register" element={<AuthPage mode="register" onUser={setUser} onTheme={setTheme} />} />
      <Route path="/forgot-password" element={<AccountActionPage mode="forgot" />} />
      <Route path="/reset-password" element={<AccountActionPage mode="reset" />} />
      <Route path="/verify-email" element={<AccountActionPage mode="verify" />} />
      <Route path="/catalog" element={<PublicCatalog />} />
      <Route path="/courses/:courseId" element={<CourseDetails user={user} />} />
      <Route path="/verify/:certificateCode" element={<CertificateVerifyPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>}
  </div>;
}

function Sidebar({ user, onLogout, mobileOpen, closeMobile }) {
  return <><div className={`mobile-scrim ${mobileOpen ? 'show' : ''}`} onClick={closeMobile} />
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <Link to="/dashboard" className="brand" onClick={closeMobile} style={{ textDecoration: 'none' }}><OmniClassLogo size={24} /></Link>
      <div className="institution-pill"><span className="institution-logo">N</span><span><b>Northstar University</b><small>{roleLabel(user?.role)} workspace</small></span><ChevronDown size={15} /></div>
      <nav>
        {user?.role === 'admin' && (
          <section className="nav-group">
            <div className="nav-label">GOVERNANCE</div>
            <NavLink to="/admin" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><LayoutDashboard size={17}/><span>Overview</span></NavLink>
            <NavLink to="/admin/users" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Users size={17}/><span>User Directory</span></NavLink>
            <NavLink to="/admin/approvals" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Shield size={17}/><span>Course Reviews</span></NavLink>
            <NavLink to="/admin/settings" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Settings size={17}/><span>Institution Settings</span></NavLink>
          </section>
        )}
        {['instructor', 'admin'].includes(user?.role) && (
          <section className="nav-group">
            <div className="nav-label">TEACHING STUDIO</div>
            <NavLink to="/teaching" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><LayoutDashboard size={17}/><span>Studio Overview</span></NavLink>
            <NavLink to="/teaching/builder" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><BookOpen size={17}/><span>Curriculum Builder</span></NavLink>
            <NavLink to="/teaching/copilot" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Sparkles size={17}/><span>Pedagogical Copilot</span></NavLink>
            <NavLink to="/teaching/roster" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Users size={17}/><span>Student Roster</span></NavLink>
          </section>
        )}
        <section className="nav-group">
          <div className="nav-label">LEARNING</div>
          <NavLink to="/dashboard" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><LayoutDashboard size={17}/><span>Overview</span></NavLink>
          <NavLink to="/courses" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><BookOpen size={17}/><span>My courses</span></NavLink>
          <NavLink to="/assignments" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Check size={17}/><span>Assignments</span></NavLink>
          <NavLink to="/assessments" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><HelpCircle size={17}/><span>Quizzes</span></NavLink>
          <NavLink to="/calendar" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><CalendarDays size={17}/><span>Calendar</span></NavLink>
          <NavLink to="/discussions" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><MessageCircle size={17}/><span>Discussions</span></NavLink>
          <NavLink to="/catalog" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Compass size={17}/><span>Explore catalog</span></NavLink>
          <NavLink to="/planner" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><CalendarDays size={17}/><span>Study planner</span></NavLink>
        </section>
        <section className="nav-group">
          <div className="nav-label">AI ASSISTANT</div>
          <NavLink to="/ai" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Sparkles size={17}/><span className="flex-1">AI Study Room</span><span className="nav-new">STUDIO</span></NavLink>
        </section>
        <section className="nav-group">
          <div className="nav-label">YOUR SPACE</div>
          {user?.role === 'student' && <NavLink to="/certificates" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><GraduationCap size={17}/><span>Certificates</span></NavLink>}
          <NavLink to="/library" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Bookmark size={17}/><span>Saved library</span></NavLink>
          <NavLink to="/achievements" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Trophy size={17}/><span>Achievements</span></NavLink>
          <NavLink to="/profile" onClick={closeMobile} className={({isActive})=>`nav-item ${isActive?'active':''}`}><UserRound size={17}/><span>Profile & Integrations</span></NavLink>
        </section>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-help"><div className="help-icon"><HelpCircle size={17} /></div><div><b>Northstar LMS</b><small>AI-Powered Institutional</small></div><ArrowRight size={15} /></div><div className="sidebar-user"><UserAvatar user={user} size="sm" /><div className="user-meta"><b>{user?.name || 'Alex Morgan'}</b><small>{roleLabel(user?.role)}</small></div><button className="icon-button subtle" aria-label="Sign out" onClick={onLogout}><LogOut size={16} /></button></div></div>
    </aside>
  </>;
}

function Header({ user, notifications, onReadNotification, onReadAll, onTheme, theme, onMenu, onLogout }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const unread = notifications.filter((n) => !n.readAt).length;
  const submitSearch = () => { if (search.trim()) navigate(`/catalog?search=${encodeURIComponent(search.trim())}`); };
  return <header className="topbar"><button className="mobile-menu icon-button" onClick={onMenu} aria-label="Open menu"><Menu size={19} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><b>{pageTitle(useLocation().pathname)}</b></div><div className="topbar-actions"><label className="global-search"><Search size={16} /><input value={search} onChange={(event)=>setSearch(event.target.value)} onKeyDown={(event)=>event.key==='Enter'&&submitSearch()} onDoubleClick={submitSearch} aria-label="Search courses" placeholder="Search courses..." /><kbd>↵</kbd></label><button className="icon-button theme-button" title={`Theme: ${theme}`} onClick={onTheme}>{theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}</button><div className="notification-wrap"><button className="icon-button notification-button" onClick={() => setShowNotifications((s) => !s)} aria-label="Notifications"><Bell size={18} />{unread > 0 && <i />}</button>{showNotifications && <div className="notification-popover"><div className="popover-title"><b>Notifications</b><span>{unread} unread</span></div>{unread>0&&<button className="text-button notification-read-all" onClick={onReadAll}>Mark all as read</button>}{notifications.length ? notifications.slice(0, 4).map((n) => <button className={`notification-row ${n.readAt ? 'read' : ''}`} key={n._id} onClick={() => onReadNotification(n)}><span className="notification-dot" /><span><b>{n.title}</b><small>{n.message}</small></span></button>) : <div className="empty-inline">You’re all caught up.</div>}</div>}</div><button className="top-avatar" style={{ padding: 0, overflow: 'hidden', border: 'none', background: 'transparent' }} title={user?.name || 'Profile'} onClick={() => navigate('/profile')}><UserAvatar user={user} size="sm" /></button></div></header>;
}

function Dashboard({ user }) {
  const [courses, setCourses] = useState(initialCourses);
  const [assignments, setAssignments] = useState([]);
  const [plannerSessions, setPlannerSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/courses/mine'),
      api.get('/assignments'),
      api.get('/planner'),
    ]).then(([cRes, aRes, pRes]) => {
      if (cRes.status === 'fulfilled') setCourses(cRes.value.data.courses || []);
      if (aRes.status === 'fulfilled') {
        const upcoming = (aRes.value.data.assignments || [])
          .filter((item) => item.dueAt && new Date(item.dueAt) >= new Date())
          .slice(0, 3);
        setAssignments(upcoming);
      }
      if (pRes.status === 'fulfilled') {
        setPlannerSessions(pRes.value.data.sessions || []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const completedSessions = plannerSessions.filter((s) => s.completed).length;
  const weeklyTarget = user?.preferences?.weeklyHoursGoal || 5;
  const percentComplete = Math.min(100, Math.round((completedSessions / weeklyTarget) * 100));
  const studyHours = Math.round(((completedSessions * 45) / 60) * 10) / 10;
  const streak = user?.gamification?.streakDays || (completedSessions > 0 ? completedSessions : 4);
  const name = (user?.name || 'Alex Morgan').split(' ')[0];
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase();

  // Dynamic visual analytics data
  const velocityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseline = [35, 50, 45, 60, 40, 75, 55];
    return days.map((day, idx) => {
      const dayMatches = plannerSessions.filter((s) => {
        if (!s.plannedFor && !s.scheduledDate) return false;
        const d = new Date(s.plannedFor || s.scheduledDate).getDay();
        return (d === 0 ? 6 : d - 1) === idx;
      });
      return {
        day,
        minutes: dayMatches.length > 0 ? dayMatches.length * 45 : baseline[idx],
        target: 45,
      };
    });
  }, [plannerSessions]);

  const courseProgressData = useMemo(() => {
    if (!courses.length) {
      return [
        { name: 'Full-Stack Web', progress: 75 },
        { name: 'AI Engineering', progress: 60 },
        { name: 'Cloud Ops', progress: 40 },
        { name: 'Data Systems', progress: 85 },
      ];
    }
    return courses.slice(0, 5).map((c) => ({
      name: c.title.length > 14 ? c.title.slice(0, 12) + '…' : c.title,
      progress: c.progress || (c.enrollmentStatus === 'completed' ? 100 : 35),
    }));
  }, [courses]);

  return <div className="page-enter">
    <EmailVerificationPanel user={user} />
    <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {today}</div><h1>Good morning, {name}<span className="wave">✳</span></h1><p className="page-subtitle">A little progress today goes a long way. Let’s make it count.</p></div><Link className="button button-primary" to="/catalog"><Compass size={16} /> Explore courses</Link></div>
    <section className="hero-banner"><div className="hero-copy"><div className="banner-kicker"><Sparkles size={14} /> YOUR WEEK, AT A GLANCE</div><h2>Make room for<br /><span>what’s next.</span></h2><p>Your learning rhythm is taking shape. Keep showing up — the rest follows.</p><Link to="/planner" className="banner-link">View your study plan <ArrowRight size={16} /></Link></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-disc"><span>✳</span></div><div className="float-card float-top"><span className="float-icon purple"><Target size={15} /></span><span><b>Weekly goal</b><small>{completedSessions} of {weeklyTarget} sessions</small></span><span className="float-percent">{percentComplete}%</span></div><div className="float-card float-bottom"><span className="float-icon green"><TrendingUp size={15} /></span><span><b>Learning streak</b><small>Keep it going</small></span><span className="streak-num">{streak} <span>days</span></span></div><span className="sparkle sparkle-a">✦</span><span className="sparkle sparkle-b">✧</span></div></section>
    <div className="section-heading"><div><div className="section-kicker">YOUR MOMENTUM</div><h2>Learning snapshot</h2></div><span className="text-button">From your activity</span></div>
    <div className="stats-grid"><StatCard icon={BookOpen} label="Courses in progress" value={loading ? '—' : courses.length} change="Active enrollments" color="violet" /><StatCard icon={Clock3} label="Study time" value={loading ? '—' : `${studyHours}h`} change={`${completedSessions} sessions logged`} color="blue" /><StatCard icon={Target} label="Weekly goal" value={loading ? '—' : `${percentComplete}%`} change={`${completedSessions}/${weeklyTarget} sessions`} color="orange" /><StatCard icon={Activity} label="Learning streak" value={loading ? '—' : `${streak}d`} change="Active daily streak" color="green" /></div>

    {/* Dynamic Visual Graphs & Analytics */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, margin: '20px 0' }}>
      <div className="panel" style={{ padding: '18px 20px', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div className="section-kicker">WEEKLY VELOCITY</div>
            <h3 style={{ font: '700 15px Manrope', margin: '2px 0 0' }}>Study Minutes Momentum</h3>
          </div>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Active Trend</span>
        </div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} unit="m" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="minutes" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#velocityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel" style={{ padding: '18px 20px', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div className="section-kicker">COURSE MASTERY</div>
            <h3 style={{ font: '700 15px Manrope', margin: '2px 0 0' }}>Enrolled Course Progress</h3>
          </div>
          <span style={{ fontSize: 11, color: 'var(--good)', fontWeight: 600 }}>% Complete</span>
        </div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} formatter={(val) => [`${val}%`, 'Mastery']} />
              <Bar dataKey="progress" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div className="content-grid"><section className="courses-section"><div className="section-heading compact"><div><div className="section-kicker">PICK UP WHERE YOU LEFT OFF</div><h2>Your courses</h2></div><Link to="/courses" className="text-button">View all <ArrowRight size={15} /></Link></div>{loading ? <div className="course-grid">{[1,2,3].map((x) => <div className="course-card skeleton-card" key={x} />)}</div> : courses.length ? <div className="course-grid">{courses.slice(0,3).map((course, index) => <CourseCard course={course} index={index} key={course._id} />)}</div> : <div className="empty-card"><div className="empty-illustration"><Compass size={23} /></div><b>Your next chapter starts here</b><p>Explore the catalog and find a course that sparks your curiosity.</p><Link to="/catalog" className="button button-soft">Browse courses <ArrowRight size={15} /></Link></div>}</section>
      <aside className="right-column"><div className="panel deadline-panel"><div className="panel-heading"><div><div className="section-kicker">UP NEXT</div><h3>Coming up</h3></div><CalendarDays size={16} className="muted-icon" /></div>{assignments.length?assignments.map(assignment=><Link to="/assignments" className="deadline-row" key={assignment._id}><span><b>{assignment.title}</b><small>{assignment.courseId?.title||'Course'}</small></span><time>{new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(assignment.dueAt))}</time></Link>):<div className="empty-inline">You’re clear for now. Upcoming assignment deadlines will appear here.</div>}<div className="panel-footer"><Link to="/assignments">View coursework <ArrowRight size={13}/></Link></div></div>
        <div className="panel focus-panel"><div className="focus-top"><div><div className="section-kicker">A GENTLE NUDGE</div><h3>Small steps add up.</h3></div><div className="focus-icon"><Sparkles size={17} /></div></div><p>You’re close to your weekly goal. A 25-minute session today will keep your momentum flowing.</p><Link to="/planner" className="focus-link">Plan a session <ArrowRight size={14} /></Link><div className="focus-decoration">✦</div></div></aside></div>
  </div>;
}

function StatCard({ icon: Icon, label, value, change, color }) { return <div className="stat-card"><div className="stat-top"><span className={`stat-icon ${color}`}><Icon size={17} /></span><span className="stat-change"><ArrowDownRight size={13} /> {change}</span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>; }

function CourseCard({ course, index }) {
  return (
    <article className={`course-card ${course.color || ['violet','orange','green'][index % 3]}`} style={{ position: 'relative' }}>
      {course.isPro && (
        <span
          className="pro-course-pill"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 3,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 10,
            padding: '3px 9px',
            borderRadius: 99,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
          }}
        >
          PRO · ₹{course.price || 1499}
        </span>
      )}
      <div className="course-cover">
        <span className="cover-symbol">{course.icon || ['◉','✳','⌁'][index % 3]}</span>
        <span className="cover-category">{course.category || 'Learning'}</span>
        <Link className="cover-more" aria-label={`Open ${course.title}`} to={`/courses/${course._id}`}><ArrowRight size={15} /></Link>
        <div className="cover-ornament" />
      </div>
      <div className="course-body">
        <div className="course-meta">
          <span>{course.level || 'All levels'}</span>
          <span className="meta-dot">·</span>
          <span>{course.duration || 'Self paced'}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.description || 'Explore course details and learning outcomes.'}</p>
        <div className="instructor-row">
          <div className="instructor-avatar">{initials(course.instructorName || 'OmniClass')}</div>
          <span>{course.instructorName || 'OmniClass Faculty'}</span>
        </div>
        {course.enrollmentStatus ? (
          <>
            <div className="progress-line"><div style={{ width: `${course.progress || 0}%` }} /></div>
            <div className="course-foot">
              <span>{course.progress || 0}% complete</span>
              <Link to={`/learn/${course._id}`} aria-label={`Continue ${course.title}`}><ArrowRight size={16} /></Link>
            </div>
          </>
        ) : (
          <div className="course-foot">
            <span>{course.isPro ? `Pro Tier (₹${course.price || 1499})` : 'View course details'}</span>
            <Link to={`/courses/${course._id}`} aria-label={`View ${course.title}`}><ArrowRight size={16} /></Link>
          </div>
        )}
      </div>
    </article>
  );
}

function CoursesPage() { const [courses,setCourses] = useState([]); const [busy,setBusy] = useState(true); const [tab,setTab]=useState('in-progress'); useEffect(() => { api.get('/courses/mine').then(({data})=>setCourses(data.courses || [])).catch(()=>setCourses([])).finally(()=>setBusy(false)); },[]); const inProgress=courses.filter(course=>course.enrollmentStatus==='active'||course.enrollmentStatus==='pending');const completed=courses.filter(course=>course.enrollmentStatus==='completed');const visible=tab==='completed'?completed:inProgress;return <><PageHeader kicker="YOUR LEARNING PATH" title="My courses" subtitle="Everything you’re learning, all in one place." action={<Link className="button button-primary" to="/catalog"><Compass size={16}/> Find a course</Link>} /><div className="tabs"><button className={`tab ${tab==='in-progress'?'active':''}`} onClick={()=>setTab('in-progress')}>In progress <span>{inProgress.length}</span></button><button className={`tab ${tab==='completed'?'active':''}`} onClick={()=>setTab('completed')}>Completed <span>{completed.length}</span></button><Link className="tab" to="/library">Saved <span>→</span></Link></div>{busy ? <div className="course-grid">{[1,2,3].map((x)=><div className="course-card skeleton-card" key={x}/>)}</div> : <div className="course-grid">{visible.length ? visible.map((c,i)=><CourseCard key={c._id} course={c} index={i}/>) : <div className="empty-card full-span"><BookOpen size={25}/><b>{tab==='completed'?'No completed courses yet':'No courses in progress'}</b><p>{tab==='completed'?'Finish a course to see it here.':'Once you enroll, your courses will appear here.'}</p><Link className="button button-soft" to="/catalog">Explore courses</Link></div>}</div>}</>; }

function CatalogPage() {
  const [courses,setCourses]=useState([]); const [query,setQuery]=useState(()=>new URLSearchParams(window.location.search).get('search')||'');
  const [category,setCategory]=useState(''); const [categories,setCategories]=useState([]); const [showFilters,setShowFilters]=useState(false);
  const [loading,setLoading]=useState(true); const [enrolling,setEnrolling]=useState(''); const [saved,setSaved]=useState(new Set()); const [saving,setSaving]=useState('');
  useEffect(()=>{api.get('/users/me/saved-courses').then(({data})=>setSaved(new Set((data.courses||[]).map(course=>course._id)))).catch(()=>{});},[]);
  useEffect(()=>{setLoading(true);api.get('/courses',{params:{search:query,category:category||undefined,limit:48}}).then(({data})=>{const items=data.courses||[];setCourses(items);if(!category)setCategories([...new Set(items.map(item=>item.category).filter(Boolean))].sort());}).catch(()=>setCourses([])).finally(()=>setLoading(false));},[query,category]);

  const enroll=async(c)=>{
    setEnrolling(c._id);
    try {
      if (c.isPro) {
        const { data: orderRes } = await api.post(`/courses/${c._id}/order`);
        const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}${Date.now()}`;
        await api.post(`/courses/${c._id}/verify-payment`, {
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderRes.data?.orderId,
        });
        toast.success(`Payment verified! Enrolled in Pro Course: ${c.title}`);
      } else {
        await api.post(`/courses/${c._id}/enroll`);
        toast.success('Enrollment confirmed.');
      }
    } catch(e) {
      toast.error(getError(e));
    } finally {
      setEnrolling('');
    }
  };

  const toggleSaved=async(id)=>{setSaving(id);try{if(saved.has(id)){await api.delete(`/users/me/saved-courses/${id}`);setSaved(current=>{const next=new Set(current);next.delete(id);return next;});toast.success('Removed from your library.');}else{await api.post(`/users/me/saved-courses/${id}`);setSaved(current=>new Set(current).add(id));toast.success('Saved to your library.');}}catch(error){toast.error(error.response?.status===401?'Sign in to save courses.':getError(error));}finally{setSaving('');}};
  return <><PageHeader kicker="FIND YOUR NEXT CURIOSITY" title="Explore courses" subtitle="Thoughtful courses for wherever you want to go."/><div className="catalog-tools"><label className="catalog-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search subjects, skills, or instructors"/></label><button className="filter-button" aria-expanded={showFilters} onClick={()=>setShowFilters(value=>!value)}><Settings size={16}/> Filters</button></div>{showFilters&&<div className="catalog-filter-panel"><label className="field-label">Category<select value={category} onChange={event=>setCategory(event.target.value)}><option value="">All categories</option>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></label></div>}{loading?<div className="course-grid">{[1,2,3].map(i=><div className="course-card skeleton-card" key={i}/>)}</div>:courses.length?<div className="course-grid">{courses.map((c,i)=><div key={c._id}><CourseCard course={c} index={i}/><div className="catalog-actions"><button className="button button-soft enroll-button" disabled={enrolling===c._id} onClick={()=>enroll(c)}>{enrolling===c._id?'Processing…':c.isPro?`Enroll Pro (₹${c.price||1499})`:'Enroll now'} <ArrowRight size={14}/></button><button className="button button-soft save-course-button" disabled={saving===c._id} onClick={()=>toggleSaved(c._id)}>{saved.has(c._id)?'Saved':'Save'}</button></div></div>)}</div>:<div className="empty-card full-span"><Search size={25}/><b>No courses found</b><p>Try another search, or check back as new courses are added.</p></div>}</>;
}

function PublicCatalog() { return <><LandingNav/><div className="public-catalog"><CatalogPage/></div></>; }

function CourseDetails({ user }) {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [requestPending, setRequestPending] = useState(false);

  useEffect(() => {
    api.get(`/courses/${courseId}`).then(({ data }) => setCourse(data.course)).catch(() => setCourse(null)).finally(() => setLoading(false));
    api.get('/courses/mine').then(({ data }) => {
      const enrollment = (data.courses || []).find((item) => String(item._id) === String(courseId));
      setEnrolled(Boolean(enrollment && ['active', 'completed'].includes(enrollment.enrollmentStatus)));
      setRequestPending(enrollment?.enrollmentStatus === 'pending');
    }).catch(() => {});
  }, [courseId]);

  const enroll = async () => {
    setBusy(true);
    try {
      if (course?.isPro) {
        const { data: orderRes } = await api.post(`/courses/${courseId}/order`);
        const paymentId = `pay_${Math.random().toString(36).substring(2, 10)}${Date.now()}`;
        await api.post(`/courses/${courseId}/verify-payment`, {
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderRes.data?.orderId,
        });
        setEnrolled(true);
        toast.success('Payment verified! Enrolled in Pro Certified Course.');
      } else {
        const { data } = await api.post(`/courses/${courseId}/enroll`);
        const status = data.enrollment?.status;
        if (status === 'active' || status === 'completed') setEnrolled(true);
        if (status === 'pending') setRequestPending(true);
        toast.success(status === 'pending' ? 'Enrollment request received.' : 'Enrollment confirmed.');
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="main-content"><div className="course-card skeleton-card" /></div>;
  if (!course) return <div className="main-content"><div className="empty-card"><BookOpen size={24}/><b>Course unavailable</b><p>This course may have been unpublished or moved.</p><Link className="button button-soft" to="/catalog">Back to catalog</Link></div></div>;

  return (
    <div className="course-details page-enter">
      <Link className="back-home" to="/catalog"><ChevronLeft size={15}/> Course catalog</Link>
      <div className="course-detail-hero">
        <div>
          <div className="section-kicker" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{course.category || 'COURSE'}</span>
            {course.isPro && (
              <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>
                PRO CERTIFICATION · ₹{course.price || 1499}
              </span>
            )}
          </div>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-detail-meta">
            <span>{course.level || 'All levels'}</span>
            <span>·</span>
            <span>{course.duration || 'Self paced'}</span>
            <span>·</span>
            <span>Instructor: {course.instructorName}</span>
            {course.isPro && <span>·</span>}
            {course.isPro && <span style={{ color: '#f59e0b', fontWeight: 600 }}>Razorpay Secure Checkout</span>}
          </div>
        </div>
        {enrolled ? (
          <Link className="button button-primary" to={`/learn/${courseId}`}>Continue learning <ArrowRight size={15}/></Link>
        ) : requestPending ? (
          <span className="private-badge">Enrollment request pending</span>
        ) : (
          <button className="button button-primary" onClick={enroll} disabled={busy}>
            {busy ? 'Processing…' : course.isPro ? `Enroll in Pro Course (₹${course.price || 1499})` : course.enrollmentPolicy === 'approval' ? 'Request enrollment' : 'Enroll in course'} <ArrowRight size={15}/>
          </button>
        )}
      </div>
      <div className="course-detail-grid">
        <section className="panel detail-panel">
          <div className="section-kicker">WHAT YOU’LL LEARN</div>
          <h2>Course overview</h2>
          {course.learningOutcomes?.length ? (
            <ul>{course.learningOutcomes.map((item) => <li key={item}>{item}</li>)}</ul>
          ) : (
            <p>Learning outcomes will be added by the instructor.</p>
          )}
        </section>
        <section className="panel detail-panel">
          <div className="section-kicker">COURSE CONTENT (5 MODULES)</div>
          <h2>Curriculum & Proctored Exam</h2>
          {course.modules?.length ? (
            course.modules.map((module, index) => (
              <div className="module-row" key={`${module.title}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <b>{module.title}</b>
                <small>{module.lessons?.length || 0} lessons</small>
              </div>
            ))
          ) : (
            <p>The curriculum will be available after enrollment.</p>
          )}
          <div className="module-row" style={{ borderTop: '1px dashed var(--border)', marginTop: 8, paddingTop: 8 }}>
            <span style={{ color: 'var(--accent)' }}>★</span>
            <b>30-MCQ Final Proctored Exam</b>
            <small style={{ color: 'var(--accent)' }}>Passing Grade: 70%</small>
          </div>
        </section>
      </div>
    </div>
  );
}

function CoursePlayer({ user }) {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [progress, setProgress] = useState(0);
  const [selection, setSelection] = useState('0.0');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // 30-MCQ Final Proctored Exam state
  const [examAnswers, setExamAnswers] = useState(new Array(30).fill(-1));
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examResult, setExamResult] = useState(null);
  const [viewingCert, setViewingCert] = useState(null);

  useEffect(() => {
    getCourseLearning(courseId)
      .then((data) => {
        setCourse(data.course);
        setCompleted(data.completedLessons || []);
        setProgress(data.progress || 0);
        const first = data.course.modules?.findIndex((module) => module.lessons?.length);
        if (first >= 0) {
          setSelection(`${first}.0`);
        }
      })
      .catch((error) => toast.error(getError(error)))
      .finally(() => setLoading(false));
  }, [courseId]);

  const [moduleIndex, lessonIndex] = selection.split('.').map(Number);
  const module = course?.modules?.[moduleIndex];
  const lesson = module?.lessons?.[lessonIndex];

  const markComplete = async () => {
    setBusy(true);
    try {
      const data = await completeLesson(courseId, selection);
      setCompleted(data.completedLessons || []);
      setProgress(data.progress || 0);
      if (data.progress === 100) {
        toast.success('All 5 modules completed! 30-MCQ Final Proctored Exam is now UNLOCKED.');
      } else {
        toast.success('Lesson marked complete.');
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    const unanswered = examAnswers.filter((a) => a === -1).length;
    if (unanswered > 0) {
      return toast.error(`Please answer all questions before submitting. (${unanswered} remaining)`);
    }
    setExamSubmitting(true);
    try {
      const { data } = await api.post(`/courses/${courseId}/final-exam/submit`, { answers: examAnswers });
      setExamResult(data);
      if (data.passed) {
        toast.success(`Congratulations! You passed with ${data.score}%! Your certificate is ready.`);
      } else {
        toast.error(`Score: ${data.score}%. Minimum criteria to pass is ${data.passingThreshold}%. Review modules and try again.`);
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setExamSubmitting(false);
    }
  };

  if (loading) return <div className="course-card skeleton-card" />;
  if (!course) return <div className="empty-card"><b>Course content unavailable</b><p>Enroll in the course to access lessons.</p><Link className="button button-soft" to={`/courses/${courseId}`}>Course details</Link></div>;

  const isFinalExamView = selection === 'final-exam';
  const finalQuestions = course.finalExam?.questions || [];

  return (
    <div className="page-enter">
      <PageHeader kicker="LEARNING PLAYER" title={course.title} subtitle={`${progress}% complete · 5 Curriculum Modules`} />
      <div className="progress-line"><div style={{ width: `${progress}%` }} /></div>
      <div className="player-layout">
        <aside className="panel player-outline">
          <div className="section-kicker">COURSE OUTLINE (5 MODULES)</div>
          {course.modules?.map((item, m) => (
            <section key={`${item.title}-${m}`}>
              <b>{item.title}</b>
              {item.lessons?.map((entry, l) => {
                const key = `${m}.${l}`;
                return (
                  <button
                    key={key}
                    className={`player-lesson ${selection === key ? 'active' : ''}`}
                    onClick={() => setSelection(key)}
                  >
                    <span className="check-circle">{completed.includes(key) && <Check size={12} />}</span>
                    <span>{entry.title}</span>
                  </button>
                );
              })}
            </section>
          ))}

          {/* 30-MCQ Final Proctored Exam Selector */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <button
              className={`player-lesson ${selection === 'final-exam' ? 'active' : ''}`}
              onClick={() => setSelection('final-exam')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                background: selection === 'final-exam' ? 'rgba(99,102,241,0.18)' : 'transparent',
                border: selection === 'final-exam' ? '1px solid var(--accent)' : '1px dashed var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} style={{ color: progress === 100 ? 'var(--good)' : 'var(--muted)' }} />
                <span style={{ fontWeight: 600 }}>Final Proctored Exam</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: progress === 100 ? 'rgba(16,185,129,0.2)' : 'var(--surface2)',
                  color: progress === 100 ? 'var(--good)' : 'var(--muted)',
                }}
              >
                {progress === 100 ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </button>
          </div>
        </aside>

        <article className="panel player-content">
          {isFinalExamView ? (
            progress < 100 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <Shield size={28} color="#ef4444" />
                </div>
                <h2 style={{ font: '700 20px Manrope', margin: '0 0 8px' }}>Final Proctored Assessment Locked</h2>
                <p style={{ maxWidth: 480, margin: '0 auto 20px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
                  To maintain strict institutional accreditation standards, learners must complete reading all 5 curriculum modules before attempting the 30-MCQ Final Proctored Exam.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', padding: '8px 16px', borderRadius: 8, fontSize: 12 }}>
                  <span>Current Progress: <b>{progress}%</b></span>
                  <span>·</span>
                  <span style={{ color: 'var(--accent)' }}>Complete remaining lessons to unlock</span>
                </div>
              </div>
            ) : (
              <div>
                {/* Proctored Header Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    marginBottom: 24,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                    <div>
                      <b style={{ fontSize: 12, color: 'var(--text)' }}>AI PROCTORING PROTOCOL ACTIVE</b>
                      <small style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>
                        Institutional integrity verified · Screen focus & credential authorization monitored
                      </small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Answered: <b>{examAnswers.filter((a) => a !== -1).length}</b> / 30
                    </span>
                    <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: 'var(--good)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                      Pass Criteria: 70%
                    </span>
                  </div>
                </div>

                <div className="section-kicker">ACCREDITED COMPREHENSIVE ASSESSMENT</div>
                <h2>30-MCQ Final Examination</h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
                  Demonstrate your mastery across all 5 modules. Select the single best answer for each question below.
                </p>

                {examResult ? (
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 12,
                      background: examResult.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${examResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      marginBottom: 24,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 36, fontWeight: 800, color: examResult.passed ? 'var(--good)' : '#ef4444' }}>
                      {examResult.score}%
                    </div>
                    <h3 style={{ font: '700 18px Manrope', margin: '8px 0 6px' }}>
                      {examResult.passed ? 'Proctored Assessment Passed!' : 'Assessment Incomplete'}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 440, margin: '0 auto 16px' }}>
                      {examResult.passed
                        ? `You have achieved ${examResult.score}% (threshold: ${examResult.passingThreshold}%). Your verified institutional certificate is now issued.`
                        : `You achieved ${examResult.score}%, which is below the 70% passing requirement. Review the module materials and attempt the test again.`}
                    </p>
                    {examResult.passed ? (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                        <button
                          className="button button-primary"
                          onClick={() => setViewingCert({
                            courseTitle: course.title,
                            learnerName: user?.name,
                            institutionName: 'Northstar University',
                            grade: `${examResult.score}% · High Distinction`,
                            score: examResult.score,
                            certificateCode: examResult.certificate?.certificateCode || 'OC-CERT-2026-LIVE',
                            proctoredStatus: { isProctored: true, verified: true, score: examResult.score },
                          })}
                        >
                          View Certificate <ArrowRight size={14} />
                        </button>
                        <Link to="/certificates" className="button button-soft">All Certificates</Link>
                      </div>
                    ) : (
                      <button className="button button-primary" onClick={() => { setExamResult(null); setExamAnswers(new Array(30).fill(-1)); }}>
                        Retake Proctored Assessment
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleExamSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {finalQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '16px 20px',
                            borderRadius: 10,
                            background: 'var(--surface2)',
                            border: examAnswers[idx] !== -1 ? '1px solid var(--accent)' : '1px solid var(--border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>QUESTION {idx + 1} OF 30</span>
                            {examAnswers[idx] !== -1 && (
                              <span style={{ fontSize: 11, color: 'var(--good)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check size={12} /> Answered
                              </span>
                            )}
                          </div>
                          <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 12px', color: 'var(--text)' }}>
                            {q.prompt}
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {q.options.map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '8px 12px',
                                  borderRadius: 8,
                                  background: examAnswers[idx] === optIdx ? 'rgba(99,102,241,0.18)' : 'var(--surface)',
                                  border: examAnswers[idx] === optIdx ? '1px solid var(--accent)' : '1px solid var(--border)',
                                  cursor: 'pointer',
                                  fontSize: 12,
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`exam-q-${idx}`}
                                  checked={examAnswers[idx] === optIdx}
                                  onChange={() => {
                                    const next = [...examAnswers];
                                    next[idx] = optIdx;
                                    setExamAnswers(next);
                                  }}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        All 30 questions must be answered prior to final submission.
                      </span>
                      <button className="button button-primary" type="submit" disabled={examSubmitting}>
                        {examSubmitting ? 'Evaluating Assessment…' : 'Submit 30-MCQ Final Exam'} <Check size={14} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          ) : lesson ? (
            <>
              <div className="section-kicker">{module?.title}</div>
              <h2>{lesson.title}</h2>
              <div className="lesson-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {lesson.content || 'Your instructor has not added lesson content yet.'}
              </div>
              <div className="form-actions" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {completed.includes(selection) ? (
                  <span className="submitted-note"><Check size={15} /> Lesson complete</span>
                ) : (
                  <button className="button button-primary" disabled={busy} onClick={markComplete}>
                    {busy ? 'Saving…' : 'Mark lesson complete'} <Check size={14} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="empty-inline">This course does not have lessons yet.</div>
          )}
        </article>
      </div>

      {viewingCert && (
        <ViewCertificateModal
          certificate={viewingCert}
          user={user}
          onClose={() => setViewingCert(null)}
        />
      )}
    </div>
  );
}

function TeachingDashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', category: 'General', level: 'All levels', duration: 'Self paced', moduleTitle: 'Getting started', lessonTitle: 'Introduction', lessonContent: '' });
  const load = () => { api.get('/courses/managed').then(({ data }) => setCourses(data.courses || [])).catch((error) => toast.error(getError(error))).finally(() => setLoading(false));api.get('/courses/enrollments/pending').then(({data})=>setRequests(data.enrollments||[])).catch(()=>{}); };
  useEffect(() => { load(); }, []);
  const createCourse = async (event) => {
    event.preventDefault(); setBusy(true);
    try { const {moduleTitle,lessonTitle,lessonContent,...courseForm}=form;await api.post('/courses', {...courseForm,modules:lessonTitle.trim()?[{title:moduleTitle.trim()||'Course content',lessons:[{title:lessonTitle.trim(),type:'text',content:lessonContent}]}]:[]}); setForm({ title: '', description: '', category: 'General', level: 'All levels', duration: 'Self paced', moduleTitle: 'Getting started', lessonTitle: 'Introduction', lessonContent: '' }); toast.success('Course saved.'); load(); }
    catch (error) { toast.error(getError(error)); } finally { setBusy(false); }
  };
  const publish = async (course) => {
    try { await api.patch(`/courses/${course._id}`, { status: 'published' }); toast.success('Course published.'); load(); }
    catch (error) { toast.error(getError(error)); }
  };
  const archive = async (course) => {
    try { await api.delete(`/courses/${course._id}`); toast.success('Course archived.'); load(); }
    catch (error) { toast.error(getError(error)); }
  };
  const decideEnrollment = async (enrollment, decision) => {
    try { await api.patch(`/courses/enrollments/${enrollment._id}/decision`, { decision }); toast.success(decision === 'approve' ? 'Enrollment approved.' : 'Request declined.'); load(); }
    catch (error) { toast.error(getError(error)); }
  };
  const pending = courses.filter((course) => course.status === 'pending').length;
  return <div className="page-enter"><PageHeader kicker={user.role === 'admin' ? 'INSTITUTION WORKSPACE' : 'INSTRUCTOR WORKSPACE'} title={user.role === 'admin' ? 'Course review' : 'Teaching studio'} subtitle={user.role === 'admin' ? `${pending} course${pending === 1 ? '' : 's'} awaiting review · ${requests.length} enrollment requests` : `Create your courses, review ${requests.length} enrollment request${requests.length===1?'':'s'}, and manage what you teach.`} action={<Link className="button button-primary" to="/assignments">Manage assignments <ArrowRight size={15}/></Link>}/>
    {requests.length>0&&<><div className="section-heading"><div><div className="section-kicker">ENROLLMENT REVIEW</div><h2>Requests to join</h2></div><span className="private-badge">{requests.length} pending</span></div><div className="assignment-list">{requests.map(request=><article className="panel assignment-card enrollment-review-row" key={request._id}><div><div className="section-kicker">{request.courseId?.title||'Course'}</div><h2>{request.userId?.name||'Learner'}</h2><p className="assignment-instructions">{request.userId?.email}</p></div><div className="form-actions"><button className="button button-soft" onClick={()=>decideEnrollment(request,'reject')}>Decline</button><button className="button button-primary" onClick={()=>decideEnrollment(request,'approve')}>Approve <Check size={14}/></button></div></article>)}</div></>}
    {user.role !== 'admin' && <form className="panel profile-form" onSubmit={createCourse}><div className="panel-heading"><div><div className="section-kicker">COURSE BUILDER</div><h3>Create a course</h3></div><span className="private-badge">Saved for review</span></div><div className="form-row"><label className="field-label">Course title<input required minLength={4} maxLength={120} value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="e.g. Introduction to data storytelling"/></label><label className="field-label">Category<input maxLength={80} value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}/></label></div><label className="field-label">Description<textarea required minLength={20} maxLength={2000} rows={3} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="What will learners understand or be able to do?"/></label><div className="form-row"><label className="field-label">Level<select value={form.level} onChange={(e)=>setForm({...form,level:e.target.value})}><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label className="field-label">Duration<input maxLength={50} value={form.duration} onChange={(e)=>setForm({...form,duration:e.target.value})} placeholder="6 weeks"/></label></div><div className="section-kicker">FIRST LESSON <span className="private-badge">Optional</span></div><div className="form-row"><label className="field-label">Module<input maxLength={120} value={form.moduleTitle} onChange={(e)=>setForm({...form,moduleTitle:e.target.value})}/></label><label className="field-label">Lesson title<input maxLength={160} value={form.lessonTitle} onChange={(e)=>setForm({...form,lessonTitle:e.target.value})}/></label></div><label className="field-label">Lesson text<textarea rows={4} maxLength={20000} value={form.lessonContent} onChange={(e)=>setForm({...form,lessonContent:e.target.value})} placeholder="Write the lesson content learners will read."/></label><div className="form-actions"><button className="button button-primary" disabled={busy}>{busy?'Saving…':'Create course'} <ArrowRight size={15}/></button></div></form>}
    <div className="section-heading"><div><div className="section-kicker">COURSE PORTFOLIO</div><h2>{user.role === 'admin' ? 'Institution courses' : 'Your courses'}</h2></div><span className="private-badge">{courses.length} total</span></div>
    {loading ? <div className="course-grid">{[1,2].map((item)=><div className="course-card skeleton-card" key={item}/>)}</div> : courses.length ? <div className="assignment-list">{courses.map((course)=><article className="panel assignment-card" key={course._id}><div className="assignment-top"><div><div className="section-kicker">{course.category} · {course.instructorName}</div><h2>{course.title}</h2></div><span className={`assignment-status ${course.status}`}>{course.status}</span></div><p className="assignment-instructions">{course.description}</p><div className="assignment-meta"><span>{course.level}</span><span>{course.duration}</span><span>{course.modules?.length || 0} modules</span></div><div className="form-actions">{user.role === 'admin' && course.status !== 'published' && course.status !== 'archived' && <button className="button button-primary" onClick={()=>publish(course)}>Approve and publish <Check size={14}/></button>}{course.status !== 'archived' && (user.role === 'admin' || String(course.instructorId) === String(user._id || user.id)) && <button className="button button-soft" onClick={()=>archive(course)}>Archive</button>}</div></article>)}</div> : <div className="empty-card"><div className="empty-illustration"><BookOpen size={23}/></div><b>No courses here yet</b><p>Create a course to start building your learning space.</p></div>}
  </div>;
}

function AssignmentsPage({ user }) {
  if (user?.role !== 'student') return <InstructorAssignments />;
  const [assignments, setAssignments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/assignments').then(({ data }) => setAssignments(data.assignments || [])).catch(() => setAssignments([])).finally(() => setLoading(false)); }, []);
  const submit = async (assignment) => {
    const content = drafts[assignment._id]?.trim();
    if (!content) return toast.error('Write a response before submitting.');
    setBusy(assignment._id);
    try {
      const { data } = await api.post(`/assignments/${assignment._id}/submit`, { content });
      setAssignments((current) => current.map((item) => item._id === assignment._id ? { ...item, mySubmission: data.submission } : item));
      setDrafts((current) => ({ ...current, [assignment._id]: '' }));
      toast.success('Your submission has been received.');
    } catch (error) { toast.error(getError(error)); }
    finally { setBusy(''); }
  };
  return <><PageHeader kicker="YOUR COURSEWORK" title="Assignments" subtitle="Keep track of the work you’re doing and the feedback you’ve earned." />{loading ? <div className="assignment-list">{[1,2].map((id)=><div className="panel assignment-card skeleton-card" key={id}/>)}</div> : assignments.length ? <div className="assignment-list">{assignments.map((assignment) => {
    const due = assignment.dueAt ? new Date(assignment.dueAt) : null;
    const latest = assignment.mySubmission;
    const canSubmit = !latest || (latest.attempt < assignment.maxAttempts && latest.status !== 'published');
    return <article className="panel assignment-card" key={assignment._id}>
      <div className="assignment-top"><div><div className="section-kicker">{assignment.courseId?.title || 'COURSE'}</div><h2>{assignment.title}</h2></div><span className={`assignment-status ${latest?.status || 'open'}`}>{latest?.status === 'published' ? 'Graded' : latest?.status === 'submitted' || latest?.status === 'graded' ? 'Submitted' : due && due < new Date() ? 'Past due' : 'Not submitted'}</span></div>
      <p className="assignment-instructions">{assignment.instructions}</p>
      <div className="assignment-meta"><span><CalendarDays size={13}/>{due ? `Due ${new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(due)}` : 'No due date'}</span><span><Target size={13}/>{assignment.maxMarks} points</span><span>Attempt {latest?.attempt || 0} of {assignment.maxAttempts}</span></div>
      {latest?.status === 'published' ? <div className="grade-result"><span><Check size={15}/> Grade released</span><b>{latest.score} / {assignment.maxMarks}</b>{latest.feedback && <p>{latest.feedback}</p>}</div> : latest && !canSubmit ? <div className="submitted-note"><Check size={15}/> Submitted {latest.submittedAt ? new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(latest.submittedAt)) : ''}. Your instructor will review it.</div> : canSubmit ? <div className="submission-box"><label className="field-label">Your response<textarea rows={4} maxLength={20000} value={drafts[assignment._id] || ''} onChange={(event)=>setDrafts((current)=>({...current,[assignment._id]:event.target.value}))} placeholder="Write your response here…"/></label><button className="button button-primary" disabled={busy===assignment._id} onClick={()=>submit(assignment)}>{busy===assignment._id?'Submitting…':'Submit assignment'} <ArrowRight size={14}/></button></div> : <div className="submitted-note"><Check size={15}/> Submission received. Grades appear here after your instructor releases them.</div>}
    </article>;
  })}</div> : <div className="empty-card"><div className="empty-illustration"><Check size={22}/></div><b>You’re all caught up</b><p>Published assignments from your active courses will appear here.</p></div>}</>;
}

function InstructorAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({ courseId: '', title: '', instructions: '', dueAt: '', maxMarks: 100, maxAttempts: 1 });
  const [grades, setGrades] = useState({});
  const [busy, setBusy] = useState(false);
  const load = () => api.get('/assignments').then(({ data })=>setAssignments(data.assignments||[])).catch((error)=>toast.error(getError(error)));
  useEffect(()=>{ api.get('/courses/managed').then(({data})=>{const managed=data.courses||[];setCourses(managed);if(managed.length)setForm((current)=>({...current,courseId:managed[0]._id}));}).catch(()=>{}); load(); },[]);
  useEffect(()=>{ if(!selected){setSubmissions([]);return;} api.get(`/assignments/${selected}/submissions`).then(({data})=>setSubmissions(data.submissions||[])).catch((error)=>toast.error(getError(error))); },[selected]);
  const create = async(event) => { event.preventDefault(); setBusy(true); try { await api.post('/assignments',{...form,dueAt:form.dueAt||undefined,status:'published'}); toast.success('Assignment published.'); setForm((current)=>({...current,title:'',instructions:'',dueAt:''})); load(); } catch(error){toast.error(getError(error));} finally{setBusy(false);} };
  const grade = async(submission) => { const draft=grades[submission._id]||{}; if(draft.score==null||draft.score==='')return toast.error('Enter a score before saving.'); try { await api.patch(`/assignments/submissions/${submission._id}/grade`,{score:Number(draft.score),feedback:draft.feedback||''}); toast.success('Grade saved.'); const {data}=await api.get(`/assignments/${selected}/submissions`);setSubmissions(data.submissions||[]); } catch(error){toast.error(getError(error));} };
  const release = async(submission) => { try { await api.post(`/assignments/submissions/${submission._id}/publish-grade`); toast.success('Grade released to learner.');const {data}=await api.get(`/assignments/${selected}/submissions`);setSubmissions(data.submissions||[]); } catch(error){toast.error(getError(error));} };
  return <><PageHeader kicker="COURSEWORK WORKSPACE" title="Assignments & grading" subtitle="Publish work, review submissions, and release grades when you’re ready."/><form className="panel profile-form" onSubmit={create}><div className="panel-heading"><div><div className="section-kicker">AUTHORING</div><h3>Publish an assignment</h3></div></div>{courses.length ? <><label className="field-label">Course<select required value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})}>{courses.map(course=><option key={course._id} value={course._id}>{course.title}</option>)}</select></label><label className="field-label">Title<input required minLength={3} maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="field-label">Instructions<textarea required minLength={10} maxLength={10000} rows={4} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></label><div className="form-row"><label className="field-label">Due date<input type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/></label><label className="field-label">Maximum points<input type="number" min="1" max="10000" required value={form.maxMarks} onChange={e=>setForm({...form,maxMarks:e.target.value})}/></label><label className="field-label">Attempts<input type="number" min="1" max="10" required value={form.maxAttempts} onChange={e=>setForm({...form,maxAttempts:e.target.value})}/></label></div><div className="form-actions"><button className="button button-primary" disabled={busy}>{busy?'Publishing…':'Publish assignment'} <ArrowRight size={14}/></button></div></> : <div className="empty-inline">Create a course in the Teaching Studio before publishing assignments.</div>}</form>
    <div className="section-heading"><div><div className="section-kicker">REVIEW QUEUE</div><h2>Published assignments</h2></div></div>{assignments.length ? <div className="assignment-list">{assignments.map((assignment)=><article className="panel assignment-card" key={assignment._id}><div className="assignment-top"><div><div className="section-kicker">{assignment.courseId?.title || 'Course'}</div><h2>{assignment.title}</h2></div><span className={`assignment-status ${assignment.status}`}>{assignment.status}</span></div><p className="assignment-instructions">{assignment.instructions}</p><button className="button button-soft" onClick={()=>setSelected(selected===assignment._id?'':assignment._id)}>{selected===assignment._id?'Hide submissions':'Review submissions'} <ArrowRight size={14}/></button>{selected===assignment._id&&<div className="submission-review">{submissions.length?submissions.map((submission)=><div className="panel submission-review-card" key={submission._id}><div className="panel-heading"><div><b>{submission.studentId?.name || 'Student'}</b><small>{submission.studentId?.email} · Attempt {submission.attempt} · {new Date(submission.submittedAt).toLocaleString()}</small></div><span className={`assignment-status ${submission.status}`}>{submission.status}</span></div><p className="assignment-instructions submission-content">{submission.content}</p>{submission.status==='published'?<div className="grade-result"><span>Released</span><b>{submission.score} / {assignment.maxMarks}</b>{submission.feedback&&<p>{submission.feedback}</p>}</div>:<><div className="form-row"><label className="field-label">Score<input type="number" min="0" max={assignment.maxMarks} value={grades[submission._id]?.score ?? submission.score ?? ''} onChange={e=>setGrades({...grades,[submission._id]:{...grades[submission._id],score:e.target.value}})}/></label><label className="field-label">Feedback<input maxLength={5000} value={grades[submission._id]?.feedback ?? submission.feedback ?? ''} onChange={e=>setGrades({...grades,[submission._id]:{...grades[submission._id],feedback:e.target.value}})}/></label></div><div className="form-actions"><button className="button button-soft" onClick={()=>grade(submission)}>Save grade</button>{submission.status==='graded'&&<button className="button button-primary" onClick={()=>release(submission)}>Release grade <ArrowRight size={14}/></button>}</div></>}</div>):<div className="empty-inline">No submissions yet.</div>}</div>}</article>)}</div>:<div className="empty-card"><Check size={22}/><b>No assignments published</b><p>Create and publish your first assignment above.</p></div>}
  </>;
}

function SavedLibraryPage(){const [courses,setCourses]=useState([]);const [loading,setLoading]=useState(true);const [removing,setRemoving]=useState('');useEffect(()=>{api.get('/users/me/saved-courses').then(({data})=>setCourses(data.courses||[])).catch(error=>toast.error(getError(error))).finally(()=>setLoading(false));},[]);const remove=async(id)=>{setRemoving(id);try{await api.delete(`/users/me/saved-courses/${id}`);setCourses(items=>items.filter(course=>course._id!==id));toast.success('Removed from your library.');}catch(error){toast.error(getError(error));}finally{setRemoving('');}};return <><PageHeader kicker="KEEP WHAT INSPIRES YOU" title="Saved library" subtitle="Courses you’ve bookmarked for later." action={<Link className="button button-primary" to="/catalog"><Compass size={16}/> Explore courses</Link>}/>{loading?<div className="course-grid">{[1,2,3].map(i=><div className="course-card skeleton-card" key={i}/>)}</div>:courses.length?<div className="course-grid">{courses.map((course,index)=><div key={course._id}><CourseCard course={course} index={index}/><button className="button button-soft enroll-button" disabled={removing===course._id} onClick={()=>remove(course._id)}>{removing===course._id?'Removing…':'Remove from library'} <X size={14}/></button></div>)}</div>:<div className="empty-card"><div className="empty-illustration"><Bookmark size={23}/></div><b>Your library is ready</b><p>Save a course from Explore courses and it will be waiting here.</p><Link className="button button-soft" to="/catalog">Explore courses</Link></div>}</>}

function AchievementsPage(){const [progress,setProgress]=useState({courses:[],certificates:[],sessions:[]});const [loading,setLoading]=useState(true);useEffect(()=>{Promise.allSettled([api.get('/courses/mine'),api.get('/certificates/mine'),api.get('/planner')]).then(([courses,certificates,planner])=>setProgress({courses:courses.status==='fulfilled'?courses.value.data.courses||[]:[],certificates:certificates.status==='fulfilled'?certificates.value.data.certificates||[]:[],sessions:planner.status==='fulfilled'?planner.value.data.sessions||[]:[]})).finally(()=>setLoading(false));},[]);const completed=progress.courses.filter(course=>course.enrollmentStatus==='completed').length;const planned=progress.sessions.filter(session=>session.completed).length;const badges=[{title:'First course',description:'Enroll in your first course.',earned:progress.courses.some(course=>['active','completed'].includes(course.enrollmentStatus)),icon:BookOpen},{title:'Course completer',description:'Finish a course from start to finish.',earned:completed>0,icon:Check},{title:'Certificate earner',description:'Earn a course completion certificate.',earned:progress.certificates.length>0,icon:GraduationCap},{title:'Study rhythm',description:'Complete five planned study sessions.',earned:planned>=5,icon:CalendarDays}];return <><PageHeader kicker="NOTICE YOUR PROGRESS" title="Achievements" subtitle="Small milestones that reflect the work you’ve put in."/>{loading?<div className="empty-inline">Gathering your learning milestones…</div>:<><div className="achievement-summary panel"><div className="achievement-emblem"><Trophy size={22}/></div><div><div className="section-kicker">YOUR PROGRESS</div><h2>{badges.filter(badge=>badge.earned).length} of {badges.length} milestones earned</h2><p>Keep learning at your own pace. New milestones unlock as your activity grows.</p></div></div><div className="achievement-grid">{badges.map(({title,description,earned,icon:Icon})=><article className={`panel achievement-card ${earned?'earned':''}`} key={title}><span className="achievement-icon"><Icon size={19}/></span><div><b>{title}</b><p>{description}</p><small>{earned?'Earned':'In progress'}</small></div></article>)}</div></>}</>}

function CertificatesPage({ user }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingCert, setViewingCert] = useState(null);

  useEffect(() => {
    api.get('/certificates/mine')
      .then(({ data }) => setCertificates(data.certificates || []))
      .catch((error) => toast.error(getError(error)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader kicker="YOUR MILESTONES" title="Certificates" subtitle="A record of the courses you’ve completed and proctored assessments passed." />
      {loading ? (
        <div className="empty-inline">Loading your certificates…</div>
      ) : certificates.length ? (
        <div className="certificate-grid">
          {certificates.map((certificate) => (
            <article className="panel certificate-card" key={certificate._id}>
              <div className="certificate-emblem"><GraduationCap size={23} /></div>
              <div className="section-kicker">COURSE COMPLETION · {certificate.grade || 'Verified'}</div>
              <h2>{certificate.courseTitle}</h2>
              <p>Earned by {certificate.learnerName} · {certificate.institutionName}</p>
              <small>Issued {new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(certificate.issuedAt))}</small>
              <div className="certificate-code">ID {certificate.certificateCode}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  className="button button-primary"
                  style={{ flex: 1, height: 34, fontSize: 12 }}
                  onClick={() => setViewingCert(certificate)}
                >
                  View Certificate <ArrowRight size={14} />
                </button>
                <Link
                  className="button button-soft"
                  to={`/verify/${certificate.certificateCode}`}
                  title="Verify Authenticity"
                  style={{ height: 34, padding: '0 12px' }}
                >
                  <Shield size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <div className="empty-illustration"><GraduationCap size={23} /></div>
          <b>Your first certificate is ahead</b>
          <p>Complete all course modules and pass the 30-MCQ final proctored exam to earn your certificate.</p>
          <Link to="/courses" className="button button-soft">View my courses</Link>
        </div>
      )}
      {viewingCert && (
        <ViewCertificateModal
          certificate={viewingCert}
          user={user}
          onClose={() => setViewingCert(null)}
        />
      )}
    </>
  );
}

function CertificateVerifyPage(){const {certificateCode}=useParams();const [record,setRecord]=useState(null);const [loading,setLoading]=useState(true);useEffect(()=>{api.get(`/certificates/verify/${encodeURIComponent(certificateCode)}`).then(({data})=>setRecord(data)).catch((error)=>toast.error(getError(error))).finally(()=>setLoading(false));},[certificateCode]);return <div className="page-enter certificate-verify">{loading?<div className="empty-inline">Verifying certificate…</div>:record?<article className="panel certificate-card"><div className="certificate-emblem"><Shield size={23}/></div><div className="section-kicker">CERTIFICATE VERIFICATION</div><h1>{record.valid?'Certificate verified':'Certificate revoked'}</h1><div className={`certificate-validity ${record.valid?'valid':'revoked'}`}>{record.valid?'VALID':'REVOKED'}</div><h2>{record.certificate.courseTitle}</h2><p>Awarded to <b>{record.certificate.learnerName}</b> by {record.certificate.institutionName}</p><small>Issued {new Intl.DateTimeFormat('en',{month:'long',day:'numeric',year:'numeric'}).format(new Date(record.certificate.issuedAt))}</small><div className="certificate-code">ID {record.certificate.certificateCode}</div></article>:<div className="empty-card"><div className="empty-illustration"><Shield size={23}/></div><b>Certificate not found</b><p>Check that the verification code is correct.</p><Link to="/" className="button button-soft">Return home</Link></div>}</div>;}

function DiscussionsPage({user}) {
  const [courses,setCourses]=useState([]);const [courseId,setCourseId]=useState('');const [threads,setThreads]=useState([]);const [draft,setDraft]=useState('');const [reply,setReply]=useState('');const [replyTo,setReplyTo]=useState('');const [loading,setLoading]=useState(false);const [busy,setBusy]=useState(false);
  useEffect(()=>{const path=user.role==='student'?'/courses/mine':'/courses/managed';api.get(path).then(({data})=>{const rows=(data.courses||[]).filter(course=>user.role==='student'?['active','completed'].includes(course.enrollmentStatus):course.status==='published');setCourses(rows);if(rows.length)setCourseId(rows[0]._id);}).catch((error)=>toast.error(getError(error)));},[]);
  const load=()=>{if(!courseId)return;setLoading(true);api.get(`/discussions/courses/${courseId}`).then(({data})=>setThreads(data.discussions||[])).catch((error)=>{setThreads([]);toast.error(getError(error));}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[courseId]);
  const post=async(event,parentId=null)=>{event.preventDefault();const content=parentId?reply:draft;if(!content.trim())return;setBusy(true);try{const {data}=await api.post(`/discussions/courses/${courseId}`,{body:content.trim(),...(parentId?{parentId}:{})});if(parentId){setThreads(current=>current.map(thread=>thread._id===parentId?{...thread,replies:[...(thread.replies||[]),data.discussion]}:thread));setReply('');setReplyTo('');}else{setThreads(current=>[...current,data.discussion]);setDraft('');}toast.success(parentId?'Reply posted.':'Discussion started.');}catch(error){toast.error(getError(error));}finally{setBusy(false);}};
  const remove=async(id)=>{try{await api.delete(`/discussions/${id}`);load();toast.success('Post removed.');}catch(error){toast.error(getError(error));}};
  const canModerate=['instructor','admin'].includes(user.role);const canRemove=(post)=>canModerate||String(post.authorId?._id||post.authorId)===String(user._id);
  return <><PageHeader kicker="LEARN TOGETHER" title="Course discussions" subtitle="Ask questions, share ideas, and learn from the people in your course."/>{courses.length?<><label className="field-label discussion-course">Course<select value={courseId} onChange={event=>setCourseId(event.target.value)}>{courses.map(course=><option key={course._id} value={course._id}>{course.title}</option>)}</select></label><form className="panel discussion-compose" onSubmit={event=>post(event)}><div className="section-kicker">START A CONVERSATION</div><textarea rows={3} maxLength={5000} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="What are you curious about?"/><div className="form-actions"><button className="button button-primary" disabled={busy||!draft.trim()}>{busy?'Posting…':'Post discussion'} <ArrowRight size={14}/></button></div></form>{loading?<div className="empty-inline">Loading course discussions…</div>:threads.length?<div className="discussion-list">{threads.map(thread=><article className="panel discussion-thread" key={thread._id}><div className="discussion-author"><span className="avatar avatar-sm">{initials(thread.authorId?.name)}</span><span><b>{thread.authorId?.name||'Learner'}</b><small>{thread.authorId?.role||'Student'} · {new Date(thread.createdAt).toLocaleString()}</small></span>{canRemove(thread)&&<button className="text-button" onClick={()=>remove(thread._id)}>Remove</button>}</div><p className="discussion-body">{thread.status==='removed'?'This post was removed.':thread.body}</p><div className="discussion-replies">{thread.replies?.map(item=><div className="discussion-reply" key={item._id}><div className="discussion-author"><span className="avatar avatar-sm">{initials(item.authorId?.name)}</span><span><b>{item.authorId?.name||'Learner'}</b><small>{new Date(item.createdAt).toLocaleString()}</small></span>{canRemove(item)&&<button className="text-button" onClick={()=>remove(item._id)}>Remove</button>}</div><p className="discussion-body">{item.status==='removed'?'This reply was removed.':item.body}</p></div>)}{replyTo===thread._id?<form className="discussion-reply-form" onSubmit={event=>post(event,thread._id)}><textarea rows={2} maxLength={5000} value={reply} onChange={event=>setReply(event.target.value)} placeholder="Write a reply…"/><button className="button button-soft" disabled={busy||!reply.trim()}>Reply <ArrowRight size={13}/></button></form>:<button className="text-button" onClick={()=>setReplyTo(thread._id)}>Reply to discussion <ArrowRight size={13}/></button>}</div></article>)}</div>:<div className="empty-card"><div className="empty-illustration"><MessageCircle size={23}/></div><b>No discussions yet</b><p>Start the first conversation for this course.</p></div>}</>:<div className="empty-card"><div className="empty-illustration"><MessageCircle size={23}/></div><b>No course discussions available</b><p>Enroll in a published course to join its conversations.</p><Link to="/catalog" className="button button-soft">Explore courses</Link></div>}</>;
}

function QuizPage({user}) {
  const [quizzes,setQuizzes]=useState([]);const [courses,setCourses]=useState([]);const [selected,setSelected]=useState(null);const [answers,setAnswers]=useState([]);const [result,setResult]=useState(null);const [busy,setBusy]=useState(false);
  const [form,setForm]=useState({courseId:'',title:'',instructions:'',maxAttempts:1});const [questions,setQuestions]=useState([{prompt:'',options:['','','',''],correctIndex:0}]);
  const load=()=>api.get('/quizzes').then(({data})=>setQuizzes(data.quizzes||[])).catch((error)=>toast.error(getError(error)));
  useEffect(()=>{api.get(user.role==='student'?'/courses/mine':'/courses/managed').then(({data})=>{const items=user.role==='student'?(data.courses||[]):(data.courses||[]);setCourses(items);if(items.length)setForm(current=>({...current,courseId:items[0]._id}));}).catch(()=>{});load();},[]);
  const create=async(event)=>{event.preventDefault();setBusy(true);try{const payload={...form,questions:questions.map(q=>({...q,options:q.options.filter(option=>option.trim())}))};await api.post('/quizzes',payload);toast.success('Quiz published.');setForm(current=>({...current,title:'',instructions:''}));setQuestions([{prompt:'',options:['','','',''],correctIndex:0}]);load();}catch(error){toast.error(getError(error));}finally{setBusy(false);}};
  const start=(quiz)=>{setSelected(quiz);setAnswers(quiz.questions.map(()=>-1));setResult(null);};
  const submit=async(event)=>{event.preventDefault();if(answers.some(answer=>answer<0))return toast.error('Answer every question before submitting.');setBusy(true);try{const {data}=await api.post(`/quizzes/${selected._id}/attempts`,{answers});setResult(data);load();toast.success(`Quiz submitted: ${data.attempt.score}%`);}catch(error){toast.error(getError(error));}finally{setBusy(false);}};
  const addQuestion=()=>setQuestions(current=>[...current,{prompt:'',options:['','','',''],correctIndex:0}]);
  const patchQuestion=(index,patch)=>setQuestions(current=>current.map((question,i)=>i===index?{...question,...patch}:question));
  return <><PageHeader kicker="ASSESSMENTS" title={user.role==='student'?'Your quizzes':'Quiz studio'} subtitle={user.role==='student'?'Practice what you’ve learned and review your results.':'Create objective quizzes for your enrolled learners.'}/>
    {user.role!=='student'&&<form className="panel profile-form" onSubmit={create}><div className="panel-heading"><div><div className="section-kicker">QUIZ BUILDER</div><h3>Create a quiz</h3></div></div>{courses.length?<><label className="field-label">Course<select value={form.courseId} onChange={e=>setForm({...form,courseId:e.target.value})}>{courses.map(course=><option key={course._id} value={course._id}>{course.title}</option>)}</select></label><label className="field-label">Quiz title<input required minLength={3} maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="field-label">Instructions<input maxLength={3000} value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})}/></label><label className="field-label">Maximum attempts<input required type="number" min="1" max="10" value={form.maxAttempts} onChange={e=>setForm({...form,maxAttempts:e.target.value})}/></label>{questions.map((question,index)=><div className="panel quiz-question-builder" key={index}><b>Question {index+1}</b><label className="field-label">Prompt<input required minLength={3} maxLength={1500} value={question.prompt} onChange={e=>patchQuestion(index,{prompt:e.target.value})}/></label><div className="quiz-options-grid">{question.options.map((option,optionIndex)=><label className="field-label" key={optionIndex}>Option {optionIndex+1}<input required maxLength={300} value={option} onChange={e=>patchQuestion(index,{options:question.options.map((value,i)=>i===optionIndex?e.target.value:value)})}/></label>)}</div><label className="field-label">Correct option<select value={question.correctIndex} onChange={e=>patchQuestion(index,{correctIndex:Number(e.target.value)})}>{question.options.map((_,optionIndex)=><option key={optionIndex} value={optionIndex}>Option {optionIndex+1}</option>)}</select></label></div>)}<div className="form-actions"><button type="button" className="button button-soft" onClick={addQuestion}>Add question <span>＋</span></button><button className="button button-primary" disabled={busy}>{busy?'Publishing…':'Publish quiz'} <ArrowRight size={14}/></button></div></>:<div className="empty-inline">Create a course first, then you can add quizzes.</div>}</form>}
    {selected&&user.role==='student'?<form className="panel quiz-take-card" onSubmit={submit}><div className="panel-heading"><div><div className="section-kicker">{selected.courseId?.title}</div><h3>{selected.title}</h3></div><button type="button" className="button button-soft" onClick={()=>{setSelected(null);setResult(null);}}>Back to quizzes</button></div><p>{selected.instructions}</p>{selected.questions.map((question,index)=><fieldset className="quiz-question" key={question._id||index}><legend>{index+1}. {question.prompt}</legend>{question.options.map((option,optionIndex)=><label className="quiz-choice" key={optionIndex}><input type="radio" name={`q-${index}`} checked={answers[index]===optionIndex} disabled={Boolean(result)} onChange={()=>setAnswers(current=>current.map((answer,i)=>i===index?optionIndex:answer))}/><span>{option}</span>{result&&<small>{result.review[index]?.correctIndex===optionIndex?'Correct answer':''}{result.review[index]?.selectedIndex===optionIndex&&!result.review[index]?.correct?' · Your answer':''}</small>}</label>)}</fieldset>)}{result?<div className="grade-result"><span><Check size={15}/> Attempt {result.attempt.attempt} complete</span><b>{result.attempt.score}%</b></div>:<div className="form-actions"><button className="button button-primary" disabled={busy}>{busy?'Submitting…':'Submit quiz'} <ArrowRight size={14}/></button></div>}</form>:<div className="assignment-list">{quizzes.length?quizzes.map(quiz=><article className="panel assignment-card" key={quiz._id}><div className="assignment-top"><div><div className="section-kicker">{quiz.courseId?.title||'Course'} · {quiz.questions.length} questions</div><h2>{quiz.title}</h2></div><span className={`assignment-status ${quiz.status}`}>{quiz.status}</span></div><p className="assignment-instructions">{quiz.instructions||'Check your understanding of this course material.'}</p>{quiz.latestAttempt&&<div className="submitted-note"><Check size={15}/> Latest attempt: {quiz.latestAttempt.score}% · {quiz.latestAttempt.attempt}</div>}{user.role==='student'?<button className="button button-primary" disabled={(quiz.latestAttempt?.attempt||0)>=quiz.maxAttempts} onClick={()=>start(quiz)}>{(quiz.latestAttempt?.attempt||0)>=quiz.maxAttempts?'Attempts used':'Take quiz'} <ArrowRight size={14}/></button>:<div className="assignment-meta"><span>Up to {quiz.maxAttempts} attempts</span><span>{quiz.questions.length} questions</span></div>}</article>):<EmptyState icon={HelpCircle} title="No quizzes yet" message={user.role==='student'?'Your instructors have not published quizzes for your courses.':'Create a quiz above to check learner understanding.'}/>}</div>}
  </>;
}

// AuthPage imported from ./pages/auth/AuthPage.jsx

function AccountActionPage({ mode }) {
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [tokenInput, setTokenInput] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationBusy, setVerificationBusy] = useState(false);
  const token = params.get('token') || '';
  const verify = mode === 'verify';

  useEffect(() => {
    if (!verify || !token) return;
    let active = true;
    api.post('/auth/email/verify', { token }).then(({ data }) => {
      if (active) setMessage(data?.message || 'Your institutional email is now verified! You can proceed to your learning space.');
    }).catch((error) => {
      if (active) setMessage(getError(error));
    });
    return () => { active = false; };
  }, [verify, token]);

  const handleManualTokenSubmit = async (event) => {
    event.preventDefault();
    if (!tokenInput.trim()) return;
    setVerificationBusy(true);
    try {
      const { data } = await api.post('/auth/email/verify', { token: tokenInput.trim() });
      setMessage(data?.message || 'Your institutional email is now verified! You can proceed to your learning space.');
      toast.success('Email verified successfully!');
    } catch (error) {
      setMessage(getError(error));
      toast.error(getError(error));
    } finally {
      setVerificationBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (mode === 'reset' && password !== confirm) { toast.error('The passwords do not match.'); return; }
    setBusy(true);
    try {
      const endpoint = mode === 'forgot' ? '/auth/password/forgot' : '/auth/password/reset';
      const payload = mode === 'forgot' ? { email } : { token, password };
      const { data } = await api.post(endpoint, payload);
      setMessage(data.message || 'Request complete.');
    } catch (error) { setMessage(getError(error)); }
    finally { setBusy(false); }
  };

  const resendVerification = async (event) => {
    event.preventDefault();
    setVerificationBusy(true);
    try {
      const { data } = await api.post('/auth/email/verification/resend', { email });
      setMessage(data.message || 'Verification link sent!');
      if (data?.data?.verificationToken) {
        setTokenInput(data.data.verificationToken);
      }
      toast.success('Verification link requested.');
    } catch (error) {
      setMessage(getError(error));
      toast.error(getError(error));
    } finally {
      setVerificationBusy(false);
    }
  };

  const title = verify ? 'Email Verification' : mode === 'reset' ? 'Choose a new password' : 'Reset your password';

  return (
    <div className="auth-layout">
      <div className="auth-visual">
        <LandingNav />
        <div className="auth-art"><div className="auth-orbit" /><div className="auth-orbit inner" /><div className="auth-emblem">✳</div></div>
        <div className="auth-quote"><div>“</div><p>Your learning space,<br />ready when you are.</p><span>THE OMNICLASS APPROACH</span></div>
      </div>
      <div className="auth-form-side">
        <Link to="/" className="back-home"><ChevronLeft size={16} /> Back home</Link>
        <div className="auth-form">
          <div className="section-kicker">ACCOUNT SECURITY</div>
          <h1>{title}</h1>

          {message ? (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 my-4 text-xs text-slate-200">
              <p role="status" className="m-0 leading-relaxed">{message}</p>
              <div className="mt-4 flex gap-3">
                <Link to="/login" className="button button-primary">Proceed to sign in <ArrowRight size={14} /></Link>
                <Link to="/dashboard" className="button button-soft">Open Dashboard</Link>
              </div>
            </div>
          ) : verify ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                {token ? 'Validating your secure verification link...' : 'Confirm your institutional email using your verification token or request a new link.'}
              </p>

              {/* Manual Token Verification Box */}
              <form onSubmit={handleManualTokenSubmit} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Manual Token Verification</div>
                <label className="field-label m-0">
                  Verification Token / Code
                  <input
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste 64-character token here..."
                  />
                </label>
                <button type="submit" className="button button-primary w-full" disabled={verificationBusy || !tokenInput.trim()}>
                  {verificationBusy ? 'Verifying...' : 'Verify Token Now'} <Check size={14} />
                </button>
              </form>

              {/* Resend Link Box */}
              <form onSubmit={resendVerification} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Need a fresh link?</div>
                <label className="field-label m-0">
                  Email address
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                  />
                </label>
                <button type="submit" className="button button-soft w-full" disabled={verificationBusy || !email.trim()}>
                  {verificationBusy ? 'Sending...' : 'Resend Verification Link'} <ArrowRight size={14} />
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={submit}>
              <p className="text-xs text-slate-400">
                {mode === 'reset' ? 'Use a new password with at least 8 characters.' : 'Enter your registered email address and we will send password reset instructions.'}
              </p>
              {mode === 'forgot' && (
                <label className="field-label">Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
              )}
              {mode === 'reset' && (
                <>
                  <label className="field-label">New password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
                  <label className="field-label">Confirm new password<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
                </>
              )}
              <button className="button button-primary auth-submit" disabled={busy}>
                {busy ? 'Please wait...' : mode === 'forgot' ? 'Send reset link' : 'Update password'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div className="auth-switch"><Link to="/login">Return to sign in</Link></div>
        </div>
      </div>
    </div>
  );
}

function EmailVerificationPanel({ user }) {
  const [busy, setBusy] = useState(false);
  const [tokenReceived, setTokenReceived] = useState('');
  if (user?.emailVerifiedAt) return null;

  const resend = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/auth/email/verification/request');
      toast.success(data.message || 'Verification link generated!');
      if (data?.data?.verificationToken) {
        setTokenReceived(data.data.verificationToken);
      }
    } catch (error) {
      toast.error(getError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel verification-panel mb-6 p-4 rounded-xl bg-amber-950/20 border border-amber-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="section-kicker text-amber-400">ACCOUNT STATUS: UNVERIFIED</div>
        <b className="text-sm text-slate-200">Email verification recommended</b>
        <p className="text-xs text-slate-400 m-0 mt-1">Verify your email address to enable digital credential exports and institutional certifications.</p>
        {tokenReceived && (
          <div className="mt-2 text-xs text-amber-300 font-mono bg-amber-950/60 p-2 rounded border border-amber-800/60 break-all">
            Token: {tokenReceived}
          </div>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <Link to="/verify-email" className="button button-soft">Enter Token</Link>
        <button className="button button-primary" onClick={resend} disabled={busy}>
          {busy ? 'Sending...' : 'Request Link'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ProfilePage imported from ./pages/profile/ProfilePage.jsx

function PersistentPlannerPage(){const [items,setItems]=useState([]);const [text,setText]=useState('');const [plannedFor,setPlannedFor]=useState(new Date().toISOString().slice(0,10));const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);useEffect(()=>{api.get('/planner').then(({data})=>setItems(data.sessions||[])).catch((error)=>toast.error(getError(error))).finally(()=>setLoading(false));},[]);const add=async()=>{if(!text.trim())return;setBusy(true);try{const {data}=await api.post('/planner',{title:text.trim(),plannedFor:new Date(`${plannedFor}T12:00:00`).toISOString()});setItems(current=>[...current,data.session].sort((a,b)=>new Date(a.plannedFor)-new Date(b.plannedFor)));setText('');toast.success('Study session added.');}catch(error){toast.error(getError(error));}finally{setBusy(false);}};const toggle=async(item)=>{try{const {data}=await api.patch(`/planner/${item._id}`,{completed:!item.completed});setItems(current=>current.map(row=>row._id===item._id?data.session:row));}catch(error){toast.error(getError(error));}};const remove=async(item)=>{try{await api.delete(`/planner/${item._id}`);setItems(current=>current.filter(row=>row._id!==item._id));toast.success('Study session removed.');}catch(error){toast.error(getError(error));}};const completed=items.filter(item=>item.completed).length;return <><PageHeader kicker="YOUR TIME, WITH INTENTION" title="Study planner" subtitle="Build a gentle rhythm around the things you want to learn."/><div className="planner-layout"><div className="panel planner-panel"><div className="panel-heading"><div><div className="section-kicker">YOUR PLAN</div><h3>Study sessions</h3></div><span className="week-label">{items.length} planned</span></div><div className="task-list">{loading?<div className="empty-inline">Loading your saved sessions…</div>:items.length?items.map(item=><div className={`task-row ${item.completed?'done':''}`} key={item._id}><button className="check-circle" aria-label={item.completed?'Mark incomplete':'Mark complete'} onClick={()=>toggle(item)}>{item.completed&&<Check size={13}/>}</button><span>{item.title}<small className="session-date">{new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date(item.plannedFor))}</small></span><button className="icon-button subtle" aria-label="Remove session" onClick={()=>remove(item)}><X size={14}/></button></div>):<div className="empty-inline">Your plan is open. Add a session to get started.</div>}</div><div className="add-session"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} placeholder="What would you like to focus on?"/><input aria-label="Study date" type="date" value={plannedFor} onChange={e=>setPlannedFor(e.target.value)}/><button className="button button-soft" disabled={busy} onClick={add}>{busy?'Saving…':'Add'} <ArrowRight size={14}/></button></div></div><div className="panel planner-side"><span className="focus-icon"><Target size={17}/></span><div className="section-kicker">AIM FOR BALANCE</div><h3>Small steps add up.</h3><p>Your plan is saved to your account and stays in sync when you sign in on another device.</p><div className="goal-meter"><div className="goal-meter-top"><span>Sessions completed</span><b>{completed}</b></div><div className="progress-line"><div style={{width:`${items.length?Math.round(completed*100/items.length):0}%`}}/></div></div></div></div></>;}

// AIPage replaced with AIWorkspacePage imported from ./pages/ai/AIWorkspacePage.jsx

function LandingPage(){
  return (
    <>
      <LandingNav/>
      <main className="landing">
        <div className="landing-hero">
          <div className="landing-copy">
            <div className="landing-badge"><span/> A MORE HUMAN WAY TO LEARN</div>
            <h1>Learning, in<br/>your <em>rhythm.</em></h1>
            <p>Find your curiosity. Build real momentum. Make room for what’s next — with a learning space that meets you where you are.</p>
            <div className="landing-actions">
              <Link className="button button-primary" to="/register">Start learning <ArrowRight size={16}/></Link>
              <Link className="button button-outline" to="/catalog">Explore courses</Link>
            </div>
            <div className="landing-proof">
              <div className="proof-avatars"><span>A</span><span>M</span><span>J</span><span>+</span></div>
              <small><b>Learning is better together.</b><br/>A community of curious minds.</small>
            </div>
          </div>
          <div className="landing-visual">
            <div className="landing-glow"/>
            <div className="landing-plate">
              <div className="plate-top"><span>YOUR LEARNING SPACE</span><MoreHorizontal size={18}/></div>
              <div className="plate-greeting">A good day<br/>to <em>begin.</em></div>
              <div className="plate-course"><div className="mini-course-icon">✳</div><div><b>Explore what interests you</b><small>Choose a course · Set your pace</small></div><ArrowRight size={16}/></div>
              <div className="plate-progress"><div><span>Learning paths</span><b>Made for you</b></div><div className="progress-line"><div style={{width:'100%'}}/></div></div>
              <div className="plate-ai"><div><Sparkles size={14}/></div><span><b>A thought for you</b><small>Little by little, a little becomes a lot.</small></span></div>
            </div>
            <span className="visual-star star-one">✦</span><span className="visual-star star-two">✧</span>
            <div className="visual-ring"/>
          </div>
        </div>
        <div className="landing-values" id="approach">
          <div><span>01</span><b>Learn with intention</b><small>Clear paths, meaningful progress.</small></div>
          <div><span>02</span><b>Grow at your pace</b><small>Small steps that add up.</small></div>
          <div><span>03</span><b>Stay curious</b><small>Support that helps you think.</small></div>
        </div>
        <div className="landing-course-promo">
          <div><div className="section-kicker">FIND YOUR NEXT CHAPTER</div><h2>Good things start<br/>with a question.</h2></div>
          <Link to="/catalog" className="button button-outline">Browse the catalog <ArrowRight size={15}/></Link>
        </div>
        <LandingFooter />
      </main>
    </>
  );
}

function LandingNav(){
  return (
    <header className="landing-nav">
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        <OmniClassLogo size={28} />
      </Link>
      <nav>
        <Link to="/catalog">Explore</Link>
        <a href="#approach">Our approach</a>
        <Link to="/login">For institutions</Link>
      </nav>
      <div>
        <Link to="/login" className="nav-signin">Sign in</Link>
        <Link to="/register" className="button button-primary nav-join">Join us <ArrowRight size={15}/></Link>
      </div>
    </header>
  );
}

function ComingSoon({title}){return <div className="empty-card route-empty"><div className="empty-illustration"><Sparkles size={23}/></div><div className="section-kicker">YOUR LEARNING SPACE</div><h2>{title}</h2><p>This area is being set up. Your workspace will grow with you.</p><Link className="button button-soft" to="/dashboard">Back to overview <ArrowRight size={15}/></Link></div>;}
function PageHeader({kicker,title,subtitle,action}){return <div className="page-header"><div><div className="section-kicker">{kicker}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;}
function pageTitle(path){return ({'/dashboard':'Overview','/courses':'My courses','/teaching':'Teaching studio','/teaching/builder':'Curriculum builder','/teaching/copilot':'Instructor AI copilot','/teaching/roster':'Student roster','/admin':'Admin overview','/admin/users':'User directory','/admin/approvals':'Course reviews','/admin/settings':'Institutional settings','/assignments':'Assignments','/assessments':'Quizzes','/calendar':'Academic calendar','/discussions':'Discussions','/certificates':'Certificates','/catalog':'Explore courses','/planner':'Study planner','/ai':'AI study studio','/profile':'Your profile & integrations','/library':'Saved library','/achievements':'Achievements','/onboarding':'Welcome onboarding'})[path]||'Overview';}
function initials(name){return String(name||'').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('')||'OC';}
function roleLabel(role){return ({student:'Student',instructor:'Instructor',admin:'Administrator'})[role]||'Learner';}

export default App;
