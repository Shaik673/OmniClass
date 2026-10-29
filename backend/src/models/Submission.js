import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attempt: { type: Number, required: true, min: 1 },
  content: { type: String, required: true, maxlength: 30000 },
  attachmentUrl: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded', 'published', 'returned'], default: 'submitted', index: true },
  score: { type: Number, min: 0 },
  feedback: { type: String, maxlength: 5000 },
  rubricScores: [{
    criterion: String,
    pointsAwarded: Number,
    feedback: String,
  }],
  aiFeedback: {
    analyzedAt: Date,
    strengths: [String],
    improvements: [String],
    suggestedScore: Number,
    feedbackText: String,
  },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  publishedAt: Date,
}, { timestamps: true });

schema.index({ assignmentId: 1, studentId: 1, attempt: 1 }, { unique: true });

export default mongoose.model('Submission', schema);
