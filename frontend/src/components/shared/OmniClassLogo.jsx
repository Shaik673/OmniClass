export default function OmniClassLogo({ size = 28, showText = true, className = '' }) {
  return (
    <div className={`brand inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div
        className="brand-mark shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <svg
          viewBox="0 0 120 120"
          width={Math.round(size * 0.76)}
          height={Math.round(size * 0.76)}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M60 26 L96 43 L60 60 L24 43 Z" fill="#ffffff" />
          <path d="M38 52 L38 68 C38 78 82 78 82 68 L82 52 L60 63 Z" fill="rgba(255,255,255,0.85)" />
          <circle cx="60" cy="43" r="4" fill="#fbbf24" />
          <path d="M60 76 L62.5 86 L72 88.5 L62.5 91 L60 100 L57.5 91 L48 88.5 L57.5 86 Z" fill="#fbbf24" />
        </svg>
      </div>
      {showText && (
        <span
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: Math.round(size * 0.65),
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            display: 'inline-flex',
            alignItems: 'baseline',
          }}
        >
          <span>Omni</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700, marginLeft: '1px' }}>Class</span>
        </span>
      )}
    </div>
  );
}

