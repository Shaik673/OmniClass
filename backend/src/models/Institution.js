import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  domain: { type: String, default: 'northstar.edu' },
  tagline: { type: String, default: 'Empowering curious minds through intentional learning & AI innovation' },
  departments: {
    type: [String],
    default: [
      'Computer Science & Engineering',
      'Artificial Intelligence & Data Systems',
      'Human-Centered Design & Media',
      'Sustainable Sciences & Energy',
      'Business Analytics & Management',
    ],
  },
  academicTerms: [{
    name: { type: String, required: true },
    code: String,
    startDate: Date,
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
  }],
  branding: {
    logoText: { type: String, default: 'Northstar' },
    primaryColor: { type: String, default: '#b7a6ff' },
    accentColor: { type: String, default: '#8ad9d4' },
    welcomeBanner: { type: String, default: 'Welcome to Northstar University OmniClass Learning Hub' },
  },
  certificateSettings: {
    issuerTitle: { type: String, default: 'Office of Academic Affairs & AI Learning' },
    signatoryName: { type: String, default: 'Dr. Eleanor Vance, Vice Chancellor' },
    templateStyle: { type: String, default: 'modern-academic' },
  },
  settings: {
    enrollmentPolicy: { type: String, enum: ['open', 'approval', 'invite'], default: 'open' },
    externalAiEnabled: { type: Boolean, default: true },
    geminiApiKeyConfigured: { type: Boolean, default: false },
    autoIssueCertificates: { type: Boolean, default: true },
    allowPublicRankings: { type: Boolean, default: true },
    allowStudentDiscussionCreation: { type: Boolean, default: true },
  },
}, { timestamps: true });

export default mongoose.model('Institution', schema);
