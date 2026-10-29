import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', default: null, index: true },
  body: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['active', 'removed'], default: 'active', index: true },
  pinnedAt: Date,
}, { timestamps: true });

discussionSchema.index({ institutionId: 1, courseId: 1, parentId: 1, status: 1, createdAt: -1 });
export default mongoose.model('Discussion', discussionSchema);
