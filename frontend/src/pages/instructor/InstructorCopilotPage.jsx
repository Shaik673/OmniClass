import { useState, useEffect } from 'react';
import { Sparkles, Bot, Send, Copy, Check, BookOpen, Layers, Award, Bell, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';
import GeminiMessage from '../../components/shared/GeminiMessage.jsx';

export default function InstructorCopilotPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [task, setTask] = useState('syllabus');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/courses/managed')
      .then(({ data }) => {
        const list = data?.courses || [];
        setCourses(list);
        if (list.length > 0) setSelectedCourseId(list[0]._id);
      })
      .catch((err) => toast.error(getError(err)));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please enter instructions for the copilot');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post('/ai/copilot/draft', {
        courseId: selectedCourseId || undefined,
        task,
        prompt: prompt.trim()
      });

      setResult(data?.data?.draft || data?.draft || 'Draft generated successfully.');
      toast.success('Pedagogical draft generated!');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const taskPresets = [
    {
      id: 'syllabus',
      label: 'Curriculum & Syllabus',
      icon: Layers,
      defaultPrompt: 'Create a 6-week module breakdown with clear weekly themes, lessons, and learning outcomes.'
    },
    {
      id: 'rubric',
      label: 'Grading Rubric',
      icon: Award,
      defaultPrompt: 'Draft an analytic grading rubric with 4 criteria: Code Quality, Architectural Design, Testing Rigor, and Documentation.'
    },
    {
      id: 'assignment',
      label: 'Assignment Instructions',
      icon: BookOpen,
      defaultPrompt: 'Draft an engaging project prompt requiring learners to implement a scalable cache using Redis and Node.js.'
    },
    {
      id: 'quiz',
      label: 'Question Bank Draft',
      icon: HelpCircle,
      defaultPrompt: 'Generate 5 multiple-choice questions testing distributed consensus, Raft protocol, and quorum reads.'
    },
    {
      id: 'announcement',
      label: 'Course Announcement',
      icon: Bell,
      defaultPrompt: 'Draft an encouraging mid-term announcement highlighting upcoming project submissions and office hours.'
    }
  ];

  return (
    <div className="page-enter p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="section-kicker">INSTRUCTOR AI STUDIO</div>
          <h1 className="text-3xl font-bold tracking-tight">Pedagogical Copilot</h1>
          <p className="text-sm opacity-70">
            Assisting educators in drafting syllabi, analytic rubrics, assignment prompts, and exam questions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Bot size={15} /> Grounded with Course Content
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Panel */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="panel p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Course Context
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Copilot Objective
              </label>
              <div className="grid grid-cols-1 gap-2">
                {taskPresets.map((preset) => {
                  const Icon = preset.icon;
                  const active = task === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setTask(preset.id);
                        setPrompt(preset.defaultPrompt);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                      }`}
                    >
                      <Icon size={16} className={active ? 'text-white' : 'text-indigo-400'} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Instructions & Parameters
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Specify target audience, criteria, point distributions, or tone..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button button-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              <Sparkles size={16} />
              {loading ? 'Drafting with AI...' : 'Generate Teaching Draft'}
            </button>
          </form>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7">
          <div className="panel p-6 rounded-2xl bg-slate-900/60 border border-slate-800 min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Bot size={17} className="text-indigo-400" />
                <span>Generated Pedagogical Output</span>
              </div>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  <p className="text-xs">Orchestrating internal models & pedagogical RAG...</p>
                </div>
              ) : result ? (
                <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/40">
                  <GeminiMessage content={result} showFooter={false} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-500 text-center space-y-2">
                  <Bot size={36} className="opacity-30" />
                  <p className="text-sm font-medium">Select an objective and click Generate</p>
                  <p className="text-xs max-w-sm opacity-70">
                    The Copilot uses your course syllabus and institutional criteria to generate structured teaching materials.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
