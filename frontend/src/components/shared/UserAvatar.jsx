import { useState } from 'react';
import { getUserAvatar } from '../../utils/avatar.js';

export default function UserAvatar({ user, size = 'md', className = '', alt = '' }) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = getUserAvatar(user);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }[size] || 'w-8 h-8 text-xs';

  const initials = String(user?.name || 'OmniClass User')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join('') || 'OC';

  if (!imageError && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt || user?.name || 'User avatar'}
        onError={() => setImageError(true)}
        className={`rounded-full object-cover shrink-0 border border-slate-700/60 shadow-sm ${sizeClasses} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-bold bg-gradient-to-br from-indigo-400 to-purple-600 text-slate-900 border border-slate-700/60 shadow-sm ${sizeClasses} ${className}`}
    >
      {initials}
    </div>
  );
}

