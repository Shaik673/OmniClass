import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BookOpen, Target, Link2, Check, ArrowRight, ArrowLeft, Sparkles, Moon, Sun, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';

export default function OnboardingWizard({ user, onUser, onTheme }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    // Step 1: Profile
    name: user?.name || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    preferredLanguage: 'English',

    // Step 2: Academic
    department: user?.academic?.department || 'Computer Science',
    program: user?.academic?.program || 'Software Engineering',
    studyLevel: user?.academic?.studyLevel || 'undergraduate',
    graduationYear: user?.academic?.graduationYear || new Date().getFullYear() + 2,

    // Step 3: Goals & Interests
    interests: (user?.interests || []).join(', ') || 'Distributed Systems, AI, Full Stack',
    weeklyStudyHours: 8,
    primaryGoal: 'Master practical industry engineering skills and complete verified certifications.',

    // Step 4: External links & Theme
    githubUsername: user?.integrations?.github?.username || '',
    linkedinUrl: user?.integrations?.linkedin?.profileUrl || '',
    leetcodeUsername: user?.integrations?.leetcode?.username || '',
    theme: user?.theme || localStorage.getItem('omniclass-theme') || 'dark'
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        timezone: form.timezone,
        preferredLanguage: form.preferredLanguage,
        academic: {
          department: form.department,
          program: form.program,
          studyLevel: form.studyLevel,
          graduationYear: Number(form.graduationYear)
        },
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        integrations: {
          github: { username: form.githubUsername.trim() },
          linkedin: { profileUrl: form.linkedinUrl.trim() },
          leetcode: { username: form.leetcodeUsername.trim() }
        },
        theme: form.theme
      };

      const { data } = await api.patch('/users/me/onboarding', payload);
      if (onUser) onUser(data?.data?.user || data?.user);
      if (onTheme) onTheme(form.theme);
      toast.success('Onboarding complete! Welcome to your academic workspace.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, title: 'Profile', icon: User },
    { num: 2, title: 'Academic', icon: BookOpen },
    { num: 3, title: 'Learning Goals', icon: Target },
    { num: 4, title: 'Integrations', icon: Link2 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur">
        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 w-full z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 transition-all duration-300 z-0"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span
                  className={`text-[11px] mt-2 font-medium tracking-wide ${
                    isCurrent ? 'text-indigo-400' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Form */}
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="section-kicker">STEP 1 OF 4</div>
                <h2 className="text-2xl font-bold tracking-tight">Personal & Public Identity</h2>
                <p className="text-xs text-slate-400">Set up how faculty, peers, and collaborators recognize you.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="e.g. Distributed Systems Researcher & Full-Stack Learner"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Short Biography
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell your academic peers about your passions and aspirations..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Language
                  </label>
                  <input
                    type="text"
                    value={form.preferredLanguage}
                    onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="section-kicker">STEP 2 OF 4</div>
                <h2 className="text-2xl font-bold tracking-tight">Academic Department & Degree</h2>
                <p className="text-xs text-slate-400">Connect your courses with your department and academic cohort.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Academic Program / Major
                </label>
                <input
                  type="text"
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                  placeholder="e.g. B.S. in Computer Engineering"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Study Level
                  </label>
                  <select
                    value={form.studyLevel}
                    onChange={(e) => setForm({ ...form, studyLevel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm"
                  >
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate (Master's)</option>
                    <option value="postgraduate">Doctoral (Ph.D.)</option>
                    <option value="professional">Professional / Continuing Ed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Expected Graduation
                  </label>
                  <input
                    type="number"
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="section-kicker">STEP 3 OF 4</div>
                <h2 className="text-2xl font-bold tracking-tight">Learning Interests & Schedule</h2>
                <p className="text-xs text-slate-400">Powers your AI personalized study planner and recommendations.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Interests & Key Subjects (comma separated)
                </label>
                <input
                  type="text"
                  value={form.interests}
                  onChange={(e) => setForm({ ...form, interests: e.target.value })}
                  placeholder="Cloud Architecture, TypeScript, Data Structures"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Weekly Study Target (Hours)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="2"
                    max="40"
                    value={form.weeklyStudyHours}
                    onChange={(e) => setForm({ ...form, weeklyStudyHours: Number(e.target.value) })}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-sm font-bold text-indigo-400 w-16">{form.weeklyStudyHours} hrs/wk</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Primary Learning Objective
                </label>
                <textarea
                  rows={3}
                  value={form.primaryGoal}
                  onChange={(e) => setForm({ ...form, primaryGoal: e.target.value })}
                  placeholder="What milestone or mastery are you striving to achieve this term?"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <div className="section-kicker">STEP 4 OF 4</div>
                <h2 className="text-2xl font-bold tracking-tight">Connected Profiles & UI Theme</h2>
                <p className="text-xs text-slate-400">Showcase your public portfolios and select your preferred theme.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={form.githubUsername}
                    onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
                    placeholder="e.g. octocat"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    LeetCode Username
                  </label>
                  <input
                    type="text"
                    value={form.leetcodeUsername}
                    onChange={(e) => setForm({ ...form, leetcodeUsername: e.target.value })}
                    placeholder="e.g. touriste"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Theme Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Mode (Midnight)', icon: Moon },
                    { id: 'light', label: 'Light Mode (Pearl/Slate)', icon: Sun },
                    { id: 'system', label: 'System Automatic', icon: Monitor }
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, theme: t.id });
                          if (onTheme) onTheme(t.id);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          form.theme === t.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon size={18} className="mx-auto mb-1.5" />
                        <span className="text-xs font-medium block">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="button button-soft flex items-center gap-2 text-xs"
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
              >
                Skip for now
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="button button-primary flex items-center gap-2 text-xs"
            >
              {step === 4 ? (
                saving ? (
                  'Completing...'
                ) : (
                  <>
                    <Sparkles size={15} /> Complete Setup
                  </>
                )
              ) : (
                <>
                  Continue <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
