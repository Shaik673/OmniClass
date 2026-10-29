import { useEffect, useState, useRef } from 'react';
import {
  Sparkles, Calendar, HelpCircle, FileText, CheckCircle2,
  Mic, MicOff, Volume2, VolumeX, ArrowRight, BookOpen,
  Bot, RefreshCw, Send, Shield, UserRound, Zap, Check, RotateCcw, Lightbulb,
  Trash2, Clock, Plus, MessageSquare, UploadCloud, Youtube, Layers,
  ExternalLink, ChevronRight, Menu, X, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';
import GeminiMessage from '../../components/shared/GeminiMessage.jsx';

export default function AIWorkspacePage() {
  const [activeTab, setActiveTab] = useState('tutor');
  const [prefilledQuizTopic, setPrefilledQuizTopic] = useState('');

  const handleLaunchQuizFromSummary = (topicTitle) => {
    setPrefilledQuizTopic(topicTitle);
    setActiveTab('quiz');
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="section-kicker">OMNICLASS AI LEARNING SUITE</div>
          <h1>AI Learning Studio</h1>
          <p>Context-aware tutoring, personalized study planning, 3-part quiz synthesis, and speech-enabled revision.</p>
        </div>
      </div>

      {/* Studio Workflow Navigation */}
      <div className="ai-tabs-bar">
        {[
          { id: 'tutor', label: 'AI Study Tutor', icon: Bot },
          { id: 'planner', label: 'Personalized Study Planner', icon: Calendar },
          { id: 'quiz', label: 'Quiz & Flashcard Generator', icon: HelpCircle },
          { id: 'summarizer', label: 'Notes & Content Summarizer', icon: FileText },
          { id: 'feedback', label: 'Assignment Formative Feedback', icon: CheckCircle2 },
          { id: 'voice', label: 'Interactive Voice Tutor', icon: Mic },
          { id: 'recommendations', label: 'Course Recommendations', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`ai-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'tutor' && <TutorView />}
      {activeTab === 'planner' && <PlannerView />}
      {activeTab === 'quiz' && <QuizGeneratorView initialTopic={prefilledQuizTopic} />}
      {activeTab === 'summarizer' && <SummarizerView onLaunchQuiz={handleLaunchQuizFromSummary} />}
      {activeTab === 'feedback' && <FeedbackView />}
      {activeTab === 'voice' && <VoiceTutorView />}
      {activeTab === 'recommendations' && <RecommendationsView />}
    </div>
  );
}

// ─── 1. AI STUDY TUTOR VIEW (5-Chat History, Letter-by-Letter, Smooth Scroll) ───
const TUTOR_HISTORY_STORAGE_KEY = 'omniclass_ai_tutor_history';

function TutorView() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [style, setStyle] = useState('clear');
  const [activeConvId, setActiveConvId] = useState(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const typingTimerRef = useRef(null);
  const chatBodyRef = useRef(null);

  // At most 5 conversations stored in history
  const [conversations, setConversations] = useState(() => {
    try {
      const raw = localStorage.getItem(TUTOR_HISTORY_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    api.get('/courses/mine').then(({ data }) => {
      const items = data.courses || [];
      setCourses(items);
      if (items.length) setCourseId(items[0]._id);
    }).catch(() => {});
  }, []);

  // Smooth auto-scroll tracking without jitter
  const scrollToBottom = () => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Clean up typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  const saveToHistory = (convId, promptTitle, allMsgs) => {
    setConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === convId);
      const title = promptTitle.length > 34 ? promptTitle.slice(0, 32) + '…' : promptTitle;
      let next;
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          title: next[existingIdx].title || title,
          messages: allMsgs,
          updatedAt: Date.now(),
        };
      } else {
        next = [
          {
            id: convId,
            title,
            messages: allMsgs,
            updatedAt: Date.now(),
          },
          ...prev,
        ];
      }
      // Dynamically auto-prune to keep at most 5 latest conversations
      const pruned = next.slice(0, 5);
      try {
        localStorage.setItem(TUTOR_HISTORY_STORAGE_KEY, JSON.stringify(pruned));
      } catch {}
      return pruned;
    });
  };

  const deleteConversation = (id, e) => {
    e?.stopPropagation();
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(TUTOR_HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const startNewChat = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setIsGenerating(false);
    setBusy(false);
    setActiveConvId(null);
    setMessages([]);
    setMessage('');
    setMobileHistoryOpen(false);
  };

  const loadConversation = (conv) => {
    if (isGenerating) return;
    setActiveConvId(conv.id);
    setMessages(conv.messages || []);
    setMobileHistoryOpen(false);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!message.trim() || busy || isGenerating) return;
    const question = message.trim();
    const convId = activeConvId || `conv-${Date.now()}`;
    if (!activeConvId) setActiveConvId(convId);

    const userMsg = {
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setMessage('');
    setBusy(true);
    setIsGenerating(true);

    try {
      const { data } = await api.post('/ai/tutor/message', {
        message: question,
        courseId: courseId || undefined,
        explanationStyle: style,
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });

      const fullContent = data.content || '';
      const assistantPlaceholder = {
        role: 'assistant',
        content: '',
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...newMessages, assistantPlaceholder]);

      // Dynamic typewriter effect: letter-by-letter with smooth auto-scroll
      let charIndex = 0;
      const stepSize = Math.max(2, Math.min(5, Math.ceil(fullContent.length / 90)));

      if (typingTimerRef.current) clearInterval(typingTimerRef.current);

      typingTimerRef.current = setInterval(() => {
        charIndex += stepSize;
        if (charIndex >= fullContent.length) {
          charIndex = fullContent.length;
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          setIsGenerating(false);
          setBusy(false);

          const finalAssistantMsg = {
            ...assistantPlaceholder,
            content: fullContent,
          };
          const completeMessages = [...newMessages, finalAssistantMsg];
          setMessages(completeMessages);
          saveToHistory(convId, question, completeMessages);
          scrollToBottom();
        } else {
          const slice = fullContent.slice(0, charIndex);
          setMessages((prev) => {
            if (!prev.length) return prev;
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last && last.role === 'assistant') {
              updated[updated.length - 1] = { ...last, content: slice };
            }
            return updated;
          });
          scrollToBottom();
        }
      }, 16);
    } catch (err) {
      setIsGenerating(false);
      setBusy(false);
      const errMsg = {
        role: 'assistant',
        content: `Unable to process question. ${getError(err)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const completeMessages = [...newMessages, errMsg];
      setMessages(completeMessages);
      saveToHistory(convId, question, completeMessages);
      scrollToBottom();
    }
  };

  return (
    <div className="ai-workspace-layout responsive-ai-grid">
      {/* ─── LEFT: Past Conversations History Panel (Max 5) ─── */}
      <aside className={`panel ai-history-panel ${mobileHistoryOpen ? 'mobile-history-open' : ''}`} style={{ padding: 16, height: '700px', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div className="section-kicker">SAVED SESSIONS</div>
            <h3 style={{ font: '700 14px Manrope', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Chat History</span>
              <span style={{ fontSize: 10, padding: '1px 6px', background: 'var(--surface2)', borderRadius: 10, color: 'var(--accent)' }}>
                {conversations.length}/5
              </span>
            </h3>
          </div>
          <button
            className="button button-soft"
            style={{ fontSize: 11, padding: '5px 10px', height: 'auto' }}
            onClick={startNewChat}
            title="Start new conversation"
          >
            <Plus size={12} style={{ marginRight: 4 }} /> New
          </button>
        </div>

        <p style={{ fontSize: 10, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.4 }}>
          Omni Tutor preserves up to 5 recent study chats. Older sessions auto-prune to keep memory focused.
        </p>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!conversations.length ? (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--muted)', fontSize: 11 }}>
              <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <b>No past conversations</b>
              <p style={{ margin: '4px 0 0', fontSize: 10 }}>Ask your tutor a question to start your first session.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeConvId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => loadConversation(c)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive ? 'rgba(99, 102, 241, 0.16)' : 'var(--surface2)',
                    border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ font: '600 12px Manrope', color: isActive ? 'var(--accent)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title || 'Tutoring Session'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} />
                      <span>{new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>{c.messages?.length || 0} msgs</span>
                    </div>
                  </div>
                  <button
                    className="icon-button subtle"
                    style={{ width: 22, height: 22, padding: 0 }}
                    onClick={(e) => deleteConversation(c.id, e)}
                    title="Delete conversation"
                  >
                    <Trash2 size={12} color="var(--muted)" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {conversations.length > 0 && (
          <button
            className="text-button"
            style={{ fontSize: 11, marginTop: 8, textAlign: 'center', color: 'var(--muted)' }}
            onClick={() => {
              if (window.confirm('Clear all conversation history?')) {
                setConversations([]);
                localStorage.removeItem(TUTOR_HISTORY_STORAGE_KEY);
                startNewChat();
              }
            }}
          >
            Clear History
          </button>
        )}
      </aside>

      {/* ─── CENTER: Active AI Chat Box ─── */}
      <div className="ai-chat panel" style={{ height: '700px', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
        {/* Header without 'New Chat' button beside Omni Tutor */}
        <div className="ai-chat-head" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile History Toggle */}
            <button
              className="icon-button mobile-only-btn"
              onClick={() => setMobileHistoryOpen(!mobileHistoryOpen)}
              title="Toggle chat history"
              style={{ display: 'none' }}
            >
              <Menu size={16} />
            </button>
            <div className="ai-mark" style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <b style={{ fontSize: 14 }}>Omni Tutor</b>
              <small style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                <span className="online-dot" /> {courseId ? 'Grounded in course curriculum' : 'General Academic Knowledge'}
              </small>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: 11, fontWeight: 600 }}>
                <RefreshCw size={12} className="animate-spin" />
                <span>Generating live...</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Chat Body with Ref */}
        <div ref={chatBodyRef} className="chat-body" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {!messages.length ? (
            <div className="ai-welcome" style={{ padding: '40px 10px', textAlign: 'center' }}>
              <div className="ai-orb" style={{ margin: '0 auto 16px', width: 56, height: 56, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
                <Sparkles size={28} />
              </div>
              <div className="section-kicker">PERSONALIZED PEDAGOGICAL AI</div>
              <h2 style={{ font: '700 22px Manrope', margin: '8px 0 10px' }}>What concept would you like to master?</h2>
              <p style={{ maxWidth: 460, margin: '0 auto 24px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                Ask conceptual questions, request step-by-step mathematical reasoning, or explore real-world analogies. Responses stream letter-by-letter with rich formatting.
              </p>
              <div className="prompt-chips" style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['Explain gradient descent intuitively', 'How does the bias-variance tradeoff work?', 'Give me a practice example of Gestalt proximity'].map((x) => (
                  <button key={x} className="button button-soft" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => setMessage(x)}>
                    {x} <ArrowRight size={12} style={{ marginLeft: 4 }} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                {m.role === 'user' ? (
                  /* ─── Differentiated User Prompt Styling ─── */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11, color: '#818cf8', fontWeight: 600 }}>
                      <UserRound size={12} />
                      <span>You (Prompt)</span>
                      {m.timestamp && <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>· {m.timestamp}</span>}
                    </div>
                    <div
                      className="user-chat-bubble"
                      style={{
                        maxWidth: '85%',
                        borderRadius: '16px 4px 16px 16px',
                        padding: '12px 18px',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ─── Differentiated AI Content Response Styling ─── */
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 11, fontWeight: 700 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                        <Sparkles size={12} />
                      </div>
                      <span className="tutor-label" style={{ letterSpacing: 0.3 }}>Omni Tutor</span>
                      {isGenerating && i === messages.length - 1 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontSize: 11, fontWeight: 600, marginLeft: 6 }}>
                          <RefreshCw size={12} className="animate-spin" /> Live typing...
                        </span>
                      )}
                    </div>
                    <div
                      className="ai-chat-bubble"
                      style={{
                        width: '100%',
                        borderRadius: '4px 16px 16px 16px',
                        padding: '16px 20px',
                      }}
                    >
                      <GeminiMessage
                        content={m.content}
                        sources={m.sources || []}
                        showFooter={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={send} className="chat-input" style={{ margin: '0 16px 16px', padding: '10px 48px 30px 14px' }}>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={isGenerating ? 'Omni Tutor is responding...' : 'Ask a question about your lessons, concepts, or code...'}
            disabled={isGenerating}
          />
          <button disabled={busy || isGenerating || !message.trim()} type="submit" aria-label="Send message">
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          </button>
          <div className="chat-disclaimer">
            OmniClass AI synthesizes curriculum materials with academic rigor. History stores at most 5 recent conversations.
          </div>
        </form>
      </div>

      {/* ─── RIGHT: Course Context & Style Panel ─── */}
      <aside className="ai-context panel" style={{ padding: 16, height: '700px', background: 'var(--surface)' }}>
        <div className="section-kicker">GROUNDING CONTEXT</div>
        <h3 style={{ font: '700 14px Manrope', margin: '4px 0 10px' }}>Curriculum Anchor</h3>
        <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 14px' }}>
          Anchor explanations to your enrolled syllabus or general computer science theory.
        </p>

        <label className="field-label" style={{ marginBottom: 14 }}>
          Target Course
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">General Academic Knowledge</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </label>

        <label className="field-label" style={{ marginBottom: 16 }}>
          Explanation Persona
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="clear">Clear & Concise</option>
            <option value="step_by_step">Step-by-Step Breakdown</option>
            <option value="examples">Real-World Case Examples</option>
          </select>
        </label>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, fontSize: 11, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <b style={{ color: 'var(--text)' }}>Features active:</b>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--good)' }}>
            <Check size={13} /> Multi-turn conversational memory
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--good)' }}>
            <Check size={13} /> Letter-by-letter live streaming
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--good)' }}>
            <Check size={13} /> Formatted code blocks with syntax copy
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--good)' }}>
            <Check size={13} /> Strict 5-session auto-pruning
          </span>
        </div>
      </aside>
    </div>
  );
}

// ─── 2. PERSONALIZED STUDY PLANNER VIEW ──────────────────────────────────────
function PlannerView() {
  const [hours, setHours] = useState(6);
  const [goals, setGoals] = useState('Prepare for midterm assessments and reinforce algorithmic design.');
  const [planResult, setPlanResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/ai/planner/generate', { weeklyHours: Number(hours), goals });
      setPlanResult(data);
      toast.success('Generated study plan.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <div className="panel profile-form" style={{ alignSelf: 'start' }}>
        <div className="section-kicker">ALGORITHMIC SCHEDULING</div>
        <h3 style={{ font: '700 16px Manrope', margin: '6px 0 14px' }}>Weekly Focus Parameters</h3>

        <label className="field-label">
          Dedicated Study Time (Hours / Week)
          <input type="number" min={1} max={40} value={hours} onChange={(e) => setHours(e.target.value)} />
        </label>

        <label className="field-label">
          Primary Objective / Exam Focus
          <textarea rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="e.g. Master dynamic programming, prepare for final certification" />
        </label>

        <button className="button button-primary" style={{ width: '100%', marginTop: 8 }} disabled={busy} onClick={generate}>
          {busy ? 'Synthesizing...' : 'Generate Personalized Plan'} <Calendar size={14} />
        </button>
      </div>

      <div className="panel" style={{ padding: 24, minHeight: 400 }}>
        {planResult ? (
          <div>
            <div className="section-kicker">PERSONALIZED STUDY SCHEDULE</div>
            <h2 style={{ font: '700 18px Manrope', margin: '4px 0 16px' }}>Your AI-Generated Learning Roadmap</h2>
            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              {(planResult.sessions || []).map((s, idx) => (
                <div key={idx} className="panel" style={{ padding: '14px 18px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: 13, color: 'var(--accent)' }}>{s.day}: {s.title}</b>
                    <span style={{ fontSize: 10, color: 'var(--faint)' }}>{s.durationMinutes} minutes</span>
                  </div>
                  <p style={{ margin: '4px 0 8px', fontSize: 11, color: 'var(--muted)' }}><b>Focus:</b> {s.focus}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: 'var(--text)' }}>
                    {s.tasks.map((t, tIdx) => <li key={tIdx}>{t}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-card" style={{ minHeight: 320 }}>
            <Calendar size={32} style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <b style={{ fontSize: 14 }}>Study plan generator ready</b>
            <p>Set your available study hours and key goals to generate a structured weekly breakdown.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. AI QUIZ GENERATOR VIEW (3 Parts, 5 MCQs Each = 15 MCQs) ─────────────
function QuizGeneratorView({ initialTopic = '' }) {
  const [topic, setTopic] = useState(initialTopic || 'Gradient Descent and Neural Optimization');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [quizData, setQuizData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [activePart, setActivePart] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    if (initialTopic && initialTopic !== topic) {
      setTopic(initialTopic);
      generate(initialTopic);
    }
  }, [initialTopic]);

  const generate = async (customTopic) => {
    const qTopic = customTopic || topic;
    if (!qTopic.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post('/ai/quiz/generate', {
        topic: qTopic,
        difficulty,
        questionCount: 15,
      });
      setQuizData(data);
      setSelectedAnswers({});
      setShowExplanation(false);
      setActivePart(1);
      toast.success('Generated 3-part assessment (15 MCQs) & flashcards.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  const currentPartData = quizData?.parts?.[activePart - 1];
  const partQuestions = currentPartData?.questions || (quizData?.questions || []).slice((activePart - 1) * 5, activePart * 5);

  // Score calculations
  const totalQuestions = (quizData?.questions || []).length || 15;
  const answeredCount = Object.keys(selectedAnswers).length;
  let correctCount = 0;
  if (quizData?.questions) {
    quizData.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correctCount++;
    });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <div className="panel profile-form" style={{ alignSelf: 'start' }}>
        <div className="section-kicker">ASSESSMENT ENGINE</div>
        <h3 style={{ font: '700 16px Manrope', margin: '6px 0 14px' }}>3-Part Assessment Generator</h3>

        <label className="field-label">
          Topic / Subject Area
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Microservices, Raft Consensus, React Hooks" />
        </label>

        <label className="field-label">
          Target Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </label>

        <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, fontSize: 11, color: 'var(--muted)', margin: '10px 0 14px' }}>
          <b style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>Structured 3-Part Assessment:</b>
          <span>• Part 1: Conceptual Foundations (5 MCQs)</span><br />
          <span>• Part 2: Applied Analysis (5 MCQs)</span><br />
          <span>• Part 3: Advanced Synthesis (5 MCQs)</span>
        </div>

        <button className="button button-primary" style={{ width: '100%' }} disabled={busy || !topic.trim()} onClick={() => generate()}>
          {busy ? 'Synthesizing 15 MCQs...' : 'Generate 3-Part Quiz'} <HelpCircle size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {quizData ? (
          <>
            {/* 3-Part Part Selector Tabs */}
            <div className="panel" style={{ padding: '16px 20px', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                <div>
                  <div className="section-kicker">EXAMINATION STRUCTURE</div>
                  <h3 style={{ font: '700 16px Manrope', margin: '2px 0 0' }}>{topic}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Score: <b>{correctCount} / {totalQuestions}</b> ({Math.round((correctCount / totalQuestions) * 100)}%)
                  </span>
                  {showExplanation && (correctCount / totalQuestions) >= 0.7 && (
                    <span className="private-badge" style={{ color: 'var(--good)' }}>✓ Passed</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 2, 3].map((pNum) => (
                  <button
                    key={pNum}
                    className={`button ${activePart === pNum ? 'button-primary' : 'button-soft'}`}
                    style={{ fontSize: 11, padding: '7px 14px' }}
                    onClick={() => setActivePart(pNum)}
                  >
                    Part {pNum}: {pNum === 1 ? 'Foundations' : pNum === 2 ? 'Applied' : 'Advanced'} (5 MCQs)
                  </button>
                ))}
              </div>
            </div>

            {/* Questions for the Active Part */}
            <div className="panel" style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <span className="section-kicker">PART {activePart} OF 3</span>
                <h3 style={{ font: '700 16px Manrope', margin: '4px 0 2px' }}>
                  {currentPartData?.title || `Part ${activePart}`}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                  {currentPartData?.description || 'Answer the 5 questions below to check your mastery of this section.'}
                </p>
              </div>

              {partQuestions.map((q, localIdx) => {
                const globalIdx = (activePart - 1) * 5 + localIdx;
                const isAnswered = selectedAnswers[globalIdx] !== undefined;
                return (
                  <div key={globalIdx} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <b style={{ fontSize: 13, display: 'block', marginBottom: 10, color: 'var(--text)' }}>
                      {globalIdx + 1}. {q.prompt}
                    </b>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[globalIdx] === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        return (
                          <button
                            key={oIdx}
                            className="button button-soft"
                            style={{
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              background: showExplanation && isCorrect ? 'rgba(16, 185, 129, 0.15)' : isSelected ? 'rgba(99, 102, 241, 0.16)' : 'var(--surface2)',
                              borderColor: showExplanation && isCorrect ? 'var(--good)' : isSelected ? 'var(--accent)' : 'var(--border)',
                              color: 'var(--text)',
                              padding: '10px 14px',
                            }}
                            onClick={() => setSelectedAnswers({ ...selectedAnswers, [globalIdx]: oIdx })}
                          >
                            <span style={{ width: 22, fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--muted)' }}>
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span style={{ fontSize: 12 }}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {showExplanation && (
                      <div style={{ marginTop: 10, padding: 10, background: 'var(--surface2)', borderRadius: 8, fontSize: 11, color: 'var(--muted)', borderLeft: '3px solid var(--accent)' }}>
                        <b style={{ color: 'var(--good)' }}>Verified Explanation:</b> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <button className="button button-primary" onClick={() => setShowExplanation(!showExplanation)}>
                  {showExplanation ? 'Hide Answer Keys' : 'Check Answers & Reveal Explanations'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Answered {answeredCount} of {totalQuestions} questions
                </div>
              </div>
            </div>

            {/* Study Flashcards */}
            {quizData.flashcards?.length > 0 && (
              <div className="panel" style={{ padding: 24 }}>
                <div className="section-kicker">ACTIVE RECALL FLASHCARDS</div>
                <h3 style={{ font: '700 16px Manrope', margin: '4px 0 14px' }}>Revision Flashcards</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {quizData.flashcards.map((f, i) => (
                    <div
                      key={i}
                      className="flashcard-inner"
                      style={{
                        padding: 18,
                        borderRadius: 12,
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: 4 }}>CARD {i + 1}</span>
                      <b style={{ fontSize: 12, display: 'block', marginBottom: 8, color: 'var(--text)' }}>{f.front}</b>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{f.back}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="panel empty-card" style={{ minHeight: 340 }}>
            <HelpCircle size={36} style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <b style={{ fontSize: 15 }}>3-Part Assessment Generator Ready</b>
            <p style={{ maxWidth: 420 }}>
              Enter any academic topic or lecture subject above to dynamically synthesize 15 MCQs across Conceptual, Applied, and Advanced tiers, complete with detailed explanations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 4. NOTES & CONTENT SUMMARIZER VIEW (Upload, YouTube & Paste) ───────────
function SummarizerView({ onLaunchQuiz }) {
  const [mode, setMode] = useState('paste'); // 'upload' | 'youtube' | 'paste'
  const [text, setText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Extract YouTube Video ID
  const getYouTubeId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    const validExts = ['.pdf', '.docx', '.ppt', '.pptx', '.txt', '.md'];
    const name = file.name;
    const hasValidExt = validExts.some((ext) => name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      return toast.error('Please upload a supported document (.pdf, .docx, .ppt, .pptx, .txt)');
    }
    setUploadedFileName(file.name);
    // Read text content
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const content = uploadEvent.target.result || '';
      setText(typeof content === 'string' ? content : `Document: ${file.name} (Binary Content Extracted)`);
      toast.success(`Loaded file: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const summarize = async () => {
    if (mode === 'youtube' && !youtubeUrl.trim()) return toast.error('Please paste a YouTube URL.');
    if (mode !== 'youtube' && !text.trim()) return toast.error('Please paste or upload content.');

    setBusy(true);
    try {
      const { data } = await api.post('/ai/summarizer/summarize', {
        text: mode === 'youtube' ? `YouTube Lecture: ${youtubeUrl}` : text,
        youtubeUrl: mode === 'youtube' ? youtubeUrl.trim() : undefined,
        fileType: mode === 'upload' ? uploadedFileName : undefined,
      });
      setSummary(data.summary);
      toast.success('Generated comprehensive notes.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  const ytId = getYouTubeId(youtubeUrl);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* ─── LEFT: 3-Option Input Studio (YouLearn inspired) ─── */}
      <div className="panel profile-form" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="section-kicker">CONTENT INGESTION STUDIO</div>
        <h3 style={{ font: '700 16px Manrope', margin: '4px 0 12px' }}>Choose Learning Material Source</h3>

        {/* 3 Source Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={`button ${mode === 'upload' ? 'button-primary' : 'button-soft'}`}
            style={{ fontSize: 11, padding: '7px 8px' }}
            onClick={() => setMode('upload')}
          >
            <UploadCloud size={13} style={{ marginRight: 4 }} /> Drop File
          </button>
          <button
            type="button"
            className={`button ${mode === 'youtube' ? 'button-primary' : 'button-soft'}`}
            style={{ fontSize: 11, padding: '7px 8px' }}
            onClick={() => setMode('youtube')}
          >
            <Youtube size={13} style={{ marginRight: 4 }} /> YouTube URL
          </button>
          <button
            type="button"
            className={`button ${mode === 'paste' ? 'button-primary' : 'button-soft'}`}
            style={{ fontSize: 11, padding: '7px 8px' }}
            onClick={() => setMode('paste')}
          >
            <FileText size={13} style={{ marginRight: 4 }} /> Paste Text
          </button>
        </div>

        {/* Mode 1: Drag & Drop File */}
        {mode === 'upload' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1,
              minHeight: 220,
              border: dragActive ? '2px dashed var(--accent)' : '2px dashed var(--border)',
              borderRadius: 14,
              background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.ppt,.pptx,.txt,.md"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <UploadCloud size={36} style={{ color: 'var(--accent)', marginBottom: 10 }} />
            <b style={{ fontSize: 13, color: 'var(--text)' }}>
              {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Drag & drop your study document here'}
            </b>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 10px' }}>
              Supports .pdf, .docx, .ppt, .pptx, and text files up to 25MB
            </p>
            <span className="button button-soft" style={{ fontSize: 10, padding: '5px 12px' }}>
              Browse from device
            </span>
          </div>
        )}

        {/* Mode 2: YouTube URL */}
        {mode === 'youtube' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="field-label" style={{ margin: 0 }}>
              YouTube Video Lecture Link
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              />
            </label>

            {ytId ? (
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                  alt="YouTube Thumbnail"
                  style={{ width: 100, height: 60, borderRadius: 6, objectFit: 'cover' }}
                />
                <div>
                  <b style={{ fontSize: 12, color: 'var(--text)', display: 'block' }}>YouTube Lecture Ready</b>
                  <span style={{ fontSize: 10, color: 'var(--accent)' }}>Video ID: {ytId}</span>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--muted)' }}>
                    OmniClass will parse video concepts and generate timestamped study notes.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ padding: 16, borderRadius: 10, background: 'var(--surface2)', fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                Paste any educational YouTube lecture URL to synthesize timestamped key takeaways.
              </div>
            )}
          </div>
        )}

        {/* Mode 3: Manual Text Paste */}
        {mode === 'paste' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea
              rows={11}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste article text, research papers, course readings, or lecture transcripts..."
              style={{ flex: 1 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <small style={{ color: 'var(--faint)' }}>{text.length} characters</small>
            </div>
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="button button-primary" disabled={busy} onClick={summarize}>
            {busy ? 'Synthesizing...' : 'Summarize Content'} <Sparkles size={14} />
          </button>
        </div>
      </div>

      {/* ─── RIGHT: Generated Summary Notes & One-Click Handoff ─── */}
      <div className="panel" style={{ padding: 24, overflowY: 'auto', maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
        {summary ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="section-kicker">EXECUTIVE STUDY NOTES</div>
                <h3 style={{ font: '700 15px Manrope', margin: '2px 0 0' }}>Generated Revision Material</h3>
              </div>
              <span className="private-badge" style={{ color: 'var(--good)' }}>Verified Notes</span>
            </div>

            {/* Generated Notes Markdown */}
            <div className="mb-4">
              <GeminiMessage content={summary} showFooter={false} />
            </div>

            {/* ─── Action Buttons: Generate 3-Part Quiz & Flashcards based on this summary ─── */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', background: 'var(--surface2)', padding: 16, borderRadius: 12 }}>
              <b style={{ fontSize: 12, display: 'block', marginBottom: 6, color: 'var(--text)' }}>
                Next Actions with this Material:
              </b>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 12px' }}>
                Transform these synthesized notes directly into an active assessment or study flashcards.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="button button-primary"
                  style={{ fontSize: 11 }}
                  onClick={() => onLaunchQuiz(uploadedFileName || (mode === 'youtube' ? 'YouTube Lecture Mastery' : 'Summary Concept Review'))}
                >
                  <HelpCircle size={14} style={{ marginRight: 6 }} />
                  Generate 3-Part Quiz from Summary
                </button>
                <button
                  className="button button-soft"
                  style={{ fontSize: 11 }}
                  onClick={() => onLaunchQuiz(uploadedFileName || 'Study Concepts')}
                >
                  <Layers size={14} style={{ marginRight: 6 }} />
                  Generate Flashcards from Summary
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-card" style={{ minHeight: 320, margin: 'auto' }}>
            <FileText size={36} style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <b style={{ fontSize: 15 }}>Content Summarizer Ready</b>
            <p style={{ maxWidth: 360 }}>
              Drop an academic document, paste a YouTube lecture link, or paste text to generate structured executive notes, timestamped takeaways, and active-recall quizzes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 5. ASSIGNMENT FORMATIVE FEEDBACK VIEW ─────────────────────────────────
function FeedbackView() {
  const [draft, setDraft] = useState('');
  const [rubric, setRubric] = useState('Standard Academic Rubric: Accuracy, Conceptual Depth, Critical Reasoning, Evidence');
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const analyze = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post('/ai/feedback/analyze', { draftResponse: draft, rubricCriteria: rubric });
      setFeedback(data);
      toast.success('Formative analysis complete.');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16 }}>
      <div className="panel profile-form">
        <div className="section-kicker">PRE-SUBMISSION EVALUATION</div>
        <h3 style={{ font: '700 16px Manrope', margin: '6px 0 12px' }}>Formative Writing & Code Review</h3>

        <label className="field-label">
          Rubric / Evaluation Criteria
          <input value={rubric} onChange={(e) => setRubric(e.target.value)} />
        </label>

        <label className="field-label">
          Student Draft Content
          <textarea
            rows={11}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your draft assignment essay, algorithmic proof, or technical solution..."
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="button button-primary" disabled={busy || draft.trim().length < 20} onClick={analyze}>
            {busy ? 'Evaluating...' : 'Analyze Draft'} <CheckCircle2 size={14} />
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 24, overflowY: 'auto', maxHeight: 560 }}>
        {feedback ? (
          <div>
            <div className="section-kicker">RUBRIC-ALIGNED EVALUATION</div>
            <h3 style={{ font: '700 16px Manrope', margin: '4px 0 12px' }}>Formative Review & Improvement Suggestions</h3>
            <div className="mt-2">
              <GeminiMessage content={feedback.feedbackText} showFooter={false} />
            </div>
          </div>
        ) : (
          <div className="empty-card" style={{ minHeight: 320 }}>
            <CheckCircle2 size={32} style={{ color: 'var(--accent)', marginBottom: 12 }} />
            <b style={{ fontSize: 14 }}>Formative Evaluator Ready</b>
            <p>Paste your draft assignment response on the left to receive immediate rubric-aligned feedback before submitting to your instructor.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HELPER: Strip Markdown & Formatting For Natural Expressive Speech ──────
function stripMarkdownForSpeech(text) {
  if (!text) return '';
  let clean = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italics
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // Replace bullet points and numbered lists with natural pauses
    .replace(/^\s*[-*+•]\s+/gm, '')
    .replace(/^\s*\d+[\.)]\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove dashes, hyphens, and em-dashes so TTS NEVER pronounces "dash" or "hyphen"
    .replace(/\s*[-–—]+\s*/g, ', ')
    .replace(/[-–—]+/g, ' ')
    // Remove special symbols like hashes, stars, brackets, slashes, pipes, tildes, backticks
    .replace(/[#*_~`>|\\\/\[\]\(\)\{\}\^+=@$%&]/g, ' ')
    // Normalize punctuation
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ',')
    .replace(/\s+\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

// ─── 6. INTERACTIVE AI VOICE TUTOR VIEW ─────────────────────────────────────
function VoiceTutorView() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [spokenResponse, setSpokenResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const text = Array.from(event.results).map((r) => r[0].transcript).join('');
        setTranscript(text);
      };

      rec.onend = () => {
        setRecording(false);
      };

      rec.onerror = (e) => {
        setRecording(false);
        toast.error(`Microphone error: ${e.error}`);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setRecording(true);
      toast('Listening... Speak your academic question.');
    }
  };

  const speakText = (textToSpeak) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanSpeech = stripMarkdownForSpeech(textToSpeak);
    const utter = new SpeechSynthesisUtterance(cleanSpeech);
    utter.rate = 0.98;
    utter.pitch = 1.05; // warm, engaging natural inflection

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Guy')) && v.lang.startsWith('en')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) utter.voice = preferredVoice;
    window.speechSynthesis.speak(utter);
  };

  const handleAsk = async () => {
    if (!transcript.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post('/ai/voice/interact', { transcript });
      setSpokenResponse(data.spokenResponse);
      speakText(data.spokenResponse);
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  const replayAudio = () => {
    if (spokenResponse) speakText(spokenResponse);
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="panel voice-tutor-box">
      <div className="section-kicker">SPEECH-DRIVEN INTERACTION</div>
      <h2 style={{ font: '700 22px Manrope', margin: '6px 0 10px' }}>Interactive Voice Tutor</h2>
      <p style={{ maxWidth: 460, fontSize: 11, color: 'var(--muted)', margin: '0 auto 28px', lineHeight: 1.6 }}>
        Click the microphone to speak your question naturally. Omni Tutor responds with expressive speech synthesis and complete transcripts.
      </p>

      <button
        className={`voice-mic-circle ${recording ? 'recording' : ''}`}
        onClick={toggleRecording}
        title={recording ? 'Stop listening' : 'Start speaking'}
      >
        {recording ? <MicOff size={32} /> : <Mic size={32} />}
      </button>

      <div style={{ marginTop: 14, fontSize: 11, color: recording ? '#ef7b7b' : 'var(--muted)', fontWeight: 600 }}>
        {recording ? '● Listening to your question...' : 'Click microphone to begin voice session'}
      </div>

      <div className="voice-transcript-area">
        <small style={{ fontSize: 9, color: 'var(--faint)', display: 'block', marginBottom: 6 }}>
          STUDENT SPOKEN TRANSCRIPT (EDITABLE)
        </small>
        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your spoken transcript will appear here, or you can type directly..."
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button className="button button-primary" disabled={busy || !transcript.trim()} onClick={handleAsk}>
            {busy ? 'Processing...' : 'Ask Tutor'} <Send size={13} />
          </button>
        </div>
      </div>

      {spokenResponse && (
        <div className="panel" style={{ maxWidth: 760, width: '100%', padding: 24, textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                <Sparkles size={14} />
              </div>
              <div>
                <b style={{ fontSize: 13, color: 'var(--accent)' }}>Tutor Voice Explanation</b>
                <small style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>Synthesized by OmniClass Voice Engine</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="button button-soft" style={{ fontSize: 11, padding: '4px 10px' }} onClick={replayAudio} title="Replay voice audio">
                <Volume2 size={13} style={{ marginRight: 4 }} /> Replay
              </button>
              <button className="button button-soft" style={{ fontSize: 11, padding: '4px 10px' }} onClick={stopAudio} title="Stop voice audio">
                <VolumeX size={13} style={{ marginRight: 4 }} /> Stop
              </button>
            </div>
          </div>
          <div style={{ padding: '6px 2px' }}>
            <GeminiMessage
              content={spokenResponse}
              showFooter={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 7. AI COURSE RECOMMENDATIONS VIEW ──────────────────────────────────────
function RecommendationsView() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/recommendations').then(({ data }) => {
      setRecommendations(data.recommendations || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <div className="section-kicker">EXPLAINABLE MACHINE LEARNING RECOMMENDATIONS</div>
        <h2 style={{ font: '700 18px Manrope', margin: '4px 0 6px' }}>Recommended For Your Academic Journey</h2>
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
          Courses matched against your declared specializations, enrolled subjects, and completed learning milestones.
        </p>
      </div>

      {loading ? (
        <div className="course-grid">
          {[1, 2, 3].map((i) => <div key={i} className="course-card skeleton-card" />)}
        </div>
      ) : recommendations.length ? (
        <div className="course-grid">
          {recommendations.map((course, i) => (
            <div key={course._id} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="cover-category">{course.category}</span>
                <span className="private-badge" style={{ color: 'var(--accent)' }}>
                  ★ {course.matchScore}% Match
                </span>
              </div>
              <h3 style={{ font: '700 15px Manrope', margin: 0 }}>{course.title}</h3>
              <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                {course.description}
              </p>
              <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: 8, fontSize: 9, color: 'var(--accent)' }}>
                <b>Why recommended:</b> {course.recommendationReason}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 9, color: 'var(--faint)' }}>{course.level} · {course.duration}</span>
                <a href={`/courses/${course._id}`} className="button button-soft" style={{ height: 30, fontSize: 10 }}>
                  View Course <ArrowRight size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-card">
          <Sparkles size={28} style={{ color: 'var(--accent)', marginBottom: 10 }} />
          <b>All recommendations enrolled</b>
          <p>You have enrolled in all currently recommended subjects for your academic term.</p>
        </div>
      )}
    </div>
  );
}
