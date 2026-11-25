import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  adminRegister,
  adminLogin,
  resendVerificationEmail,
  verifyEmail,
  logout
} from "../controllers/auth.controller.js";

const router = express.Router();

// 🔒 Login rate limiter: Limits consecutive failed attempts to 5 per 15 minutes.
// Successful logins are skipped. When 5 failures occur, returns HTTP 429.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many failed login attempts. Please try again after 15 minutes or reset your password.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// 🔒 Forgot password rate limiter
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.get("/reset-password/:token", verifyResetToken);
router.get("/reset-password", verifyResetToken);
router.post("/reset-password/:token", resetPassword);
router.post("/reset-password", resetPassword);
// Public — pehla admin (secret key se protected, JWT nahi chahiye)
router.post("/admin/register", adminRegister);

router.post("/admin/login", loginLimiter, adminLogin);     // admin-only login (role-checked)
router.post("/logout", logout);



// Email verification and resend routes
router.post("/resend-verification", resendVerificationEmail);
router.post("/resend-email", resendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);
router.post("/verify-email", verifyEmail);

export default router;
