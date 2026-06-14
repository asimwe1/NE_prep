import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getEscalations, updateEscalation, getEscalationStats } from '../controllers/escalation.controller';

const router = Router();

router.get('/escalations', authenticate, requireRole('staff', 'admin'), getEscalations);
router.patch('/escalations/:id',
  authenticate,
  requireRole('staff', 'admin'),
  [
    param('id').isUUID(),
    body('status').optional().isIn(['open','in_review','notified_authority','resolved','closed']),
    body('notes').optional().trim().isLength({ max: 1000 }),
    body('authority_ref').optional().trim().isLength({ max: 100 }),
  ],
  updateEscalation
);
router.get('/escalations/stats', authenticate, requireRole('staff', 'admin'), getEscalationStats);

export default router;
