import { body, param, query } from 'express-validator';

export const createExtinguisherValidator = [
  body('customer_id')
    .notEmpty().withMessage('Customer ID is required')
    .isUUID().withMessage('Invalid customer ID'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1, max: 1000 }).withMessage('Quantity must be between 1 and 1000'),
  body('serial_numbers')
    .optional()
    .isArray().withMessage('Serial numbers must be an array'),
  body('serial_numbers.*')
    .optional()
    .isString().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Each serial number must be 1–50 chars'),
  body('purchase_date')
    .optional()
    .isDate().withMessage('Invalid purchase date (YYYY-MM-DD)'),
  body('expiry_date')
    .notEmpty().withMessage('Expiry date is required')
    .isDate().withMessage('Invalid expiry date (YYYY-MM-DD)')
    .custom((value, { req }) => {
      const purchaseDate = req.body.purchase_date ? new Date(req.body.purchase_date) : new Date();
      if (new Date(value) <= purchaseDate) {
        throw new Error('Expiry date must be after purchase date');
      }
      return true;
    }),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes max 500 characters'),
];

export const updateExtinguisherValidator = [
  param('id').isUUID().withMessage('Invalid extinguisher ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Quantity must be between 1 and 1000'),
  body('expiry_date')
    .optional()
    .isDate().withMessage('Invalid expiry date (YYYY-MM-DD)'),
  body('status')
    .optional()
    .isIn(['active', 'expiring_soon', 'expired', 'renewed', 'escalated'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes max 500 characters'),
];

export const listQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
  query('status').optional().isIn(['active', 'expiring_soon', 'expired', 'renewed', 'escalated']),
  query('search').optional().trim().isLength({ max: 100 }),
];
