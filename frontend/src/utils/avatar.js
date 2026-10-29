// OmniClass Smart Gender-Aware Avatar System

const FEMALE_NAMES = new Set([
  'mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen',
  'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley', 'kimberly', 'emily', 'donna', 'michelle',
  'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia', 'kathleen',
  'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen', 'samantha',
  'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather', 'diane',
  'olivia', 'sophia', 'isabella', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'abigail', 'priya',
  'ananya', 'fatima', 'aisha', 'zainab', 'sneha', 'pooja', 'kavita', 'deepa', 'neha', 'divya',
  'lucia', 'elena', 'camila', 'valeria', 'sofia', 'clara', 'chloe', 'zoe', 'charlie', 'taylor'
]);

const MALE_NAMES = new Set([
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'charles',
  'christopher', 'daniel', 'matthew', 'anthony', 'donald', 'mark', 'paul', 'steven', 'andrew', 'kenneth',
  'joshua', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
  'benjamin', 'samuel', 'gregory', 'alexander', 'frank', 'patrick', 'raymond', 'jack', 'dennis', 'jerry',
  'shaik', 'mohammed', 'muhammad', 'ahmed', 'ali', 'hassan', 'hussein', 'rahul', 'rohit', 'amit',
  'arjun', 'vikram', 'suresh', 'ramesh', 'rajesh', 'carlos', 'mateo', 'alejandro', 'diego', 'lucas',
  'liam', 'noah', 'oliver', 'elijah', 'ethan', 'aiden', 'alex', 'sam'
]);

export function detectGenderFromName(name) {
  if (!name) return 'boy';
  const first = String(name).trim().split(/\s+/)[0].toLowerCase();

  if (FEMALE_NAMES.has(first)) return 'girl';
  if (MALE_NAMES.has(first)) return 'boy';

  // Suffix heuristic for common female name patterns
  if (first.endsWith('a') || first.endsWith('i') || first.endsWith('ia') || first.endsWith('ette') || first.endsWith('ine')) {
    // Exceptions like Joshua, Andrea in Italian, Luca
    if (['joshua', 'luca', 'eli'].includes(first)) return 'boy';
    return 'girl';
  }

  return 'boy';
}

export const BOY_AVATARS = [
  { id: 'boy-1', label: 'Tech Scholar', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80' },
  { id: 'boy-2', label: 'Casual Learner', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80' },
  { id: 'boy-3', label: 'Campus Stylist', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80' },
  { id: 'boy-4', label: 'Focus Student', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80' },
];

export const GIRL_AVATARS = [
  { id: 'girl-1', label: 'Creative Thinker', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80' },
  { id: 'girl-2', label: 'Data Researcher', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80' },
  { id: 'girl-3', label: 'Lead Developer', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80' },
  { id: 'girl-4', label: 'Design Analyst', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80' },
];

export function getDefaultAvatar(name) {
  const gender = detectGenderFromName(name);
  return gender === 'girl' ? GIRL_AVATARS[0].url : BOY_AVATARS[0].url;
}

export function getUserAvatar(user) {
  if (user?.avatar && user.avatar.trim()) {
    return user.avatar;
  }
  return getDefaultAvatar(user?.name);
}

