import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Download, Share2, ShieldCheck, CheckCircle, ExternalLink,
  Award, QrCode, Lock, GraduationCap, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import OmniClassLogo from './OmniClassLogo.jsx';

export default function ViewCertificateModal({ certificate, user, onClose }) {
  const navigate = useNavigate();
  const certRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!certificate) return null;

  const certCode = certificate.certificateCode || 'OC-CERT-2026-0001';
  const learner = certificate.learnerName || user?.name || 'Alex Morgan';
  const courseTitle = certificate.courseTitle || 'Advanced Distributed Systems & Cloud Architecture';
  const institution = certificate.institutionName || 'Northstar University';
  const instructor = certificate.instructorName || 'Dr. Eleanor Vance, Dean of Computing';
  const issuedDate = new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(certificate.issuedAt || Date.now()));

  const grade = certificate.grade || (certificate.score ? `${certificate.score}% · High Distinction` : 'Pass with Distinction (92%)');
  const isProctored = Boolean(certificate.proctoredStatus?.verified || certificate.proctoredStatus?.isProctored || certificate.status === 'valid');
  const proctoredScore = certificate.proctoredStatus?.score || certificate.score || 92;

  const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(certCode)}`;

  // SVG QR Code generator representation
  const qrCodeSvg = (
    <svg viewBox="0 0 100 100" width="80" height="80" style={{ background: '#ffffff', padding: 4, borderRadius: 6 }}>
      {/* Real QR matrix structure */}
      <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
      {/* Top Left Finder */}
      <rect x="8" y="8" width="28" height="28" fill="#1e1b4b" />
      <rect x="12" y="12" width="20" height="20" fill="#ffffff" />
      <rect x="16" y="16" width="12" height="12" fill="#1e1b4b" />
      {/* Top Right Finder */}
      <rect x="64" y="8" width="28" height="28" fill="#1e1b4b" />
      <rect x="68" y="12" width="20" height="20" fill="#ffffff" />
      <rect x="72" y="16" width="12" height="12" fill="#1e1b4b" />
      {/* Bottom Left Finder */}
      <rect x="8" y="64" width="28" height="28" fill="#1e1b4b" />
      <rect x="12" y="68" width="20" height="20" fill="#ffffff" />
      <rect x="16" y="72" width="12" height="12" fill="#1e1b4b" />
      {/* Timing and alignment patterns */}
      <rect x="40" y="12" width="4" height="4" fill="#1e1b4b" />
      <rect x="48" y="12" width="4" height="4" fill="#1e1b4b" />
      <rect x="56" y="12" width="4" height="4" fill="#1e1b4b" />
      <rect x="12" y="40" width="4" height="4" fill="#1e1b4b" />
      <rect x="12" y="48" width="4" height="4" fill="#1e1b4b" />
      <rect x="12" y="56" width="4" height="4" fill="#1e1b4b" />
      {/* Data Matrix Dots */}
      <rect x="42" y="42" width="16" height="16" rx="2" fill="#6366f1" />
      <rect x="66" y="42" width="6" height="6" fill="#1e1b4b" />
      <rect x="76" y="42" width="6" height="6" fill="#1e1b4b" />
      <rect x="86" y="42" width="6" height="6" fill="#1e1b4b" />
      <rect x="42" y="66" width="6" height="6" fill="#1e1b4b" />
      <rect x="52" y="66" width="6" height="6" fill="#1e1b4b" />
      <rect x="62" y="66" width="6" height="6" fill="#1e1b4b" />
      <rect x="42" y="76" width="6" height="6" fill="#1e1b4b" />
      <rect x="52" y="86" width="6" height="6" fill="#1e1b4b" />
      <rect x="72" y="72" width="18" height="18" rx="2" fill="#1e1b4b" />
    </svg>
  );

  const handlePrint = () => {
    window.print();
  };

  const handleShareLinkedIn = () => {
    const isConnected = Boolean(user?.integrations?.linkedin?.connected);
    if (!isConnected) {
      toast.error('LinkedIn is not connected to your profile yet! Redirecting to connect your LinkedIn account...');
      onClose();
      navigate('/profile');
      return;
    }

    const issueYear = new Date(certificate.issuedAt || Date.now()).getFullYear();
    const issueMonth = new Date(certificate.issuedAt || Date.now()).getMonth() + 1;
    const certUrl = encodeURIComponent(verifyUrl);
    const certName = encodeURIComponent(courseTitle);
    const org = encodeURIComponent('OmniClass');

    const shareUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=${org}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${certUrl}&certId=${encodeURIComponent(certCode)}`;

    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening LinkedIn Certification Dialog...');
  };

  return (
    <div
      className="certificate-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10, 12, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '24px 16px 48px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
      onClick={onClose}
    >
      {/* Viewport Floating Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close certificate modal"
        style={{
          position: 'fixed',
          top: 16,
          right: 20,
          zIndex: 10001,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(25, 28, 38, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#ffffff',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
        title="Close certificate (Esc)"
      >
        <X size={18} />
      </button>

      <div
        className="certificate-modal-content"
        style={{
          width: '100%',
          maxWidth: '1060px',
          margin: '0 auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Action Header */}
        <div
          className="certificate-modal-toolbar"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            padding: '14px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: 'var(--surface2)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <b style={{ fontSize: 14, color: 'var(--text)' }}>Official Academic Credential</b>
              <small style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                ID: {certCode} · Cryptographically Validated
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="button button-soft"
              onClick={handleShareLinkedIn}
              title="Add this verified credential directly to your LinkedIn profile"
              style={{ fontSize: 12, padding: '7px 14px' }}
            >
              <Share2 size={14} style={{ marginRight: 6 }} />
              Share on LinkedIn
            </button>
            <button
              className="button button-primary"
              onClick={handlePrint}
              style={{ fontSize: 12, padding: '7px 16px' }}
            >
              <Printer size={14} style={{ marginRight: 6 }} />
              Download / Print PDF
            </button>
            <button
              className="icon-button subtle"
              onClick={onClose}
              aria-label="Close certificate modal"
              style={{ width: 34, height: 34 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── A4 LANDSCAPE CERTIFICATE DOCUMENT ─── */}
        <div
          style={{
            padding: '30px 20px',
            background: 'var(--bg)',
            display: 'flex',
            justifyContent: 'center',
            overflowX: 'auto',
          }}
        >
          <div
            id="print-certificate"
            ref={certRef}
            className="a4-landscape-certificate"
            style={{
              width: '980px',
              height: '692px', // Aspect ratio ~1.415:1 (Exact A4 Landscape)
              background: '#ffffff',
              color: '#1e293b',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
              borderRadius: 6,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            {/* Outer Academic Border */}
            <div
              style={{
                position: 'absolute',
                inset: '14px',
                border: '3px double #4338ca',
                pointerEvents: 'none',
              }}
            />
            {/* Inner Gold Inset Border */}
            <div
              style={{
                position: 'absolute',
                inset: '20px',
                border: '1px solid #d97706',
                pointerEvents: 'none',
              }}
            />

            {/* Corner Filigree Accents */}
            <div style={{ position: 'absolute', top: 22, left: 22, color: '#d97706', fontSize: 18, lineHeight: 1 }}>❖</div>
            <div style={{ position: 'absolute', top: 22, right: 22, color: '#d97706', fontSize: 18, lineHeight: 1 }}>❖</div>
            <div style={{ position: 'absolute', bottom: 22, left: 22, color: '#d97706', fontSize: 18, lineHeight: 1 }}>❖</div>
            <div style={{ position: 'absolute', bottom: 22, right: 22, color: '#d97706', fontSize: 18, lineHeight: 1 }}>❖</div>

            {/* Background Watermark Seal */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.04,
                pointerEvents: 'none',
                width: 380,
                height: 380,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg viewBox="0 0 120 120" width="380" height="380" fill="#4338ca">
                <path d="M60 26 L96 43 L60 60 L24 43 Z" />
                <path d="M38 52 L38 68 C38 78 82 78 82 68 L82 52 L60 63 Z" />
              </svg>
            </div>

            {/* Certificate Header */}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                <OmniClassLogo size={32} />
                <span style={{ height: 22, width: 1, background: '#cbd5e1' }} />
                <div style={{ textAlign: 'left' }}>
                  <b style={{ fontSize: 13, letterSpacing: '0.08em', color: '#1e1b4b', textTransform: 'uppercase', display: 'block' }}>
                    {institution}
                  </b>
                  <span style={{ fontSize: 9, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block' }}>
                    Academic Senate & Examination Syndicate
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, letterSpacing: '0.25em', color: '#d97706', fontWeight: 800, textTransform: 'uppercase' }}>
                  Certificate of Academic Achievement
                </span>
                <h1
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 27,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: '#0f172a',
                    margin: '4px 0 2px',
                    textTransform: 'uppercase',
                  }}
                >
                  Honors Course Completion
                </h1>
              </div>
            </div>

            {/* Certificate Body Text */}
            <div style={{ textAlign: 'center', margin: 'auto 0', padding: '0 40px' }}>
              <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', margin: '0 0 8px' }}>
                This credential is officially conferred upon
              </p>

              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 34,
                  fontWeight: 700,
                  color: '#1e1b4b',
                  letterSpacing: '0.02em',
                  paddingBottom: 6,
                  borderBottom: '2px solid #e0e7ff',
                  display: 'inline-block',
                  minWidth: 420,
                  marginBottom: 10,
                }}
              >
                {learner}
              </div>

              <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, maxWidth: 660, margin: '0 auto 12px' }}>
                for successfully fulfilling all rigorous academic requirements, mastering all curriculum modules, and demonstrating exemplary proficiency in
              </p>

              <h2
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 21,
                  fontWeight: 800,
                  color: '#4338ca',
                  letterSpacing: '-0.02em',
                  margin: '0 0 12px',
                }}
              >
                {courseTitle}
              </h2>

              {/* Proctored Assessment Status Badge (Shown when successfully validated) */}
              {isProctored && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    borderRadius: 20,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    margin: '4px auto 8px',
                  }}
                >
                  <ShieldCheck size={16} color="#059669" />
                  <span>✓ AI Proctored & Identity Verified: Passed · {grade}</span>
                </div>
              )}
            </div>

            {/* Certificate Footer: Signatures & Verification QR */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'flex-end',
                padding: '0 24px 10px',
                marginBottom: 8,
              }}
            >
              {/* Left: Issuing Authority & Date */}
              <div style={{ textAlign: 'left' }}>
                <div style={{ borderBottom: '1px solid #94a3b8', width: 190, marginBottom: 6 }}>
                  <span
                    style={{
                      fontFamily: 'Brush Script MT, cursive, Georgia',
                      fontSize: 22,
                      color: '#312e81',
                      display: 'block',
                    }}
                  >
                    Eleanor Vance
                  </span>
                </div>
                <b style={{ fontSize: 11, color: '#0f172a', display: 'block' }}>{instructor}</b>
                <small style={{ fontSize: 9, color: '#64748b', display: 'block' }}>
                  Conferred on: {issuedDate}
                </small>
              </div>

              {/* Center: Public Verification QR Code */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 4, background: '#fff' }}>
                  {qrCodeSvg}
                </div>
                <span style={{ fontSize: 8, color: '#475569', fontWeight: 700, marginTop: 4, letterSpacing: '0.04em' }}>
                  SCAN TO VERIFY AUTHENTICITY
                </span>
                <span style={{ fontSize: 8, color: '#6366f1', fontFamily: 'monospace', fontWeight: 600 }}>
                  {certCode}
                </span>
              </div>

              {/* Right: Academic Senate Signature */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ borderBottom: '1px solid #94a3b8', width: 190, marginLeft: 'auto', marginBottom: 6 }}>
                  <span
                    style={{
                      fontFamily: 'Brush Script MT, cursive, Georgia',
                      fontSize: 22,
                      color: '#312e81',
                      display: 'block',
                    }}
                  >
                    Marcus Sterling
                  </span>
                </div>
                <b style={{ fontSize: 11, color: '#0f172a', display: 'block' }}>Dr. Marcus Sterling</b>
                <small style={{ fontSize: 9, color: '#64748b', display: 'block' }}>
                  Chairman, OmniClass Academic Senate
                </small>
              </div>
            </div>

            {/* Bottom Fine Print Security Bar */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 8,
                color: '#94a3b8',
                borderTop: '1px solid #f1f5f9',
                paddingTop: 6,
                marginTop: 'auto',
              }}
            >
              OmniClass Verifiable Credential · Tamper-evident ledger reference: {certCode} · Public Verification at {verifyUrl}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar (Ensures actions are accessible at the bottom of the scroll) */}
        <div
          className="certificate-modal-bottombar"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: 'var(--surface2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
            <ShieldCheck size={16} style={{ color: 'var(--good)' }} />
            <span>Public Verification: <a href={verifyUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}>{certCode}</a></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="button button-soft"
              onClick={handleShareLinkedIn}
              style={{ fontSize: 12, padding: '7px 14px' }}
            >
              <Share2 size={14} style={{ marginRight: 6 }} />
              Share on LinkedIn
            </button>
            <button
              className="button button-primary"
              onClick={handlePrint}
              style={{ fontSize: 12, padding: '7px 16px' }}
            >
              <Printer size={14} style={{ marginRight: 6 }} />
              Download / Print PDF
            </button>
            <button
              className="button button-soft"
              onClick={onClose}
              style={{ fontSize: 12, padding: '7px 14px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

