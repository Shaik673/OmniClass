import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificateCode: { type: String, required: true, unique: true, index: true },
  learnerName: { type: String, required: true },
  courseTitle: { type: String, required: true },
  institutionName: { type: String, required: true },
  instructorName: { type: String, default: 'Dr. Eleanor Vance, Dean of Computing' },
  issuingAuthority: { type: String, default: 'OmniClass Academic Senate & Examination Syndicate' },
  grade: { type: String, default: 'Pass with Distinction' },
  score: { type: Number, default: 92 },
  proctoredStatus: {
    isProctored: { type: Boolean, default: true },
    verified: { type: Boolean, default: true },
    score: { type: Number, default: 92 },
    proctoredAt: { type: Date, default: Date.now },
    assessmentName: { type: String, default: '30-MCQ Comprehensive Final Proctored Assessment' },
  },
  issuedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['valid', 'revoked'], default: 'valid' },
}, { timestamps: true });

certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
export default mongoose.model('Certificate', certificateSchema);
