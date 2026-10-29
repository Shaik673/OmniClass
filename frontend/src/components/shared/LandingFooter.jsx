import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Lock, ExternalLink, Mail, ArrowRight, Github, Linkedin, Code2 } from 'lucide-react';
import OmniClassLogo from './OmniClassLogo.jsx';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LandingFooter() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Thank you for subscribing to OmniClass Academic Dispatch!');
    setEmail('');
  };

  return (
    <footer className="landing-comprehensive-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '60px 32px 36px', marginTop: 60 }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        {/* Top Section: Brand + Mission + Newsletter */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 36, paddingBottom: 48, borderBottom: '1px solid var(--border)' }}>
          <div>
            <OmniClassLogo size={34} />
            <p style={{ margin: '14px 0 20px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 360 }}>
              The AI-native institutional learning workspace. Designed for universities, modern faculties, and forward-looking learners seeking verifiable academic mastery.
            </p>
            {/* Trust & Accreditation Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
                <ShieldCheck size={14} style={{ color: 'var(--good)' }} />
                <span>AACSB Aligned</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
                <Lock size={14} style={{ color: 'var(--accent)' }} />
                <span>ISO 27001 Certified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
                <Award size={14} style={{ color: '#f59e0b' }} />
                <span>EdTech Excellence 2026</span>
              </div>
            </div>
          </div>

          {/* Newsletter Box */}
          <div style={{ background: 'var(--surface2)', padding: '24px 28px', borderRadius: 16, border: '1px solid var(--border)', alignSelf: 'start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
              <Mail size={15} />
              <span>OMNICLASS ACADEMIC DISPATCH</span>
            </div>
            <h4 style={{ font: '700 16px Manrope', margin: '8px 0 6px', color: 'var(--text)' }}>Stay informed on pedagogical breakthroughs</h4>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Curated articles on grounded AI tutoring, distributed systems curricula, and institutional research.
            </p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your university email..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 9,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button type="submit" className="button button-primary" style={{ whiteSpace: 'nowrap', padding: '0 16px' }}>
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Middle Section: 4 Institutional Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, padding: '48px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h4 style={{ font: '700 13px Manrope', color: 'var(--text)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 14 }}>
              Academics & Curricula
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
              <li><Link to="/catalog" style={{ color: 'inherit' }} className="hover:text-accent">AI & Neural Systems</Link></li>
              <li><Link to="/catalog" style={{ color: 'inherit' }} className="hover:text-accent">Distributed Cloud Architectures</Link></li>
              <li><Link to="/catalog" style={{ color: 'inherit' }} className="hover:text-accent">Modern Full-Stack Engineering</Link></li>
              <li><Link to="/catalog" style={{ color: 'inherit' }} className="hover:text-accent">Algorithmic Problem Solving</Link></li>
              <li><Link to="/catalog" style={{ color: 'inherit' }} className="hover:text-accent">Pro Degree & Certifications</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ font: '700 13px Manrope', color: 'var(--text)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 14 }}>
              Learning Studio & AI
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Omni Tutor Interactive Studio</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">3-Part Assessment Generator</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Notes & YouTube Summarizer</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Interactive Voice Tutor</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Pedagogical Copilot for Instructors</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ font: '700 13px Manrope', color: 'var(--text)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 14 }}>
              Governance & Enterprise
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Northstar University Network</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Academic Senate Governance</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">LTI 1.3 & Canvas / Blackboard SSO</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Institutional Role Approvals</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Security Whitepaper & SOC2</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ font: '700 13px Manrope', color: 'var(--text)', letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 14 }}>
              Trust, Ethics & Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--muted)' }}>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Academic Integrity & Honor Code</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Privacy Policy (FERPA & GDPR)</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Terms of Academic Service</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Digital Credential Verification</Link></li>
              <li><Link to="/login" style={{ color: 'inherit' }} className="hover:text-accent">Cookie Preferences & Telemetry</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright + Social Accounts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            © 2026 OmniClass Inc. All rights reserved. Northstar University Academic Consortium.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, transition: 'color 0.2s' }}
              title="OmniClass on LinkedIn"
            >
              <Linkedin size={16} /> <span>LinkedIn</span>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, transition: 'color 0.2s' }}
              title="OmniClass Open Education on GitHub"
            >
              <Github size={16} /> <span>GitHub</span>
            </a>
            <a
              href="https://leetcode.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, transition: 'color 0.2s' }}
              title="OmniClass Algorithmic League on LeetCode"
            >
              <Code2 size={16} /> <span>LeetCode</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

