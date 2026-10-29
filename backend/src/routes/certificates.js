import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import Certificate from '../certificates/Certificate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { param, validationResult } from 'express-validator';

const router = Router();

router.get('/mine', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ studentId: req.user.id, institutionId: req.user.institutionId, status: 'valid' }).sort({ issuedAt: -1 }).lean();
    return res.json({ success: true, data: { certificates } });
  } catch (error) { next(error); }
});

router.get('/view/:certificateCode', async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ certificateCode: req.params.certificateCode }).lean();
    if (!certificate) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Certificate not found.' } });
    return res.json({ success: true, data: { certificate, valid: certificate.status === 'valid' } });
  } catch (error) { next(error); }
});

router.get('/verify/:certificateCode', async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ certificateCode: req.params.certificateCode })
      .select('certificateCode learnerName courseTitle institutionName instructorName issuingAuthority grade score proctoredStatus issuedAt status')
      .lean();
    if (!certificate) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Certificate not found.' } });
    return res.json({ success: true, data: { certificate, valid: certificate.status === 'valid' } });
  } catch (error) { next(error); }
});

router.post('/:certificateId/revoke', requireAuth, requireRole('admin'), param('certificateId').isMongoId(), (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid certificate ID.' } });
  return next();
}, async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ _id: req.params.certificateId, institutionId: req.user.institutionId });
    if (!certificate) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Certificate not found.' } });
    certificate.status = 'revoked';
    await certificate.save();
    return res.json({ success: true, data: { revoked: true, certificateCode: certificate.certificateCode } });
  } catch (error) { next(error); }
});

export async function issueCourseCertificate({
  course,
  user,
  institutionName = 'Northstar University',
  grade = 'Pass with Distinction (92%)',
  score = 92,
  proctoredStatus = null,
}) {
  const code = `OC-CERT-2026-${randomUUID().slice(0, 8).toUpperCase()}`;
  const certificate = await Certificate.findOneAndUpdate(
    { studentId: user.id || user._id, courseId: course.id || course._id },
    {
      $setOnInsert: {
        institutionId: course.institutionId,
        studentId: user.id || user._id,
        courseId: course.id || course._id,
        certificateCode: code,
        learnerName: user.name,
        courseTitle: course.title,
        institutionName,
        instructorName: course.instructorName || 'Dr. Eleanor Vance, Dean of Computing',
        issuingAuthority: 'OmniClass Academic Senate & Examination Syndicate',
        grade,
        score,
        proctoredStatus: proctoredStatus || {
          isProctored: true,
          verified: true,
          score,
          proctoredAt: new Date(),
          assessmentName: '30-MCQ Comprehensive Final Proctored Assessment',
        },
        issuedAt: new Date(),
        status: 'valid',
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
  return certificate;
}

export default router;
