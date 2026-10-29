import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, institutionId: mongoose.Schema.Types.ObjectId, title: { type: String, required: true }, message: { type: String, required: true }, readAt: Date, type: { type: String, default: 'general' } }, { timestamps: true });
export default mongoose.model('Notification', schema);
