import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  plannedFor: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true });

studySessionSchema.index({ institutionId: 1, userId: 1, plannedFor: 1 });
export default mongoose.model('StudySession', studySessionSchema);
