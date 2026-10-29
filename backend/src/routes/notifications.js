import { Router } from 'express';
import Notification from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res, next) => { try { const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30).lean(); return res.json({ success: true, data: { notifications } }); } catch (e) { next(e); } });
router.patch('/read-all', requireAuth, async (req, res, next) => { try { const result = await Notification.updateMany({ userId: req.user.id, $or: [{ readAt: { $exists: false } }, { readAt: null }] }, { $set: { readAt: new Date() } }); return res.json({ success: true, data: { updated: result.modifiedCount } }); } catch (e) { next(e); } });
router.patch('/:id/read', requireAuth, async (req, res, next) => { try { const notification = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { readAt: new Date() }, { new: true }); if (!notification) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found.' } }); return res.json({ success: true, data: { notification } }); } catch (e) { next(e); } });
export default router;
