import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getCustomers, getCustomer,
  createExtinguisher, getExtinguishers, updateExtinguisher, getExpiringExtinguishers,
} from '../controllers/customer.controller';
import { createExtinguisherValidator, updateExtinguisherValidator, listQueryValidator } from '../validators/extinguisher.validator';

const router = Router();

// Customers
router.get('/customers', authenticate, requireRole('staff', 'admin'), listQueryValidator, getCustomers);
router.get('/customers/:id', authenticate, getCustomer);

// Extinguishers
router.post('/extinguishers', authenticate, requireRole('staff', 'admin'), createExtinguisherValidator, createExtinguisher);
router.get('/extinguishers', authenticate, listQueryValidator, getExtinguishers);
router.patch('/extinguishers/:id', authenticate, requireRole('staff', 'admin'), updateExtinguisherValidator, updateExtinguisher);
router.get('/extinguishers/expiring', authenticate, requireRole('staff', 'admin'), getExpiringExtinguishers);

export default router;
