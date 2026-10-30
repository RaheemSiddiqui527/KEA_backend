import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  adminRegister,
  adminLogin,
  resendVerificationEmail,
  verifyEmail
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
// Public — pehla admin (secret key se protected, JWT nahi chahiye)
router.post("/admin/register", adminRegister);

router.post("/admin/login", adminLogin);     // admin-only login (role-checked)



// Email verification and resend routes
router.post("/resend-verification", resendVerificationEmail);
router.post("/resend-email", resendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);
router.post("/verify-email", verifyEmail);

export default router;
