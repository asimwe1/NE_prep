import { Router } from 'express';
import { register, login, verifyOtp, resendOtp, verifyToken } from '../controllers/auth.controller';
import {
  registerValidator,
  loginValidator,
  otpVerifyValidator,
  resendOtpValidator,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/verify-otp', otpVerifyValidator, verifyOtp);
router.post('/resend-otp', resendOtpValidator, resendOtp);
router.get('/verify-token', verifyToken);

export default router;
