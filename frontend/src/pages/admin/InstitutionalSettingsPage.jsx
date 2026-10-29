import { useState, useEffect } from 'react';
import { Building2, Palette, Award, Bot, ShieldCheck, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';

export default function InstitutionalSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    departments: [],
    branding: {
      primaryColor: '#6366f1',
      accentColor: '#38bdf8',
      logoUrl: '',
      heroBannerUrl: '',
    },
    certificateSettings: {
      template: 'academic_classic',
      signerTitle: 'Dean of Academic Affairs',
      signerName: 'Dr. Aris Thorne',
      institutionSeal: true,
    },
    settings: {
      allowOpenRegistration: true,
      requireCourseApproval: true,
      aiEnabled: true,
      geminiFallbackEnabled: true,
      retentionDays: 365,
    },
  });

  const [newDept, setNewDept] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/institution');
      if (data?.data?.institution) {
        const inst = data.data.institution;
        setForm({
          name: inst.name || '',
          tagline: inst.tagline || '',
          departments: inst.departments || [],
          branding: {
            primaryColor: inst.branding?.primaryColor || '#6366f1',
            accentColor: inst.branding?.accentColor || '#38bdf8',
            logoUrl: inst.branding?.logoUrl || '',
            heroBannerUrl: inst.branding?.heroBannerUrl || '',
          },
          certificateSettings: {
            template: inst.certificateSettings?.template || 'academic_classic',
            signerTitle: inst.certificateSettings?.signerTitle || 'Dean of Academic Affairs',
            signerName: inst.certificateSettings?.signerName || 'Dr. Aris Thorne',
            institutionSeal: inst.certificateSettings?.institutionSeal !== false,
          },
          settings: {
            allowOpenRegistration: inst.settings?.allowOpenRegistration !== false,
            requireCourseApproval: inst.settings?.requireCourseApproval !== false,
            aiEnabled: inst.settings?.aiEnabled !== false,
            geminiFallbackEnabled: inst.settings?.geminiFallbackEnabled !== false,
            retentionDays: inst.settings?.retentionDays || 365,
          },
        });
      }
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/admin/institution', form);
      toast.success(data?.data?.message || 'Institutional settings saved!');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = () => {
    if (!newDept.name.trim() || !newDept.code.trim()) {
      toast.error('Department name and code are required');
      return;
    }
    setForm((prev) => ({
      ...prev,
      departments: [...prev.departments, { name: newDept.name.trim(), code: newDept.code.trim().toUpperCase() }],
    }));
    setNewDept({ name: '', code: '' });
  };

  const removeDepartment = (index) => {
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="page-enter p-6 max-w-6xl mx-auto">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="page-enter p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="section-kicker">GOVERNANCE & CONFIGURATION</div>
          <h1 className="text-3xl font-bold tracking-tight">Institutional Settings</h1>
          <p className="text-sm opacity-70">
            Configure institutional profile, branding, certificate templates, departments, and AI policies.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="button button-primary flex items-center gap-2 self-start"
        >
          <Save size={16} />
          {saving ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700/30 pb-3">
        {[
          { id: 'general', label: 'Organization Profile', icon: Building2 },
          { id: 'branding', label: 'Branding & Identity', icon: Palette },
          { id: 'departments', label: 'Departments & Faculties', icon: ShieldCheck },
          { id: 'certificates', label: 'Credential Templates', icon: Award },
          { id: 'ai-policy', label: 'AI & Data Governance', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="panel p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-3">Organization Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="e.g. Northstar University"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="e.g. Excellence in Research, Creativity, and Innovation"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Data Retention Window (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3650"
                  value={form.settings.retentionDays}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      settings: { ...form.settings, retentionDays: parseInt(e.target.value) || 365 },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Compliant academic log and telemetry retention period.
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.allowOpenRegistration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, allowOpenRegistration: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm font-medium text-slate-300">
                    Allow Open Registration (Self-signup enabled)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.requireCourseApproval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, requireCourseApproval: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm font-medium text-slate-300">
                    Require Academic Dean/Admin Review for Course Publishing
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Branding */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-3">Branding & Color Palettes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.branding.primaryColor}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, primaryColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 rounded border border-slate-700 cursor-pointer bg-slate-800"
                  />
                  <input
                    type="text"
                    value={form.branding.primaryColor}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, primaryColor: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.branding.accentColor}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, accentColor: e.target.value },
                      })
                    }
                    className="w-12 h-10 rounded border border-slate-700 cursor-pointer bg-slate-800"
                  />
                  <input
                    type="text"
                    value={form.branding.accentColor}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branding: { ...form.branding, accentColor: e.target.value },
                      })
                    }
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Institution Logo URL
                </label>
                <input
                  type="url"
                  value={form.branding.logoUrl}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, logoUrl: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                  placeholder="https://assets.institution.edu/logo.png"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Portal Hero Banner URL
                </label>
                <input
                  type="url"
                  value={form.branding.heroBannerUrl}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branding: { ...form.branding, heroBannerUrl: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                  placeholder="https://assets.institution.edu/banner.jpg"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-xl border border-slate-700/50 bg-slate-800/30">
              <div className="text-xs uppercase text-slate-400 font-semibold mb-2">Preview Badge</div>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                  style={{ backgroundColor: form.branding.primaryColor }}
                >
                  {form.name ? form.name.charAt(0) : 'O'}
                </div>
                <div>
                  <div className="font-semibold text-slate-200">{form.name || 'OmniClass Institution'}</div>
                  <div className="text-xs text-slate-400" style={{ color: form.branding.accentColor }}>
                    {form.tagline || 'Learning Management System'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Departments */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-3">Academic Departments & Faculties</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Department Name (e.g. Computer Science)"
                value={newDept.name}
                onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
              />
              <input
                type="text"
                placeholder="Code (e.g. CS)"
                value={newDept.code}
                onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                className="w-28 px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm uppercase"
              />
              <button
                type="button"
                onClick={addDepartment}
                className="button button-primary flex items-center gap-2"
              >
                <Plus size={16} /> Add Department
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {form.departments.map((dept, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-200">{dept.name}</div>
                    <div className="text-xs font-mono text-indigo-400">{dept.code}</div>
                  </div>
                  <button
                    onClick={() => removeDepartment(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/40 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {form.departments.length === 0 && (
                <div className="col-span-full py-8 text-center text-sm text-slate-500">
                  No departments configured yet. Add your first academic department above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Certificates */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-3">
              Course Completion Credential Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Certificate Layout Template
                </label>
                <select
                  value={form.certificateSettings.template}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      certificateSettings: { ...form.certificateSettings, template: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                >
                  <option value="academic_classic">Academic Classic (Seal + Border)</option>
                  <option value="modern_minimalist">Modern Minimalist (High-Tech)</option>
                  <option value="executive_gold">Executive Gold Crest</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Official Signer Name
                </label>
                <input
                  type="text"
                  value={form.certificateSettings.signerName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      certificateSettings: { ...form.certificateSettings, signerName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                  placeholder="e.g. Dr. Aris Thorne"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Signer Title
                </label>
                <input
                  type="text"
                  value={form.certificateSettings.signerTitle}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      certificateSettings: { ...form.certificateSettings, signerTitle: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm"
                  placeholder="e.g. Dean of Academic Affairs"
                />
              </div>

              <div className="pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.certificateSettings.institutionSeal}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        certificateSettings: { ...form.certificateSettings, institutionSeal: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm font-medium text-slate-300">
                    Include Cryptographic Holographic Seal on Issued PDF/Verification Page
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: AI Policy */}
        {activeTab === 'ai-policy' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-slate-800 pb-3">
              AI Microservice & Data Governance Policy
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
                <div className="flex items-start gap-3">
                  <Bot className="text-indigo-400 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-sm text-indigo-200">Hybrid AI Routing Protocol</h3>
                    <p className="text-xs text-indigo-300/80 mt-1 leading-relaxed">
                      OmniClass executes primary inference through internal RAG vector indexing and local models. When
                      Gemini API fallback is enabled, requests with insufficient local context are forwarded to Gemini
                      via secure backend orchestration with zero student data exposure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.aiEnabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, aiEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 mt-1 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-200 block">
                      Enable AI Learning Tutor & Copilot Workspace
                    </span>
                    <span className="text-xs text-slate-400">
                      Activates context-aware tutoring, study planner generation, quiz drafts, and voice assistant.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.settings.geminiFallbackEnabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, geminiFallbackEnabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4 mt-1 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-200 block">
                      Permit Gemini API External Fallback
                    </span>
                    <span className="text-xs text-slate-400">
                      When internal RAG cannot satisfy a query, route sanitized context to the configured Gemini model.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
