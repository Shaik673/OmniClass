import { useEffect, useState, useRef } from 'react';
import {
  User, Award, BookOpen, Briefcase, Calendar, Check, ChevronRight,
  Code2, ExternalLink, Eye, EyeOff, FileText, Github, Globe,
  GraduationCap, KeyRound, Linkedin, Lock, RefreshCw, Save,
  Send, Shield, Sparkles, Trophy, Unlink, Upload, UserCheck, X, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getError } from '../../api.js';
import UserAvatar from '../../components/shared/UserAvatar.jsx';
import { BOY_AVATARS, GIRL_AVATARS, detectGenderFromName, getDefaultAvatar, getUserAvatar } from '../../utils/avatar.js';

export default function ComprehensiveProfilePage({ user, onUser, onTheme }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Form states
  const [personalForm, setPersonalForm] = useState({
    name: '', displayName: '', headline: '', bio: '', location: '', phone: '', visibility: 'public',
  });
  const [academicForm, setAcademicForm] = useState({
    department: '', degree: '', studyLevel: '', academicYear: '', graduationYear: '', specializations: '',
  });
  const [profForm, setProfForm] = useState({
    careerObjective: '', skills: '', portfolioUrl: '',
  });
  const [prefForm, setPrefForm] = useState({
    preferredDifficulty: 'All levels', weeklyHoursGoal: 6, aiTutorStyle: 'clear', voiceSpeed: 1.0, theme: 'dark',
  });

  const [avatarInput, setAvatarInput] = useState('');

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [generatedTokenNotice, setGeneratedTokenNotice] = useState('');

  // Integration connect modals
  const [connectModal, setConnectModal] = useState(null); // 'github' | 'linkedin' | 'leetcode'
  const [connectInput, setConnectInput] = useState('');
  const [syncingProvider, setSyncingProvider] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users/me/profile');
      setProfileData(data);
      const u = data.user;
      setAvatarInput(u.avatar || '');

      setPersonalForm({
        name: u.name || '',
        displayName: u.displayName || '',
        headline: u.headline || '',
        bio: u.bio || '',
        location: u.location || '',
        phone: u.phone || '',
        visibility: u.visibility || 'public',
      });

      setAcademicForm({
        department: u.academic?.department || '',
        degree: u.academic?.degree || '',
        studyLevel: u.academic?.studyLevel || '',
        academicYear: u.academic?.academicYear || '',
        graduationYear: u.academic?.graduationYear || '',
        specializations: (u.academic?.specializations || []).join(', '),
      });

      setProfForm({
        careerObjective: u.professional?.careerObjective || '',
        skills: (u.professional?.skills || []).join(', '),
        portfolioUrl: u.professional?.portfolioUrl || '',
      });

      setPrefForm({
        preferredDifficulty: u.preferences?.preferredDifficulty || 'All levels',
        weeklyHoursGoal: u.preferences?.weeklyHoursGoal || 6,
        aiTutorStyle: u.preferences?.aiTutorStyle || 'clear',
        voiceSpeed: u.preferences?.voiceSpeed || 1.0,
        theme: u.theme || 'dark',
      });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = async (sectionData, successMsg = 'Profile updated.') => {
    setBusy(true);
    try {
      const { data } = await api.patch('/users/me/profile', sectionData);
      const updatedUser = data?.user || data?.data?.user;
      if (updatedUser) {
        onUser(updatedUser);
        if (sectionData.theme) onTheme(sectionData.theme);
      }
      toast.success(successMsg);
      loadProfile();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Avatar image must be smaller than 2MB.');
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target.result;
      setAvatarInput(base64);
      saveProfile({ avatar: base64 }, 'Avatar uploaded and profile picture updated!');
    };
    reader.readAsDataURL(file);
  };

  const bannerFileRef = useRef(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [confirmingChallenge, setConfirmingChallenge] = useState(false);

  const handleBannerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Banner image must be smaller than 5MB.');
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target.result;
      saveProfile({ banner: base64 }, 'Profile banner uploaded and updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateChallenge = async () => {
    setChallengeLoading(true);
    try {
      const { data } = await api.post('/integrations/leetcode/challenge');
      setActiveChallenge(data.data);
      toast.success('Ownership verification code generated!');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleConfirmChallenge = async () => {
    setConfirmingChallenge(true);
    try {
      const { data } = await api.post('/integrations/leetcode/verify-challenge');
      toast.success(data.data?.message || 'LeetCode ownership verified successfully!');
      setActiveChallenge(null);
      loadProfile();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setConfirmingChallenge(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    setPwdBusy(true);
    try {
      await api.post('/users/me/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      toast.success('Password changed successfully.');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setPwdBusy(false);
    }
  };

  const handleRequestVerification = async () => {
    setVerifyBusy(true);
    try {
      const { data } = await api.post('/auth/email/verification/request');
      toast.success(data?.data?.message || 'Verification link generated!');
      if (data?.data?.verificationToken) {
        setVerifyTokenInput(data.data.verificationToken);
        setGeneratedTokenNotice(data.data.verificationToken);
      }
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e?.preventDefault();
    if (!verifyTokenInput.trim()) return;
    setVerifyBusy(true);
    try {
      const { data } = await api.post('/auth/email/verify', { token: verifyTokenInput.trim() });
      toast.success('Email verified successfully!');
      if (data?.data?.user) {
        onUser(data.data.user);
      } else {
        onUser({ ...u, emailVerifiedAt: new Date().toISOString() });
      }
      setGeneratedTokenNotice('');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { data } = await api.post('/users/me/export-data');
      const blob = new Blob([JSON.stringify(data.exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omniclass-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      toast.success('Data export downloaded.');
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleConnectIntegration = async () => {
    if (!connectInput.trim()) return;
    setBusy(true);
    try {
      if (connectModal === 'github') {
        await api.post('/integrations/github/connect', { username: connectInput.trim() });
        toast.success('GitHub account connected.');
      } else if (connectModal === 'linkedin') {
        await api.post('/integrations/linkedin/connect', { profileUrl: connectInput.trim() });
        toast.success('LinkedIn verified in link-only mode.');
      } else if (connectModal === 'leetcode') {
        await api.post('/integrations/leetcode/connect', { username: connectInput.trim() });
        toast.success('LeetCode profile connected.');
      }
      setConnectModal(null);
      setConnectInput('');
      loadProfile();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!window.confirm(`Disconnect your ${provider} account from OmniClass?`)) return;
    try {
      await api.post(`/integrations/${provider}/disconnect`);
      toast.success(`${provider} disconnected.`);
      loadProfile();
    } catch (err) {
      toast.error(getError(err));
    }
  };

  const handleManualSync = async (provider) => {
    setSyncingProvider(provider);
    try {
      if (provider === 'github') {
        await api.post('/integrations/github/sync');
        toast.success('GitHub repositories synchronized.');
      } else if (provider === 'leetcode') {
        await api.post('/integrations/leetcode/connect', { username: profileData.user?.integrations?.leetcode?.username });
        toast.success('LeetCode stats refreshed.');
      }
      loadProfile();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSyncingProvider('');
    }
  };

  if (loading) {
    return <div className="page-enter"><div className="panel profile-form"><div className="skeleton-card" /></div></div>;
  }

  const u = profileData?.user || user;
  const stats = profileData?.stats || {};
  const integrations = u.integrations || {};

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'academic', label: 'Academic Profile', icon: GraduationCap },
    { id: 'professional', label: 'Professional & Career', icon: Briefcase },
    { id: 'integrations', label: 'Connected Accounts', icon: Code2 },
    { id: 'preferences', label: 'Learning Preferences', icon: Sparkles },
    { id: 'achievements', label: 'Summary & Milestones', icon: Trophy },
    { id: 'security', label: 'Account & Security', icon: Shield },
  ];

  return (
    <div className="page-enter">
      {/* Header Profile Hero Card */}
      <div className="panel profile-card" style={{ marginBottom: 20, textAlign: 'left', padding: '0 0 20px', overflow: 'hidden' }}>
        <input
          type="file"
          ref={bannerFileRef}
          accept=".jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleBannerFileUpload}
        />
        <div
          className="profile-cover"
          style={{
            height: 140,
            position: 'relative',
            cursor: 'pointer',
            backgroundImage: (u.banner ? `url(${u.banner})` : undefined),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: 'var(--surface2)',
          }}
          onClick={() => bannerFileRef.current?.click()}
          title="Click profile banner to upload image (.jpg, .png)"
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              opacity: 0,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
          >
            <Camera size={18} />
            <span>Click to upload profile banner (.jpg)</span>
          </div>
        </div>
        <div style={{ padding: '0 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              className="profile-avatar"
              style={{ width: 80, height: 80, marginTop: -40, position: 'relative', cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--surface)', background: 'var(--surface2)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
              onClick={() => setActiveTab('personal')}
              title="Click to customize profile avatar"
            >
              <img
                src={avatarInput || getUserAvatar(u)}
                alt={u.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', opacity: 0, display: 'grid', placeItems: 'center', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              >
                <Camera size={22} color="#fff" />
              </div>
            </div>
            <div>
              <h1 style={{ font: '700 22px Manrope, sans-serif', margin: '6px 0 3px' }}>
                {u.name} {u.displayName && <small style={{ color: 'var(--muted)', fontSize: 13 }}>({u.displayName})</small>}
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                {u.headline || `${u.role.toUpperCase()} · Northstar University`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 9, color: 'var(--faint)', display: 'block' }}>PROFILE COMPLETION</span>
              <b style={{ font: '700 15px Manrope', color: 'var(--accent)' }}>{profileData?.profileCompletion || 85}%</b>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', border: '2px solid var(--accent)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
              {profileData?.profileCompletion || 85}%
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="profile-subtabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`profile-subtab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.id === 'integrations' && integrations.github?.connected && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: PERSONAL INFORMATION & AVATAR EDIT ─── */}
      {activeTab === 'personal' && (
        <div>
          {/* Avatar & Visual Identity Customizer */}
          <div className="panel profile-form" style={{ marginBottom: 20 }}>
            <div className="panel-heading">
              <div>
                <div className="section-kicker">PROFILE PICTURE & AVATAR</div>
                <h3>Visual Identity & Student Avatar</h3>
              </div>
              <span className="private-badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', borderColor: '#6366f1' }}>
                Default Detected: {detectGenderFromName(u.name) === 'girl' ? 'Female Student' : 'Male Student'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={avatarInput || getUserAvatar(u)}
                  alt="Avatar preview"
                  style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <b style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>Customize Profile Picture</b>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  OmniClass dynamically defaults student avatars based on your legal name ({u.name} → {detectGenderFromName(u.name) === 'girl' ? 'girl student' : 'boy student'}). Choose from curated student presets below or upload your own photo.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <label className="button button-soft" style={{ cursor: 'pointer', fontSize: 12, padding: '7px 14px' }}>
                    <Upload size={14} style={{ marginRight: 6 }} /> Upload Image File
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileUpload}
                    />
                  </label>
                  <button
                    type="button"
                    className="button button-soft"
                    style={{ fontSize: 12, padding: '7px 14px' }}
                    onClick={() => {
                      const def = getDefaultAvatar(u.name);
                      setAvatarInput(def);
                      saveProfile({ avatar: def }, 'Reset to gender default avatar.');
                    }}
                  >
                    Reset Default Avatar
                  </button>
                  {avatarInput && avatarInput !== u.avatar && (
                    <button
                      type="button"
                      className="button button-primary"
                      style={{ fontSize: 12, padding: '7px 16px' }}
                      disabled={busy}
                      onClick={() => saveProfile({ avatar: avatarInput }, 'Profile picture saved successfully!')}
                    >
                      {busy ? 'Saving...' : 'Save Avatar'} <Save size={14} style={{ marginLeft: 6 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Boy Avatar Presets */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#818cf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>BOY / MALE STUDENT AVATARS</span>
                {detectGenderFromName(u.name) === 'boy' && <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(99,102,241,0.2)', borderRadius: 4 }}>Default for your name</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
                {BOY_AVATARS.map((av) => {
                  const isSelected = (avatarInput || u.avatar) === av.url;
                  return (
                    <div
                      key={av.id}
                      onClick={() => {
                        setAvatarInput(av.url);
                        saveProfile({ avatar: av.url }, `Selected ${av.label}`);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: isSelected ? 'rgba(99,102,241,0.25)' : 'var(--surface2)',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <img src={av.url} alt={av.label} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <b style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{av.label}</b>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Girl Avatar Presets */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#f472b6', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>GIRL / FEMALE STUDENT AVATARS</span>
                {detectGenderFromName(u.name) === 'girl' && <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(244,114,182,0.2)', borderRadius: 4 }}>Default for your name</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
                {GIRL_AVATARS.map((av) => {
                  const isSelected = (avatarInput || u.avatar) === av.url;
                  return (
                    <div
                      key={av.id}
                      onClick={() => {
                        setAvatarInput(av.url);
                        saveProfile({ avatar: av.url }, `Selected ${av.label}`);
                      }}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: isSelected ? 'rgba(244,114,182,0.25)' : 'var(--surface2)',
                        border: isSelected ? '2px solid #f472b6' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <img src={av.url} alt={av.label} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <b style={{ color: isSelected ? '#f472b6' : 'var(--text)' }}>{av.label}</b>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <form className="panel profile-form" onSubmit={(e) => { e.preventDefault(); saveProfile(personalForm); }}>
          <div className="panel-heading">
            <div>
              <div className="section-kicker">PERSONAL IDENTITY</div>
              <h3>Basic Personal Information</h3>
            </div>
            <span className="private-badge"><Shield size={13} /> Stored Privately</span>
          </div>

          <div className="form-row">
            <label className="field-label">
              Full Legal Name
              <input required value={personalForm.name} onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })} />
            </label>
            <label className="field-label">
              Display Name (Classroom)
              <input value={personalForm.displayName} onChange={(e) => setPersonalForm({ ...personalForm, displayName: e.target.value })} placeholder="Preferred name" />
            </label>
          </div>

          <label className="field-label">
            Professional Headline
            <input value={personalForm.headline} onChange={(e) => setPersonalForm({ ...personalForm, headline: e.target.value })} placeholder="e.g. Software Systems Student | Machine Learning Enthusiast" />
          </label>

          <label className="field-label">
            Biography & Introduction
            <textarea rows={4} value={personalForm.bio} onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })} placeholder="Share a few sentences about your learning background and aspirations..." />
          </label>

          <div className="form-row">
            <label className="field-label">
              Location
              <input value={personalForm.location} onChange={(e) => setPersonalForm({ ...personalForm, location: e.target.value })} placeholder="City, State / Country" />
            </label>
            <label className="field-label">
              Contact Phone (Optional)
              <input value={personalForm.phone} onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">
              Profile Visibility
              <select value={personalForm.visibility} onChange={(e) => setPersonalForm({ ...personalForm, visibility: e.target.value })}>
                <option value="public">Public (Visible across institutional roster)</option>
                <option value="private">Private (Only instructors and administrators)</option>
              </select>
            </label>
            <div style={{ paddingTop: 24, fontSize: 11, color: 'var(--muted)' }}>
              Institutional Email: <b>{u.email}</b> {u.emailVerifiedAt ? '✓ Verified' : '· Unverified'}
            </div>
          </div>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save Changes'} <Save size={14} />
            </button>
          </div>
        </form>
      </div>
    )}

      {/* ─── TAB 2: ACADEMIC PROFILE ─── */}
      {activeTab === 'academic' && (
        <form className="panel profile-form" onSubmit={(e) => {
          e.preventDefault();
          saveProfile({
            academic: {
              ...academicForm,
              specializations: academicForm.specializations.split(',').map((s) => s.trim()).filter(Boolean),
            },
          });
        }}>
          <div className="panel-heading">
            <div>
              <div className="section-kicker">ACADEMIC STANDING</div>
              <h3>Institutional Academic Profile</h3>
            </div>
            <span className="private-badge"><GraduationCap size={14} /> Northstar University</span>
          </div>

          <div className="form-row">
            <label className="field-label">
              Department
              <input value={academicForm.department} onChange={(e) => setAcademicForm({ ...academicForm, department: e.target.value })} />
            </label>
            <label className="field-label">
              Degree / Program
              <input value={academicForm.degree} onChange={(e) => setAcademicForm({ ...academicForm, degree: e.target.value })} />
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">
              Study Level & Year
              <input value={academicForm.studyLevel} onChange={(e) => setAcademicForm({ ...academicForm, studyLevel: e.target.value })} placeholder="e.g. Undergraduate · Year 3" />
            </label>
            <label className="field-label">
              Expected Graduation Year
              <input type="number" value={academicForm.graduationYear} onChange={(e) => setAcademicForm({ ...academicForm, graduationYear: e.target.value })} placeholder="2027" />
            </label>
          </div>

          <label className="field-label">
            Academic Specializations & Focus Areas
            <input value={academicForm.specializations} onChange={(e) => setAcademicForm({ ...academicForm, specializations: e.target.value })} placeholder="Comma-separated: Machine Learning, Distributed Systems" />
          </label>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save Academic Details'} <Save size={14} />
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 3: PROFESSIONAL & CAREER ─── */}
      {activeTab === 'professional' && (
        <form className="panel profile-form" onSubmit={(e) => {
          e.preventDefault();
          saveProfile({
            professional: {
              careerObjective: profForm.careerObjective,
              portfolioUrl: profForm.portfolioUrl,
              skills: profForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
            },
          });
        }}>
          <div className="panel-heading">
            <div>
              <div className="section-kicker">CAREER READINESS</div>
              <h3>Professional Skills & Portfolio</h3>
            </div>
            <span className="private-badge"><Briefcase size={14} /> Career Profile</span>
          </div>

          <label className="field-label">
            Career Objective
            <textarea rows={3} value={profForm.careerObjective} onChange={(e) => setProfForm({ ...profForm, careerObjective: e.target.value })} placeholder="What are your career ambitions and targets?" />
          </label>

          <label className="field-label">
            Technical & Professional Skills
            <input value={profForm.skills} onChange={(e) => setProfForm({ ...profForm, skills: e.target.value })} placeholder="Comma-separated: JavaScript, Python, React, Docker, System Architecture" />
          </label>

          <label className="field-label">
            Portfolio / Personal Website URL
            <input value={profForm.portfolioUrl} onChange={(e) => setProfForm({ ...profForm, portfolioUrl: e.target.value })} placeholder="https://yourportfolio.dev" />
          </label>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save Career Profile'} <Save size={14} />
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 4: CONNECTED ACCOUNTS & DEVELOPER INTEGRATIONS (SECTION 8) ─── */}
      {activeTab === 'integrations' && (
        <div>
          <div className="panel" style={{ padding: 18, marginBottom: 16 }}>
            <div className="section-kicker">DEVELOPER INTEGRATIONS & AUTOMATION</div>
            <h2 style={{ font: '700 18px Manrope', margin: '6px 0 4px' }}>Connected Developer Accounts</h2>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
              Connect your verified external developer profiles to showcase real projects, synchronized statistics, and public contributions.
            </p>
          </div>

          <div className="integrations-grid">
            {/* 1. GITHUB CARD */}
            {(() => {
              const isGitHubAuth = u.authProvider === 'github';
              const isGitHubConnected = Boolean(integrations.github?.connected || isGitHubAuth);
              const ghUsername = integrations.github?.username || (isGitHubAuth ? u.name?.replace(/\s+/g, '').toLowerCase() : '');

              return (
                <div className="integration-card">
                  <div className="integration-header">
                    <div className="integration-brand">
                      <div className="integration-icon-wrap github"><Github size={20} /></div>
                      <div>
                        <b style={{ fontSize: 13, display: 'block' }}>GitHub</b>
                        <small style={{ fontSize: 9, color: 'var(--muted)' }}>Developer Identity</small>
                      </div>
                    </div>
                    <span className={`integration-status-pill ${isGitHubConnected ? 'synced' : 'not-connected'}`}>
                      {isGitHubAuth ? 'Auto-Connected' : isGitHubConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>

                  {isGitHubConnected ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={integrations.github?.avatarUrl || `https://github.com/${ghUsername || 'github'}.png`}
                          alt="avatar"
                          style={{ width: 36, height: 36, borderRadius: '50%' }}
                        />
                        <div>
                          <b style={{ fontSize: 12 }}>@{ghUsername || 'github-user'}</b>
                          <a
                            href={integrations.github?.profileUrl || `https://github.com/${ghUsername}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 10, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}
                          >
                            View Profile <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>

                      <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, margin: '12px 0' }}>
                        {isGitHubAuth
                          ? 'Synchronized directly with your institutional GitHub authentication session.'
                          : 'Connected with your public GitHub profile metadata.'}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        {!isGitHubAuth ? (
                          <button className="button button-soft" style={{ flex: 1, height: 32 }} onClick={() => handleDisconnect('github')}>
                            Disconnect <Unlink size={12} />
                          </button>
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--good)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> Primary Sign-in Account
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, margin: '8px 0' }}>
                        Connect your GitHub account to showcase your public developer identity directly on your OmniClass profile.
                      </p>
                      <button className="button button-primary" style={{ marginTop: 'auto' }} onClick={() => { setConnectModal('github'); setConnectInput(''); }}>
                        Connect GitHub <ChevronRight size={13} />
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

            {/* 2. LINKEDIN CARD */}
            <div className="integration-card">
              <div className="integration-header">
                <div className="integration-brand">
                  <div className="integration-icon-wrap linkedin"><Linkedin size={20} /></div>
                  <div>
                    <b style={{ fontSize: 13, display: 'block' }}>LinkedIn</b>
                    <small style={{ fontSize: 9, color: 'var(--muted)' }}>Professional Profile Link</small>
                  </div>
                </div>
                <span className={`integration-status-pill ${integrations.linkedin?.connected ? 'connected' : 'not-connected'}`}>
                  {integrations.linkedin?.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {integrations.linkedin?.connected ? (
                <>
                  <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 10 }}>
                    <small style={{ fontSize: 8, color: 'var(--faint)', display: 'block' }}>CONNECTED URL</small>
                    <a href={integrations.linkedin.profileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {integrations.linkedin.profileUrl} <ExternalLink size={11} />
                    </a>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6 }}>
                    Verified link-only integration. Your professional profile is linked directly on your institutional academic credential page.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button className="button button-soft" style={{ flex: 1, height: 32 }} onClick={() => { setConnectModal('linkedin'); setConnectInput(integrations.linkedin.profileUrl); }}>
                      Update URL
                    </button>
                    <button className="button button-soft" style={{ height: 32 }} onClick={() => handleDisconnect('linkedin')}>
                      <Unlink size={12} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, margin: '8px 0' }}>
                    Attach your public LinkedIn address to link your career resume with your verified academic completion records.
                  </p>
                  <button className="button button-primary" style={{ marginTop: 'auto' }} onClick={() => { setConnectModal('linkedin'); setConnectInput(''); }}>
                    Connect LinkedIn <ChevronRight size={13} />
                  </button>
                </>
              )}
            </div>

            {/* 3. LEETCODE CARD */}
            <div className="integration-card">
              <div className="integration-header">
                <div className="integration-brand">
                  <div className="integration-icon-wrap leetcode"><Code2 size={20} /></div>
                  <div>
                    <b style={{ fontSize: 13, display: 'block' }}>LeetCode</b>
                    <small style={{ fontSize: 9, color: 'var(--muted)' }}>Problem Solving & Contests</small>
                  </div>
                </div>
                <span className={`integration-status-pill ${integrations.leetcode?.connected ? (integrations.leetcode.verified ? 'synced' : 'pending') : 'not-connected'}`}>
                  {integrations.leetcode?.connected ? (integrations.leetcode.verified ? 'Verified Owner' : 'Unverified') : 'Not Connected'}
                </span>
              </div>

              {integrations.leetcode?.connected ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <b style={{ fontSize: 12 }}>@{integrations.leetcode.username}</b>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: 8 }}>
                        Ranking: {integrations.leetcode.ranking ? `#${integrations.leetcode.ranking.toLocaleString()}` : 'Unranked'}
                        {integrations.leetcode.contestRating ? ` · Rating: ${integrations.leetcode.contestRating}` : ''}
                      </small>
                    </div>
                    <a href={integrations.leetcode.profileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      Profile <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="integration-stats-box">
                    <div>
                      <small style={{ color: '#00b8a3' }}>EASY</small>
                      <b>{integrations.leetcode.solvedEasy || 0}</b>
                    </div>
                    <div>
                      <small style={{ color: '#ffc01e' }}>MEDIUM</small>
                      <b>{integrations.leetcode.solvedMedium || 0}</b>
                    </div>
                    <div>
                      <small style={{ color: '#ff375f' }}>HARD</small>
                      <b>{integrations.leetcode.solvedHard || 0}</b>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)' }}>
                    Total Solved: <b style={{ color: 'var(--text)' }}>{integrations.leetcode.solvedTotal || 0}</b> problems
                  </div>

                  {/* Ownership Challenge Box */}
                  {!integrations.leetcode.verified && (
                    <div style={{ padding: 10, borderRadius: 8, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', margin: '8px 0' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#eab308', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Lock size={12} /> OWNERSHIP VERIFICATION REQUIRED
                      </div>
                      <p style={{ fontSize: 9, color: 'var(--muted)', margin: '4px 0 8px', lineHeight: 1.4 }}>
                        Prove ownership of this LeetCode profile through an expiring challenge code.
                      </p>
                      {activeChallenge ? (
                        <div>
                          <div style={{ fontSize: 10, fontFamily: 'monospace', background: 'var(--surface)', padding: '4px 8px', borderRadius: 4, color: 'var(--accent)', marginBottom: 6, wordBreak: 'break-all' }}>
                            Code: {activeChallenge.challengeCode}
                          </div>
                          <p style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.3 }}>
                            Add this code to your LeetCode 'About Me' profile section, then click Confirm below.
                          </p>
                          <button
                            className="button button-primary"
                            style={{ height: 28, fontSize: 10, width: '100%' }}
                            disabled={confirmingChallenge}
                            onClick={handleConfirmChallenge}
                          >
                            {confirmingChallenge ? 'Verifying...' : 'Confirm Ownership'} <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="button button-soft"
                          style={{ height: 28, fontSize: 10, width: '100%' }}
                          disabled={challengeLoading}
                          onClick={handleGenerateChallenge}
                        >
                          {challengeLoading ? 'Generating...' : 'Start Ownership Challenge'} <KeyRound size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button className="button button-soft" style={{ flex: 1, height: 32 }} disabled={syncingProvider === 'leetcode'} onClick={() => handleManualSync('leetcode')}>
                      <RefreshCw size={12} className={syncingProvider === 'leetcode' ? 'animate-spin' : ''} /> Refresh Stats
                    </button>
                    <button className="button button-soft" style={{ height: 32 }} onClick={() => handleDisconnect('leetcode')}>
                      <Unlink size={12} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, margin: '8px 0' }}>
                    Connect your public LeetCode handle or profile URL to sync algorithmic problem counts across Easy, Medium, and Hard difficulty levels.
                  </p>
                  <button className="button button-primary" style={{ marginTop: 'auto' }} onClick={() => { setConnectModal('leetcode'); setConnectInput(''); }}>
                    Connect LeetCode <ChevronRight size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: LEARNING PREFERENCES ─── */}
      {activeTab === 'preferences' && (
        <form className="panel profile-form" onSubmit={(e) => {
          e.preventDefault();
          saveProfile({ preferences: prefForm, theme: prefForm.theme });
        }}>
          <div className="panel-heading">
            <div>
              <div className="section-kicker">PERSONALIZED STUDY</div>
              <h3>Learning & AI Preferences</h3>
            </div>
            <span className="private-badge"><Sparkles size={14} /> AI Tailored</span>
          </div>

          <div className="form-row">
            <label className="field-label">
              Preferred Course Difficulty
              <select value={prefForm.preferredDifficulty} onChange={(e) => setPrefForm({ ...prefForm, preferredDifficulty: e.target.value })}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All levels">All levels</option>
              </select>
            </label>
            <label className="field-label">
              Weekly Study Goal (Hours)
              <input type="number" min={1} max={50} value={prefForm.weeklyHoursGoal} onChange={(e) => setPrefForm({ ...prefForm, weeklyHoursGoal: Number(e.target.value) })} />
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">
              AI Tutor Default Style
              <select value={prefForm.aiTutorStyle} onChange={(e) => setPrefForm({ ...prefForm, aiTutorStyle: e.target.value })}>
                <option value="clear">Clear & Conversational</option>
                <option value="step_by_step">Step-by-Step Breakdown</option>
                <option value="examples">Real-World Examples & Analogies</option>
              </select>
            </label>
            <label className="field-label">
              Theme Preference
              <select value={prefForm.theme} onChange={(e) => setPrefForm({ ...prefForm, theme: e.target.value })}>
                <option value="dark">Dark Mode (Default Charcoal / Navy)</option>
                <option value="light">Light Mode (Warm Off-White / Pearl Slate)</option>
                <option value="system">System (Follow OS Preference)</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save Preferences'} <Save size={14} />
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 6: ACHIEVEMENTS & MILESTONES ─── */}
      {activeTab === 'achievements' && (
        <div>
          <div className="achievement-summary panel">
            <div className="achievement-emblem"><Trophy size={24} /></div>
            <div>
              <div className="section-kicker">LEARNING RECOGNITION</div>
              <h2>{u.gamification?.badges?.length || 4} Badges Unlocked · {stats.points || 480} XP</h2>
              <p>Achievements are verified through backend events: completed lessons, submitted assignments, and streak milestones.</p>
            </div>
          </div>

          <div className="achievement-grid">
            {(u.gamification?.badges || []).map((badge) => (
              <article key={badge.id} className="panel achievement-card earned">
                <div className="achievement-icon"><Trophy size={18} /></div>
                <div>
                  <b>{badge.title}</b>
                  <p>{badge.description}</p>
                  <small>Unlocked {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'Recently'}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 7: ACCOUNT & SECURITY ─── */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Email Verification Status Card */}
          <div className="panel profile-form">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">INSTITUTIONAL IDENTITY</div>
                <h3>Email Verification & Security</h3>
              </div>
              <span className={u.emailVerifiedAt ? "private-badge" : "text-amber-400 font-semibold text-xs flex items-center gap-1"}>
                {u.emailVerifiedAt ? <><Check size={14} /> Verified</> : "⚠ Unverified"}
              </span>
            </div>

            <div className="form-row" style={{ alignItems: 'center' }}>
              <div>
                <label className="field-label">Institutional Email</label>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.email}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                  {u.emailVerifiedAt
                    ? `Verified on ${new Date(u.emailVerifiedAt).toLocaleDateString()} - Credential verification enabled`
                    : "Email verification enables digital credential exports and institutional certifications."}
                </div>
              </div>

              {!u.emailVerifiedAt && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    className="button button-soft"
                    onClick={handleRequestVerification}
                    disabled={verifyBusy}
                  >
                    {verifyBusy ? "Requesting..." : "Send Verification Link"}
                  </button>
                </div>
              )}
            </div>

            {!u.emailVerifiedAt && (
              <form onSubmit={handleVerifyToken} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                {generatedTokenNotice && (
                  <div style={{ padding: '8px 12px', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.3)', borderRadius: 8, fontSize: 11, color: '#fbbf24', marginBottom: 12, wordBreak: 'break-all' }}>
                    <b>Verification Token Generated:</b> {generatedTokenNotice}
                  </div>
                )}
                <label className="field-label">
                  Manual Token Verification
                  <input
                    value={verifyTokenInput}
                    onChange={(e) => setVerifyTokenInput(e.target.value)}
                    placeholder="Enter or paste verification token..."
                  />
                </label>
                <div className="form-actions" style={{ marginTop: 8 }}>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={verifyBusy || !verifyTokenInput.trim()}
                  >
                    {verifyBusy ? "Verifying..." : "Verify Token"} <Check size={14} />
                  </button>
                </div>
              </form>
            )}
          </div>
          <form className="panel profile-form" onSubmit={handleChangePassword}>
            <div className="panel-heading">
              <div>
                <div className="section-kicker">PASSWORD & AUTHENTICATION</div>
                <h3>Update Password</h3>
              </div>
              <span className="private-badge"><Lock size={13} /> Secure</span>
            </div>

            <label className="field-label">
              Current Password
              <input type="password" required value={pwdForm.currentPassword} onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} />
            </label>

            <div className="form-row">
              <label className="field-label">
                New Password
                <input type="password" required minLength={8} value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
              </label>
              <label className="field-label">
                Confirm New Password
                <input type="password" required minLength={8} value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={pwdBusy}>
                {pwdBusy ? 'Updating...' : 'Update Password'} <KeyRound size={14} />
              </button>
            </div>
          </form>

          <div className="panel profile-form">
            <div className="panel-heading">
              <div>
                <div className="section-kicker">PRIVACY & DATA GOVERNANCE</div>
                <h3>Export Personal Data</h3>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
              Download a machine-readable JSON archive of all your personal academic profile records, course enrollments, submitted assignments, and verified certificates.
            </p>
            <button className="button button-soft" onClick={handleExportData}>
              Export Personal Data (JSON) <FileText size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Connect Integration Modal */}
      {connectModal && (
        <div className="mobile-scrim show" style={{ display: 'grid', placeItems: 'center', zIndex: 100 }}>
          <div className="panel" style={{ width: min(440, '90%'), padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ font: '700 16px Manrope', margin: 0 }}>
                Connect {connectModal === 'github' ? 'GitHub' : connectModal === 'linkedin' ? 'LinkedIn' : 'LeetCode'}
              </h3>
              <button className="icon-button subtle" onClick={() => setConnectModal(null)}><X size={16} /></button>
            </div>

            <label className="field-label">
              {connectModal === 'linkedin'
                ? 'LinkedIn Profile URL'
                : connectModal === 'leetcode'
                ? 'LeetCode Profile URL or Username'
                : 'GitHub Username or Profile URL'}
              <input
                required
                autoFocus
                placeholder={
                  connectModal === 'linkedin'
                    ? 'https://www.linkedin.com/in/username'
                    : connectModal === 'leetcode'
                    ? 'https://leetcode.com/u/your_username/ or handle'
                    : 'e.g. your-github-username'
                }
                value={connectInput}
                onChange={(e) => setConnectInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnectIntegration()}
              />
            </label>

            <div style={{ fontSize: 9, color: 'var(--faint)', margin: '10px 0 18px', lineHeight: 1.5 }}>
              OmniClass only reads public profile metadata and never accesses private credentials or personal messages.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="button button-soft" onClick={() => setConnectModal(null)}>Cancel</button>
              <button className="button button-primary" disabled={busy || !connectInput.trim()} onClick={handleConnectIntegration}>
                {busy ? 'Connecting...' : 'Confirm & Connect'} <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function min(val, fallback) {
  return typeof window !== 'undefined' && window.innerWidth < val ? fallback : val;
}
