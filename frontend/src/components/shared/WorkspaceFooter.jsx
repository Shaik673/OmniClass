import { Link } from 'react-router-dom';
import OmniClassLogo from './OmniClassLogo.jsx';

export default function WorkspaceFooter() {
  return (
    <footer
      className="workspace-short-footer"
      style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'var(--surface)',
        fontSize: 11,
        color: 'var(--muted)',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <OmniClassLogo size={20} showText={true} />
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)' }} />
          <span>Northstar Systems Operational · v2.6</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Link to="/catalog" style={{ color: 'inherit' }} className="hover:text-accent">Course Catalog</Link>
        <Link to="/ai" style={{ color: 'inherit' }} className="hover:text-accent">AI Study Studio</Link>
        <Link to="/certificates" style={{ color: 'inherit' }} className="hover:text-accent">Certificates</Link>
        <Link to="/profile" style={{ color: 'inherit' }} className="hover:text-accent">Integrations</Link>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span>© 2026 OmniClass</span>
      </div>
    </footer>
  );
}

