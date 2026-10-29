import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, ArrowUp, ArrowDown, Save, Send, Sparkles, CheckCircle2, ChevronRight, Video, FileText, HelpCircle, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';

export default function CourseBuilderPage({ user }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('new');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Course Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
    level: 'Beginner',
    duration: '6 weeks',
    enrollmentPolicy: 'open',
    tags: '',
    learningOutcomes: [''],
    modules: [
      {
        title: 'Module 1: Introduction & Foundations',
        lessons: [
          { title: 'Welcome and Course Overview', type: 'text', content: 'Welcome to this comprehensive course!' }
        ]
      }
    ]
  });

  useEffect(() => {
    fetchManagedCourses();
  }, []);

  const fetchManagedCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses/managed');
      setCourses(data?.courses || []);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (id) => {
    setSelectedCourseId(id);
    if (id === 'new') {
      setForm({
        title: '',
        description: '',
        category: 'Computer Science',
        level: 'Beginner',
        duration: '6 weeks',
        enrollmentPolicy: 'open',
        tags: '',
        learningOutcomes: [''],
        modules: [
          {
            title: 'Module 1: Introduction & Foundations',
            lessons: [
              { title: 'Welcome and Course Overview', type: 'text', content: 'Welcome to this comprehensive course!' }
            ]
          }
        ]
      });
    } else {
      const course = courses.find((c) => c._id === id);
      if (course) {
        setForm({
          title: course.title || '',
          description: course.description || '',
          category: course.category || 'Computer Science',
          level: course.level || 'Beginner',
          duration: course.duration || '6 weeks',
          enrollmentPolicy: course.enrollmentPolicy || 'open',
          tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
          learningOutcomes: course.learningOutcomes?.length ? course.learningOutcomes : [''],
          modules: course.modules?.length
            ? course.modules.map((m) => ({
                title: m.title,
                lessons: m.lessons?.map((l) => ({
                  title: l.title,
                  type: l.type || 'text',
                  content: l.content || ''
                })) || []
              }))
            : [{ title: 'Module 1: Overview', lessons: [{ title: 'Introduction', type: 'text', content: '' }] }]
        });
      }
    }
  };

  // Learning Outcomes handlers
  const addOutcome = () => {
    setForm((prev) => ({ ...prev, learningOutcomes: [...prev.learningOutcomes, ''] }));
  };

  const updateOutcome = (index, value) => {
    setForm((prev) => {
      const next = [...prev.learningOutcomes];
      next[index] = value;
      return { ...prev, learningOutcomes: next };
    });
  };

  const removeOutcome = (index) => {
    setForm((prev) => ({
      ...prev,
      learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
    }));
  };

  // Modules & Lessons handlers
  const addModule = () => {
    setForm((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          title: `Module ${prev.modules.length + 1}: Next Section`,
          lessons: [{ title: 'First Lesson', type: 'text', content: '' }]
        }
      ]
    }));
  };

  const removeModule = (mIdx) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== mIdx)
    }));
  };

  const updateModuleTitle = (mIdx, title) => {
    setForm((prev) => {
      const next = [...prev.modules];
      next[mIdx].title = title;
      return { ...prev, modules: next };
    });
  };

  const moveModule = (mIdx, dir) => {
    if ((dir === -1 && mIdx === 0) || (dir === 1 && mIdx === form.modules.length - 1)) return;
    setForm((prev) => {
      const next = [...prev.modules];
      const target = mIdx + dir;
      const temp = next[mIdx];
      next[mIdx] = next[target];
      next[target] = temp;
      return { ...prev, modules: next };
    });
  };

  const addLesson = (mIdx) => {
    setForm((prev) => {
      const next = [...prev.modules];
      next[mIdx].lessons.push({
        title: `Lesson ${next[mIdx].lessons.length + 1}`,
        type: 'text',
        content: ''
      });
      return { ...prev, modules: next };
    });
  };

  const updateLesson = (mIdx, lIdx, field, val) => {
    setForm((prev) => {
      const next = [...prev.modules];
      next[mIdx].lessons[lIdx][field] = val;
      return { ...prev, modules: next };
    });
  };

  const removeLesson = (mIdx, lIdx) => {
    setForm((prev) => {
      const next = [...prev.modules];
      next[mIdx].lessons = next[mIdx].lessons.filter((_, i) => i !== lIdx);
      return { ...prev, modules: next };
    });
  };

  const moveLesson = (mIdx, lIdx, dir) => {
    if ((dir === -1 && lIdx === 0) || (dir === 1 && lIdx === form.modules[mIdx].lessons.length - 1)) return;
    setForm((prev) => {
      const next = [...prev.modules];
      const lessons = [...next[mIdx].lessons];
      const target = lIdx + dir;
      const temp = lessons[lIdx];
      lessons[lIdx] = lessons[target];
      lessons[target] = temp;
      next[mIdx].lessons = lessons;
      return { ...prev, modules: next };
    });
  };

  const handleSave = async (submitStatus) => {
    if (!form.title.trim() || form.title.length < 4) {
      toast.error('Title must be at least 4 characters');
      return;
    }
    if (!form.description.trim() || form.description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      level: form.level,
      duration: form.duration,
      enrollmentPolicy: form.enrollmentPolicy,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      learningOutcomes: form.learningOutcomes.filter((o) => o.trim()),
      modules: form.modules,
      status: submitStatus || (user?.role === 'admin' ? 'published' : 'pending')
    };

    try {
      if (selectedCourseId === 'new') {
        const { data } = await api.post('/courses', payload);
        toast.success(
          user?.role === 'admin'
            ? 'Course created and published!'
            : 'Course saved and submitted for institutional review!'
        );
        fetchManagedCourses();
        setSelectedCourseId(data?.data?.course?._id || 'new');
      } else {
        await api.patch(`/courses/${selectedCourseId}`, payload);
        toast.success('Course curriculum updated successfully!');
        fetchManagedCourses();
      }
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter p-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="section-kicker">CURRICULUM BUILDER</div>
          <h1 className="text-3xl font-bold tracking-tight">Course Design Studio</h1>
          <p className="text-sm opacity-70">
            Build pedagogical syllabi, organize modules, write lesson content, and manage enrollment policies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="button button-soft flex items-center gap-2"
          >
            <Save size={16} /> Save Draft
          </button>
          <button
            onClick={() => handleSave(user?.role === 'admin' ? 'published' : 'pending')}
            disabled={saving}
            className="button button-primary flex items-center gap-2"
          >
            <Send size={16} /> {user?.role === 'admin' ? 'Publish Course' : 'Submit for Review'}
          </button>
        </div>
      </div>

      {/* Course Selector Bar */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <label className="text-xs uppercase font-semibold text-slate-400">Select Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => handleSelectCourse(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="new">+ Create New Course...</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title} ({c.status})
            </option>
          ))}
        </select>
        {selectedCourseId !== 'new' && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            Editing Mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="space-y-6">
          <div className="panel p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen size={18} className="text-indigo-400" /> Basic Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Course Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Distributed Cloud Systems"
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Description & Syllabus *
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what learners will gain from this curriculum..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                >
                  <option>Computer Science</option>
                  <option>Machine Learning</option>
                  <option>Data Science</option>
                  <option>Software Engineering</option>
                  <option>Design & UX</option>
                  <option>Business & Leadership</option>
                  <option>Cybersecurity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Level
                </label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                >
                  <option>All levels</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 8 weeks"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Enrollment
                </label>
                <select
                  value={form.enrollmentPolicy}
                  onChange={(e) => setForm({ ...form, enrollmentPolicy: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                >
                  <option value="open">Open (Immediate)</option>
                  <option value="approval">Instructor Approval</option>
                  <option value="invite">Invitation Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Keywords & Tags (comma separated)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="docker, kubernetes, microservices"
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="panel p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" /> Learning Outcomes
              </h2>
              <button
                type="button"
                onClick={addOutcome}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus size={14} /> Add Outcome
              </button>
            </div>

            <div className="space-y-2">
              {form.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => updateOutcome(idx, e.target.value)}
                    placeholder={`e.g. Master container orchestration with Kubernetes`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs"
                  />
                  {form.learningOutcomes.length > 1 && (
                    <button
                      onClick={() => removeOutcome(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Curriculum Builder */}
        <div className="lg:col-span-2 space-y-6">
          <div className="panel p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers size={20} className="text-indigo-400" /> Curriculum & Lesson Builder
                </h2>
                <p className="text-xs opacity-70">
                  Organize your course sequentially with modules, videos, rich text, and quizzes.
                </p>
              </div>
              <button
                type="button"
                onClick={addModule}
                className="button button-soft flex items-center gap-2 text-xs"
              >
                <Plus size={16} /> Add Module
              </button>
            </div>

            {/* Modules List */}
            <div className="space-y-6">
              {form.modules.map((module, mIdx) => (
                <div
                  key={mIdx}
                  className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4"
                >
                  {/* Module Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                        {mIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
                        className="flex-1 font-semibold text-sm bg-transparent border-b border-dashed border-slate-600 focus:border-indigo-400 px-1 py-0.5 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveModule(mIdx, -1)}
                        disabled={mIdx === 0}
                        className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveModule(mIdx, 1)}
                        disabled={mIdx === form.modules.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                      {form.modules.length > 1 && (
                        <button
                          onClick={() => removeModule(mIdx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="space-y-3 pl-4 border-l-2 border-indigo-500/30">
                    {module.lessons.map((lesson, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/40 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs text-slate-500 font-mono">
                              {mIdx + 1}.{lIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(mIdx, lIdx, 'title', e.target.value)}
                              placeholder="Lesson Title"
                              className="flex-1 font-medium text-xs bg-slate-800/80 px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-indigo-500"
                            />
                            <select
                              value={lesson.type}
                              onChange={(e) => updateLesson(mIdx, lIdx, 'type', e.target.value)}
                              className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300"
                            >
                              <option value="text">Rich Text</option>
                              <option value="video">Video Stream</option>
                              <option value="document">PDF / Doc</option>
                              <option value="quiz">Quiz</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveLesson(mIdx, lIdx, -1)}
                              disabled={lIdx === 0}
                              className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => moveLesson(mIdx, lIdx, 1)}
                              disabled={lIdx === module.lessons.length - 1}
                              className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-30"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              onClick={() => removeLesson(mIdx, lIdx)}
                              className="p-1 text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <textarea
                            rows={3}
                            value={lesson.content}
                            onChange={(e) => updateLesson(mIdx, lIdx, 'content', e.target.value)}
                            placeholder="Write comprehensive lesson materials, reading assignments, or embedded video notes..."
                            className="w-full px-2.5 py-1.5 rounded bg-slate-800/50 border border-slate-700/60 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addLesson(mIdx)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium pt-1"
                    >
                      <Plus size={14} /> Add Lesson to Module {mIdx + 1}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
