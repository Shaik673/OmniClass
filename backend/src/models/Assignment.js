import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  instructions: { type: String, required: true, maxlength: 10000 },
  opensAt: Date,
  dueAt: Date,
  maxMarks: { type: Number, min: 1, max: 10000, default: 100 },
  maxAttempts: { type: Number, min: 1, max: 10, default: 1 },
  allowLate: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'closed', 'archived'], default: 'published', index: true },
  rubric: [{
    criterion: { type: String, required: true },
    maxPoints: { type: Number, required: true },
    description: { type: String, default: '' },
  }],
}, { timestamps: true });

schema.index({ institutionId: 1, courseId: 1, status: 1, dueAt: 1 });

export default mongoose.model('Assignment', schema);
