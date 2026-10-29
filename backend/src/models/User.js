import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  displayName: { type: String, trim: true, maxlength: 80, default: '' },
  username: { type: String, trim: true, lowercase: true, maxlength: 50, sparse: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, select: false, default: null },
  googleId: { type: String, sparse: true, index: true },
  githubId: { type: String, sparse: true, index: true },
  facebookId: { type: String, sparse: true, index: true },
  authProvider: { type: String, enum: ['local', 'google', 'github', 'facebook'], default: 'local' },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student', index: true },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', index: true },
  avatar: { type: String, default: '' },
  banner: { type: String, default: '' },
  bio: { type: String, maxlength: 1000, default: '' },
  headline: { type: String, maxlength: 140, default: '' },
  location: { type: String, maxlength: 100, default: '' },
  phone: { type: String, maxlength: 30, default: '' },
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'UTC' },
  visibility: { type: String, enum: ['public', 'private'], default: 'public' },
  interests: { type: [String], default: [] },
  savedCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
  emailVerifiedAt: Date,
  sessionVersion: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  onboardingComplete: { type: Boolean, default: false },

  // Academic Profile
  academic: {
    department: { type: String, default: 'Computer Science & Engineering' },
    degree: { type: String, default: 'B.S. in Software Systems' },
    studyLevel: { type: String, default: 'Undergraduate' },
    academicYear: { type: String, default: 'Year 3' },
    enrollmentYear: { type: Number, default: 2023 },
    graduationYear: { type: Number, default: 2027 },
    specializations: { type: [String], default: ['Machine Learning', 'Web Systems'] },
  },

  // Professional & Career Profile
  professional: {
    careerObjective: { type: String, default: 'Aspiring Full-Stack Software Architect with focus on AI systems.' },
    skills: { type: [String], default: ['JavaScript', 'React', 'Node.js', 'Python', 'FastAPI', 'MongoDB', 'Docker'] },
    resumeUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
  },

  // Learning Preferences
  preferences: {
    preferredDifficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All levels'], default: 'All levels' },
    weeklyHoursGoal: { type: Number, default: 6 },
    aiTutorStyle: { type: String, enum: ['clear', 'step_by_step', 'examples'], default: 'clear' },
    voiceSpeed: { type: Number, default: 1.0 },
    studyReminders: { type: Boolean, default: true },
    recommendationTopics: { type: [String], default: ['AI', 'System Design', 'Cloud Architecture'] },
  },

  // Gamification & Progress
  gamification: {
    points: { type: Number, default: 240 },
    streakDays: { type: Number, default: 4 },
    lastActiveAt: { type: Date, default: Date.now },
    badges: [{
      id: String,
      title: String,
      description: String,
      icon: String,
      earnedAt: { type: Date, default: Date.now },
    }],
  },

  // External Connected Accounts & Developer Integrations
  integrations: {
    github: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: '' },
      profileUrl: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
      reposCount: { type: Number, default: 0 },
      languages: { type: [String], default: [] },
      pinnedRepos: [{
        name: String,
        description: String,
        stars: Number,
        language: String,
        url: String,
      }],
      lastSyncAt: Date,
      status: { type: String, default: 'Not Connected' }, // Not Connected, Connected, Syncing, Synced Successfully, Sync Failed, Disconnected
    },
    linkedin: {
      connected: { type: Boolean, default: false },
      profileUrl: { type: String, default: '' },
      headline: { type: String, default: '' },
      lastSyncAt: Date,
      status: { type: String, default: 'Not Connected' },
      isLinkOnly: { type: Boolean, default: true },
    },
    leetcode: {
      connected: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      username: { type: String, default: '' },
      profileUrl: { type: String, default: '' },
      ranking: { type: Number, default: 0 },
      contestRating: { type: Number, default: 0 },
      solvedTotal: { type: Number, default: 0 },
      solvedEasy: { type: Number, default: 0 },
      solvedMedium: { type: Number, default: 0 },
      solvedHard: { type: Number, default: 0 },
      lastSyncAt: Date,
      status: { type: String, default: 'Not Connected' },
      isManualVerified: { type: Boolean, default: false },
      verificationChallenge: { type: String, default: '' },
      challengeExpiresAt: Date,
    },
  },
}, {
  timestamps: true,
  toJSON: {
    transform(_doc, ret) {
      delete ret.passwordHash;
      delete ret.sessionVersion;
      delete ret.__v;
      return ret;
    },
  },
});

userSchema.index({ institutionId: 1, email: 1 });
userSchema.index({ institutionId: 1, role: 1 });

export default mongoose.model('User', userSchema);
