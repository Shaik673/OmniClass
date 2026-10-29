import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, trim: true, maxlength: 1500 },
  options: { type: [String], required: true, validate: (options) => options.length >= 2 && options.length <= 8 },
  correctIndex: { type: Number, required: true, min: 0 },
}, { _id: true });

const quizSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  instructions: { type: String, default: '', maxlength: 3000 },
  questions: { type: [questionSchema], required: true, validate: (questions) => questions.length >= 1 && questions.length <= 50 },
  maxAttempts: { type: Number, min: 1, max: 10, default: 1 },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'published', index: true },
}, { timestamps: true });

quizSchema.index({ institutionId: 1, courseId: 1, status: 1 });
export default mongoose.model('Quiz', quizSchema);
