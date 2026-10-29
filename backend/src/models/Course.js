import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, maxlength: 3000 },
  category: { type: String, default: 'General', maxlength: 80, index: true },
  department: { type: String, default: 'Computer Science & Engineering', maxlength: 100 },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All levels'], default: 'All levels' },
  duration: { type: String, default: 'Self paced', maxlength: 60 },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  instructorName: { type: String, required: true },
  status: { type: String, enum: ['draft', 'pending', 'published', 'archived'], default: 'published', index: true },
  enrollmentPolicy: { type: String, enum: ['open', 'approval', 'invite'], default: 'open' },
  tags: { type: [String], default: [] },
  learningOutcomes: { type: [String], default: [] },
  prerequisites: { type: [String], default: [] },
  coverImage: { type: String, default: '' },
  color: { type: String, default: 'violet' },
  icon: { type: String, default: '✳' },
  reviewNotes: { type: String, default: '' },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 28 },
  enrolledCount: { type: Number, default: 0 },
  isPro: { type: Boolean, default: false, index: true },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  finalExam: {
    enabled: { type: Boolean, default: true },
    title: { type: String, default: '30-MCQ Comprehensive Final Proctored Exam' },
    description: { type: String, default: '30 Multiple-Choice Questions covering all course modules. Minimum 70% passing threshold required to unlock official certification.' },
    durationMinutes: { type: Number, default: 45 },
    passingScore: { type: Number, default: 70 },
    questions: [{
      id: Number,
      prompt: String,
      options: [String],
      correctIndex: Number,
      explanation: String,
      moduleTag: String,
    }],
  },
  modules: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    lessons: [{
      title: { type: String, required: true },
      type: { type: String, enum: ['text', 'video', 'resource', 'quiz'], default: 'text' },
      content: { type: String, default: '' },
      videoUrl: { type: String, default: '' },
      durationMinutes: { type: Number, default: 15 },
      order: { type: Number, default: 0 },
      resources: [{
        title: String,
        url: String,
        type: { type: String, default: 'link' },
      }],
    }],
  }],
}, { timestamps: true });

courseSchema.index({ institutionId: 1, status: 1, title: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text', instructorName: 'text', category: 'text' });

export default mongoose.model('Course', courseSchema);
