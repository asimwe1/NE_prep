import { body } from 'express-validator';

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^\+?[\d\s\-()]{7,20}$/).withMessage('Invalid phone number'),
  body('national_id')
    .trim()
    .notEmpty().withMessage('National ID is required')
    .isLength({ min: 5, max: 30 }).withMessage('National ID must be 5–30 characters')
    .matches(/^[A-Za-z0-9\-]+$/).withMessage('National ID can only contain letters, numbers, and hyphens'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address max 500 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[A-Z])/).withMessage('Password must contain at least one uppercase letter')
    .matches(/(?=.*[0-9])/).withMessage('Password must contain at least one number'),
  body('role')
    .optional()
    .isIn(['customer', 'staff', 'admin']).withMessage('Invalid role'),
];



export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const otpVerifyValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('code')
    .trim()
    .notEmpty().withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
  body('purpose')
    .notEmpty().withMessage('Purpose is required')
    .isIn(['registration', 'login', 'password_reset']).withMessage('Invalid purpose'),
];

export const resendOtpValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),
  body('purpose')
    .notEmpty().withMessage('Purpose is required')
    .isIn(['registration', 'login', 'password_reset']).withMessage('Invalid purpose'),
];
