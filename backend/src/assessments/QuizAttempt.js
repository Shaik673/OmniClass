import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attempt: { type: Number, required: true, min: 1 },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

quizAttemptSchema.index({ quizId: 1, studentId: 1, attempt: 1 }, { unique: true });
export default mongoose.model('QuizAttempt', quizAttemptSchema);
