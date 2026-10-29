import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'active', 'completed', 'withdrawn', 'rejected'], default: 'active' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  completedLessons: { type: [String], default: [] },
  isPro: { type: Boolean, default: false },
  paymentId: { type: String, default: '' },
  finalExamPassed: { type: Boolean, default: false },
  finalExamScore: { type: Number, default: 0 },
  finalExamAttempts: { type: Number, default: 0 },
  finalExamCompletedAt: Date,
  enrolledAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: true });
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
export default mongoose.model('Enrollment', enrollmentSchema);
