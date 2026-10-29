import { Sparkles } from 'lucide-react';

export default function EmptyState({ icon: Icon = Sparkles, title, message, action }) {
  return <div className="empty-card">
    <div className="empty-illustration"><Icon size={23} /></div>
    <b>{title}</b>
    {message && <p>{message}</p>}
    {action}
  </div>;
}
